export default function PageHeader({ title, subtitle, meta, accent = 'primary', children }) {
  return (
    <header className={`page-header page-header-${accent}`}>
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {(meta || children) && (
        <div className="page-header-side">
          {meta}
          {children}
        </div>
      )}
    </header>
  );
}
