import React, { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Operador from './pages/Operador';

function App() {
  const { user, loading, logout } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--primary)' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }}></div>
          <p>Cargando sistema...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div>
      <nav>
        <h2 className="title" style={{ margin: 0 }}>MultiBur</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#22c55e', borderRadius: '50%', marginRight: '8px' }}></span>
            Conectado
          </span>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--border)', padding: '8px 16px', fontSize: '0.9rem' }}>
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
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
