const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  if (response.status === 204) return undefined as T;

  return response.json();
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

// ============ Cat API ============
export interface Cat {
  cat_id: number;
  cat_name: string;
  cat_photo_uri: string;
  cat_type: string;
  cat_gender: string;
  master_name: string;
  master_phone_number: string;
  created_at?: string;
}

export const catApi = {
  list: (page = 1, pageSize = 10) =>
    request<PaginatedResponse<Cat>>(`/cats/page?page=${page}&pageSize=${pageSize}`),
  get: (id: number) => request<Cat>(`/cats/${id}`),
  create: (cat: Omit<Cat, 'cat_id' | 'created_at'>) =>
    request<Cat>('/cats', { method: 'POST', body: JSON.stringify(cat) }),
  update: (id: number, cat: Partial<Cat>) =>
    request<Cat>(`/cats/${id}`, { method: 'PUT', body: JSON.stringify(cat) }),
  delete: (id: number) => request<void>(`/cats/${id}`, { method: 'DELETE' }),
};

// ============ Site API ============
export interface Site {
  site_id: number;
  site_name: string;
  site_address: string;
  site_admin_phone_number: string;
  created_at?: string;
}

export const siteApi = {
  list: (page = 1, pageSize = 10) =>
    request<PaginatedResponse<Site>>(`/sites/page?page=${page}&pageSize=${pageSize}`),
  get: (id: number) => request<Site>(`/sites/${id}`),
  create: (site: Omit<Site, 'site_id' | 'created_at'>) =>
    request<Site>('/sites', { method: 'POST', body: JSON.stringify(site) }),
  update: (id: number, site: Partial<Site>) =>
    request<Site>(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(site) }),
  delete: (id: number) => request<void>(`/sites/${id}`, { method: 'DELETE' }),
};

// ============ Cat Action API ============
export interface CatAction {
  action_id: number;
  cat_id: number;
  site_id: number;
  user_id: number;
  action_type: string;
  action_detail: string;
  created_at: string;
}

export const ACTION_TYPES = [
  '喂食',
  '喂水',
  '测体温',
  '逗猫',
  '绝育',
  '体检',
  '驱虫',
  '清理猫砂',
  '环境消毒',
  '修剪指甲',
  '洗脚',
  '疫苗',
] as const;

export const catActionApi = {
  list: (page = 1, pageSize = 10) =>
    request<PaginatedResponse<CatAction>>(`/cat-actions/page?page=${page}&pageSize=${pageSize}`),
  get: (id: number) => request<CatAction>(`/cat-actions/${id}`),
  getByCat: (catId: number) => request<CatAction[]>(`/cat-actions/cat/${catId}`),
  getBySite: (siteId: number) => request<CatAction[]>(`/cat-actions/site/${siteId}`),
  getByUser: (userId: number) => request<CatAction[]>(`/cat-actions/user/${userId}`),
  create: (action: Omit<CatAction, 'action_id' | 'created_at'>) =>
    request<{ action: CatAction }>('/cat-actions', { method: 'POST', body: JSON.stringify(action) }),
  update: (id: number, action: Partial<CatAction>) =>
    request<CatAction>(`/cat-actions/${id}`, { method: 'PUT', body: JSON.stringify(action) }),
  delete: (id: number) => request<void>(`/cat-actions/${id}`, { method: 'DELETE' }),
};

// ============ Cat Event API ============
export interface CatEvent {
  event_id: number;
  event_type: string;
  site_id: number;
  user_id: number;
  cat_id: number;
  detail: string;
  created_at: string;
}

export const EVENT_TYPES = ['生病', '受伤', '怀孕', '分娩', '死亡', '合同解除'] as const;

export const catEventApi = {
  list: (page = 1, pageSize = 10) =>
    request<PaginatedResponse<CatEvent>>(`/cat-events/page?page=${page}&pageSize=${pageSize}`),
  get: (id: number) => request<CatEvent>(`/cat-events/${id}`),
  getByCat: (catId: number) => request<CatEvent[]>(`/cat-events/cat/${catId}`),
  getBySite: (siteId: number) => request<CatEvent[]>(`/cat-events/site/${siteId}`),
  create: (event: Omit<CatEvent, 'event_id' | 'created_at'>) =>
    request<CatEvent>('/cat-events', { method: 'POST', body: JSON.stringify(event) }),
  update: (id: number, event: Partial<CatEvent>) =>
    request<CatEvent>(`/cat-events/${id}`, { method: 'PUT', body: JSON.stringify(event) }),
  delete: (id: number) => request<void>(`/cat-events/${id}`, { method: 'DELETE' }),
};

// ============ Cat FSM API ============
export interface CatFSM {
  id?: number;
  cat_id: number;
  site_id: number;
  temperature_c: number;
  weight_kg: number;
  trim_nails_time: string;
}

export const catFsmApi = {
  list: (page = 1, pageSize = 10) =>
    request<PaginatedResponse<CatFSM>>(`/cat-fsms/page?page=${page}&pageSize=${pageSize}`),
  get: (id: number) => request<CatFSM>(`/cat-fsms/${id}`),
  getBySite: (siteId: number) => request<CatFSM[]>(`/cat-fsms/site/${siteId}`),
  create: (fsm: Omit<CatFSM, 'id'>) =>
    request<CatFSM>('/cat-fsms', { method: 'POST', body: JSON.stringify(fsm) }),
  update: (id: number, fsm: Partial<CatFSM>) =>
    request<CatFSM>(`/cat-fsms/${id}`, { method: 'PUT', body: JSON.stringify(fsm) }),
  delete: (id: number) => request<void>(`/cat-fsms/${id}`, { method: 'DELETE' }),
  updateTemperature: (catId: number, temperature_c: number) =>
    request<CatFSM>(`/cat-fsms/${catId}/temperature`, {
      method: 'PATCH',
      body: JSON.stringify({ temperature_c }),
    }),
  updateWeight: (catId: number, weight_kg: number) =>
    request<CatFSM>(`/cat-fsms/${catId}/weight`, {
      method: 'PATCH',
      body: JSON.stringify({ weight_kg }),
    }),
  updateTrimNailsTime: (catId: number, trim_nails_time: string) =>
    request<CatFSM>(`/cat-fsms/${catId}/trim-nails-time`, {
      method: 'PATCH',
      body: JSON.stringify({ trim_nails_time }),
    }),
};

// ============ Site FSM API ============
export interface SiteFSM {
  id?: number;
  site_id: number;
  last_disinfect_time: string;
  last_feed_time: string;
  last_give_water_time: string;
  last_play_time: string;
}

export const siteFsmApi = {
  list: (page = 1, pageSize = 10) =>
    request<PaginatedResponse<SiteFSM>>(`/site-fsms/page?page=${page}&pageSize=${pageSize}`),
  get: (id: number) => request<SiteFSM>(`/site-fsms/${id}`),
  getBySite: (siteId: number) => request<SiteFSM>(`/site-fsms/site/${siteId}`),
  create: (fsm: Omit<SiteFSM, 'id'>) =>
    request<SiteFSM>('/site-fsms', { method: 'POST', body: JSON.stringify(fsm) }),
  update: (id: number, fsm: Partial<SiteFSM>) =>
    request<SiteFSM>(`/site-fsms/${id}`, { method: 'PUT', body: JSON.stringify(fsm) }),
  delete: (id: number) => request<void>(`/site-fsms/${id}`, { method: 'DELETE' }),
  updateDisinfectTime: (siteId: number, last_disinfect_time: string) =>
    request<SiteFSM>(`/site-fsms/${siteId}/disinfect-time`, {
      method: 'PATCH',
      body: JSON.stringify({ last_disinfect_time }),
    }),
  updateFeedTime: (siteId: number, last_feed_time: string) =>
    request<SiteFSM>(`/site-fsms/${siteId}/feed-time`, {
      method: 'PATCH',
      body: JSON.stringify({ last_feed_time }),
    }),
  updateGiveWaterTime: (siteId: number, last_give_water_time: string) =>
    request<SiteFSM>(`/site-fsms/${siteId}/give-water-time`, {
      method: 'PATCH',
      body: JSON.stringify({ last_give_water_time }),
    }),
  updatePlayTime: (siteId: number, last_play_time: string) =>
    request<SiteFSM>(`/site-fsms/${siteId}/play-time`, {
      method: 'PATCH',
      body: JSON.stringify({ last_play_time }),
    }),
};
