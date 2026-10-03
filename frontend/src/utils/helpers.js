import { ROLE_NAMES, ROLE_COLORS } from './constants';

export function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Kept for backwards compatibility with older imports
export const classNames = cx;

export function getRoleName(roleId) {
  return ROLE_NAMES[roleId] || 'Unknown';
}

export function getRoleColor(roleId) {
  return ROLE_COLORS[roleId] || 'var(--text-3)';
}

export function formatDate(dateString, options = {}) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export function formatDateTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateString) {
  if (!dateString) return '—';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  const then = new Date(dateString);
  if (Number.isNaN(then.getTime())) return '—';
  const diffMs = Date.now() - then.getTime();
  const future = diffMs < 0;
  const abs = Math.abs(diffMs);
  const mins = Math.floor(abs / 60000);
  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);

  if (mins < 1) return 'Just now';
  const suffix = future ? 'from now' : 'ago';
  if (mins < 60) return `${mins}m ${suffix}`;
  if (hours < 24) return `${hours}h ${suffix}`;
  if (days < 7) return `${days}d ${suffix}`;
  return formatDate(dateString);
}

export function formatNumber(num, options) {
  const n = Number(num);
  if (num === null || num === undefined || Number.isNaN(n)) return '0';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2, ...options }).format(n);
}

export function compactNumber(num) {
  const n = Number(num) || 0;
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function truncate(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}…`;
}

export function initials(name = '') {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Normalises API payloads into arrays: [], {data: []}, {logs: []}, {items: []}. */
export function asArray(payload, key) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  if (key && Array.isArray(payload[key])) return payload[key];
  for (const k of ['data', 'items', 'rows', 'results', 'logs']) {
    if (Array.isArray(payload[k])) return payload[k];
  }
  return [];
}

export function countBy(list, key) {
  return list.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item?.[key];
    if (k === undefined || k === null) return acc;
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

export function sumBy(list, key) {
  return list.reduce((acc, item) => acc + (Number(typeof key === 'function' ? key(item) : item?.[key]) || 0), 0);
}

export function percent(part, whole) {
  const p = Number(part) || 0;
  const w = Number(whole) || 0;
  if (w <= 0) return 0;
  return Math.max(0, Math.min(100, (p / w) * 100));
}

/** Downloads rows as a CSV file (client side). columns: [{ key, header, csv? }] */
export function exportCsv(filename, columns, rows) {
  const cols = columns.filter((c) => c.key && c.header && c.csv !== false);
  const escape = (value) => {
    if (value === null || value === undefined) return '';
    const s = String(value).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  const header = cols.map((c) => escape(c.header)).join(',');
  const body = rows
    .map((row) => cols.map((c) => escape(typeof c.csv === 'function' ? c.csv(row) : row[c.key])).join(','))
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Groups timestamps into the last `days` days (oldest → newest) for column charts. */
export function dailySeries(list, dateKey, days = 14) {
  const buckets = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    buckets.push({ date: d, key: d.toDateString(), value: 0 });
  }
  const index = new Map(buckets.map((b) => [b.key, b]));
  list.forEach((item) => {
    const raw = item?.[dateKey];
    if (!raw) return;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return;
    d.setHours(0, 0, 0, 0);
    const bucket = index.get(d.toDateString());
    if (bucket) bucket.value += 1;
  });
  return buckets.map((b) => ({
    label: b.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    value: b.value,
  }));
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Working late';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

/** True when a timestamp falls within the last `days` days. */
export function isWithinDays(dateString, days) {
  if (!dateString) return false;
  const t = new Date(dateString).getTime();
  return !Number.isNaN(t) && Date.now() - t <= days * 86400000;
}
