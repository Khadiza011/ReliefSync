import { useState } from 'react';
import { Crown, Trash2, UserPlus, Users } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Input, Select } from '../../components/ui/Field';
import { useToast } from '../../context/ToastContext';
import { useFetch } from '../../hooks/useFetch';
import { familiesService } from '../../services/api';
import { humanize } from '../../utils/constants';
import { notifyDataChanged } from '../../utils/events';

const SEX_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
];

const RELATION_OPTIONS = ['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'GRANDPARENT', 'RELATIVE', 'OTHER'].map((r) => ({
  value: r,
  label: humanize(r),
}));

const emptyForm = { full_name: '', age_years: '', sex: '', relationship_to_head: '', is_head: false };

/** Member list + inline "Add member" form shown inside the family drawer. */
export function FamilyMembers({ family, canAdd, canRemove = false, onChanged }) {
  const toast = useToast();
  const { data, loading, error, refetch } = useFetch(() => familiesService.members(family.family_id), [family.family_id]);
  const { data: capacityData, refetch: refetchCapacity } = useFetch(() => familiesService.memberCapacity(family.family_id), [family.family_id]);
  const members = data || [];
  const hasHead = members.some((m) => Number(m.is_head) === 1);
  const admittedLimit = Number(capacityData?.admitted_member_count || 0);
  const remainingSlots = Number(capacityData?.remaining_slots || 0);
  const hasActiveAdmission = Boolean(capacityData?.has_active_admission);
  const canAddAnother = hasActiveAdmission && remainingSlots > 0;

  const [adding, setAdding] = useState(false);
  const [values, setValues] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removing, setRemoving] = useState(false);

  const set = (key) => (e) => {
    const value = e?.target ? e.target.value : e;
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const close = () => {
    setAdding(false);
    setValues(emptyForm);
    setErrors({});
  };

  const submit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!values.full_name.trim()) next.full_name = 'Name is required';
    if (values.age_years !== '' && (Number(values.age_years) < 0 || Number(values.age_years) > 120)) next.age_years = 'Age must be 0 - 120';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await familiesService.addMember(family.family_id, {
        full_name: values.full_name.trim(),
        age_years: values.age_years === '' ? null : Number(values.age_years),
        sex: values.sex || null,
        is_head: values.is_head,
        relationship_to_head: values.relationship_to_head || null,
      });
      toast.success('Member added', `${values.full_name.trim()} was added to ${family.family_code}.`);
      close();
      await Promise.all([refetch(), refetchCapacity()]);
      notifyDataChanged();
      onChanged?.();
    } catch (err) {
      toast.error('Could not add member', err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmRemove = async () => {
    setRemoving(true);
    try {
      await familiesService.removeMember(family.family_id, removeTarget.member_id);
      toast.success('Member removed', `${removeTarget.full_name} was removed from ${family.family_code}.`);
      setRemoveTarget(null);
      await Promise.all([refetch(), refetchCapacity()]);
      notifyDataChanged();
      onChanged?.();
    } catch (err) {
      toast.error('Could not remove member', err.message);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="row" style={{ gap: 8, alignItems: 'center', color: 'var(--text-1)', fontWeight: 600 }}>
          <Users size={16} aria-hidden="true" />
          Family members
          <Badge tone="neutral" size="sm">
            {members.length}
          </Badge>
        </div>
        {canAdd && !adding && (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<UserPlus />}
            onClick={() => setAdding(true)}
            disabled={!canAddAnother}
            title={!hasActiveAdmission ? 'Admit this family before adding members' : remainingSlots <= 0 ? 'Admitted member limit reached' : undefined}
          >
            Add member
          </Button>
        )}
      </div>

      {canAdd && capacityData && (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            border: '1px solid var(--border-1)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-2)',
            fontSize: 13,
          }}
        >
          {!hasActiveAdmission ? (
            <>Admit this family to a shelter before adding member records.</>
          ) : (
            <>
              Members recorded: <strong>{members.length}</strong> / <strong>{admittedLimit}</strong> admitted
              {remainingSlots > 0 ? ` · ${remainingSlots} slot${remainingSlots === 1 ? '' : 's'} remaining` : ' · limit reached'}
            </>
          )}
        </div>
      )}

      {adding && canAddAnother && (
        <form onSubmit={submit} noValidate style={{ marginBottom: 16, padding: 16, border: '1px solid var(--border-2)', borderRadius: 'var(--radius-md)' }}>
          <div className="form-grid">
            <div className="span-2">
              <Input label="Full name" required value={values.full_name} onChange={set('full_name')} error={errors.full_name} maxLength={100} />
            </div>
            <Input label="Age" type="number" min="0" max="120" value={values.age_years} onChange={set('age_years')} error={errors.age_years} />
            <Select label="Sex" placeholder="Select" value={values.sex} onChange={set('sex')} options={SEX_OPTIONS} />
            <Select
              label="Relationship to head"
              placeholder={values.is_head ? 'Head of family' : 'Select'}
              value={values.is_head ? '' : values.relationship_to_head}
              onChange={set('relationship_to_head')}
              options={RELATION_OPTIONS}
              disabled={values.is_head}
            />
            {!hasHead && (
              <label className="row" style={{ gap: 8, alignItems: 'center', alignSelf: 'end', paddingBottom: 10, color: 'var(--text-2)' }}>
                <input type="checkbox" checked={values.is_head} onChange={(e) => setValues((v) => ({ ...v, is_head: e.target.checked }))} />
                Head of family
              </label>
            )}
          </div>
          <div className="row" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <Button variant="ghost" size="sm" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={saving} leftIcon={<UserPlus />}>
              Save member
            </Button>
          </div>
        </form>
      )}

      {loading && !data ? (
        <p className="muted">Loading members…</p>
      ) : error ? (
        <p className="muted">Could not load members.</p>
      ) : members.length === 0 ? (
        <p className="muted">No members recorded yet.{canAdd && canAddAnother ? ' Use "Add member" to record the admitted household.' : ''}</p>
      ) : (
        <div>
          {members.map((m) => (
            <div
              key={m.member_id}
              className="row"
              style={{ justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-1)' }}
            >
              <div className="cell-primary">
                <span className="cell-primary__title">
                  {Number(m.is_head) === 1 && <Crown size={13} style={{ display: 'inline', marginRight: 6, verticalAlign: '-2px', color: 'var(--warning)' }} aria-hidden="true" />}
                  {m.full_name}
                </span>
                <span className="cell-primary__sub">
                  {[m.relationship_to_head && humanize(m.relationship_to_head), m.sex && humanize(m.sex), m.age_years != null && `${m.age_years} yrs`].filter(Boolean).join(' · ') || '—'}
                </span>
              </div>
              {canRemove && (
                <Button variant="danger-soft" size="sm" iconOnly aria-label={`Remove ${m.full_name}`} title="Remove member" onClick={() => setRemoveTarget(m)}>
                  <Trash2 />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmDialog
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        loading={removing}
        tone="danger"
        title="Remove this member?"
        description={removeTarget ? `${removeTarget.full_name} will be removed from ${family.family_code} and one shelter place will be released.` : ''}
        confirmLabel="Remove member"
      />
    </div>
  );
}

export default FamilyMembers;
