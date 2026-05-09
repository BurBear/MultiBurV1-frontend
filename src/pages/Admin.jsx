import { useMemo, useState } from 'react';
import PageHeader from '../components/layout/PageHeader';
import Button from '../components/ui/Button';
import Dashboard from './admin/Dashboard';
import Clientes from './admin/Clientes';
import Materiales from './admin/Materiales';
import Formatos from './admin/Formatos';
import Maquinas from './admin/Maquinas';
import OrdenesTrabajo from './admin/OrdenesTrabajo';
import OrdenesProduccion from './admin/OrdenesProduccion';

const sections = [
  { id: 'DASHBOARD', label: 'Dashboard', Component: Dashboard },
  { id: 'CLIENTES', label: 'Clientes', Component: Clientes },
  { id: 'MATERIALES', label: 'Materiales', Component: Materiales },
  { id: 'FORMATOS', label: 'Formatos', Component: Formatos },
  { id: 'MAQUINAS', label: 'Maquinas', Component: Maquinas },
  { id: 'ORDENES_TRABAJO', label: 'Ordenes de Trabajo', Component: OrdenesTrabajo },
  { id: 'ORDENES_PRODUCCION', label: 'Ordenes de Produccion', Component: OrdenesProduccion },
];

export default function Admin({ user }) {
  const [activeSection, setActiveSection] = useState('DASHBOARD');
  const ActiveComponent = useMemo(
    () => sections.find((section) => section.id === activeSection)?.Component || Dashboard,
    [activeSection],
  );

  return (
    <div className="page-stack fade-in">
      <PageHeader
        title="Panel de Administracion"
        subtitle="Dashboard, catalogos y gestion de ordenes"
        meta={
          <>
            <span className="eyebrow">Sesion activa como</span>
            <strong>{user.nombre}</strong>
          </>
        }
      />

      <div className="admin-layout">
        <aside className="admin-sidebar">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </Button>
          ))}
        </aside>

        <section className="admin-content">
          <ActiveComponent />
        </section>
      </div>
    </div>
  );
}
