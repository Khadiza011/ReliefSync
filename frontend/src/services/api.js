import apiClient from './apiClient';
import { asArray } from '../utils/helpers';

/**
 * Typed wrappers around every REST endpoint the backend exposes.
 * Paths, verbs and payloads match ReliefSync-main/03-backend/routes exactly.
 */

const get = async (url, params) => (await apiClient.get(url, { params })).data;
const post = async (url, body) => (await apiClient.post(url, body)).data;
const put = async (url, body) => (await apiClient.put(url, body)).data;
const del = async (url) => (await apiClient.delete(url)).data;

export const dashboardService = {
  /** GET /dashboard/summary (roles 1,2,3) */
  getSummary: () => get('/dashboard/summary'),
};

export const familiesService = {
  /** GET /families (roles 1,2,3) */
  list: async () => asArray(await get('/families')),
  /** POST /families { family_code, contact_phone, current_district, current_area, priority } (roles 1,2) */
  create: (data) => post('/families', data),
  /** GET /families/:id/members (roles 1,2,3) */
  members: async (id) => asArray(await get(`/families/${id}/members`)),
  /** POST /families/:id/members { full_name, age_years, sex, is_head, relationship_to_head } (roles 1,2) */
  addMember: (id, data) => post(`/families/${id}/members`, data),
  /** GET /families/:id/member-capacity → { admitted_member_count, recorded_member_count, remaining_slots, can_add_member } */
  memberCapacity: (id) => get(`/families/${id}/member-capacity`),
  /** DELETE /families/:id/members/:memberId (admin only) — releases the shelter place */
  removeMember: (id, memberId) => del(`/families/${id}/members/${memberId}`),
  /** DELETE /families/:id (admin only) — removes the family and frees its shelter places */
  remove: (id) => del(`/families/${id}`),
};

export const sheltersService = {
  /** GET /shelters (public) */
  list: async () => asArray(await get('/shelters')),
  /** GET /shelters/mine (shelter manager only) */
  mine: async () => asArray(await get('/shelters/mine')),
  /** GET /shelters/available */
  available: async () => asArray(await get('/shelters/available')),
  /** GET /shelters/:id/capacity */
  capacity: (id) => get(`/shelters/${id}/capacity`),
  /** GET /shelters/recommend?district&upazila */
  recommend: async (district, upazila) => asArray(await get('/shelters/recommend', { district, upazila })),
  /** GET /shelters/:id/families (roles 1,2,3) → { shelter, families: [{ …, members }] } */
  families: (id) => get(`/shelters/${id}/families`),
};

export const admissionsService = {
  /** GET /admissions (roles 1,2,3) */
  list: async () => asArray(await get('/admissions')),
  /** POST /admissions { family_id, shelter_id, admitted_member_count } (roles 1,2) */
  create: (data) => post('/admissions', data),
  /** PUT /admissions/:id/discharge (roles 1,2) — releases shelter places */
  discharge: (id) => put(`/admissions/${id}/discharge`, {}),
};

export const inventoryService = {
  /** GET /inventory (roles 1,2,3,4 — scoped per role server-side) */
  list: async () => asArray(await get('/inventory')),
  /** GET /inventory/low-stock (roles 1,2,3) */
  lowStock: async () => asArray(await get('/inventory/low-stock')),
  /** POST /inventory/add { shelter_id, item_id, quantity } */
  add: (data) => post('/inventory/add', data),
  /** POST /inventory/add-new-item { shelter_id, item_name, reorder_level, quantity } */
  addNewItem: (data) => post('/inventory/add-new-item', data),
  /** PUT /inventory/reduce { shelter_id, item_id, quantity } */
  reduce: (data) => put('/inventory/reduce', data),
};

export const lookupService = {
  /** GET /items */
  items: async () => asArray(await get('/items')),
  /** GET /item-categories */
  categories: async () => asArray(await get('/item-categories')),
  /** GET /donors (roles 1,3,5) */
  donors: async () => asArray(await get('/donors')),
};

export const requestsService = {
  /** GET /requests (roles 1,2,3) */
  list: async () => asArray(await get('/requests')),
  /** POST /requests { shelter_id, priority, notes } (roles 1,2) */
  create: (data) => post('/requests', data),
  /** PUT /requests/status { request_id, status: APPROVED|CANCELLED } (roles 1,3) */
  updateStatus: (requestId, status) => put('/requests/status', { request_id: requestId, status }),
  /** GET /request-items/:request_id */
  items: async (requestId) => asArray(await get(`/request-items/${requestId}`)),
  /** POST /request-items { request_id, item_id, requested_qty } */
  addItem: (data) => post('/request-items', data),
};

export const distributionService = {
  /** GET /distributions (roles 1,2,3) */
  list: async () => asArray(await get('/distributions')),
  /** POST /distributions { request_id, notes } (roles 1,3; request must be APPROVED) */
  create: (data) => post('/distributions', data),
  /** POST /distribution-items { distribution_id, request_item_id, item_id, quantity } (roles 1,3) */
  addItem: (data) => post('/distribution-items', data),
};

export const donationService = {
  /** GET /donations (roles 1,2,3,5) */
  list: async () => asArray(await get('/donations')),
  /** POST /donations { donor_id?, shelter_id, items: [{ item_id, quantity }], notes } (roles 1,5) */
  create: (data) => post('/donations', data),
  /** PUT /donations/:id/receive (roles 1,3) */
  receive: (id) => put(`/donations/${id}/receive`),
};

export const auditService = {
  /** GET /audit-logs (role 1) → { total, logs } */
  list: async () => asArray(await get('/audit-logs'), 'logs'),
  /** GET /audit-logs/inventory-transactions (role 1) → { total, transactions } */
  transactions: async () => asArray(await get('/audit-logs/inventory-transactions'), 'transactions'),
};

export const volunteerService = {
  /** GET /volunteers/me (role 4) → { volunteer, skills, assignments } */
  me: () => get('/volunteers/me'),
  /** GET /volunteers/me/skills/catalog (volunteer only) */
  skillCatalog: async () => asArray(await get('/volunteers/me/skills/catalog')),
  /** PUT /volunteers/me/skills { skill_ids: number[] } (volunteer only) */
  updateMySkills: (skill_ids) => put('/volunteers/me/skills', { skill_ids }),
  /** GET /volunteers/me/shelters/:id/families (volunteer only) */
  shelterPeople: (shelterId) => get(`/volunteers/me/shelters/${shelterId}/families`),
  /** PUT /volunteers/me/assignments/:id/complete (volunteer only) */
  completeAssignment: (assignmentId) => put(`/volunteers/me/assignments/${assignmentId}/complete`, {}),
  /** GET /volunteers (roles 1,3) */
  list: async () => asArray(await get('/volunteers')),
  /** GET /volunteers/available (roles 1,3) */
  available: async () => asArray(await get('/volunteers/available')),
  /** PUT /volunteers/:id/approve (admin only) */
  approve: (id) => put(`/volunteers/${id}/approve`, {}),
  /** POST /volunteers/:id/assign */
  assign: (id, data) => post(`/volunteers/${id}/assign`, data),
};

export const medicalService = {
  /** GET /medical/requests (roles 1,2,3) — requests with their assigned team / volunteer */
  requests: async () => asArray(await get('/medical/requests')),
  /** GET /medical/teams (roles 1,3) */
  teams: async () => asArray(await get('/medical/teams')),
  /** POST /medical/request { family_id, problem_description, priority } (roles 1,2,3) */
  create: (data) => post('/medical/request', data),
  /** POST /medical/assign { medical_request_id, medical_team_id?, volunteer_id? } (roles 1,3) */
  assign: (data) => post('/medical/assign', data),
  /** PUT /medical/assignment/status { assignment_id, status: ASSIGNED|COMPLETED } (roles 1,3) */
  updateStatus: (assignment_id, status) => put('/medical/assignment/status', { assignment_id, status }),
};

/** Runs several loaders in parallel; one failure never blanks the whole view. */
export async function loadAll(loaders) {
  const keys = Object.keys(loaders);
  const results = await Promise.allSettled(keys.map((k) => loaders[k]()));
  const data = {};
  const errors = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') data[keys[i]] = r.value;
    else {
      data[keys[i]] = null;
      errors[keys[i]] = r.reason;
    }
  });
  const failed = Object.keys(errors).length;
  if (failed === keys.length && failed > 0) {
    throw errors[keys[0]];
  }
  return { ...data, errors };
}

export const userService = {
  list: async () => asArray(await get('/users')),
  create: (data) => post('/users', data),
  /** PUT /users/:id/status { status: ACTIVE|INACTIVE } (admin only) */
  setStatus: (id, status) => put(`/users/${id}/status`, { status }),
  /** PUT /users/:id/shelter { shelter_id } (admin only, shelter managers) */
  assignShelter: (id, shelter_id) => put(`/users/${id}/shelter`, { shelter_id }),
  deletionRequests: async () => asArray(await get('/users/deletion-requests')),
  resolveDeletionRequest: (requestId, decision, note = '') => put(`/users/deletion-requests/${requestId}`, { decision, note }),
};
