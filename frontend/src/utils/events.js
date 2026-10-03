export const DATA_CHANGED_EVENT = 'reliefsync:data-changed';

/** Tell the app shell that data changed so live counters (sidebar badges, alerts) refresh now. */
export function notifyDataChanged() {
  window.dispatchEvent(new CustomEvent(DATA_CHANGED_EVENT));
}
