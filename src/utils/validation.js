export function isBlank(value) {
  return value === null || value === undefined || String(value).trim() === '';
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}

export function normalizeValidationResult(result) {
  if (!result) return { fieldErrors: {}, formError: '' };
  if (typeof result === 'string') return { fieldErrors: {}, formError: result };
  return { fieldErrors: result, formError: '' };
}

export function validateRequired(errors, values, field, message) {
  if (isBlank(values[field])) errors[field] = message;
}

export function validateNonNegativeNumber(errors, values, field, message) {
  if (!isBlank(values[field]) && Number(values[field]) < 0) errors[field] = message;
}

export function validatePositiveNumber(errors, values, field, message) {
  if (isBlank(values[field]) || Number(values[field]) <= 0) errors[field] = message;
}
