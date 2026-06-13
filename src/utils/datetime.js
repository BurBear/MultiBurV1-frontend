export const PERU_TIME_ZONE = 'America/Lima';

const PERU_UTC_OFFSET = '-05:00';
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_ZONE_PATTERN = /(?:Z|[+-]\d{2}:?\d{2})$/i;

function normalizeDateTimeString(value) {
  return value.trim().replace(/\s+/, 'T');
}

function isValidDate(date) {
  return date && !Number.isNaN(date.getTime());
}

function parseDateOnlyAsPeru(value) {
  return new Date(`${value}T00:00:00${PERU_UTC_OFFSET}`);
}

export function parseApiDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return new Date(value);

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (DATE_ONLY_PATTERN.test(trimmed)) return parseDateOnlyAsPeru(trimmed);

  const normalizedValue = normalizeDateTimeString(trimmed);
  const hasTimeZone = TIME_ZONE_PATTERN.test(normalizedValue);
  const normalized = !hasTimeZone ? `${normalizedValue}Z` : normalizedValue;
  return new Date(normalized);
}

export function parseLocalDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return new Date(value);

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (DATE_ONLY_PATTERN.test(trimmed)) return parseDateOnlyAsPeru(trimmed);

  const normalizedValue = normalizeDateTimeString(trimmed);
  const hasTimeZone = TIME_ZONE_PATTERN.test(normalizedValue);
  const normalized = !hasTimeZone ? `${normalizedValue}${PERU_UTC_OFFSET}` : normalizedValue;
  return new Date(normalized);
}

export function getApiDateTimeValue(value, fallback = Number.MAX_SAFE_INTEGER) {
  const date = parseApiDateTime(value);
  return isValidDate(date) ? date.getTime() : fallback;
}

export function getLocalDateTimeValue(value, fallback = Number.MAX_SAFE_INTEGER) {
  const date = parseLocalDateTime(value);
  return isValidDate(date) ? date.getTime() : fallback;
}

export function formatDateTime(value) {
  const date = parseApiDateTime(value);
  if (!isValidDate(date)) return '-';

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: PERU_TIME_ZONE,
  }).format(date);
}

export function formatLocalDate(value) {
  const date = parseLocalDateTime(value);
  if (!isValidDate(date)) return '-';

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeZone: PERU_TIME_ZONE,
  }).format(date);
}

export function formatLocalTime(value) {
  const date = parseLocalDateTime(value);
  if (!isValidDate(date)) return '';

  return new Intl.DateTimeFormat('es-PE', {
    timeStyle: 'short',
    timeZone: PERU_TIME_ZONE,
  }).format(date);
}

export function formatLocalDateTime(value) {
  if (!value) return '-';
  if (typeof value === 'string' && DATE_ONLY_PATTERN.test(value.trim())) {
    return formatLocalDate(value);
  }

  const date = parseLocalDateTime(value);
  if (!isValidDate(date)) return '-';

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: PERU_TIME_ZONE,
  }).format(date);
}

export function formatLocalDateTimeParts(value) {
  if (!value) return { date: '-', time: '' };
  if (typeof value === 'string' && DATE_ONLY_PATTERN.test(value.trim())) {
    return { date: formatLocalDate(value), time: '' };
  }

  const date = parseLocalDateTime(value);
  if (!isValidDate(date)) return { date: '-', time: '' };

  return {
    date: new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeZone: PERU_TIME_ZONE,
    }).format(date),
    time: new Intl.DateTimeFormat('es-PE', {
      timeStyle: 'short',
      timeZone: PERU_TIME_ZONE,
    }).format(date),
  };
}

export function toPeruDateTimeInputValue(value) {
  const date = parseLocalDateTime(value);
  if (!isValidDate(date)) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PERU_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}
