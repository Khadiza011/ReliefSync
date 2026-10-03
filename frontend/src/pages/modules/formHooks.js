import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import { useLookups } from '../../hooks/useLookups';
import { familiesService, requestsService } from '../../services/api';
import { notifyDataChanged } from '../../utils/events';

/* Form state + submit logic shared by the dialogs and the full-page forms. */

export function validLines(lines) {
  return lines.filter((l) => l.item_id && Number(l.quantity) > 0);
}

/* ---------------- Family registration ---------------- */

const emptyFamily = { family_code: '', contact_phone: '', current_district: '', current_area: '', priority: 'MEDIUM' };

export function useFamilyForm({ onCreated }) {
  const toast = useToast();
  const [values, setValues] = useState(() => ({ ...emptyFamily, family_code: suggestFamilyCode() }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const reset = () => {
    setValues({ ...emptyFamily, family_code: suggestFamilyCode() });
    setErrors({});
  };

  const submit = async (e) => {
    e?.preventDefault();
    const next = {};
    if (!values.family_code.trim()) next.family_code = 'Family code is required';
    else if (values.family_code.trim().length > 20) next.family_code = 'Max 20 characters';
    if (!values.contact_phone.trim()) next.contact_phone = 'Contact phone is required';
    else if (!/^[+\d][\d\s-]{6,19}$/.test(values.contact_phone.trim())) next.contact_phone = 'Enter a valid phone number';
    if (!values.current_district) next.current_district = 'Select a district';
    if (!values.current_area.trim()) next.current_area = 'Area / upazila is required';
    setErrors(next);
    if (Object.keys(next).length) return false;

    setSaving(true);
    try {
      const result = await familiesService.create({
        family_code: values.family_code.trim(),
        contact_phone: values.contact_phone.trim(),
        current_district: values.current_district,
        current_area: values.current_area.trim(),
        priority: values.priority,
      });
      toast.success('Family registered', `${values.family_code.trim()} has been added to the registry.`);
      notifyDataChanged();
      onCreated?.(result);
      reset();
      return true;
    } catch (err) {
      if (/already/i.test(err.message)) setErrors({ family_code: err.message });
      toast.error('Could not register family', err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { values, errors, saving, set, submit, reset };
}

function suggestFamilyCode() {
  return `FAM-${Date.now().toString().slice(-6)}`;
}

/* ---------------- Relief request ---------------- */

export function useRequestForm({ onCreated, defaultShelterId }) {
  const toast = useToast();
  const { items = [], shelters = [] } = useLookups(['items', 'shelters']);
  const [rawValues, setValues] = useState({ shelter_id: '', priority: 'HIGH', notes: '' });
  // Fall back to the caller's default shelter until the user picks one
  const values = { ...rawValues, shelter_id: rawValues.shelter_id || (defaultShelterId ? String(defaultShelterId) : '') };
  const [lines, setLines] = useState([{ key: 1, item_id: '', quantity: '' }]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setValues({ shelter_id: '', priority: 'HIGH', notes: '' });
    setLines([{ key: Date.now(), item_id: '', quantity: '' }]);
    setErrors({});
  };

  const submit = async (e) => {
    e?.preventDefault();
    const next = {};
    if (!values.shelter_id) next.shelter_id = 'Select the shelter that needs supplies';
    const good = validLines(lines);
    if (good.length === 0) next.items = 'Add at least one item with a quantity';
    if (values.notes.length > 255) next.notes = 'Keep notes under 255 characters';
    setErrors(next);
    if (Object.keys(next).length) return false;

    setSaving(true);
    try {
      const created = await requestsService.create({
        shelter_id: Number(values.shelter_id),
        priority: values.priority,
        notes: values.notes.trim() || undefined,
      });
      const failures = [];
      for (const line of good) {
        try {
          await requestsService.addItem({ request_id: created.request_id, item_id: Number(line.item_id), requested_qty: Number(line.quantity) });
        } catch (err) {
          failures.push(err.message);
        }
      }
      if (failures.length) {
        toast.warning('Request created with warnings', `${created.request_code}: ${failures.length} item(s) could not be added.`);
      } else {
        toast.success('Relief request submitted', `${created.request_code} is now awaiting approval.`);
      }
      notifyDataChanged();
      onCreated?.(created);
      reset();
      return true;
    } catch (err) {
      toast.error('Could not create request', err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  return { values, setValues, lines, setLines, errors, saving, submit, reset, items, shelters };
}

