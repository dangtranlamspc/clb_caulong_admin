import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken });
          localStorage.setItem('access_token', data.access_token);
          if (data.refresh_token) localStorage.setItem('refresh_token', data.refresh_token);
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      } else {
        localStorage.clear();
        window.location.href = '/login';
      }
    }
    const message = error.response?.data?.message || 'Đã có lỗi xảy ra';
    if (error.response?.status !== 401) toast.error(Array.isArray(message) ? message[0] : message);
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  profile: () => api.get('/auth/profile'),
};

export const usersApi = {
  list: (params?: any) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  updatePassword: (id: string, data: any) => api.patch(`/users/${id}/password`, data),
  toggleActive: (id: string) => api.patch(`/users/${id}/toggle-active`),
  delete: (id: string) => api.delete(`/users/${id}`),
  dashboard: () => api.get('/users/dashboard'),
  export: (params?: any) => api.get('/users/export', { params, responseType: 'blob' }),
  searchMembers: (q: string) => api.get('/users/search/members', { params: { q } }),
};

export const sessionsApi = {
  list: (params?: any) => api.get('/sessions', { params }),
  get: (id: string) => api.get(`/sessions/${id}`),
  create: (data: any) => api.post('/sessions', data),
  update: (id: string, data: any) => api.put(`/sessions/${id}`, data),
  updateStatus: (id: string, data: { status: string }) =>
    api.patch(`/sessions/${id}/status`, data),
  delete: (id: string) => api.delete(`/sessions/${id}`),
  getRegistrations: (id: string) => api.get(`/sessions/${id}/registrations`),
  getCost: (id: string) => api.get(`/sessions/${id}/cost`),
  finish: (id: string, data: any) => api.patch(`/sessions/${id}/finish`, data),
};

export const registrationsApi = {
  list: (params?: any) => api.get('/registrations', { params }),
  approveRegistration: (id: string) => api.patch(`/registrations/${id}/approve`),
  rejectRegistrationRequest: (id: string) => api.patch(`/registrations/${id}/reject-registration`),
  confirm: (id: string, notes?: string) => api.patch(`/registrations/${id}/confirm`, { notes }),
  reject: (id: string, notes?: string) => api.patch(`/registrations/${id}/reject`, { notes }),
  setAmount: (id: string, amount: number) => api.patch(`/registrations/${id}/amount`, { amount }),
  adminAdd: (data: any) => api.post('/registrations/admin-add', data),
  addGuest: (id: string, data: any) => api.post(`/registrations/${id}/guests`, data),
  checkinPresent: (id: string) => api.patch(`/registrations/${id}/checkin-present`),
  checkinAbsent: (id: string) => api.patch(`/registrations/${id}/checkin-absent`),
  getAdminDetail: (id: string) => api.get(`/registrations/${id}/admin-detail`),
};

export const matchesApi = {
  // Member
  create: (data: any) => api.post('/matches', data),
  myList: (params?: any) => api.get('/matches/my', { params }),
  get: (id: string) => api.get(`/matches/${id}`),
  accept: (id: string) => api.patch(`/matches/${id}/accept`),
  decline: (id: string, reason?: string) => api.patch(`/matches/${id}/decline`, { reason }),
  submitResult: (id: string, data: any) => api.patch(`/matches/${id}/result`, data),

  // Admin
  list: (params?: any) => api.get('/matches', { params }),
  approve: (id: string, data?: { score_a?: number; score_b?: number; note?: string }) =>
    api.patch(`/matches/${id}/approve`, data ?? {}),
  reject: (id: string, reason: string) => api.patch(`/matches/${id}/reject`, { reject_reason: reason }),
  adminCreate: (data: any) => api.post('/matches/admin-create', data),
};

export const rankingsApi = {
  leaderboard: (params?: { month?: number; year?: number }) => api.get('/rankings/leaderboard', { params }),
  reviceLeaderboard: () => api.get('/rankings/revice'),
  winRate: () => api.get('/rankings/win-rate'),
  myStats: () => api.get('/rankings/my-stats'),
  rankLeaderboard: () => api.get('/rankings/rank-leaderboard'),
  myRank: () => api.get('/rankings/my-rank'),
  rankHistory: (limit?: number) => api.get('/rankings/rank-history', { params: { limit } }),
  lpChart: (limit?: number) => api.get('/rankings/lp-chart', { params: { limit } }),
};


export const walletAdminApi = {
  getSummary: () => api.get('/wallet/admin/summary'),
  listMembers: (params?: any) => api.get('/wallet/admin/members', { params }),
  getMemberTransactions: (userId: string, params?: any) =>
    api.get(`/wallet/admin/users/${userId}/transactions`, { params }),
  manualTopup: (userId: string, amount: number, note?: string) =>
    api.post(`/wallet/admin/users/${userId}/topup`, { amount, note }),
  manualAdjust: (userId: string, amount: number, note?: string) =>
    api.post(`/wallet/admin/users/${userId}/adjust`, { amount, note }),
  listTopupRequests: (params?: any) => api.get('/wallet/admin/topup-requests', { params }),
  approveTopup: (id: string) => api.patch(`/wallet/admin/topup-requests/${id}/approve`),
  rejectTopup: (id: string, reason: string) => api.patch(`/wallet/admin/topup-requests/${id}/reject`, { reason }),
};