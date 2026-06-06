import { useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Operador from './pages/Operador';
import Navbar from './components/layout/Navbar';
import { getRoleDestination, isKnownRole } from './utils/roles';

function App() {
  const { user, loading, logout } = useContext(AuthContext);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [operatorMenuOpen, setOperatorMenuOpen] = useState(false);
  const [adminSectionTitle, setAdminSectionTitle] = useState('Dashboard');

  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-content">
          <div className="spinner" />
          <p>Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const destination = getRoleDestination(user.rol);
  const showRoleWarning = !isKnownRole(user.rol);
  const isAdminDestination = destination === 'ADMIN';

  return (
    <div>
      <Navbar
        user={user}
        onLogout={logout}
        showMenuButton
        onMenuClick={() => (isAdminDestination ? setAdminMenuOpen(true) : setOperatorMenuOpen(true))}
        centerTitle={isAdminDestination ? adminSectionTitle : 'Pizarra Operativa'}
        centerSubtitle={isAdminDestination ? 'Panel de Administracion' : 'Menu de estados'}
      />

      <main className={`app-shell ${isAdminDestination ? 'app-shell-admin' : ''}`}>
        {showRoleWarning && (
          <div className="alert alert-warning">
            Rol no reconocido: {user.rol}. Se muestra la vista operativa por defecto.
          </div>
        )}

        {isAdminDestination ? (
          <Admin
            menuOpen={adminMenuOpen}
            setMenuOpen={setAdminMenuOpen}
            onSectionChange={setAdminSectionTitle}
          />
        ) : (
          <Operador user={user} menuOpen={operatorMenuOpen} setMenuOpen={setOperatorMenuOpen} />
        )}
      </main>
    </div>
  );
}

export default App;
