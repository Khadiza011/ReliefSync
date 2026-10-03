import { useState } from 'react';
import { House, Plus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { useToast } from '../../context/ToastContext';
import { useOnOpen } from '../../hooks/useUi';
import { invalidateLookups } from '../../hooks/useLookups';
import { sheltersService } from '../../services/api';
import { notifyDataChanged } from '../../utils/events';

const TYPE_OPTIONS = [
  { value: 'COLLECTIVE', label: 'Collective' },
  { value: 'TEMPORARY', label: 'Temporary' },
  { value: 'TRANSITIONAL', label: 'Transitional' },
  { value: 'OTHER', label: 'Other' },
];

const EMPTY = { shelter_name: '', shelter_type: 'COLLECTIVE', district: '', upazila: '', address: '', total_capacity: '' };

/** Admin-only form to register a new shelter. */
export function ShelterModal({ open, onClose, onCreated }) {
  const toast = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useOnOpen(open, () => {
    setValues(EMPTY);
    setErrors({});
  });

  const set = (key) => (e) => {
    setValues((v) => ({ ...v, [key]: e.target.value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.shelter_name.trim()) next.shelter_name = 'Shelter name is required';
    if (!values.district.trim()) next.district = 'District is required';
    const cap = Number(values.total_capacity);
    if (!Number.isInteger(cap) || cap < 1) next.total_capacity = 'Enter a whole number greater than zero';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const result = await sheltersService.create({
        shelter_name: values.shelter_name.trim(),
        shelter_type: values.shelter_type,
        district: values.district.trim(),
        upazila: values.upazila.trim() || null,
        address: values.address.trim() || null,
        total_capacity: cap,
      });
      invalidateLookups('shelters');
      toast.success('Shelter created', `${result?.shelter_code || 'New shelter'} · ${values.shelter_name.trim()} is open with ${cap} places.`);
      notifyDataChanged();
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error('Could not create shelter', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      as="form"
      onSubmit={submit}
      icon={House}
      title="Add shelter"
      description="Register a new shelter. It opens with zero occupancy and a shelter code is generated automatically."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving} leftIcon={<Plus />}>
            Create shelter
          </Button>
        </>
      }
    >
      <div className="form-grid">
        <div className="span-2">
          <Input label="Shelter name" required placeholder="e.g. Feni Girls School Shelter" value={values.shelter_name} onChange={set('shelter_name')} error={errors.shelter_name} maxLength={120} />
        </div>
        <Select label="Type" required value={values.shelter_type} onChange={set('shelter_type')} options={TYPE_OPTIONS} />
        <Input label="Total capacity" required type="number" min={1} step={1} placeholder="e.g. 300" value={values.total_capacity} onChange={set('total_capacity')} error={errors.total_capacity} hint="Maximum number of people" />
        <Input label="District" required placeholder="e.g. Feni" value={values.district} onChange={set('district')} error={errors.district} maxLength={80} />
        <Input label="Upazila" placeholder="e.g. Feni Sadar" value={values.upazila} onChange={set('upazila')} maxLength={80} />
        <div className="span-2">
          <Input label="Address" placeholder="Street, landmark" value={values.address} onChange={set('address')} maxLength={255} />
        </div>
      </div>
    </Modal>
  );
}

export default ShelterModal;
