const PERU_TIME_ZONE = 'America/Lima';

function parseApiDateTime(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value !== 'string') return new Date(value);

  const trimmed = value.trim();
  if (!trimmed) return null;

  const hasTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  const normalized = trimmed.includes('T') && !hasTimeZone ? `${trimmed}Z` : trimmed;
  return new Date(normalized);
}

export function formatDateTime(value) {
  const date = parseApiDateTime(value);
  if (!date || Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: PERU_TIME_ZONE,
  }).format(date);
}

export function formatLocalDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('es-PE', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

export function formatLocalDateTimeParts(value) {
  if (!value) return { date: '-', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '-', time: '' };

  return {
    date: new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
    }).format(date),
    time: new Intl.DateTimeFormat('es-PE', {
      timeStyle: 'short',
    }).format(date),
  };
}
