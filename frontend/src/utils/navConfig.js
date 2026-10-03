import {
  Boxes,
  ClipboardList,
  DoorOpen,
  HandHeart,
  House,
  LayoutDashboard,
  ScrollText,
  Stethoscope,
  Truck,
  UserCheck,
  Users,
} from 'lucide-react';
import { ROLES } from './constants';

const { ADMIN, SHELTER_MANAGER, RELIEF_MANAGER, VOLUNTEER, DONOR } = ROLES;

/**
 * Sidebar + command palette navigation. `path: 'HOME'` resolves to the role's workspace.
 * `signal` names a live counter from the dashboard summary shown as a badge.
 */
export const NAV_SECTIONS = [
  {
    title: 'Workspace',
    items: [
      {
        path: 'HOME',
        label: 'Overview',
        icon: LayoutDashboard,
        roles: [ADMIN, SHELTER_MANAGER, RELIEF_MANAGER, VOLUNTEER, DONOR],
        keywords: 'dashboard home overview',
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      { path: '/families', label: 'Families', icon: Users, roles: [ADMIN, SHELTER_MANAGER, RELIEF_MANAGER], keywords: 'households affected people' },
      { path: '/shelters', label: 'Shelters', icon: House, roles: [ADMIN, SHELTER_MANAGER, RELIEF_MANAGER], keywords: 'capacity occupancy camps' },
      { path: '/admissions', label: 'Admissions', icon: DoorOpen, roles: [ADMIN, SHELTER_MANAGER, RELIEF_MANAGER], keywords: 'admit check-in' },
      { path: '/inventory', label: 'Inventory', icon: Boxes, roles: [ADMIN, SHELTER_MANAGER, RELIEF_MANAGER, VOLUNTEER], signal: 'low_stock_items', signalTone: 'warning', keywords: 'stock supplies items' },
      { path: '/volunteer/shelter', label: 'My Shelter', icon: House, roles: [VOLUNTEER], keywords: 'assigned shelter families people occupancy' },
      { path: '/volunteer/assignments', label: 'Assignments', icon: ClipboardList, roles: [VOLUNTEER], keywords: 'tasks assigned shelter work history' },
      { path: '/requests', label: 'Relief Requests', icon: ClipboardList, roles: [ADMIN, SHELTER_MANAGER, RELIEF_MANAGER], signal: 'pending_requests', signalTone: 'cyan', keywords: 'approve needs' },
      { path: '/distributions', label: 'Distributions', icon: Truck, roles: [ADMIN, SHELTER_MANAGER, RELIEF_MANAGER], keywords: 'dispatch delivery' },
      { path: '/medical', label: 'Medical', icon: Stethoscope, roles: [ADMIN, SHELTER_MANAGER, RELIEF_MANAGER], keywords: 'medical doctor nurse health support history' },
      { path: '/volunteers', label: 'Volunteers', icon: UserCheck, roles: [ADMIN, RELIEF_MANAGER], keywords: 'volunteer availability assignment tasks skills' },
      { path: '/donations', label: 'Donations', icon: HandHeart, roles: [ADMIN, SHELTER_MANAGER, RELIEF_MANAGER, DONOR], signal: 'pending_donations', signalTone: 'violet', keywords: 'donors contributions' },
    ],
  },
  {
    title: 'Oversight',
    items: [
      { path: '/users', label: 'Users', icon: Users, roles: [ADMIN], keywords: 'accounts staff roles access' },
      { path: '/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: [ADMIN], keywords: 'history activity security trail' },
    ],
  },
];

/** Titles for the top bar breadcrumb. */
export const PAGE_META = [
  { match: '/profile', title: 'My Profile', section: 'Account' },
  { match: '/users', title: 'Users', section: 'Administration' },
  { match: '/volunteers', title: 'Volunteers', section: 'Operations' },
  { match: '/admin', title: 'Command Center', section: 'Workspace' },
  { match: '/relief-manager', title: 'Relief Operations', section: 'Workspace' },
  { match: '/shelter-manager/families/register', title: 'Register Family', section: 'Shelter' },
  { match: '/shelter-manager/requests/create', title: 'New Relief Request', section: 'Shelter' },
  { match: '/shelter-manager/inventory', title: 'Shelter Inventory', section: 'Shelter' },
  { match: '/shelter-manager/distributions', title: 'Shelter Distributions', section: 'Shelter' },
  { match: '/shelter-manager', title: 'Shelter Operations', section: 'Workspace' },
  { match: '/volunteer/shelter', title: 'My Shelter', section: 'Operations' },
  { match: '/volunteer/assignments', title: 'My Assignments', section: 'Operations' },
  { match: '/volunteer', title: 'Volunteer Hub', section: 'Workspace' },
  { match: '/donor', title: 'Donor Hub', section: 'Workspace' },
  { match: '/families', title: 'Families', section: 'Operations' },
  { match: '/shelters', title: 'Shelters', section: 'Operations' },
  { match: '/admissions', title: 'Admissions', section: 'Operations' },
  { match: '/inventory', title: 'Inventory', section: 'Operations' },
  { match: '/requests', title: 'Relief Requests', section: 'Operations' },
  { match: '/distributions', title: 'Distributions', section: 'Operations' },
  { match: '/donations', title: 'Donations', section: 'Operations' },
  { match: '/medical', title: 'Medical Support', section: 'Operations' },
  { match: '/audit-logs', title: 'Audit Logs', section: 'Oversight' },
];

export function pageMetaFor(pathname) {
  return PAGE_META.find((p) => pathname === p.match || pathname.startsWith(`${p.match}/`)) || { title: 'ReliefSync', section: 'Workspace' };
}

export function navForRole(role, homePath) {
  return NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items
      .filter((item) => item.roles.includes(role))
      .map((item) => ({ ...item, path: item.path === 'HOME' ? homePath : item.path })),
  })).filter((section) => section.items.length > 0);
}
