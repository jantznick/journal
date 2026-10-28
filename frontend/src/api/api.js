export const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    const msg = [error.error, error.detail].filter(Boolean).join(' — ');
    throw new Error(msg || 'Request failed');
  }

  if (response.status === 204) return null;
  return response.json();
}

export const authAPI = {
  providers: () => request('/auth/providers'),
  me: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  magicLink: (email) =>
    request('/auth/magic-link', { method: 'POST', body: JSON.stringify({ email }) }),
  magicRegisterLink: (email) =>
    request('/auth/magic-register-link', { method: 'POST', body: JSON.stringify({ email }) }),
  magicVerify: (token) =>
    request('/auth/magic-verify', { method: 'POST', body: JSON.stringify({ token }) }),
  magicRegisterVerify: (token) =>
    request('/auth/magic-register-verify', { method: 'POST', body: JSON.stringify({ token }) }),
  magicCode: (email, code) =>
    request('/auth/magic-code', { method: 'POST', body: JSON.stringify({ email, code }) }),
  oidcStart: () => request('/auth/oidc/start'),
};

export const userAPI = {
  themes: () => request('/user/themes'),
  profile: () => request('/user/profile'),
  updateProfile: (data) =>
    request('/user/profile', { method: 'PATCH', body: JSON.stringify(data) }),
};

export const entriesAPI = {
  list: (limitOrOpts = 50, maybeOpts = {}) => {
    const opts =
      typeof limitOrOpts === 'object' && limitOrOpts !== null
        ? limitOrOpts
        : { limit: limitOrOpts, ...maybeOpts };
    const limit = opts.limit ?? 50;
    const offset = opts.offset ?? 0;
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (opts.encrypted === true) params.set('encrypted', 'true');
    if (opts.encrypted === false) params.set('encrypted', 'false');
    return request(`/entries?${params}`);
  },
  get: (id) => request(`/entries/${id}`),
  prompt: (theme) =>
    request('/entries/prompt', { method: 'POST', body: JSON.stringify({ theme }) }),
  create: (data) => request('/entries', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) =>
    request(`/entries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id) => request(`/entries/${id}`, { method: 'DELETE' }),
};

export const insightsAPI = {
  get: () => request('/insights'),
  generate: ({ limit = 15, entries } = {}) =>
    request('/insights/generate', {
      method: 'POST',
      body: JSON.stringify(entries ? { limit, entries } : { limit }),
    }),
  updateGoals: (goals) =>
    request('/insights/goals', { method: 'PATCH', body: JSON.stringify({ goals }) }),
};
