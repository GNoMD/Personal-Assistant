const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('task-planner-token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders(), ...options.headers },
    ...options,
  });
  if (res.status === 401) {
    const err = new Error('未登录或登录已过期');
    err.code = 'UNAUTHORIZED';
    throw err;
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 500 && !err.error) {
      throw new Error('服务器异常，请确认后端已启动后重试');
    }
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => request('/health'),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    request('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  getProfile: () => request('/profile/me'),
  updateProfile: (data) =>
    request('/profile/me', { method: 'PATCH', body: JSON.stringify(data) }),
  clearProfile: () => request('/profile/me', { method: 'DELETE' }),
  uploadAvatar: (dataUrl) =>
    request('/profile/me/avatar', {
      method: 'PUT',
      body: JSON.stringify({ dataUrl }),
    }),
  deleteAvatar: () => request('/profile/me/avatar', { method: 'DELETE' }),
  async fetchAvatarBlob() {
    const res = await fetch(`${API_BASE}/profile/me/avatar`, {
      headers: { ...getAuthHeaders() },
    });
    if (res.status === 404) return null;
    if (res.status === 401) {
      const err = new Error('未登录或登录已过期');
      err.code = 'UNAUTHORIZED';
      throw err;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.blob();
  },
  adminUserProfile: (id) => request(`/admin/users/${id}/profile`),
  adminUpdateUserProfile: (id, data) =>
    request(`/admin/users/${id}/profile`, { method: 'PATCH', body: JSON.stringify(data) }),
  adminClearUserProfile: (id) =>
    request(`/admin/users/${id}/profile`, { method: 'DELETE' }),
  joinTeam: (inviteCode) =>
    request('/teams/join', { method: 'POST', body: JSON.stringify({ inviteCode }) }),
  createTeam: (name) =>
    request('/teams', { method: 'POST', body: JSON.stringify({ name }) }),
  getTasksByDate: (date) => request(`/tasks?date=${date}`),
  getCalendar: (year, month) => request(`/tasks/calendar?year=${year}&month=${month}`),
  updateTask: (id, data) =>
    request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  createTask: (data) =>
    request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),
  getRecentAudit: () => request('/audit/recent'),
  getTaskAudit: (taskId) => request(`/audit/task/${taskId}`),
  getRecipes: (params = {}) => {
    const query = new URLSearchParams(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== '')
    );
    return request(`/recipes${query.size ? `?${query}` : ''}`);
  },
  getRecipe: (id) => request(`/recipes/${id}`),
  createRecipe: (data) =>
    request('/recipes', { method: 'POST', body: JSON.stringify(data) }),
  updateRecipe: (id, data) =>
    request(`/recipes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteRecipe: (id) => request(`/recipes/${id}`, { method: 'DELETE' }),
  getFitnessFavorites: () => request('/fitness/favorites'),
  setFitnessFavorite: (itemId, isFavorite) =>
    request(`/fitness/favorites/${encodeURIComponent(itemId)}`, {
      method: 'PUT',
      body: JSON.stringify({ isFavorite }),
    }),
  adminOverview: () => request('/admin/overview'),
  adminUsers: () => request('/admin/users'),
  adminUser: (id) => request(`/admin/users/${id}`),
  adminCreateUser: (data) =>
    request('/admin/users', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateUser: (id, data) =>
    request(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  adminDeleteUser: (id) =>
    request(`/admin/users/${id}`, { method: 'DELETE' }),
};
