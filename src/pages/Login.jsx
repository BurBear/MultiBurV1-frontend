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

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Procesando...' : 'Iniciar sesión'}
          </Button>
        </form>
      </section>
    </main>
  );
}
