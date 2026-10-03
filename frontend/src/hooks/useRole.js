import { useAuth } from '../context/AuthContext';
import { MANAGER_ROLES, PERMISSIONS, ROLES, ROLE_NAMES } from '../utils/constants';

export function useRole() {
  const { user, hasRole } = useAuth();
  const role = user?.role_id;

  return {
    role,
    roleName: role ? ROLE_NAMES[role] : null,
    isAdmin: role === ROLES.ADMIN,
    isShelterManager: role === ROLES.SHELTER_MANAGER,
    isReliefManager: role === ROLES.RELIEF_MANAGER,
    isVolunteer: role === ROLES.VOLUNTEER,
    isDonor: role === ROLES.DONOR,
    isManager: MANAGER_ROLES.includes(role),
    hasRole,
    /** can('createRequest') — mirrors backend permissions */
    can: (permission) => (PERMISSIONS[permission] || []).includes(role),
  };
}

export default useRole;
