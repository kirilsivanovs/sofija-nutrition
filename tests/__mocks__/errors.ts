/**
 * Mock errors module for frontend-ts tests
 */
export interface ValidationError {
  field: string;
  message: string;
}

export function createValidationError(field: string, message: string): ValidationError {
  return { field, message };
}

export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0].message;
  return errors.map(e => `• ${e.message}`).join('\n');
}
