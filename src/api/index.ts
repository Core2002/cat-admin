const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
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
export interface CatCreate {
  cat_name: string;
  cat_photo_uri: string;
  cat_type: string;
  cat_gender: string;
  master_name: string;
  master_phone_number: string;
}

export interface Cat extends CatCreate {
  cat_id: number;
  created_at: string; // 由后端自动生成
}

export const catApi = {
  list: (page = 1, pageSize = 10) =>
    request<PaginatedResponse<Cat>>(`/cats/page?page=${page}&page_size=${pageSize}`),
  get: (id: number) => request<Cat>(`/cats/${id}`),
  create: (cat: CatCreate) =>
    request<Cat>('/cats', { method: 'POST', body: JSON.stringify(cat) }),
  update: (id: number, cat: Partial<CatCreate>) =>
    request<Cat>(`/cats/${id}`, { method: 'PUT', body: JSON.stringify(cat) }),
  delete: (id: number) => request<void>(`/cats/${id}`, { method: 'DELETE' }),
};

// ============ Site API ============
export interface SiteCreate {
  site_name: string;
  site_address: string;
  site_admin_phone_number: string;
}

export interface Site extends SiteCreate {
  site_id: number;
  created_at: string; // 由后端自动生成
}

export const siteApi = {
  list: (page = 1, pageSize = 10) =>
    request<PaginatedResponse<Site>>(`/sites/page?page=${page}&page_size=${pageSize}`),
  get: (id: number) => request<Site>(`/sites/${id}`),
  create: (site: SiteCreate) =>
    request<Site>('/sites', { method: 'POST', body: JSON.stringify(site) }),
  update: (id: number, site: Partial<SiteCreate>) =>
    request<Site>(`/sites/${id}`, { method: 'PUT', body: JSON.stringify(site) }),
  delete: (id: number) => request<void>(`/sites/${id}`, { method: 'DELETE' }),
};

// ============ Cat Action API ============
export interface CatActionCreate {
  cat_id: number;
  site_id: number;
  user_id: number;
  action_type: string;
  action_detail: string;
}

export interface CatAction extends CatActionCreate {
  action_id: number;
  created_at: string; // 由后端自动生成
}

export const ACTION_TYPES = [
  '测体温',
  '绝育',
  '体检',
  '驱虫',
  '修剪指甲',
  '洗澡',
  '疫苗',
] as const;

export const catActionApi = {
  list: (page = 1, pageSize = 10) =>
    request<PaginatedResponse<CatAction>>(`/cat-actions/page?page=${page}&page_size=${pageSize}`),
  get: (id: number) => request<CatAction>(`/cat-actions/${id}`),
  getByCat: (catId: number) => request<CatAction[]>(`/cat-actions/cat/${catId}`),
  getBySite: (siteId: number) => request<CatAction[]>(`/cat-actions/site/${siteId}`),
  getByUser: (userId: number) => request<CatAction[]>(`/cat-actions/user/${userId}`),
  create: (action: CatActionCreate) =>
    request<{ action: CatAction }>('/cat-actions', { method: 'POST', body: JSON.stringify(action) }),
};

// ============ Cat Event API ============
export interface CatEventCreate {
  event_type: string;
  site_id: number;
  user_id: number;
  cat_id: number;
  detail: string;
}

export interface CatEvent extends CatEventCreate {
  event_id: number;
  created_at: string; // 由后端自动生成
}

export const EVENT_TYPES = ['生病', '受伤', '怀孕', '分娩', '死亡', '合同解除'] as const;

export const catEventApi = {
  list: (page = 1, pageSize = 10) =>
    request<PaginatedResponse<CatEvent>>(`/cat-events/page?page=${page}&page_size=${pageSize}`),
  get: (id: number) => request<CatEvent>(`/cat-events/${id}`),
  getByCat: (catId: number) => request<CatEvent[]>(`/cat-events/cat/${catId}`),
  getBySite: (siteId: number) => request<CatEvent[]>(`/cat-events/site/${siteId}`),
  create: (event: CatEventCreate) =>
    request<{ event: CatEvent }>('/cat-events', { method: 'POST', body: JSON.stringify(event) }),
  update: (id: number, event: Partial<CatEventCreate>) =>
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
    request<PaginatedResponse<CatFSM>>(`/cat-fsms/page?page=${page}&page_size=${pageSize}`),
  get: (id: number) => request<CatFSM>(`/cat-fsms/${id}`),
  getBySite: (siteId: number) => request<CatFSM[]>(`/cat-fsms/site/${siteId}`),
};

// ============ Site FSM API ============
export interface SiteFSM {
  id?: number;
  site_id: number;
  last_disinfect_time: string;
  last_feed_time: string;
  last_give_water_time: string;
  last_play_time: string;
  last_clean_litter_time: string;
}

export const siteFsmApi = {
  list: (page = 1, pageSize = 10) =>
    request<PaginatedResponse<SiteFSM>>(`/site-fsms/page?page=${page}&page_size=${pageSize}`),
  get: (id: number) => request<SiteFSM>(`/site-fsms/${id}`),
  getBySite: (siteId: number) => request<SiteFSM>(`/site-fsms/site/${siteId}`),
};

// ============ Site Action API ============
export type SiteActionType = '消毒' | '喂食' | '喂水' | '逗猫' | '清理猫砂';

export interface SiteActionCreate {
  site_id: number;
  user_id: number;
  action_type: SiteActionType;
  action_detail: string;
}

export interface SiteAction extends SiteActionCreate {
  action_id: number;
  created_at: string; // 由后端自动生成
  updated_at: string; // 由后端自动生成
}

export const SITE_ACTION_TYPES: SiteActionType[] = ['消毒', '喂食', '喂水', '逗猫', '清理猫砂'];

export const siteActionApi = {
  list: (page = 1, pageSize = 10) =>
    request<PaginatedResponse<SiteAction>>(`/site-actions/page?page=${page}&page_size=${pageSize}`),
  get: (id: number) => request<SiteAction>(`/site-actions/${id}`),
  getBySite: (siteId: number) => request<SiteAction[]>(`/site-actions/site/${siteId}`),
  getByUser: (userId: number) => request<SiteAction[]>(`/site-actions/user/${userId}`),
  create: (action: SiteActionCreate) =>
    request<{ action: SiteAction }>('/site-actions', { method: 'POST', body: JSON.stringify(action) }),
};

// ============ Hospitalization API ============

export interface AdmitRequest {
  cat_id: number;
  site_id: number;
  user_id: number;
  admission_reason: string;
  admission_note?: string;
  initial_temperature_c: number;
  initial_weight_kg: number;
}

export interface DischargeRequest {
  cat_id: number;
  user_id: number;
  discharge_reason: string;
  discharge_note?: string;
  final_temperature_c?: number;
  final_weight_kg?: number;
}

export const hospitalizationApi = {
  admit: (payload: AdmitRequest) =>
    request<{ message: string; cat_id: number; site_id: number }>('/hospitalizations/admit', { method: 'POST', body: JSON.stringify(payload) }),
  discharge: (payload: DischargeRequest) =>
    request<{ message: string; cat_id: number }>('/hospitalizations/discharge', { method: 'POST', body: JSON.stringify(payload) }),
};
