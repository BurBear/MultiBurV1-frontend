import { useEffect, useMemo, useState } from 'react';
import Button from '../components/ui/Button';
import Dashboard from './admin/Dashboard';
import PizarraGlobal from './admin/PizarraGlobal';
import Clientes from './admin/Clientes';
import Materiales from './admin/Materiales';
import Formatos from './admin/Formatos';
import Maquinas from './admin/Maquinas';
import OrdenesTrabajo from './admin/OrdenesTrabajo';
import OrdenesProduccion from './admin/OrdenesProduccion';
import Incidencias from './admin/Incidencias';

function MenuIcon({ name }) {
  const commonProps = {
    width: '18',
    height: '18',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '2',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': 'true',
  };

  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </>
    ),
    board: (
      <>
        <path d="M3 5h18" />
        <path d="M3 12h18" />
        <path d="M3 19h18" />
        <path d="M8 5v14" />
        <path d="M16 5v14" />
      </>
    ),
    clientes: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    materiales: (
      <>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
        <path d="m3.3 7 8.7 5 8.7-5" />
        <path d="M12 22V12" />
      </>
    ),
    formatos: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 7h8" />
        <path d="M8 11h8" />
        <path d="M8 15h5" />
      </>
    ),
    maquinas: (
      <>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l1.3-1.3a7 7 0 0 1-9 9l-6 6-3-3 6-6a7 7 0 0 1 9-9l-1.3 1.3Z" />
      </>
    ),
    ordenTrabajo: (
      <>
        <path d="M9 11h6" />
        <path d="M9 15h6" />
        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
        <path d="M14 3v5h5" />
      </>
    ),
    ordenProduccion: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
        <path d="M7 4v16" />
        <path d="M17 4v16" />
      </>
    ),
    incidencias: (
      <>
        <path d="M10.3 3.3 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.3a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
  };

  return <svg {...commonProps}>{paths[name]}</svg>;
}

const sections = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: 'dashboard', Component: Dashboard },
  { id: 'PIZARRA_GLOBAL', label: 'Pizarra Global', icon: 'board', Component: PizarraGlobal },
  { id: 'CLIENTES', label: 'Clientes', icon: 'clientes', Component: Clientes },
  { id: 'MATERIALES', label: 'Materiales', icon: 'materiales', Component: Materiales },
  { id: 'FORMATOS', label: 'Formatos', icon: 'formatos', Component: Formatos },
  { id: 'MAQUINAS', label: 'Maquinas', icon: 'maquinas', Component: Maquinas },
  { id: 'ORDENES_TRABAJO', label: 'Ordenes de Trabajo', icon: 'ordenTrabajo', Component: OrdenesTrabajo },
  { id: 'ORDENES_PRODUCCION', label: 'Ordenes de Produccion', icon: 'ordenProduccion', Component: OrdenesProduccion },
  { id: 'INCIDENCIAS', label: 'Incidencias', icon: 'incidencias', Component: Incidencias },
];

const menuGroups = [
  { id: 'GENERAL', label: 'General', items: ['DASHBOARD', 'PIZARRA_GLOBAL'] },
  { id: 'CATALOGOS', label: 'Catalogos', items: ['CLIENTES', 'MATERIALES', 'FORMATOS', 'MAQUINAS'] },
  { id: 'ORDENES', label: 'Ordenes', items: ['ORDENES_TRABAJO', 'ORDENES_PRODUCCION'] },
  { id: 'PRODUCCION', label: 'Produccion', items: ['INCIDENCIAS'] },
];

export default function Admin({ menuOpen, setMenuOpen, onSectionChange }) {
  const [activeSection, setActiveSection] = useState('DASHBOARD');
  const [openGroups, setOpenGroups] = useState({
    GENERAL: true,
    CATALOGOS: true,
    ORDENES: true,
    PRODUCCION: true,
  });

  const ActiveComponent = useMemo(
    () => sections.find((section) => section.id === activeSection)?.Component || Dashboard,
    [activeSection],
  );
  const sectionsById = useMemo(() => {
    return sections.reduce((acc, section) => {
      acc[section.id] = section;
      return acc;
    }, {});
  }, []);

  useEffect(() => {
    const section = sections.find((item) => item.id === activeSection);
    onSectionChange?.(section?.label || 'Dashboard');
  }, [activeSection, onSectionChange]);

  const toggleGroup = (groupId) => {
    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  };

  return (
    <div className="admin-shell fade-in">
      {menuOpen && <button className="admin-sidebar-backdrop" type="button" aria-label="Cerrar menu" onClick={() => setMenuOpen(false)} />}

      <aside className={`admin-sidebar ${menuOpen ? 'admin-sidebar-open' : ''}`}>
        <div className="admin-drawer-header">
          <div className="admin-drawer-brand">
            <span className="sidebar-mark">MB</span>
            <div>
              <strong>MultiBur</strong>
              <span>Administracion</span>
            </div>
          </div>
          <Button
            className="sidebar-toggle"
            variant="ghost"
            size="sm"
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menu"
            title="Cerrar menu"
          >
            x
          </Button>
        </div>

        <nav className="admin-menu" aria-label="Menu administrativo">
          {menuGroups.map((group) => (
            <div key={group.id} className="admin-menu-group">
              <button
                type="button"
                className="admin-menu-group-toggle"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={openGroups[group.id]}
              >
                <span>{group.label}</span>
                <span className={`admin-menu-chevron ${openGroups[group.id] ? 'admin-menu-chevron-open' : ''}`} aria-hidden="true" />
              </button>

              {openGroups[group.id] && (
                <div className="admin-menu-items">
                  {group.items.map((sectionId) => {
                    const section = sectionsById[sectionId];
                    return (
                      <Button
                        key={section.id}
                        className="admin-menu-item"
                        variant={activeSection === section.id ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => {
                          setActiveSection(section.id);
                          setMenuOpen(false);
                        }}
                        aria-label={section.label}
                      >
                        <span className="admin-menu-item-mark">
                          <MenuIcon name={section.icon} />
                        </span>
                        <span>{section.label}</span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>
      </aside>

      <main className="admin-main">
        <section className="admin-content">
          <ActiveComponent />
        </section>
      </main>
    </div>
  );
}
