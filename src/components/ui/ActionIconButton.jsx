import Button from './Button';

const icons = {
  view: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.75 12s3.5-6 9.25-6 9.25 6 9.25 6-3.5 6-9.25 6-9.25-6-9.25-6Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20h4.8L19.4 9.4a2.1 2.1 0 0 0 0-3L17.6 4.6a2.1 2.1 0 0 0-3 0L4 15.2V20Z" />
      <path d="m13.8 5.4 4.8 4.8" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M5 16H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  ),
  cancel: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.8 8.8 6.4 6.4M15.2 8.8l-6.4 6.4" />
    </svg>
  ),
};

export default function ActionIconButton({
  icon,
  label,
  title,
  variant = 'outline',
  className = '',
  ...props
}) {
  return (
    <Button
      size="sm"
      variant={variant}
      className={`table-action-icon ${className}`.trim()}
      aria-label={label}
      title={title || label}
      {...props}
    >
      {icons[icon]}
      <span className="visually-hidden">{label}</span>
    </Button>
  );
}
