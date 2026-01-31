/**
 * OData Query Sanitization
 * Prevents OData injection attacks in Azure Table Storage queries
 */

/**
 * Allowed characters for OData string values
 * Only alphanumeric, dash, underscore, and space
 */
const SAFE_ODATA_PATTERN = /^[a-zA-Z0-9\-_\s]+$/;

/**
 * Allowed status values for bookings
 */
const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'all'];

/**
 * Escape a string value for safe use in OData filter
 * @param {string} value - The value to escape
 * @returns {string} - Escaped value safe for OData
 */
function escapeODataString(value) {
    if (!value || typeof value !== 'string') {
        return '';
    }
    
    // Remove any single quotes (OData string delimiter)
    // Replace with escaped version
    return value.replace(/'/g, "''");
}

/**
 * Validate and sanitize a value for OData filter
 * Only allows safe alphanumeric characters
 * @param {string} value - The value to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string|null} - Sanitized value or null if invalid
 */
function sanitizeODataValue(value, maxLength = 100) {
    if (!value || typeof value !== 'string') {
        return null;
    }
    
    // Trim and limit length
    const trimmed = value.trim().substring(0, maxLength);
    
    // Check against allowed pattern
    if (!SAFE_ODATA_PATTERN.test(trimmed)) {
        return null;
    }
    
    return escapeODataString(trimmed);
}

/**
 * Validate booking status filter
 * @param {string} status - Status value from query param
 * @returns {string} - Valid status or 'all'
 */
function validateStatusFilter(status) {
    if (!status || typeof status !== 'string') {
        return 'all';
    }
    
    const normalized = status.toLowerCase().trim();
    
    if (VALID_STATUSES.includes(normalized)) {
        return normalized;
    }
    
    return 'all';
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string
 * @returns {string|null} - Valid date or null
 */
function validateDateFormat(date) {
    if (!date || typeof date !== 'string') {
        return null;
    }
    
    // Strict date format: YYYY-MM-DD
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
        return null;
    }
    
    // Validate it's a real date
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
        return null;
    }
    
    return date;
}

/**
 * Validate time format (HH:MM)
 * @param {string} time - Time string
 * @returns {string|null} - Valid time or null
 */
function validateTimeFormat(time) {
    if (!time || typeof time !== 'string') {
        return null;
    }
    
    // Strict time format: HH:MM
    const timePattern = /^\d{2}:\d{2}$/;
    if (!timePattern.test(time)) {
        return null;
    }
    
    const [hours, minutes] = time.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
    }
    
    return time;
}

/**
 * Build safe OData filter for PartitionKey
 * @param {string} partitionKey - The partition key value
 * @returns {string|null} - Safe filter string or null
 */
function buildPartitionKeyFilter(partitionKey) {
    const sanitized = sanitizeODataValue(partitionKey);
    if (!sanitized) {
        return null;
    }
    return `PartitionKey eq '${sanitized}'`;
}

/**
 * Build safe OData filter for RowKey
 * @param {string} rowKey - The row key value
 * @returns {string|null} - Safe filter string or null
 */
function buildRowKeyFilter(rowKey) {
    const sanitized = sanitizeODataValue(rowKey);
    if (!sanitized) {
        return null;
    }
    return `RowKey eq '${sanitized}'`;
}

/**
 * Build safe OData filter for status
 * @param {string} status - Status value
 * @returns {string|null} - Safe filter string or null if 'all'
 */
function buildStatusFilter(status) {
    const validated = validateStatusFilter(status);
    if (validated === 'all') {
        return null;
    }
    return `status eq '${validated}'`;
}

module.exports = {
    escapeODataString,
    sanitizeODataValue,
    validateStatusFilter,
    validateDateFormat,
    validateTimeFormat,
    buildPartitionKeyFilter,
    buildRowKeyFilter,
    buildStatusFilter,
    VALID_STATUSES
};
