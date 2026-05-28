import Button from './Button';

export default function Modal({
  title,
  children,
  onClose,
  footer,
  panelClassName = '',
  headerMeta,
  closeDisabled = false,
}) {
  const handleClose = () => {
    if (!closeDisabled) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={handleClose}>
      <section
        className={`modal-panel fade-in ${panelClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          {headerMeta && <div className="modal-header-meta">{headerMeta}</div>}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={closeDisabled}
            aria-label="Cerrar modal"
            title={closeDisabled ? 'Pausa o finaliza el proceso antes de cerrar.' : 'Cerrar modal'}
          >
            X
          </Button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-footer">{footer}</footer>}
      </section>
    </div>
  );
}
