import { useMemo, useState } from 'react';
import Button from './Button';
import Modal from './Modal';

export default function SearchPickerModal({
  title,
  items,
  getLabel,
  getMeta,
  onClose,
  onSelect,
  placeholder = 'Buscar...',
}) {
  const [search, setSearch] = useState('');
  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => {
      const label = getLabel(item) || '';
      const meta = getMeta?.(item) || '';
      return `${label} ${meta}`.toLowerCase().includes(normalized);
    });
  }, [getLabel, getMeta, items, search]);

  return (
    <Modal title={title} onClose={onClose} panelClassName="modal-panel-picker">
      <div className="picker-modal">
        <label className="field">
          <span className="field-label">Buscar</span>
          <div className="search-input-wrap">
            <span aria-hidden="true">⌕</span>
            <input
              className="input"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={placeholder}
              autoFocus
            />
          </div>
        </label>

        <div className="picker-results">
          {filteredItems.map((item) => (
            <button key={item.id} type="button" className="picker-result-item" onClick={() => onSelect(item)}>
              <strong>{getLabel(item)}</strong>
              {getMeta && <span>{getMeta(item) || 'Sin detalle'}</span>}
            </button>
          ))}
          {filteredItems.length === 0 && <div className="empty-state compact">No hay resultados.</div>}
        </div>

        <div className="form-actions">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </div>
      </div>
    </Modal>
  );
}
