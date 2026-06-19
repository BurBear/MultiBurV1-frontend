import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/crud/ConfirmDialog';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import { AuthContext } from '../../context/AuthContext';
import * as usuariosService from '../../services/usuariosService';
import { getRoleLabel, ROLES } from '../../utils/roles';
import { hasErrors, isBlank, isValidEmail } from '../../utils/validation';

const roleOptions = [
  { value: ROLES.ADMIN, label: 'ADMIN' },
  { value: ROLES.OPERADOR_IMPRESION, label: 'OPERADOR DE IMPRESION' },
  { value: ROLES.OPERADOR_ACABADOS, label: 'OPERADOR DE ACABADOS' },
];

const emptyForm = {
  nombre: '',
  email: '',
  rol: ROLES.OPERADOR_IMPRESION,
  password: '',
};

function getUserStatus(user) {
  return user?.is_active ? 'ACTIVO' : 'INACTIVO';
}

function validateUserForm(values, editing) {
  const errors = {};
  if (isBlank(values.nombre)) errors.nombre = 'Ingresa el nombre del usuario.';
  if (isBlank(values.email)) errors.email = 'Ingresa el correo electronico.';
  if (!isBlank(values.email) && !isValidEmail(values.email)) errors.email = 'Ingresa un correo valido.';
  if (isBlank(values.rol)) errors.rol = 'Selecciona un rol.';
  if (!editing && isBlank(values.password)) errors.password = 'Ingresa una contraseña.';
  if (!editing && !isBlank(values.password) && values.password.trim().length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.';
  }
  return errors;
}

function UserFormModal({ editing, onClose, onSaved }) {
  const [values, setValues] = useState(editing ? {
    nombre: editing.nombre || '',
    email: editing.email || '',
    rol: editing.rol || ROLES.OPERADOR_IMPRESION,
    password: '',
  } : emptyForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const errors = validateUserForm(values, Boolean(editing));
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    try {
      const payload = {
        nombre: values.nombre.trim(),
        email: values.email.trim(),
        rol: values.rol,
      };
      if (!editing) payload.password = values.password.trim();

      if (editing) {
        await usuariosService.actualizar(editing.id, payload);
      } else {
        await usuariosService.crear(payload);
      }
      await onSaved();
    } catch (err) {
      setError(err.message || 'No se pudo guardar el usuario.');
      setSaving(false);
    }
  };

  return (
    <Modal title={editing ? 'Editar usuario' : 'Nuevo usuario'} onClose={onClose}>
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <div className="form-grid form-grid-two">
          <Input
            label="Nombre completo"
            name="nombre"
            value={values.nombre}
            onChange={(event) => handleChange('nombre', event.target.value)}
            error={fieldErrors.nombre}
            required
          />
          <Input
            label="Correo electronico"
            name="email"
            type="email"
            value={values.email}
            onChange={(event) => handleChange('email', event.target.value)}
            error={fieldErrors.email}
            required
          />
          <Select
            label="Rol"
            name="rol"
            value={values.rol}
            onChange={(event) => handleChange('rol', event.target.value)}
            error={fieldErrors.rol}
            required
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {!editing && (
            <Input
              label="Contraseña"
              name="password"
              type="password"
              value={values.password}
              onChange={(event) => handleChange('password', event.target.value)}
              error={fieldErrors.password}
              required
            />
          )}
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function PasswordModal({ user, onClose, onSaved }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const errors = {};
    if (password.trim().length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres.';
    if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden.';
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    setSaving(true);
    try {
      await usuariosService.cambiarPassword(user.id, password.trim());
      await onSaved();
    } catch (err) {
      setError(err.message || 'No se pudo cambiar la contraseña.');
      setSaving(false);
    }
  };

  return (
    <Modal title={`Cambiar contraseña - ${user.nombre}`} onClose={onClose}>
      <form className="form-stack" onSubmit={handleSubmit} noValidate>
        <Input
          label="Nueva contraseña"
          name="password"
          type="password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, password: '' }));
          }}
          error={fieldErrors.password}
          required
        />
        <Input
          label="Confirmar contraseña"
          name="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            setFieldErrors((current) => ({ ...current, confirmPassword: '' }));
          }}
          error={fieldErrors.confirmPassword}
          required
        />

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="form-actions">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Actualizar contraseña'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Usuarios() {
  const { user: currentUser } = useContext(AuthContext);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('TODOS');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [statusUser, setStatusUser] = useState(null);
  const [statusLoading, setStatusLoading] = useState(false);

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await usuariosService.listar();
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'No se pudo cargar usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const status = getUserStatus(row);
      if (statusFilter !== 'TODOS' && status !== statusFilter) return false;
      if (!term) return true;
      return [
        row.nombre,
        row.email,
        row.rol,
        getRoleLabel(row.rol),
        status,
      ].some((value) => String(value || '').toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  const handleSaved = async (message = 'Usuario guardado correctamente.') => {
    closeForm();
    setPasswordUser(null);
    setNotice(message);
    await loadRows();
  };

  const handleStatusChange = async () => {
    if (!statusUser) return;
    setStatusLoading(true);
    setError('');
    try {
      const nextStatus = !statusUser.is_active;
      await usuariosService.actualizarEstado(statusUser.id, nextStatus);
      setStatusUser(null);
      setNotice(nextStatus ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.');
      await loadRows();
    } catch (err) {
      setError(err.message || 'No se pudo actualizar el estado del usuario.');
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="page-stack fade-in">
      <section className="panel">
        <div className="section-heading">
          <div>
            <h2>Usuarios</h2>
            <p>Gestion de accesos y roles - {rows.length} registros cargados</p>
          </div>
          <div className="section-actions">
            <Button
              className="icon-button"
              variant="outline"
              onClick={loadRows}
              disabled={loading}
              aria-label="Refrescar"
              title="Refrescar"
            >
              ↻
            </Button>
            <Button onClick={() => setShowForm(true)}>+ Nuevo usuario</Button>
          </div>
        </div>

        <div className="table-toolbar">
          <div className="table-filter-row">
            <label className="table-search">
              <span>Buscar</span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nombre, correo o rol..."
              />
            </label>
            <label className="table-filter-control">
              <span>Estado</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="TODOS">Todos</option>
                <option value="ACTIVO">Activos</option>
                <option value="INACTIVO">Inactivos</option>
              </select>
            </label>
          </div>
          <div className="table-filter-row table-filter-row-right">
            <span>{filteredRows.length} de {rows.length} usuarios</span>
          </div>
        </div>

        {notice && <div className="alert alert-success">{notice}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <p className="muted">Cargando...</p>
        ) : filteredRows.length === 0 ? (
          <div className="empty-state compact">No hay usuarios que coincidan con el filtro.</div>
        ) : (
          <div className="table-wrap">
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const isSelf = row.id === currentUser?.id;
                  const status = getUserStatus(row);
                  return (
                    <tr key={row.id}>
                      <td>{row.nombre}</td>
                      <td>{row.email}</td>
                      <td>{getRoleLabel(row.rol)}</td>
                      <td>
                        <Badge tone={row.is_active ? 'success' : 'neutral'}>{status}</Badge>
                      </td>
                      <td>
                        <div className="table-actions">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditing(row);
                              setShowForm(true);
                            }}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPasswordUser(row)}
                          >
                            Contraseña
                          </Button>
                          <Button
                            size="sm"
                            variant={row.is_active ? 'danger-outline' : 'outline'}
                            onClick={() => setStatusUser(row)}
                            disabled={isSelf && row.is_active}
                            title={isSelf && row.is_active ? 'No puedes desactivar tu propio usuario.' : undefined}
                          >
                            {row.is_active ? 'Desactivar' : 'Activar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showForm && (
        <UserFormModal
          editing={editing}
          onClose={closeForm}
          onSaved={() => handleSaved()}
        />
      )}

      {passwordUser && (
        <PasswordModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
          onSaved={() => handleSaved('Contraseña actualizada correctamente.')}
        />
      )}

      {statusUser && (
        <ConfirmDialog
          title={statusUser.is_active ? 'Desactivar usuario' : 'Activar usuario'}
          message={`${statusUser.is_active ? 'Se desactivara' : 'Se activara'} "${statusUser.nombre}".`}
          loading={statusLoading}
          onCancel={() => setStatusUser(null)}
          onConfirm={handleStatusChange}
        />
      )}
    </div>
  );
}
