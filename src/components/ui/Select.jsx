export default function Select({ label, className = '', id, children, error = '', ...props }) {
  const selectId = id || props.name;
  const errorId = error ? `${selectId}-error` : undefined;
  const describedBy = [props['aria-describedby'], errorId].filter(Boolean).join(' ') || undefined;
  const selectClassName = ['input', 'select', className, error ? 'input-error' : ''].filter(Boolean).join(' ');

  return (
    <label className={`field ${error ? 'field-invalid' : ''}`.trim()} htmlFor={selectId}>
      {label && <span className="field-label">{label}</span>}
      <select
        id={selectId}
        className={selectClassName}
        {...props}
        aria-invalid={error ? 'true' : props['aria-invalid']}
        aria-describedby={describedBy}
      >
        {children}
      </select>
      {error && <span id={errorId} className="field-error">{error}</span>}
    </label>
  );
}
