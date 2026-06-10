import axios from 'axios';
const API = axios.create({ baseURL: `${process.env.REACT_APP_API_URL || ''}/api` });

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      const isAuthEndpoint =
        url.includes('/auth/login') || url.includes('/auth/register');
      const hadToken = !!localStorage.getItem('token');
      if (hadToken && !isAuthEndpoint) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const getFileUrl = (path) => path || null;

export const authAPI = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  me: () => API.get('/auth/me'),
};

export const workoutAPI = {
  list: (params) => API.get('/workouts', { params }),
  get: (id) => API.get(`/workouts/${id}`),
  create: (data) => API.post('/workouts', data),
  update: (id, data) => API.put(`/workouts/${id}`, data),
  delete: (id) => API.delete(`/workouts/${id}`),
  uploadPhoto: (id, file) => {
    const form = new FormData();
    form.append('photo', file);
    return API.post(`/workouts/${id}/photo`, form);
  },
};

export const bookingAPI = {
  my: () => API.get('/bookings/my'),
  book: (id) => API.post(`/workouts/${id}/book`),
  cancel: (id) => API.put(`/bookings/${id}/cancel`),
  markAttended: (id) => API.put(`/bookings/${id}/attend`),
};

export const userAPI = {
  updateProfile: (data) => API.put('/profile', data),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return API.post('/profile/avatar', form);
  },
  trainers: () => API.get('/trainers'),
};

export const adminAPI = {
  users: () => API.get('/admin/users'),
  createUser: (data) => API.post('/admin/users', data),
  updateUser: (id, data) => API.put(`/admin/users/${id}`, data),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  stats: () => API.get('/admin/stats'),
};

export default API;
