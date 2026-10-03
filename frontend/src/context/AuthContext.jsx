import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { AUTH_EXPIRED_EVENT } from '../services/apiClient';
import { ROLES, ROLE_ROUTES, STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (authService.isAuthenticated() ? authService.getStoredUser() : null));
  const [isLoading, setIsLoading] = useState(() => authService.isAuthenticated());
  const [sessionExpired, setSessionExpired] = useState(false);

  // Verify a stored token with the backend on first load
  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      if (!authService.isAuthenticated()) {
        setIsLoading(false);
        return;
      }
      try {
        const payload = await authService.getProfile();
        if (cancelled) return;
        const stored = authService.getStoredUser() || {};
        const merged = { ...stored, ...payload };
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(merged));
        setUser(merged);
      } catch (err) {
        if (cancelled) return;
        // Only drop the session when the server rejected the token; keep it on network errors
        if (err?.code !== 'NETWORK_ERROR') {
          authService.logout();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, []);

  // Any API call that finds the token rejected ends the session
  useEffect(() => {
    const onExpired = () => {
      setUser(null);
      setSessionExpired(true);
    };
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      const { user: userData } = await authService.login(email, password);
      setUser(userData);
      setSessionExpired(false);
      return { success: true, user: userData };
    } catch (err) {
      return { success: false, error: err?.message || 'Login failed' };
    }
  }, []);

  const register = useCallback(async (data) => {
    try {
      const result = await authService.register(data);
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err?.message || 'Registration failed' };
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const updateStoredUser = useCallback((changes) => {
    setUser((current) => {
      const next = { ...(current || {}), ...(changes || {}) };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next));
      return next;
    });
  }, []);

  const hasRole = useCallback(
    (allowedRoles) => {
      if (!user) return false;
      const list = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      return list.includes(user.role_id);
    },
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user,
      sessionExpired,
      clearSessionExpired: () => setSessionExpired(false),
      login,
      register,
      logout,
      updateStoredUser,
      hasRole,
      homePath: user ? ROLE_ROUTES[user.role_id] || '/login' : '/login',
      isAdmin: user?.role_id === ROLES.ADMIN,
      isShelterManager: user?.role_id === ROLES.SHELTER_MANAGER,
      isReliefManager: user?.role_id === ROLES.RELIEF_MANAGER,
      isVolunteer: user?.role_id === ROLES.VOLUNTEER,
      isDonor: user?.role_id === ROLES.DONOR,
    }),
    [user, isLoading, sessionExpired, login, register, logout, updateStoredUser, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
