import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axiosInstance';
import { isTokenValid } from '../utils/token';

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
          role: userData.role || decoded.role,
        });
      },

      logout: () => {
        set({ token: null, user: null, role: null });
        localStorage.removeItem('hirehub-auth');
      },

      setUser: (user) => {
        set({ user, role: user.role });
      },

      fetchCurrentUser: async () => {
        try {
          const { data } = await api.get('/auth/me');
          set({ user: data.user, role: data.user.role });
          return data.user;
        } catch {
          get().logout();
          return null;
        }
      },

      isAuthenticated: () => {
        const { token } = get();
        return isTokenValid(token);
      },

      homePath: (role) => {
        const state = get();
        let r = role || state.role;
        if (!r && state.token) {
          try {
            const decoded = jwtDecode(state.token);
            r = decoded.role;
          } catch {
            // invalid token
          }
        }
        const paths = {
          jobseeker: '/jobseeker/dashboard',
          employer: '/employer/dashboard',
          admin: '/admin/dashboard',
        };
        return paths[r] || null;
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
