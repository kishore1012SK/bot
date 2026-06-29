const BASE_URL = '/api/v1'

function getToken(): string | null {
  return localStorage.getItem('access_token')
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers })

  if (res.status === 401) {
    localStorage.removeItem('access_token')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'API Error')
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

async function upload<T>(endpoint: string, formData: FormData): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Upload Error')
  }
  return res.json()
}

// ── Auth ────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ access_token: string; token_type: string; role: string; email: string; full_name: string }>(
        '/auth/login/json', { method: 'POST', body: JSON.stringify({ email, password }) }
      ),
    register: (payload: { email: string; password: string; full_name: string; role?: string }) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    me: () => request<{ id: number; email: string; full_name: string; role: string; is_active: boolean; created_at: string }>('/auth/me'),
  },

  // ── Chat ──────────────────────────────────────────────────────────────────
  chat: {
    list: (query?: string) =>
      request<Conversation[]>(`/chat${query ? `?query=${encodeURIComponent(query)}` : ''}`),
    create: (title: string) =>
      request<Conversation>('/chat', { method: 'POST', body: JSON.stringify({ title }) }),
    get: (id: number) => request<ConversationDetail>(`/chat/${id}`),
    delete: (id: number) => request(`/chat/${id}`, { method: 'DELETE' }),
    export: (id: number, format: 'json' | 'txt') => `${BASE_URL}/chat/${id}/export?format=${format}`,
    streamUrl: (id: number) => `${BASE_URL}/chat/${id}/stream`,
    wsUrl: (id: number, token: string) => {
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws'
      return `${proto}://${window.location.host}/api/v1/chat/${id}/ws?token=${token}`
    },
  },

  // ── Knowledge Base ─────────────────────────────────────────────────────────
  knowledge: {
    list: () => request<Document[]>('/knowledge'),
    upload: (formData: FormData) => upload<Document>('/knowledge/upload', formData),
    delete: (id: number) => request(`/knowledge/${id}`, { method: 'DELETE' }),
    search: (query: string, limit = 5) => {
      const fd = new FormData(); fd.append('query', query); fd.append('limit', String(limit))
      return upload<SearchResult[]>('/knowledge/search', fd)
    },
  },

  // ── Career ────────────────────────────────────────────────────────────────
  career: {
    assess: (payload: object) =>
      request('/career/assess', { method: 'POST', body: JSON.stringify(payload) }),
    history: () => request('/career/history'),
  },

  // ── Resume ────────────────────────────────────────────────────────────────
  resume: {
    analyze: (formData: FormData) => upload('/resume/analyze', formData),
    history: () => request('/resume/history'),
  },

  // ── Interview ─────────────────────────────────────────────────────────────
  interview: {
    start: (type: string) =>
      request('/interview/start', { method: 'POST', body: JSON.stringify({ type }) }),
    answer: (sessionId: number, answer: string) =>
      request(`/interview/${sessionId}/answer`, { method: 'POST', body: JSON.stringify({ answer }) }),
    history: () => request('/interview/history'),
  },

  // ── Projects ──────────────────────────────────────────────────────────────
  projects: {
    recommend: (skills: string[], difficulty: string) =>
      request('/projects/recommend', { method: 'POST', body: JSON.stringify({ skills, difficulty }) }),
    history: () => request('/projects/history'),
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: {
    users: () => request<UserAdmin[]>('/admin/users'),
    updateRole: (id: number, role: string) =>
      request(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
    toggleStatus: (id: number, is_active: boolean) =>
      request(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ is_active }) }),
    deleteUser: (id: number) => request(`/admin/users/${id}`, { method: 'DELETE' }),
    logs: () => request('/admin/logs'),
    analytics: () => request<AnalyticsData>('/admin/analytics'),
  },

  // ── Health ────────────────────────────────────────────────────────────────
  health: {
    check: () => request<HealthData>('/health'),
  },
}

// ── Types ─────────────────────────────────────────────────────────────────
export interface Conversation {
  id: number; user_id: number; title: string; created_at: string; updated_at: string
}
export interface Message {
  id: number; conversation_id: number; sender: string; content: string; timestamp: string
}
export interface ConversationDetail extends Conversation { messages: Message[] }
export interface Document {
  id: number; name: string; category: string; tags: string[]; version: number; file_type: string; created_at: string; user_id: number
}
export interface SearchResult {
  chunk_id: number; document_id: number; document_name: string; category: string; version: number; content: string; chunk_index: number
}
export interface UserAdmin {
  id: number; email: string; full_name: string; role: string; is_active: boolean; created_at: string
}
export interface AnalyticsData {
  total_users: number; role_breakdown: Record<string, number>; total_documents: number; total_questions_asked: number; latest_activities: any[]
}
export interface HealthData {
  status: string; database: string; vector_store: string; active_llm: string; system_stats: Record<string, any>
}
