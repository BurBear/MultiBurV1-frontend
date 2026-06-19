import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
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

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => validateLoginFields({ email, password });

  const clearFieldError = (field) => {
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const validationErrors = validate();
    if (hasErrors(validationErrors)) {
      setFieldErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
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

        <form className="form-stack" onSubmit={handleSubmit} noValidate>
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
          <div className={`field ${fieldErrors.password ? 'field-invalid' : ''}`.trim()}>
            <label className="field-label" htmlFor="password">Contraseña</label>
            <div className="login-password-field">
              <input
                id="password"
                className={`input ${fieldErrors.password ? 'input-error' : ''}`.trim()}
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  clearFieldError('password');
                }}
                aria-invalid={fieldErrors.password ? 'true' : undefined}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                required
              />
              <button
                type="button"
                className="password-visibility-button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M3 3l18 18" />
                    <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                    <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 8.5 4 10 8a12.8 12.8 0 0 1-2.1 3.5" />
                    <path d="M6.1 6.1A12.4 12.4 0 0 0 2 12c1.5 4 5 8 10 8a10.8 10.8 0 0 0 4.1-.8" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {fieldErrors.password && <span id="password-error" className="field-error">{fieldErrors.password}</span>}
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : 'Iniciar sesión'}
          </Button>
        </form>
      </section>
    </main>
  );
}
