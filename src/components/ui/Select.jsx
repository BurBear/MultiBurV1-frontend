export default function Select({ label, className = '', id, children, ...props }) {
  const selectId = id || props.name;

  return (
    <label className="field" htmlFor={selectId}>
      {label && <span className="field-label">{label}</span>}
      <select id={selectId} className={`input select ${className}`.trim()} {...props}>
        {children}
      </select>
    </label>
  );
}
