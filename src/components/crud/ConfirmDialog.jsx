import Button from '../ui/Button';
import Modal from '../ui/Modal';

export default function ConfirmDialog({ title, message, onCancel, onConfirm, loading }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="form-actions">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger-outline" onClick={onConfirm} disabled={loading}>
            {loading ? 'Procesando...' : 'Confirmar'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
