import { CircleAlert, CircleCheck } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

/** Confirmation for irreversible workflow actions (approve, cancel, receive…). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'primary',
  loading = false,
  children,
}) {
  const danger = tone === 'danger';
  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      size="sm"
      title={title}
      description={description}
      icon={danger ? CircleAlert : CircleCheck}
      tone={danger ? 'danger' : 'success'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Keep as is
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Modal>
  );
}

export default ConfirmDialog;
