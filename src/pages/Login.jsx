import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { apiFetch } from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import BrandLogo from '../components/brand/BrandLogo';
import { hasErrors, isBlank, isValidEmail } from '../utils/validation';

// eslint-disable-next-line react-refresh/only-export-components
export function validateLoginFields({ email, password, nombre = '', isRegister = false }) {
  const errors = {};
  if (isBlank(email)) errors.email = 'Ingresa el correo electrónico.';
  else if (!isValidEmail(email)) errors.email = 'Ingresa un correo válido.';
  if (isBlank(password)) errors.password = 'Ingresa la contraseña.';
  else if (password.length < 4) errors.password = 'La contraseña debe tener al menos 4 caracteres.';
  if (isRegister && isBlank(nombre)) errors.nombre = 'Ingresa el nombre del usuario.';
  return errors;
}

export default function Login() {
  const { login } = useContext(AuthContext);

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('ADMIN');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    return validateLoginFields({ email, password, nombre, isRegister });
  };

  const clearFieldError = (field) => {
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    const validationErrors = validate();
    if (hasErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      if (isRegister) {
        await apiFetch('/auth/register', {
          method: 'POST',
          body: { email: email.trim(), password, nombre: nombre.trim(), rol },
        });
        setSuccess('Usuario creado. Iniciando sesión...');
      }

      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || (isRegister ? 'Error al registrar usuario' : 'Error al iniciar sesión'));
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-screen">
      <section className="login-panel fade-in">
        <div className="login-brand">
          <BrandLogo className="brand-logo-login" />
          <h1 className="title login-title">MultiBur</h1>
        </div>
        <p className="login-subtitle">Sistema de Control de Producción</p>

        {isRegister && <div className="alert alert-warning">Registro solo para pruebas</div>}

        <form className="form-stack" onSubmit={handleSubmit} noValidate>
          {isRegister && (
            <>
              <Input
                label="Nombre completo"
                name="nombre"
                type="text"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(event) => {
                  setNombre(event.target.value);
                  clearFieldError('nombre');
                }}
                error={fieldErrors.nombre}
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
            label="Correo electrónico"
            name="email"
            type="email"
            placeholder="correo@empresa.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearFieldError('email');
            }}
            error={fieldErrors.email}
            required
          />
          <Input
            label="Contraseña"
            name="password"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              clearFieldError('password');
            }}
            error={fieldErrors.password}
            required
          />

          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : isRegister ? 'Registrar y entrar' : 'Iniciar sesión'}
          </Button>
        </form>

        <Button
          variant="ghost"
          className="login-dev-toggle"
          onClick={() => {
            setIsRegister(!isRegister);
            setError('');
            setFieldErrors({});
            setSuccess('');
          }}
        >
          {isRegister ? 'Volver al inicio de sesión' : 'Modo desarrollo: registrar prueba'}
        </Button>
      </section>
    </main>
  );
}
