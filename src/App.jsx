import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Operador from './pages/Operador';
import Navbar from './components/layout/Navbar';
import { getRoleDestination, isKnownRole } from './utils/roles';

function App() {
  const { user, loading, logout } = useContext(AuthContext);

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

  return (
    <div>
      <Navbar user={user} onLogout={logout} />

      <main className="app-shell">
        {showRoleWarning && (
          <div className="alert alert-warning">
            Rol no reconocido: {user.rol}. Se muestra la vista operativa por defecto.
          </div>
        )}

        {destination === 'ADMIN' ? (
          <Admin user={user} />
        ) : (
          <Operador user={user} />
        )}
      </main>
    </div>
  );
}

export default App;
