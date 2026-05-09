export default function Input({ label, className = '', id, ...props }) {
  const inputId = id || props.name;

  return (
    <label className="field" htmlFor={inputId}>
      {label && <span className="field-label">{label}</span>}
      <input id={inputId} className={`input ${className}`.trim()} {...props} />
    </label>
  );
}
