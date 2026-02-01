/**
 * Settings-related TypeScript types
 * Shared between frontend and backend
 */

/**
 * Service definition
 */
export interface Service {
    id: string;
    name: {
        lv: string;
        en?: string;
    };
    description?: {
        lv: string;
        en?: string;
    };
    duration: number; // minutes
    price?: number; // EUR
    active: boolean;
    order?: number; // Display order
}

/**
 * Email template configuration
 */
export interface EmailTemplate {
    subject: string;
    body: string;
    variables?: string[]; // Available variables like {{name}}, {{date}}
}

/**
 * Email settings
 */
export interface EmailSettings {
    confirmationTemplate: EmailTemplate;
    cancellationTemplate: EmailTemplate;
    reminderTemplate: EmailTemplate;
    adminNotificationEmail: string;
    sendReminders: boolean;
    reminderHoursBefore: number;
}

/**
 * Payment settings
 */
export interface PaymentSettings {
    enabled: boolean;
    stripePublicKey?: string;
    requirePaymentUpfront: boolean;
    depositAmount?: number; // EUR
    refundPolicy?: string;
}

/**
 * General settings
 */
export interface GeneralSettings {
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    businessAddress?: string;
    timezone: string;
    locale: string;
    currency: string;
}

/**
 * Notification settings
 */
export interface NotificationSettings {
    emailNotifications: boolean;
    smsNotifications: boolean;
    adminNotifications: boolean;
}

/**
 * Complete application settings
 */
export interface AppSettings {
    general: GeneralSettings;
    services: Service[];
    email: EmailSettings;
    payment: PaymentSettings;
    notifications: NotificationSettings;
    updatedAt?: string; // ISO timestamp
}

/**
 * Settings update data (partial)
 */
export type UpdateSettingsData = Partial<AppSettings>;
