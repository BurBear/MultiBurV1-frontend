import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../services/api';

export default function Login() {
  const { login } = useContext(AuthContext);

  const [isRegister, setIsRegister] = useState(false);

  // Estados para Login y Registro
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('ADMIN');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    if (isRegister) {
      try {
        await apiFetch('/auth/register', {
          method: 'POST',
          body: { email, password, nombre, rol }
        });
        setSuccess('¡Usuario creado con éxito! Iniciando sesión...');

        // Auto-login tras el registro
        await login(email, password);
      } catch (err) {
        setError(err.message || 'Error al registrar usuario');
        setIsSubmitting(false);
      }
    } else {
      try {
        await login(email, password);
      } catch (err) {
        setError(err.message || 'Error al iniciar sesión');
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="glass-panel fade-in" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 className="title" style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>MultiBur</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Sistema de Control de Producción
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          {isRegister && (
            <>
              <div>
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div>
                <select
                  value={rol}
                  onChange={(e) => setRol(e.target.value)}
                  required
                  style={{ width: '100%', padding: '12px 16px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-dark)', color: 'white', outline: 'none' }}
                >
                  <option value="ADMIN">ADMIN (Pre-prensa / Gerencia)</option>
                  <option value="OPERADOR_IMPRESION">OPERADOR DE IMPRESIÓN</option>
                  <option value="OPERADOR_ACABADOS">OPERADOR DE ACABADOS</option>
                </select>
              </div>
            </>
          )}

          <div>
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="fade-in" style={{ color: '#f87171', fontSize: '0.9rem', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="fade-in" style={{ color: '#4ade80', fontSize: '0.9rem', padding: '10px', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '8px', border: '1px solid rgba(74, 222, 128, 0.2)' }}>
              {success}
            </div>
          )}

          <button type="submit" disabled={isSubmitting} style={{ marginTop: '10px' }}>
            {isSubmitting ? 'Procesando...' : (isRegister ? 'Registrar y Entrar' : 'Iniciar Sesión')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
            style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', textDecoration: 'underline', padding: 0 }}
          >
            {isRegister ? 'Ya tengo una cuenta. Iniciar Sesión' : 'Registrar usuario de prueba'}
          </button>
        </div>
      </div>
    </div>
  );
}
