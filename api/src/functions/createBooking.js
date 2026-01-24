const { app } = require('@azure/functions');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const { Resend } = require('resend');
const fs = require('fs');
const path = require('path');

// In-memory booking storage (for MVP - later replace with Azure Table Storage)
const bookings = new Map();

// Translations for emails and PDF
const translations = {
    lv: {
        emailSubject: (id) => `Rezervacijas apstiprinajums - ${id}`,
        emailGreeting: (name) => `Labdien, ${name}!`,
        emailThankYou: 'Paldies par rezervaciju!',
        emailConfirmed: 'Jusu rezervacija ir apstiprināta:',
        emailBookingId: 'Rezervacijas numurs',
        emailService: 'Pakalpojums',
        emailFormat: 'Formats',
        emailDate: 'Datums',
        emailTime: 'Laiks',
        emailPrice: 'Cena',
        emailInvoiceAttached: 'Rekins ir pievienots sim e-pastam.',
        emailQuestions: 'Ja jums ir jautajumi, ludzu, sazinieties ar mums.',
        emailRegards: 'Ar cienu,',
        emailSubtitle: 'Uztura specialiste · PhD',
        formatOnline: 'Attalinati (Zoom/Google Meet)',
        formatInPerson: 'Klatiene',
        // Payment confirmed
        paymentConfirmedSubject: (id) => `Maksajums apstiprinats - ${id}`,
        paymentConfirmedTitle: 'Maksajums sanemts!',
        paymentConfirmedText: 'Paldies! Jusu maksajums ir sanemts. Gaidam Jus konsultacija:',
        paymentWaitingText: 'Gaidam Jus:',
        // PDF
        pdfSubtitle: 'Uztura specialiste · PhD',
        pdfInvoice: 'REKINS',
        pdfNumber: 'Numurs',
        pdfDate: 'Datums',
        pdfClient: 'Klients',
        pdfName: 'Vards',
        pdfEmail: 'E-pasts',
        pdfPhone: 'Telefons',
        pdfFormat: 'Formats',
        pdfService: 'Pakalpojums',
        pdfTime: 'Laiks',
        pdfPrice: 'Cena',
        pdfTotal: 'KOPA',
        pdfPaymentInfo: 'Maksajuma informacija',
        pdfBank: 'Banka',
        pdfReference: 'Maksajuma merkis',
        pdfNotes: 'Piezimes',
        pdfThankYou: 'Paldies, ka izvelejaties mus!',
        pdfNotProvided: 'Nav noradits',
        // Services
        services: {
            'initial': 'Sakotneja konsultacija',
            'followup': 'Atkartota konsultacija',
            'package3': '3 konsultaciju pakete',
            'package5': '5 konsultaciju pakete',
            'cgm-diagnostic': 'CGM diagnostikas programma',
            'consultation': 'Uztura konsultacija',
            'free-consultation': 'Bezmaksas 15 min konsultacija'
        }
    },
    en: {
        emailSubject: (id) => `Booking Confirmation - ${id}`,
        emailGreeting: (name) => `Hello, ${name}!`,
        emailThankYou: 'Thank you for your booking!',
        emailConfirmed: 'Your booking has been confirmed:',
        emailBookingId: 'Booking ID',
        emailService: 'Service',
        emailFormat: 'Format',
        emailDate: 'Date',
        emailTime: 'Time',
        emailPrice: 'Price',
        emailInvoiceAttached: 'The invoice is attached to this email.',
        emailQuestions: 'If you have any questions, please contact us.',
        emailRegards: 'Best regards,',
        emailSubtitle: 'Nutrition Specialist · PhD',
        formatOnline: 'Online (Zoom/Google Meet)',
        formatInPerson: 'In-person',
        // Payment confirmed
        paymentConfirmedSubject: (id) => `Payment Confirmed - ${id}`,
        paymentConfirmedTitle: 'Payment Received!',
        paymentConfirmedText: 'Thank you! Your payment has been received. We look forward to seeing you:',
        paymentWaitingText: 'We look forward to seeing you:',
        // PDF
        pdfSubtitle: 'Nutrition Specialist · PhD',
        pdfInvoice: 'INVOICE',
        pdfNumber: 'Number',
        pdfDate: 'Date',
        pdfClient: 'Client',
        pdfName: 'Name',
        pdfEmail: 'Email',
        pdfPhone: 'Phone',
        pdfFormat: 'Format',
        pdfService: 'Service',
        pdfTime: 'Time',
        pdfPrice: 'Price',
        pdfTotal: 'TOTAL',
        pdfPaymentInfo: 'Payment Information',
        pdfBank: 'Bank',
        pdfReference: 'Reference',
        pdfNotes: 'Notes',
        pdfThankYou: 'Thank you for choosing us!',
        pdfNotProvided: 'Not provided',
        // Services
        services: {
            'initial': 'Initial Consultation',
            'followup': 'Follow-up Consultation',
            'package3': '3 Consultation Package',
            'package5': '5 Consultation Package',
            'cgm-diagnostic': 'CGM Diagnostic Program',
            'consultation': 'Nutrition Consultation',
            'free-consultation': 'Free 15-min Consultation'
        }
    },
    ru: {
        emailSubject: (id) => `Podtverzhdenie bronirovaniya - ${id}`,
        emailGreeting: (name) => `Zdravstvuyte, ${name}!`,
        emailThankYou: 'Spasibo za bronirovanie!',
        emailConfirmed: 'Vashe bronirovanie podtverzhdeno:',
        emailBookingId: 'Nomer bronirovaniya',
        emailService: 'Usluga',
        emailFormat: 'Format',
        emailDate: 'Data',
        emailTime: 'Vremya',
        emailPrice: 'Cena',
        emailInvoiceAttached: 'Schyot prikreplyon k etomu pismu.',
        emailQuestions: 'Esli u vas est voprosy, pozhaluysta, svyazhites s nami.',
        emailRegards: 'S uvazheniem,',
        emailSubtitle: 'Specialist po pitaniyu · PhD',
        formatOnline: 'Onlayn (Zoom/Google Meet)',
        formatInPerson: 'Ochno',
        // Payment confirmed
        paymentConfirmedSubject: (id) => `Oplata podtverzhdena - ${id}`,
        paymentConfirmedTitle: 'Oplata poluchena!',
        paymentConfirmedText: 'Spasibo! Vasha oplata poluchena. Zhdem vas na konsultacii:',
        paymentWaitingText: 'Zhdem vas:',
        // PDF
        pdfSubtitle: 'Specialist po pitaniyu · PhD',
        pdfInvoice: 'SCHYOT',
        pdfNumber: 'Nomer',
        pdfDate: 'Data',
        pdfClient: 'Klient',
        pdfName: 'Imya',
        pdfEmail: 'Email',
        pdfPhone: 'Telefon',
        pdfFormat: 'Format',
        pdfService: 'Usluga',
        pdfTime: 'Vremya',
        pdfPrice: 'Cena',
        pdfTotal: 'ITOGO',
        pdfPaymentInfo: 'Platezhnaya informaciya',
        pdfBank: 'Bank',
        pdfReference: 'Naznachenie platezha',
        pdfNotes: 'Primechaniya',
        pdfThankYou: 'Spasibo, chto vybrali nas!',
        pdfNotProvided: 'Ne ukazano',
        // Services
        services: {
            'initial': 'Pervichnaya konsultaciya',
            'followup': 'Povtornaya konsultaciya',
            'package3': 'Paket iz 3 konsultaciy',
            'package5': 'Paket iz 5 konsultaciy',
            'cgm-diagnostic': 'Programma CGM diagnostiki',
            'consultation': 'Konsultaciya po pitaniyu',
            'free-consultation': 'Besplatnaya 15-min konsultaciya'
        }
    }
};

// Service prices
const servicePrices = {
    'initial': 65,
    'followup': 45,
    'package3': 150,
    'package5': 220,
    'cgm-diagnostic': 150,
    'consultation': 80,
    'free-consultation': 0
};

// API Base URL for confirmation links
const API_BASE_URL = process.env.API_BASE_URL || 'https://sofija-nutrition-api.azurewebsites.net';

function generateClientEmailHTML(t, name, bookingId, serviceName, formatLabel, date, time, price) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2d5a4a 0%, #3a7365 100%); padding: 40px 40px 30px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 600; letter-spacing: -0.5px;">Sofija Ivanova</h1>
                                        <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px; font-weight: 400;">${t.emailSubtitle}</p>
                                        <div style="width: 50px; height: 3px; background-color: #d4a574; margin-top: 16px; border-radius: 2px;"></div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 20px 0; color: #2d5a4a; font-size: 24px; font-weight: 600;">${t.emailThankYou}</h2>
                            <p style="margin: 0 0 25px 0; color: #444; font-size: 16px; line-height: 1.6;">${t.emailGreeting(name)}</p>
                            <p style="margin: 0 0 25px 0; color: #666; font-size: 15px; line-height: 1.6;">${t.emailConfirmed}</p>
                            
                            <!-- Booking Details Card -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%); border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 25px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                                                    <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.emailBookingId}</span><br>
                                                    <span style="color: #2d5a4a; font-size: 16px; font-weight: 600;">${bookingId}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                                                    <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.emailService}</span><br>
                                                    <span style="color: #333; font-size: 16px; font-weight: 500;">${serviceName}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                                                    <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.emailFormat}</span><br>
                                                    <span style="color: #333; font-size: 16px; font-weight: 500;">${formatLabel}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 12px 0; border-bottom: 1px solid #e0e0e0;">
                                                    <table width="100%" cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td width="50%">
                                                                <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.emailDate}</span><br>
                                                                <span style="color: #333; font-size: 16px; font-weight: 500;">${date}</span>
                                                            </td>
                                                            <td width="50%">
                                                                <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.emailTime}</span><br>
                                                                <span style="color: #333; font-size: 16px; font-weight: 500;">${time}</span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 16px 0 0 0;">
                                                    <span style="color: #888; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">${t.emailPrice}</span><br>
                                                    <span style="color: #2d5a4a; font-size: 28px; font-weight: 700;">${price > 0 ? '€' + price : 'FREE'}</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0 0 15px 0; color: #666; font-size: 14px; line-height: 1.6;">
                                📎 ${t.emailInvoiceAttached}
                            </p>
                            <p style="margin: 0 0 30px 0; color: #666; font-size: 14px; line-height: 1.6;">
                                ${t.emailQuestions}
                            </p>
                            
                            <p style="margin: 0; color: #444; font-size: 15px; line-height: 1.8;">
                                ${t.emailRegards}<br>
                                <strong style="color: #2d5a4a;">Sofija Ivanova</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2d5a4a; padding: 25px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">www.sofija-nutrition.lv</p>
                                    </td>
                                    <td align="right">
                                        <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 12px;">© 2026 Sofija Ivanova</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function generateAdminEmailHTML(booking, confirmUrl) {
    const formatLabel = booking.consultationFormat === 'online' ? 'Attalinati' : 'Klatiene';
    return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #d4a574 0%, #c4956a 100%); padding: 30px 40px;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">🆕 Jauna rezervacija!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 30px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8f9fa; border-radius: 12px; margin-bottom: 25px;">
                                <tr>
                                    <td style="padding: 20px;">
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                                                    <span style="color: #888; font-size: 12px; text-transform: uppercase;">Numurs</span><br>
                                                    <span style="color: #2d5a4a; font-size: 18px; font-weight: 700;">${booking.id}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                                                    <span style="color: #888; font-size: 12px; text-transform: uppercase;">Klients</span><br>
                                                    <span style="font-size: 16px; font-weight: 500;">${booking.name}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                                                    <span style="color: #888; font-size: 12px; text-transform: uppercase;">E-pasts</span><br>
                                                    <span style="font-size: 14px;">${booking.email}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                                                    <span style="color: #888; font-size: 12px; text-transform: uppercase;">Telefons</span><br>
                                                    <span style="font-size: 14px;">${booking.phone || 'Nav noradits'}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                                                    <span style="color: #888; font-size: 12px; text-transform: uppercase;">Pakalpojums</span><br>
                                                    <span style="font-size: 14px; font-weight: 500;">${booking.serviceName}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                                                    <span style="color: #888; font-size: 12px; text-transform: uppercase;">Formats</span><br>
                                                    <span style="font-size: 14px; font-weight: 500; color: ${booking.consultationFormat === 'online' ? '#2196F3' : '#4CAF50'};">
                                                        ${booking.consultationFormat === 'online' ? '💻' : '📍'} ${formatLabel}
                                                    </span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                                                    <table width="100%">
                                                        <tr>
                                                            <td width="50%">
                                                                <span style="color: #888; font-size: 12px; text-transform: uppercase;">Datums</span><br>
                                                                <span style="font-size: 14px; font-weight: 500;">${booking.date}</span>
                                                            </td>
                                                            <td width="50%">
                                                                <span style="color: #888; font-size: 12px; text-transform: uppercase;">Laiks</span><br>
                                                                <span style="font-size: 14px; font-weight: 500;">${booking.time}</span>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0; border-bottom: 1px solid #e0e0e0;">
                                                    <span style="color: #888; font-size: 12px; text-transform: uppercase;">Summa</span><br>
                                                    <span style="font-size: 22px; font-weight: 700; color: #2d5a4a;">${booking.price > 0 ? '€' + booking.price : 'BEZMAKSAS'}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 10px 0;">
                                                    <span style="color: #888; font-size: 12px; text-transform: uppercase;">Valoda</span><br>
                                                    <span style="font-size: 14px;">${booking.language.toUpperCase()}</span>
                                                </td>
                                            </tr>
                                            ${booking.notes ? `
                                            <tr>
                                                <td style="padding: 10px 0; border-top: 1px solid #e0e0e0;">
                                                    <span style="color: #888; font-size: 12px; text-transform: uppercase;">Piezimes</span><br>
                                                    <span style="font-size: 14px;">${booking.notes}</span>
                                                </td>
                                            </tr>
                                            ` : ''}
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Confirm Payment Button -->
                            ${booking.price > 0 ? `
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <p style="margin: 0 0 15px 0; color: #666; font-size: 14px;">Kad maksajums sanems, nospied pogu:</p>
                                        <a href="${confirmUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);">
                                            ✓ Apstiprinat maksajumu
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            ` : `
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <p style="margin: 0; padding: 15px 25px; background: #e8f5e9; border-radius: 8px; color: #2e7d32; font-size: 14px;">
                                            ✓ Bezmaksas konsultacija - maksajums nav nepieciesams
                                        </p>
                                    </td>
                                </tr>
                            </table>
                            `}
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2d5a4a; padding: 20px 40px; text-align: center;">
                            <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 12px;">Sofija Nutrition Booking System</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

function generatePaymentConfirmedEmailHTML(t, booking) {
    const formatLabel = booking.consultationFormat === 'online' ? t.formatOnline : t.formatInPerson;
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 40px 40px 30px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-block; line-height: 80px; font-size: 40px;">✓</div>
                                        <h1 style="margin: 20px 0 0 0; color: #ffffff; font-size: 28px; font-weight: 600;">${t.paymentConfirmedTitle}</h1>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 25px 0; color: #444; font-size: 16px; line-height: 1.6; text-align: center;">${t.paymentConfirmedText}</p>
                            
                            <!-- Appointment Details -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%); border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                                <tr>
                                    <td style="padding: 30px; text-align: center;">
                                        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${t.emailService}</p>
                                        <p style="margin: 0 0 20px 0; color: #2d5a4a; font-size: 20px; font-weight: 600;">${booking.serviceName}</p>
                                        
                                        <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${t.emailFormat}</p>
                                        <p style="margin: 0 0 20px 0; color: #333; font-size: 16px; font-weight: 500;">
                                            ${booking.consultationFormat === 'online' ? '💻' : '📍'} ${formatLabel}
                                        </p>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td width="50%" style="text-align: center; padding: 15px;">
                                                    <p style="margin: 0 0 5px 0; color: #666; font-size: 13px;">${t.emailDate}</p>
                                                    <p style="margin: 0; color: #2d5a4a; font-size: 24px; font-weight: 700;">${booking.date}</p>
                                                </td>
                                                <td width="50%" style="text-align: center; padding: 15px; border-left: 2px solid rgba(45, 90, 74, 0.2);">
                                                    <p style="margin: 0 0 5px 0; color: #666; font-size: 13px;">${t.emailTime}</p>
                                                    <p style="margin: 0; color: #2d5a4a; font-size: 24px; font-weight: 700;">${booking.time}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0; color: #444; font-size: 15px; line-height: 1.8; text-align: center;">
                                ${t.emailRegards}<br>
                                <strong style="color: #2d5a4a;">Sofija Ivanova</strong>
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2d5a4a; padding: 25px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td>
                                        <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">www.sofija-nutrition.lv</p>
                                    </td>
                                    <td align="right">
                                        <p style="margin: 0; color: rgba(255,255,255,0.6); font-size: 12px;">© 2026 Sofija Ivanova</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// Create Booking Endpoint
app.http('createBooking', {
    methods: ['POST'],
    authLevel: 'anonymous',
    route: 'bookings',
    handler: async (request, context) => {
        try {
            const body = await request.json();
            const { email, phone, date, time, notes, message, language, consultationFormat } = body;
            const name = body.name || '';
            const service = body.service || body.serviceType;
            const bookingNotes = notes || message;
            const lang = translations[language] ? language : 'lv';
            const t = translations[lang];
            const format = consultationFormat || 'online';

            // Validate required fields
            if (!name || !email || !date || !time || !service) {
                return {
                    status: 400,
                    jsonBody: { error: 'Missing required fields: name, email, date, time, service' }
                };
            }

            // Generate booking ID
            const bookingId = `SN-${Date.now().toString(36).toUpperCase()}`;

            // Get service info
            const price = servicePrices[service] || 0;
            const serviceName = t.services[service] || service;
            const formatLabel = format === 'online' ? t.formatOnline : t.formatInPerson;

            // Store booking data (for payment confirmation)
            const bookingData = {
                id: bookingId,
                name,
                email,
                phone,
                date,
                time,
                service,
                serviceName,
                price,
                consultationFormat: format,
                notes: bookingNotes,
                language: lang,
                paymentConfirmed: price === 0, // Free consultations are auto-confirmed
                createdAt: new Date().toISOString()
            };
            bookings.set(bookingId, bookingData);

            // Generate PDF invoice
            const pdfBytes = await generateInvoicePDF({
                bookingId,
                name,
                email,
                phone,
                date,
                time,
                serviceName,
                formatLabel,
                price,
                notes: bookingNotes,
                t
            });

            // Send confirmation emails
            const resendApiKey = process.env.RESEND_API_KEY;
            let emailStatus = { sent: false, error: null };
            
            if (resendApiKey) {
                const resend = new Resend(resendApiKey);
                
                try {
                    // Email to client
                    const clientEmailResult = await resend.emails.send({
                        from: 'Sofija Ivanova <onboarding@resend.dev>',
                        to: email,
                        subject: t.emailSubject(bookingId),
                        html: generateClientEmailHTML(t, name, bookingId, serviceName, formatLabel, date, time, price),
                        attachments: [
                            {
                                filename: `invoice-${bookingId}.pdf`,
                                content: Buffer.from(pdfBytes).toString('base64')
                            }
                        ]
                    });
                    
                    context.log('Client email result:', JSON.stringify(clientEmailResult));

                    // Email to admin with payment confirmation button
                    const adminEmail = process.env.ADMIN_EMAIL || 'ivanovs.kirils95@gmail.com';
                    const confirmUrl = `${API_BASE_URL}/api/confirm-payment?id=${bookingId}&token=${Buffer.from(bookingId + ':' + email).toString('base64')}`;
                    
                    const adminEmailResult = await resend.emails.send({
                        from: 'Sofija Ivanova <onboarding@resend.dev>',
                        to: adminEmail,
                        subject: `Jauna rezervacija - ${bookingId}`,
                        html: generateAdminEmailHTML(bookingData, confirmUrl),
                        attachments: [
                            {
                                filename: `invoice-${bookingId}.pdf`,
                                content: Buffer.from(pdfBytes).toString('base64')
                            }
                        ]
                    });
                    
                    context.log('Admin email result:', JSON.stringify(adminEmailResult));
                    emailStatus = { sent: true, clientId: clientEmailResult?.data?.id, adminId: adminEmailResult?.data?.id };
                    
                } catch (emailError) {
                    context.error('Email sending error:', emailError);
                    emailStatus = { sent: false, error: emailError.message };
                }
            } else {
                emailStatus = { sent: false, error: 'RESEND_API_KEY not configured' };
            }

            return {
                status: 201,
                jsonBody: {
                    success: true,
                    booking: {
                        id: bookingId,
                        date,
                        time,
                        name,
                        email,
                        serviceType: service,
                        serviceName,
                        consultationFormat: format,
                        price
                    },
                    emailStatus,
                    message: 'Rezervacija veiksmigi izveidota'
                }
            };

        } catch (error) {
            context.error('Error creating booking:', error);
            return {
                status: 500,
                jsonBody: { error: 'Internal server error', details: error.message }
            };
        }
    }
});

// Confirm Payment Endpoint (for admin to click from email)
app.http('confirmPayment', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'confirm-payment',
    handler: async (request, context) => {
        try {
            const url = new URL(request.url);
            const bookingId = url.searchParams.get('id');
            const token = url.searchParams.get('token');

            if (!bookingId || !token) {
                return {
                    status: 400,
                    headers: { 'Content-Type': 'text/html' },
                    body: generateConfirmationPage('error', 'Nepareizi parametri / Invalid parameters')
                };
            }

            // Get booking from storage
            const booking = bookings.get(bookingId);
            
            if (!booking) {
                // For demo: if booking not in memory, show error
                // In production: fetch from Azure Table Storage
                return {
                    status: 404,
                    headers: { 'Content-Type': 'text/html' },
                    body: generateConfirmationPage('error', `Rezervacija ${bookingId} nav atrasta. Iespejams, serveris tika restartets. / Booking not found.`)
                };
            }

            // Verify token
            const expectedToken = Buffer.from(bookingId + ':' + booking.email).toString('base64');
            if (token !== expectedToken) {
                return {
                    status: 403,
                    headers: { 'Content-Type': 'text/html' },
                    body: generateConfirmationPage('error', 'Nepareizs tokens / Invalid token')
                };
            }

            // Check if already confirmed
            if (booking.paymentConfirmed) {
                return {
                    status: 200,
                    headers: { 'Content-Type': 'text/html' },
                    body: generateConfirmationPage('already', `Maksajums jau apstiprinats! / Payment already confirmed! (${bookingId})`)
                };
            }

            // Mark as confirmed
            booking.paymentConfirmed = true;
            booking.paymentConfirmedAt = new Date().toISOString();
            bookings.set(bookingId, booking);

            // Send confirmation email to client
            const resendApiKey = process.env.RESEND_API_KEY;
            let emailSent = false;
            
            if (resendApiKey) {
                const resend = new Resend(resendApiKey);
                const t = translations[booking.language] || translations.lv;
                
                try {
                    await resend.emails.send({
                        from: 'Sofija Ivanova <onboarding@resend.dev>',
                        to: booking.email,
                        subject: t.paymentConfirmedSubject(bookingId),
                        html: generatePaymentConfirmedEmailHTML(t, booking)
                    });
                    emailSent = true;
                    context.log('Payment confirmation email sent to:', booking.email);
                } catch (emailError) {
                    context.error('Failed to send payment confirmation email:', emailError);
                }
            }

            return {
                status: 200,
                headers: { 'Content-Type': 'text/html' },
                body: generateConfirmationPage('success', `Maksajums apstiprinats! Klientam ${booking.name} (${booking.email}) nosutits apstiprinajums. / Payment confirmed!`, emailSent)
            };

        } catch (error) {
            context.error('Error confirming payment:', error);
            return {
                status: 500,
                headers: { 'Content-Type': 'text/html' },
                body: generateConfirmationPage('error', 'Servera kluda / Server error: ' + error.message)
            };
        }
    }
});

function generateConfirmationPage(status, message, emailSent = false) {
    const statusColors = {
        success: { bg: '#e8f5e9', color: '#2e7d32', icon: '✓' },
        error: { bg: '#ffebee', color: '#c62828', icon: '✕' },
        already: { bg: '#fff3e0', color: '#ef6c00', icon: '!' }
    };
    const s = statusColors[status] || statusColors.error;
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Confirmation</title>
</head>
<body style="margin: 0; padding: 40px 20px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center;">
    <div style="max-width: 500px; background: white; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: ${s.bg}; padding: 40px; text-align: center;">
            <div style="width: 80px; height: 80px; background: ${s.color}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 40px; color: white; margin-bottom: 20px;">${s.icon}</div>
            <h1 style="margin: 0; color: ${s.color}; font-size: 24px;">${status === 'success' ? 'Maksajums apstiprinats!' : status === 'already' ? 'Jau apstiprinats' : 'Kluda'}</h1>
        </div>
        <div style="padding: 30px; text-align: center;">
            <p style="margin: 0 0 20px 0; color: #666; font-size: 16px; line-height: 1.6;">${message}</p>
            ${emailSent ? '<p style="margin: 0; padding: 10px 20px; background: #e3f2fd; border-radius: 8px; color: #1565c0; font-size: 14px;">📧 E-pasts klientam nosutits!</p>' : ''}
            <a href="https://wonderful-bay-0fb550403.4.azurestaticapps.net" style="display: inline-block; margin-top: 20px; padding: 12px 30px; background: #2d5a4a; color: white; text-decoration: none; border-radius: 8px; font-size: 14px;">Atgriezties uz majas lapu</a>
        </div>
    </div>
</body>
</html>`;
}

async function generateInvoicePDF({ bookingId, name, email, phone, date, time, serviceName, formatLabel, price, notes, t }) {
    const pdfDoc = await PDFDocument.create();
    
    // Register fontkit for custom fonts with Unicode support
    pdfDoc.registerFontkit(fontkit);
    
    // Load Roboto fonts (support Latvian/Russian characters)
    const fontsDir = path.join(__dirname, '..', 'fonts');
    const regularFontBytes = fs.readFileSync(path.join(fontsDir, 'Roboto-Regular.ttf'));
    const boldFontBytes = fs.readFileSync(path.join(fontsDir, 'Roboto-Bold.ttf'));
    
    const font = await pdfDoc.embedFont(regularFontBytes);
    const boldFont = await pdfDoc.embedFont(boldFontBytes);
    
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    
    // Colors matching website
    const primaryColor = rgb(0.176, 0.353, 0.29); // #2d5a4a
    const accentColor = rgb(0.827, 0.569, 0.455); // #d39174
    const grayColor = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.95, 0.95, 0.95);
    
    // Header background
    page.drawRectangle({
        x: 0,
        y: height - 120,
        width: width,
        height: 120,
        color: primaryColor
    });
    
    // Header text - Doctor name and title
    page.drawText('Sofija Ivanova', {
        x: 50,
        y: height - 55,
        size: 28,
        font: boldFont,
        color: rgb(1, 1, 1)
    });
    
    page.drawText(t.pdfSubtitle, {
        x: 50,
        y: height - 80,
        size: 12,
        font,
        color: rgb(0.8, 0.8, 0.8)
    });
    
    // Accent line
    page.drawRectangle({
        x: 50,
        y: height - 95,
        width: 60,
        height: 3,
        color: accentColor
    });
    
    let y = height - 160;
    
    // Invoice title
    page.drawText(t.pdfInvoice, {
        x: 50,
        y,
        size: 24,
        font: boldFont,
        color: primaryColor
    });
    y -= 35;

    // Invoice details box
    page.drawRectangle({
        x: 50,
        y: y - 50,
        width: 200,
        height: 50,
        color: lightGray
    });
    
    page.drawText(`${t.pdfNumber}: ${bookingId}`, {
        x: 60,
        y: y - 20,
        size: 11,
        font: boldFont
    });

    page.drawText(`${t.pdfDate}: ${new Date().toLocaleDateString('lv-LV')}`, {
        x: 60,
        y: y - 38,
        size: 11,
        font
    });
    y -= 80;

    // Client info section
    page.drawText(t.pdfClient, {
        x: 50,
        y,
        size: 14,
        font: boldFont,
        color: primaryColor
    });
    y -= 22;

    page.drawText(`${t.pdfName}: ${name}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfEmail}: ${email}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfPhone}: ${phone || t.pdfNotProvided}`, { x: 50, y, size: 11, font });
    y -= 35;

    // Service section
    page.drawText(t.pdfService, {
        x: 50,
        y,
        size: 14,
        font: boldFont,
        color: primaryColor
    });
    y -= 22;

    page.drawText(serviceName, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfFormat}: ${formatLabel}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfDate}: ${date}`, { x: 50, y, size: 11, font });
    y -= 16;
    page.drawText(`${t.pdfTime}: ${time}`, { x: 50, y, size: 11, font });
    y -= 40;

    // Price table header
    page.drawRectangle({
        x: 50,
        y: y - 25,
        width: width - 100,
        height: 25,
        color: primaryColor
    });

    page.drawText(t.pdfService, { x: 60, y: y - 17, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    page.drawText(t.pdfPrice, { x: width - 130, y: y - 17, size: 11, font: boldFont, color: rgb(1, 1, 1) });
    y -= 40;

    // Price row
    page.drawText(serviceName, { x: 60, y, size: 11, font });
    page.drawText(price > 0 ? `€${price.toFixed(2)}` : 'FREE', { x: width - 130, y, size: 11, font });
    y -= 25;

    // Separator line
    page.drawLine({
        start: { x: 50, y },
        end: { x: width - 50, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
    });
    y -= 25;

    // Total
    page.drawRectangle({
        x: width - 200,
        y: y - 5,
        width: 150,
        height: 30,
        color: lightGray
    });
    
    page.drawText(t.pdfTotal + ':', { x: width - 190, y: y + 5, size: 12, font: boldFont });
    page.drawText(price > 0 ? `€${price.toFixed(2)}` : 'FREE', { x: width - 100, y: y + 5, size: 14, font: boldFont, color: primaryColor });
    y -= 55;

    // Payment info (only if not free)
    if (price > 0) {
        page.drawText(t.pdfPaymentInfo, {
            x: 50,
            y,
            size: 14,
            font: boldFont,
            color: primaryColor
        });
        y -= 22;

        page.drawText(`${t.pdfBank}: Swedbank`, { x: 50, y, size: 11, font });
        y -= 16;
        page.drawText('IBAN: LV00HABA0000000000000', { x: 50, y, size: 11, font });
        y -= 16;
        page.drawText(`${t.pdfReference}: ${bookingId}`, { x: 50, y, size: 11, font });
        y -= 35;
    }

    // Notes (if any)
    if (notes) {
        page.drawText(t.pdfNotes, {
            x: 50,
            y,
            size: 14,
            font: boldFont,
            color: primaryColor
        });
        y -= 22;
        const truncatedNotes = notes.length > 80 ? notes.substring(0, 80) + '...' : notes;
        page.drawText(truncatedNotes, { x: 50, y, size: 11, font, color: grayColor });
    }

    // Footer
    page.drawRectangle({
        x: 0,
        y: 0,
        width: width,
        height: 60,
        color: primaryColor
    });
    
    page.drawText(t.pdfThankYou, {
        x: 50,
        y: 35,
        size: 11,
        font,
        color: rgb(1, 1, 1)
    });
    page.drawText('www.sofija-nutrition.lv', {
        x: 50,
        y: 18,
        size: 10,
        font,
        color: rgb(0.7, 0.7, 0.7)
    });

    return await pdfDoc.save();
}
