import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Boxes, ClipboardPlus, DoorOpen, HandHeart, Minus, PackageMinus, PackagePlus, Plus, Trash2, UserPlus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { ChoiceGroup, Input, Select, Textarea } from '../../components/ui/Field';
import { useToast } from '../../context/ToastContext';
import { useLookups, invalidateLookups } from '../../hooks/useLookups';
import { useOnOpen } from '../../hooks/useUi';
import { admissionsService, donationService, familiesService, inventoryService } from '../../services/api';
import { BD_DISTRICTS, PRIORITIES, PRIORITY_META, ROLES } from '../../utils/constants';
import { notifyDataChanged } from '../../utils/events';
import { useFamilyForm, useRequestForm, validLines } from './formHooks';
import { formatNumber } from '../../utils/helpers';

const PRIORITY_OPTIONS = PRIORITIES.map((p) => ({ value: p, label: PRIORITY_META[p].label, color: PRIORITY_META[p].color }));

const shelterLabel = (s) => {
  const free = Math.max(0, (Number(s.total_capacity) || 0) - (Number(s.current_occupancy) || 0));
  return `${s.shelter_name} · ${s.district || ''}${s.total_capacity ? ` · ${free} free` : ''}`;
};

/* ======================================================================
   Family registration
   ====================================================================== */

export function FamilyFields({ form }) {
  const { values, errors, set } = form;
  return (
    <div className="form-grid">
      <Input
        label="Family code"
        required
        value={values.family_code}
        onChange={set('family_code')}
        error={errors.family_code}
        hint="Unique ID, e.g. FAM-004"
        className="mono"
        maxLength={20}
      />
      <Input
        label="Contact phone"
        required
        type="tel"
        placeholder="01XXXXXXXXX"
        value={values.contact_phone}
        onChange={set('contact_phone')}
        error={errors.contact_phone}
      />
      <Select
        label="Current district"
        required
        placeholder="Select district"
        value={values.current_district}
        onChange={set('current_district')}
        error={errors.current_district}
        options={BD_DISTRICTS.map((d) => ({ value: d, label: d }))}
      />
      <Input
        label="Area / upazila"
        required
        placeholder="e.g. Sonagazi"
        value={values.current_area}
        onChange={set('current_area')}
        error={errors.current_area}
      />
      <div className="span-2">
        <ChoiceGroup label="Priority" required value={values.priority} onChange={set('priority')} options={PRIORITY_OPTIONS} />
      </div>
    </div>
  );
}

export function FamilyModal({ open, onClose, onCreated }) {
  const form = useFamilyForm({
    onCreated: (r) => {
      onCreated?.(r);
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      as="form"
      onSubmit={form.submit}
      icon={UserPlus}
      title="Register a family"
      description="Add an affected household to the relief registry."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={form.saving} leftIcon={<UserPlus />}>
            Register family
          </Button>
        </>
      }
    >
      <FamilyFields form={form} />
    </Modal>
  );
}


/* ======================================================================
   Shelter admission
   ====================================================================== */

export function AdmitModal({ open, onClose, onCreated, family, families: familiesProp }) {
  const toast = useToast();
  const { shelters = [] } = useLookups(['shelters']);
  const [fetchedFamilies, setFetchedFamilies] = useState([]);
  const [values, setValues] = useState({ family_id: '', shelter_id: '', admitted_member_count: 1 });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const familyId = family?.family_id;
  const hasFamiliesProp = !!familiesProp;

  useOnOpen(open, () => {
    setValues({ family_id: familyId ? String(familyId) : '', shelter_id: '', admitted_member_count: Number(family?.member_count) || 1 });
    setErrors({});
  });

  // Load the family list only when the caller didn't provide one
  useEffect(() => {
    if (!open || hasFamiliesProp || familyId) return undefined;
    let cancelled = false;
    familiesService
      .list()
      .then((list) => !cancelled && setFetchedFamilies(list))
      .catch(() => !cancelled && setFetchedFamilies([]));
    return () => {
      cancelled = true;
    };
  }, [open, familyId, hasFamiliesProp]);

  const families = familiesProp || fetchedFamilies;

  const selectedShelter = shelters.find((s) => String(s.shelter_id) === String(values.shelter_id));
  const free = selectedShelter ? Math.max(0, Number(selectedShelter.total_capacity) - Number(selectedShelter.current_occupancy || 0)) : null;

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.family_id) next.family_id = 'Select a family';
    if (!values.shelter_id) next.shelter_id = 'Select a shelter';
    const count = Number(values.admitted_member_count);
    if (!count || count < 1) next.admitted_member_count = 'At least 1 member';
    else if (free !== null && count > free) next.admitted_member_count = `Only ${free} places available`;
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await admissionsService.create({
        family_id: Number(values.family_id),
        shelter_id: Number(values.shelter_id),
        admitted_member_count: count,
      });
      toast.success('Family admitted', `${count} member${count > 1 ? 's' : ''} admitted to ${selectedShelter?.shelter_name || 'the shelter'}.`);
      invalidateLookups('shelters');
      notifyDataChanged();
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error('Admission failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  const familyOptions = (family ? [family] : families).map((f) => ({
    value: String(f.family_id),
    label: `${f.family_code} · ${f.current_district || ''} · ${PRIORITY_META[f.priority]?.label || f.priority}`,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      as="form"
      onSubmit={submit}
      icon={DoorOpen}
      title="Admit to shelter"
      description="Check a family into a shelter. Occupancy updates automatically."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving} leftIcon={<DoorOpen />}>
            Admit family
          </Button>
        </>
      }
    >
      <div className="stack">
        <Select
          label="Family"
          required
          placeholder="Select a family"
          value={values.family_id}
          onChange={(e) => setValues((v) => ({ ...v, family_id: e.target.value }))}
          error={errors.family_id}
          options={familyOptions}
          disabled={!!family}
        />
        <Select
          label="Shelter"
          required
          placeholder="Select a shelter"
          value={values.shelter_id}
          onChange={(e) => setValues((v) => ({ ...v, shelter_id: e.target.value }))}
          error={errors.shelter_id}
          options={shelters.map((s) => ({ value: String(s.shelter_id), label: shelterLabel(s) }))}
          hint={selectedShelter ? `${formatNumber(free)} of ${formatNumber(selectedShelter.total_capacity)} places free` : undefined}
        />
        <Input
          label="Members admitted"
          required
          type="number"
          min={1}
          value={values.admitted_member_count}
          onChange={(e) => setValues((v) => ({ ...v, admitted_member_count: e.target.value }))}
          error={errors.admitted_member_count}
        />
      </div>
    </Modal>
  );
}

/* ======================================================================
   Inventory stock in / out
   ====================================================================== */

export function StockModal({ open, onClose, onDone, mode = 'add', row, shelterOptions }) {
  const toast = useToast();
  const { items = [], shelters = [] } = useLookups(['items', 'shelters']);
  const [values, setValues] = useState({ shelter_id: '', item_id: '', quantity: '', item_name: '', reorder_level: '' });
  const [newItemMode, setNewItemMode] = useState(false);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isAdd = mode === 'add';

  useOnOpen(open, () => {
    setValues({
      shelter_id: row?.shelter_id ? String(row.shelter_id) : '',
      item_id: row?.item_id ? String(row.item_id) : '',
      quantity: '',
      item_name: '',
      reorder_level: '',
    });
    setNewItemMode(false);
    setErrors({});
  });

  const shelterList = shelterOptions?.length ? shelterOptions : shelters;
  const item = items.find((i) => String(i.item_id) === String(values.item_id));

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.shelter_id) next.shelter_id = 'Select a shelter';
    if (!newItemMode && !values.item_id) next.item_id = 'Select an item';
    if (newItemMode && !values.item_name.trim()) next.item_name = 'Enter an item name';
    if (newItemMode) {
      const reorder = Number(values.reorder_level);
      if (values.reorder_level === '' || !Number.isFinite(reorder) || reorder < 0) next.reorder_level = 'Enter a reorder point of zero or greater';
    }
    const qty = Number(values.quantity);
    if (!qty || qty <= 0) next.quantity = 'Enter a quantity greater than zero';
    else if (!isAdd && row && qty > Number(row.quantity)) next.quantity = `Only ${formatNumber(row.quantity)} in stock`;
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const payload = { shelter_id: Number(values.shelter_id), item_id: Number(values.item_id), quantity: qty };
      if (isAdd && newItemMode) {
        await inventoryService.addNewItem({
          shelter_id: Number(values.shelter_id),
          item_name: values.item_name.trim(),
          reorder_level: Number(values.reorder_level),
          quantity: qty,
        });
      } else if (isAdd) await inventoryService.add(payload);
      else await inventoryService.reduce(payload);
      toast.success(
        isAdd ? (newItemMode ? 'New item added' : 'Stock added') : 'Stock reduced',
        newItemMode
          ? `${values.item_name.trim()} was created with ${formatNumber(qty)} units of initial stock.`
          : `${formatNumber(qty)} ${item?.unit || 'units'} of ${item?.item_name || row?.item_name || 'item'} ${isAdd ? 'received' : 'issued'}.`
      );
      notifyDataChanged();
      onDone?.();
      onClose();
    } catch (err) {
      toast.error(isAdd ? 'Could not add stock' : 'Could not reduce stock', err.message);
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
      icon={isAdd ? PackagePlus : PackageMinus}
      tone={isAdd ? undefined : 'danger'}
      title={isAdd ? 'Add stock' : 'Issue stock'}
      description={
        isAdd
          ? 'Record supplies received. A ledger IN transaction is written automatically.'
          : 'Record supplies used or issued. A ledger OUT transaction is written automatically.'
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={isAdd ? 'primary' : 'danger'} loading={saving} leftIcon={isAdd ? <Plus /> : <Minus />}>
            {isAdd ? 'Add to inventory' : 'Reduce stock'}
          </Button>
        </>
      }
    >
      <div className="stack">
        <Select
          label="Shelter"
          required
          placeholder="Select a shelter"
          value={values.shelter_id}
          onChange={(e) => setValues((v) => ({ ...v, shelter_id: e.target.value }))}
          error={errors.shelter_id}
          disabled={!!row}
          options={shelterList.map((s) => ({ value: String(s.shelter_id), label: s.shelter_name }))}
        />
        {isAdd && !row && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setNewItemMode((current) => !current);
              setErrors({});
            }}
          >
            {newItemMode ? 'Select existing item instead' : '+ Add a brand new item'}
          </Button>
        )}

        {newItemMode ? (
          <>
            <Input
              label="Item name"
              required
              placeholder="e.g. Baby Food"
              value={values.item_name}
              onChange={(e) => setValues((v) => ({ ...v, item_name: e.target.value }))}
              error={errors.item_name}
            />
            <Input
              label="Reorder point"
              required
              type="number"
              min={0}
              step="any"
              placeholder="0"
              value={values.reorder_level}
              onChange={(e) => setValues((v) => ({ ...v, reorder_level: e.target.value }))}
              error={errors.reorder_level}
              hint="Low-stock alert starts when stock reaches this amount."
            />
          </>
        ) : (
          <Select
            label="Item"
            required
            placeholder="Select an item"
            value={values.item_id}
            onChange={(e) => setValues((v) => ({ ...v, item_id: e.target.value }))}
            error={errors.item_id}
            disabled={!!row}
            options={items.map((i) => ({ value: String(i.item_id), label: `${i.item_name} (${i.unit})${i.category_name ? ` · ${i.category_name}` : ''}` }))}
          />
        )}
        <Input
          label={`Quantity${item?.unit ? ` (${item.unit})` : ''}`}
          required
          type="number"
          min={0}
          step="any"
          placeholder="0"
          value={values.quantity}
          onChange={(e) => setValues((v) => ({ ...v, quantity: e.target.value }))}
          error={errors.quantity}
          hint={row ? `Current balance: ${formatNumber(row.quantity)} ${row.unit || ''}` : undefined}
        />
      </div>
    </Modal>
  );
}

/* ======================================================================
   Item lines editor (requests & donations)
   ====================================================================== */

export function ItemLines({ lines, onChange, items, error, qtyLabel = 'Quantity' }) {
  const update = (i, patch) => onChange(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const remove = (i) => onChange(lines.filter((_, idx) => idx !== i));
  const add = () => onChange([...lines, { key: Date.now(), item_id: '', quantity: '' }]);
  const used = new Set(lines.map((l) => String(l.item_id)));

  return (
    <div className="item-lines">
      <div className="item-lines__head">
        <span>Items</span>
        <Button variant="ghost" size="sm" leftIcon={<Plus />} onClick={add} disabled={lines.length >= items.length && items.length > 0}>
          Add item
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {lines.map((line, i) => {
          const item = items.find((it) => String(it.item_id) === String(line.item_id));
          return (
            <motion.div
              key={line.key}
              className="item-lines__row"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <select
                className="select"
                value={line.item_id}
                onChange={(e) => update(i, { item_id: e.target.value })}
                aria-label={`Item ${i + 1}`}
              >
                <option value="">Select item</option>
                {items.map((it) => (
                  <option key={it.item_id} value={it.item_id} disabled={used.has(String(it.item_id)) && String(it.item_id) !== String(line.item_id)}>
                    {it.item_name} ({it.unit})
                  </option>
                ))}
              </select>
              <div className="control">
                <input
                  className="input input--with-suffix"
                  type="number"
                  min={0}
                  step="any"
                  placeholder={qtyLabel}
                  value={line.quantity}
                  onChange={(e) => update(i, { quantity: e.target.value })}
                  aria-label={`${qtyLabel} for item ${i + 1}`}
                />
                <span className="control__suffix item-lines__unit">{item?.unit || ''}</span>
              </div>
              <button
                type="button"
                className="item-lines__remove"
                onClick={() => remove(i)}
                aria-label={`Remove item ${i + 1}`}
                disabled={lines.length === 1}
              >
                <Trash2 />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}


/* ======================================================================
   Relief request (with item lines)
   ====================================================================== */

export function RequestFields({ form, shelterOptions }) {
  const { values, setValues, lines, setLines, errors, items, shelters } = form;
  const list = shelterOptions?.length ? shelterOptions : shelters;
  return (
    <div className="stack" style={{ gap: 20 }}>
      <Select
        label="Shelter"
        required
        placeholder="Select a shelter"
        value={values.shelter_id}
        onChange={(e) => setValues((v) => ({ ...v, shelter_id: e.target.value }))}
        error={errors.shelter_id}
        options={list.map((s) => ({ value: String(s.shelter_id), label: `${s.shelter_name}${s.district ? ` · ${s.district}` : ''}` }))}
      />
      <ChoiceGroup
        label="Priority"
        required
        value={values.priority}
        onChange={(p) => setValues((v) => ({ ...v, priority: p }))}
        options={PRIORITY_OPTIONS}
      />
      <ItemLines lines={lines} onChange={setLines} items={items} error={errors.items} qtyLabel="Requested qty" />
      <Textarea
        label="Notes"
        placeholder="Context for the relief team — e.g. number of children, access road status…"
        value={values.notes}
        onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
        error={errors.notes}
        rows={3}
        maxLength={255}
      />
    </div>
  );
}

export function RequestModal({ open, onClose, onCreated, shelterOptions }) {
  const form = useRequestForm({
    onCreated: (r) => {
      onCreated?.(r);
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      as="form"
      onSubmit={form.submit}
      icon={ClipboardPlus}
      title="New relief request"
      description="Request supplies for a shelter. Relief managers are notified for approval."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={form.saving} leftIcon={<ClipboardPlus />}>
            Submit request
          </Button>
        </>
      }
    >
      <RequestFields form={form} shelterOptions={shelterOptions} />
    </Modal>
  );
}

/* ======================================================================
   Donation (with item lines)
   ====================================================================== */

export function DonationModal({ open, onClose, onCreated, role }) {
  const toast = useToast();
  const isDonor = role === ROLES.DONOR;
  const lookups = useLookups(isDonor ? ['items', 'shelters'] : ['items', 'shelters', 'donors']);
  const { items = [], shelters = [], donors = [] } = lookups;
  const [values, setValues] = useState({ donor_id: '', shelter_id: '', notes: '' });
  const [lines, setLines] = useState([{ key: 1, item_id: '', quantity: '' }]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useOnOpen(open, () => {
    setValues({ donor_id: '', shelter_id: '', notes: '' });
    setLines([{ key: Date.now(), item_id: '', quantity: '' }]);
    setErrors({});
  });

  const totalUnits = useMemo(() => validLines(lines).reduce((s, l) => s + Number(l.quantity), 0), [lines]);

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!isDonor && !values.donor_id) next.donor_id = 'Select the donor';
    if (!values.shelter_id) next.shelter_id = 'Select the receiving shelter';
    const good = validLines(lines);
    if (good.length === 0) next.items = 'Add at least one item with a quantity';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await donationService.create({
        ...(isDonor ? {} : { donor_id: Number(values.donor_id) }),
        shelter_id: Number(values.shelter_id),
        items: good.map((l) => ({ item_id: Number(l.item_id), quantity: Number(l.quantity) })),
        notes: values.notes.trim() || undefined,
      });
      toast.success('Donation submitted', 'It will be added to inventory once the shelter confirms receipt.');
      notifyDataChanged();
      onCreated?.();
      onClose();
    } catch (err) {
      toast.error('Could not submit donation', err.message);
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
      icon={HandHeart}
      title={isDonor ? 'Make a donation' : 'Record a donation'}
      description="Pledge relief supplies to a shelter. Stock updates when the donation is received."
      size="lg"
      footer={
        <>
          <span className="muted" style={{ marginRight: 'auto', fontSize: 'var(--text-sm)' }}>
            <Boxes size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
            {formatNumber(totalUnits)} units across {validLines(lines).length} item(s)
          </span>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving} leftIcon={<HandHeart />}>
            Submit donation
          </Button>
        </>
      }
    >
      <div className="stack" style={{ gap: 20 }}>
        <div className="form-grid">
          {!isDonor && (
            <Select
              label="Donor"
              required
              placeholder={donors.length ? 'Select donor' : 'No donors found'}
              value={values.donor_id}
              onChange={(e) => setValues((v) => ({ ...v, donor_id: e.target.value }))}
              error={errors.donor_id}
              options={donors.map((d) => ({ value: String(d.donor_id), label: `${d.donor_name} · ${d.donor_code}` }))}
            />
          )}
          <Select
            label="Receiving shelter"
            required
            placeholder="Select shelter"
            value={values.shelter_id}
            onChange={(e) => setValues((v) => ({ ...v, shelter_id: e.target.value }))}
            error={errors.shelter_id}
            options={shelters.map((s) => ({ value: String(s.shelter_id), label: `${s.shelter_name}${s.district ? ` · ${s.district}` : ''}` }))}
            fieldClassName={isDonor ? 'span-2' : undefined}
          />
        </div>
        <ItemLines lines={lines} onChange={setLines} items={items} error={errors.items} />
        <Textarea
          label="Notes"
          placeholder="Delivery details, packaging, expiry dates…"
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          rows={2}
          maxLength={255}
        />
      </div>
    </Modal>
  );
}
