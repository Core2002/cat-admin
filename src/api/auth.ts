// WebAuthn 认证 API - 对接 fifu-gateway（使用 SimpleWebAuthn）

import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

const AUTH_BASE = ''; // fifu-gateway 直接在根路径

interface RequestOptions extends RequestInit {
  token?: string;
}

async function request<T>(url: string, options?: RequestOptions): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };

  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const response = await fetch(`${AUTH_BASE}${url}`, {
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

// ============ Types ============

export interface User {
  id: number;
  username: string;
  role: string;
}

export interface LoginFinishResponse {
  status: string;
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
    user: User;
  };
}

export interface ProfileResponse {
  user: User;
  issued_at: string;
  expired_at: string;
}

// ============ Auth API ============

export const authApi = {
  // 开始注册流程 - 返回 SimpleWebAuthn 兼容的 creation options
  registerStart: async (
    username: string
  ): Promise<PublicKeyCredentialCreationOptionsJSON> => {
    return request<PublicKeyCredentialCreationOptionsJSON>(
      '/webauthn/register/start',
      {
        method: 'POST',
        body: JSON.stringify({ username }),
      }
    );
  },

  // 完成注册流程 - 发送完整 RegistrationResponseJSON
  registerFinish: async (
    username: string,
    credential: RegistrationResponseJSON
  ): Promise<{ status: string }> => {
    return request<{ status: string }>('/webauthn/register/finish', {
      method: 'POST',
      body: JSON.stringify({ username, ...credential }),
    });
  },

  // 开始登录流程 - 返回 SimpleWebAuthn 兼容的 request options
  loginStart: async (
    username: string
  ): Promise<PublicKeyCredentialRequestOptionsJSON> => {
    return request<PublicKeyCredentialRequestOptionsJSON>(
      '/webauthn/login/start',
      {
        method: 'POST',
        body: JSON.stringify({ username }),
      }
    );
  },

  // 完成登录流程 - 发送完整 AuthenticationResponseJSON（含 challenge）
  loginFinish: async (
    username: string,
    assertion: AuthenticationResponseJSON,
    challenge: string
  ): Promise<LoginFinishResponse> => {
    return request<LoginFinishResponse>('/webauthn/login/finish', {
      method: 'POST',
      body: JSON.stringify({ username, challenge, ...assertion }),
    });
  },

  // 获取用户信息
  getProfile: async (token: string): Promise<ProfileResponse> => {
    return request<ProfileResponse>('/webauthn/profile', { token });
  },
};

// ============ WebAuthn 认证流程封装 ============

export function isWebAuthnSupported(): boolean {
  return browserSupportsWebAuthn();
}

export async function webAuthnRegister(username: string): Promise<boolean> {
  try {
    // 1. 从服务端获取注册选项
    const optionsJSON = await authApi.registerStart(username);

    // 2. 使用 SimpleWebAuthn 创建凭证（自动处理 navigator.credentials.create 和 base64url 编码）
    const credential = await startRegistration({ optionsJSON });

    // 3. 将 SimpleWebAuthn 格式的响应发送到服务端完成注册
    await authApi.registerFinish(username, credential);
    return true;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

export async function webAuthnLogin(
  username: string
): Promise<LoginFinishResponse['data']> {
  try {
    // 1. 从服务端获取认证选项
    const optionsJSON = await authApi.loginStart(username);

    // 2. 使用 SimpleWebAuthn 获取断言（自动处理 navigator.credentials.get 和 base64url 编码）
    const assertion = await startAuthentication({ optionsJSON });

    // 3. 将断言和 challenge 发送到服务端完成登录
    const result = await authApi.loginFinish(
      username,
      assertion,
      optionsJSON.challenge
    );
    return result.data;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

// ============ Token 管理 ============

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function saveAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
