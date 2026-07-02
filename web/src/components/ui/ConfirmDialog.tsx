import { Button } from './Button';
import { Modal } from './Modal';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  pending,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  pending?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-text-2">{message}</p>
      <div className="mt-4 flex justify-end gap-2">
        <Button variant="secondary" className="!px-4 !py-1.5 !text-xs" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          className="!px-4 !py-1.5 !text-xs"
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? '…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
