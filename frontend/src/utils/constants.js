import { ArrowDown, ArrowRight, ArrowUp, Siren } from 'lucide-react';

export const ROLES = {
  ADMIN: 1,
  SHELTER_MANAGER: 2,
  RELIEF_MANAGER: 3,
  VOLUNTEER: 4,
  DONOR: 5,
};

export const ROLE_NAMES = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SHELTER_MANAGER]: 'Shelter Manager',
  [ROLES.RELIEF_MANAGER]: 'Relief Manager',
  [ROLES.VOLUNTEER]: 'Volunteer',
  [ROLES.DONOR]: 'Donor',
};

export const ROLE_COLORS = {
  [ROLES.ADMIN]: 'var(--role-admin)',
  [ROLES.SHELTER_MANAGER]: 'var(--role-shelter)',
  [ROLES.RELIEF_MANAGER]: 'var(--role-relief)',
  [ROLES.VOLUNTEER]: 'var(--role-volunteer)',
  [ROLES.DONOR]: 'var(--role-donor)',
};

/** Each role's home workspace. */
export const ROLE_ROUTES = {
  [ROLES.ADMIN]: '/admin',
  [ROLES.SHELTER_MANAGER]: '/shelter-manager',
  [ROLES.RELIEF_MANAGER]: '/relief-manager',
  [ROLES.VOLUNTEER]: '/volunteer',
  [ROLES.DONOR]: '/donor',
};

export const MANAGER_ROLES = [ROLES.ADMIN, ROLES.SHELTER_MANAGER, ROLES.RELIEF_MANAGER];

/** Mirrors the backend's checkRole() rules so the UI only offers permitted actions. */
export const PERMISSIONS = {
  createFamily: [ROLES.ADMIN, ROLES.SHELTER_MANAGER],
  admitFamily: [ROLES.ADMIN, ROLES.SHELTER_MANAGER],
  removeFamily: [ROLES.ADMIN],
  manageInventory: [ROLES.ADMIN, ROLES.SHELTER_MANAGER, ROLES.RELIEF_MANAGER],
  viewLowStock: [ROLES.ADMIN, ROLES.SHELTER_MANAGER, ROLES.RELIEF_MANAGER],
  createRequest: [ROLES.ADMIN, ROLES.SHELTER_MANAGER],
  reviewRequest: [ROLES.ADMIN, ROLES.RELIEF_MANAGER],
  createDistribution: [ROLES.ADMIN, ROLES.RELIEF_MANAGER],
  createDonation: [ROLES.ADMIN, ROLES.DONOR],
  receiveDonation: [ROLES.ADMIN, ROLES.RELIEF_MANAGER],
  viewAudit: [ROLES.ADMIN],
  viewSummary: [ROLES.ADMIN, ROLES.SHELTER_MANAGER, ROLES.RELIEF_MANAGER],
};

export const STORAGE_KEYS = {
  TOKEN: 'reliefsync_token',
  USER: 'reliefsync_user',
  SIDEBAR_COLLAPSED: 'reliefsync_sidebar_collapsed',
};

export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const PRIORITY_META = {
  LOW: { label: 'Low', tone: 'neutral', icon: ArrowDown, color: 'var(--seq-4)' },
  MEDIUM: { label: 'Medium', tone: 'info', icon: ArrowRight, color: 'var(--seq-3)' },
  HIGH: { label: 'High', tone: 'serious', icon: ArrowUp, color: 'var(--seq-2)' },
  CRITICAL: { label: 'Critical', tone: 'danger', icon: Siren, color: 'var(--seq-1)' },
};

/** Status vocabulary across modules, mapped to badge tones. */
export const STATUS_META = {
  // Relief requests
  REQUESTED: { label: 'Requested', tone: 'warning', pulse: true },
  PENDING: { label: 'Pending', tone: 'warning', pulse: true },
  APPROVED: { label: 'Approved', tone: 'cyan' },
  PARTIALLY_DELIVERED: { label: 'Partially delivered', tone: 'violet' },
  DELIVERED: { label: 'Delivered', tone: 'success' },
  COMPLETED: { label: 'Completed', tone: 'success' },
  REJECTED: { label: 'Rejected', tone: 'danger' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  // Donations
  RECEIVED: { label: 'Received', tone: 'success' },
  // Families
  NEEDS_SHELTER: { label: 'Needs shelter', tone: 'danger', pulse: true },
  WAITING_FOR_SHELTER: { label: 'Waiting', tone: 'warning' },
  SHELTERED: { label: 'Sheltered', tone: 'success' },
  RELOCATED: { label: 'Relocated', tone: 'info' },
  CLOSED: { label: 'Closed', tone: 'neutral' },
  // Shelters
  OPEN: { label: 'Open', tone: 'success' },
  FULL: { label: 'Full', tone: 'danger' },
  NEARLY_FULL: { label: 'Nearly full', tone: 'warning' },
  AVAILABLE: { label: 'Available', tone: 'success' },
  TEMPORARILY_CLOSED: { label: 'Temporarily closed', tone: 'neutral' },
  DAMAGED: { label: 'Damaged', tone: 'danger' },
  EVACUATING: { label: 'Evacuating', tone: 'serious', pulse: true },
  // Admissions & assignments
  ACTIVE: { label: 'Active', tone: 'success', pulse: true },
  DISCHARGED: { label: 'Discharged', tone: 'neutral' },
  // Volunteers
  BUSY: { label: 'Busy', tone: 'warning' },
  INACTIVE: { label: 'Inactive', tone: 'neutral' },
  // Inventory
  LOW_STOCK: { label: 'Low stock', tone: 'warning' },
  OUT_OF_STOCK: { label: 'Out of stock', tone: 'danger' },
  IN_STOCK: { label: 'Healthy', tone: 'success' },
};

export const REQUEST_STATUSES = ['REQUESTED', 'APPROVED', 'PARTIALLY_DELIVERED', 'DELIVERED', 'REJECTED', 'CANCELLED'];
export const DONATION_STATUSES = ['PENDING', 'RECEIVED', 'CANCELLED'];
export const DISTRIBUTION_STATUSES = ['PENDING', 'COMPLETED', 'CANCELLED'];
export const FAMILY_STATUSES = ['NEEDS_SHELTER', 'WAITING_FOR_SHELTER', 'SHELTERED', 'RELOCATED', 'CLOSED'];

export function humanize(value) {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

/** Stock health for an inventory row. */
export function stockState(quantity, reorderLevel) {
  const q = Number(quantity) || 0;
  const r = Number(reorderLevel) || 0;
  if (q <= 0) return 'OUT_OF_STOCK';
  if (r > 0 && q <= r) return 'LOW_STOCK';
  return 'IN_STOCK';
}

export const BD_DISTRICTS = [
  'Bagerhat', 'Barguna', 'Barishal', 'Bhola', 'Bogura', 'Brahmanbaria', 'Chandpur', 'Chattogram',
  "Cox's Bazar", 'Cumilla', 'Dhaka', 'Dinajpur', 'Faridpur', 'Feni', 'Gaibandha', 'Gazipur',
  'Habiganj', 'Jamalpur', 'Jashore', 'Khulna', 'Kishoreganj', 'Kurigram', 'Lakshmipur', 'Moulvibazar',
  'Mymensingh', 'Narayanganj', 'Noakhali', 'Patuakhali', 'Pirojpur', 'Rajshahi', 'Rangpur', 'Satkhira',
  'Sirajganj', 'Sunamganj', 'Sylhet', 'Tangail',
];
