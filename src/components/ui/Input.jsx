export default function Input({ label, className = '', id, error = '', ...props }) {
  const inputId = id || props.name;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [props['aria-describedby'], errorId].filter(Boolean).join(' ') || undefined;
  const inputClassName = ['input', className, error ? 'input-error' : ''].filter(Boolean).join(' ');

  return (
    <label className={`field ${error ? 'field-invalid' : ''}`.trim()} htmlFor={inputId}>
      {label && <span className="field-label">{label}</span>}
      <input
        id={inputId}
        className={inputClassName}
        {...props}
        aria-invalid={error ? 'true' : props['aria-invalid']}
        aria-describedby={describedBy}
      />
      {error && <span id={errorId} className="field-error">{error}</span>}
    </label>
  );
}
