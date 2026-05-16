import Button from '../ui/Button';

export default function Navbar({ user, onLogout, showMenuButton = false, onMenuClick }) {
  return (
    <nav className="navbar">
      <div className="navbar-brand-row">
        {showMenuButton && (
          <Button
            className="navbar-menu-button"
            variant="outline"
            size="sm"
            onClick={onMenuClick}
            aria-label="Abrir menu"
            title="Abrir menu"
          >
            <span />
            <span />
            <span />
          </Button>
        )}
        <div>
          <h2 className="title">MultiBur</h2>
          <p className="navbar-subtitle">Control de produccion</p>
        </div>
      </div>
      <div className="navbar-actions">
        <span className="connection-status">
          <span className="status-dot" aria-hidden="true" />
          {user?.nombre || 'Conectado'}
        </span>
        <Button variant="outline" size="sm" onClick={onLogout}>
          Cerrar sesion
        </Button>
      </div>
    </nav>
  );
}
