/** Helpers for presenting audit-log rows. */

export function actionTone(action = '') {
  const a = String(action).toUpperCase();
  if (a.includes('DELETE') || a.includes('CANCEL') || a.includes('REJECT')) return 'danger';
  if (a.includes('UPDATE') || a.includes('EDIT')) return 'warning';
  if (a.includes('APPROV') || a.includes('RECEIV') || a.includes('COMPLET')) return 'success';
  if (a.includes('INSERT') || a.includes('CREATE') || a.includes('ADD')) return 'cyan';
  return 'info';
}

/** Audit log rows → timeline items */
export function auditToTimeline(logs) {
  return logs.map((l) => ({
    id: l.audit_id,
    action: l.action_type,
    title: `${humanAction(l.action_type)} ${String(l.entity_type || '').toLowerCase().replace(/_/g, ' ')}${l.entity_id ? ` #${l.entity_id}` : ''}`,
    description: l.description,
    at: l.created_at,
    actor: l.email || (l.user_id ? `User #${l.user_id}` : 'System'),
  }));
}

function humanAction(a = '') {
  const s = String(a).toLowerCase().replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
