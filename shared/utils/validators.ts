/**
 * Shared validation utilities
 * Used across frontend and backend to ensure consistent validation
 */

/**
 * Validates date string format (yyyy-mm-dd)
 * @param dateStr - Date string to validate
 * @returns True if valid date
 * @example isValidDate('2024-02-01') // true
 * @example isValidDate('2024-13-01') // false (invalid month)
 */
export function isValidDate(dateStr: string): boolean {
    if (!dateStr) return false;
    
    // Check format yyyy-mm-dd
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) return false;
    
    // Check if valid date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    
    // Check if date components match (prevents dates like 2024-02-31)
    const [year, month, day] = dateStr.split('-').map(Number);
    return (
        date.getFullYear() === year &&
        date.getMonth() === month - 1 &&
        date.getDate() === day
    );
}

/**
 * Validates time string format (HH:MM)
 * @param timeStr - Time string to validate
 * @returns True if valid time in 24-hour format
 * @example isValidTime('09:30') // true
 * @example isValidTime('25:00') // false (invalid hour)
 */
export function isValidTime(timeStr: string): boolean {
    if (!timeStr) return false;
    
    // Check format HH:MM
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
    return timeRegex.test(timeStr);
}

/**
 * Validates email address format
 * @param email - Email address to validate
 * @returns True if valid email format
 * @example isValidEmail('user@example.com') // true
 * @example isValidEmail('invalid-email') // false
 */
export function isValidEmail(email: string): boolean {
    if (!email) return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates phone number (flexible format)
 * @param phone - Phone number to validate
 * @returns True if valid phone format
 * @example isValidPhone('+371 12345678') // true
 */
export function isValidPhone(phone: string): boolean {
    if (!phone) return false;
    
    // Remove spaces, dashes, parentheses
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    
    // Check if contains only digits and optional + at start
    const phoneRegex = /^\+?[0-9]{8,15}$/;
    return phoneRegex.test(cleanPhone);
}

/**
 * Validates that date is not in the past
 * @param dateStr - Date string in yyyy-mm-dd format
 * @returns True if date is today or in the future
 */
export function isDateInFuture(dateStr: string): boolean {
    if (!isValidDate(dateStr)) return false;
    
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return date >= today;
}

/**
 * Validates time slot duration
 * @param startTime - Start time (HH:MM)
 * @param endTime - End time (HH:MM)
 * @param minDuration - Minimum duration in minutes (default: 30)
 * @returns True if time slot is valid and meets minimum duration
 */
export function isValidTimeSlot(startTime: string, endTime: string, minDuration: number = 30): boolean {
    if (!isValidTime(startTime) || !isValidTime(endTime)) return false;
    
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const duration = endMinutes - startMinutes;
    
    return duration >= minDuration;
}
