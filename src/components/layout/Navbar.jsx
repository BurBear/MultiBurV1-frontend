import Button from '../ui/Button';
import BrandLogo from '../brand/BrandLogo';

export default function Navbar({
  user,
  onLogout,
  showMenuButton = false,
  onMenuClick,
  centerTitle = '',
  centerSubtitle = '',
}) {
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
        <BrandLogo className="brand-logo-navbar" />
        <div>
          <h2 className="title">MultiBur</h2>
          <p className="navbar-subtitle">Control de produccion</p>
        </div>
      </div>
      {centerTitle && (
        <div className="navbar-center-context">
          <span>{centerSubtitle}</span>
          <strong>{centerTitle}</strong>
        </div>
      )}
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
