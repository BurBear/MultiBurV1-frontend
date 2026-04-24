import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Operador from './pages/Operador';

function App() {
  const { user, loading, logout } = useContext(AuthContext);

  if (loading) {
    return <div>Cargando sistema...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div>
      <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', background: '#333', color: 'white' }}>
        <h2>MultiBur Producción</h2>
        <button onClick={logout}>Cerrar Sesión</button>
      </nav>

      <main style={{ padding: '20px' }}>
        {user.rol === "ADMIN" ? (
          <Admin user={user} />
        ) : (
          <Operador user={user} />
        )}
      </main>
    </div>
  );
}

export default App;
