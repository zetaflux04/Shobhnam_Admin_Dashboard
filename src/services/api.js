import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  timeout: 10000,
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminBookingApi = {
  assignArtist: (bookingId, payload) => api.patch(`/admin/bookings/${bookingId}/assign-artist`, payload),
  unassignArtist: (bookingId) => api.patch(`/admin/bookings/${bookingId}/unassign-artist`),
};

export const adminArtistApi = {
  listApproved: (params = {}) =>
    api.get('/admin/artists', {
      params: { page: 1, limit: 200, status: 'APPROVED', ...params },
    }),
};

export default api;
