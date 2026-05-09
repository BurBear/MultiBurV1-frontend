import Button from '../ui/Button';

export default function Navbar({ user, onLogout }) {
  return (
    <nav className="navbar">
      <div>
        <h2 className="title">MultiBur</h2>
        <p className="navbar-subtitle">Control de produccion</p>
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
