import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axiosInstance';

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      role: null,

      login: (token, userData) => {
        const decoded = jwtDecode(token);
        set({
          token,
          user: userData,
          // EDGE-06: always use server-provided role as source of truth
          role: userData.role || decoded.role,
        });
      },

      logout: () => {
        set({ token: null, user: null, role: null });
        localStorage.removeItem('hirehub-auth');
      },

      setUser: (user) => {
        // EDGE-06: update role whenever user data is refreshed from the server
        set({ user, role: user.role });
      },

      /**
       * EDGE-05: Validate the session server-side by calling /auth/me.
       * Called on app load (see main.jsx) to catch deactivated / deleted accounts
       * and stale roles that local-only token decoding cannot detect.
       * Returns the fresh user object, or null if the session is invalid.
       */
      validateSession: async () => {
        const { token, logout } = get();
        if (!token) return null;

        // Quick client-side expiry check before making a network call
        try {
          const decoded = jwtDecode(token);
          if (decoded.exp * 1000 <= Date.now()) {
            logout();
            return null;
          }
        } catch {
          logout();
          return null;
        }

        try {
          const { data } = await api.get('/auth/me');
          const freshUser = data.user;
          // EDGE-06: sync role from server so stale persisted role is corrected
          set({ user: freshUser, role: freshUser.role });
          return freshUser;
        } catch {
          // 401 / 403 means the token is invalid or account deactivated
          logout();
          return null;
        }
      },

      fetchCurrentUser: async () => {
        try {
          const { data } = await api.get('/auth/me');
          const freshUser = data.user;
          set({ user: freshUser, role: freshUser.role });
          return freshUser;
        } catch {
          get().logout();
          return null;
        }
      },

      isAuthenticated: () => {
        const { token } = get();
        if (!token) return false;
        try {
          const decoded = jwtDecode(token);
          return decoded.exp * 1000 > Date.now();
        } catch {
          return false;
        }
      },

      homePath: (role) => {
        const r = role || get().role;
        const paths = {
          jobseeker: '/jobseeker/dashboard',
          employer: '/employer/dashboard',
          admin: '/admin/dashboard',
        };
        return paths[r] || '/login';
      },
    }),
    {
      name: 'hirehub-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        role: state.role,
      }),
    }
  )
);

export default useAuthStore;
