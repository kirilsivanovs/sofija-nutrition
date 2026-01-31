/**
 * OData Query Sanitization (TypeScript)
 * Prevents OData injection attacks in Azure Table Storage queries
 */

// ============================================
// Constants
// ============================================

/**
 * Allowed characters for OData string values
 * Only alphanumeric, dash, underscore, and space
 */
const SAFE_ODATA_PATTERN = /^[a-zA-Z0-9\-_\s]+$/;

/**
 * Allowed status values for bookings
 */
export const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'all'] as const;

export type ValidStatus = typeof VALID_STATUSES[number];

// ============================================
// Escape Functions
// ============================================

/**
 * Escape a string value for safe use in OData filter
 */
export function escapeODataString(value: string): string {
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
 */
export function sanitizeODataValue(value: unknown, maxLength = 100): string | null {
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

// ============================================
// Validation Functions
// ============================================

/**
 * Validate booking status filter
 */
export function validateStatusFilter(status: unknown): ValidStatus {
  if (!status || typeof status !== 'string') {
    return 'all';
  }

  const normalized = status.toLowerCase().trim() as ValidStatus;

  if (VALID_STATUSES.includes(normalized)) {
    return normalized;
  }

  return 'all';
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function validateDateFormat(date: unknown): string | null {
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
 */
export function validateTimeFormat(time: unknown): string | null {
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

// ============================================
// Filter Builders
// ============================================

/**
 * Build safe OData filter for PartitionKey
 */
export function buildPartitionKeyFilter(partitionKey: string): string | null {
  const sanitized = sanitizeODataValue(partitionKey);
  if (!sanitized) {
    return null;
  }
  return `PartitionKey eq '${sanitized}'`;
}

/**
 * Build safe OData filter for RowKey
 */
export function buildRowKeyFilter(rowKey: string): string | null {
  const sanitized = sanitizeODataValue(rowKey);
  if (!sanitized) {
    return null;
  }
  return `RowKey eq '${sanitized}'`;
}

/**
 * Build safe OData filter for status
 */
export function buildStatusFilter(status: unknown): string | null {
  const validated = validateStatusFilter(status);
  if (validated === 'all') {
    return null;
  }
  return `status eq '${validated}'`;
}

// ============================================
// CommonJS exports for backward compatibility
// ============================================

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
