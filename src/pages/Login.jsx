import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';

export default function Login() {
  const { login } = useContext(AuthContext);

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('ADMIN');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    if (!email.trim() || !password.trim()) return 'Ingresa correo y contraseña.';
    if (!email.includes('@')) return 'Ingresa un correo valido.';
    if (password.length < 4) return 'La contraseña debe tener al menos 4 caracteres.';
    if (isRegister && !nombre.trim()) return 'Ingresa el nombre del usuario de prueba.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        await apiFetch('/auth/register', {
          method: 'POST',
          body: { email: email.trim(), password, nombre: nombre.trim(), rol },
        });
        setSuccess('Usuario creado. Iniciando sesion...');
      }

      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || (isRegister ? 'Error al registrar usuario' : 'Error al iniciar sesion'));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-screen">
      <section className="login-panel fade-in">
        <h1 className="title login-title">MultiBur</h1>
        <p className="login-subtitle">Sistema de Control de Produccion</p>

        {isRegister && <div className="alert alert-warning">Registro solo para pruebas</div>}

        <form className="form-stack" onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <Input
                label="Nombre completo"
                name="nombre"
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                required
              />
              <Select label="Rol" name="rol" value={rol} onChange={(event) => setRol(event.target.value)} required>
                <option value="ADMIN">ADMIN (Pre-prensa / Gerencia)</option>
                <option value="OPERADOR_IMPRESION">OPERADOR DE IMPRESION</option>
                <option value="OPERADOR_ACABADOS">OPERADOR DE ACABADOS</option>
              </Select>
            </>
          )}

          <Input
            label="Correo electronico"
            name="email"
            type="email"
            placeholder="correo@empresa.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            label="Contraseña"
            name="password"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : isRegister ? 'Registrar y entrar' : 'Iniciar sesion'}
          </Button>
        </form>

        <Button
          variant="ghost"
          className="login-dev-toggle"
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
            setSuccess('');
          }}
        >
          {isRegister ? 'Volver al inicio de sesion' : 'Modo desarrollo: registrar prueba'}
        </Button>
      </section>
    </main>
  );
}
