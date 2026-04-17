// WebAuthn 认证 API - 对接 fifu-gateway

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

export interface LoginStartResponse {
  challenge: string;
  rpId: string;
  timeout: number;
  userVerification: string;
  allowCredentials: Array<{
    id: string;
    type: string;
  }>;
}

export interface RegisterStartResponse {
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  challenge: string;
  pubKeyCredParams: Array<{ type: string; alg: number }>;
  timeout: number;
  attestation: string;
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

// ============ WebAuthn Helpers ============

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const padded = base64.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============ Auth API ============

export const authApi = {
  // 开始注册流程
  registerStart: async (username: string): Promise<RegisterStartResponse> => {
    return request<RegisterStartResponse>('/webauthn/register/start', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  // 完成注册流程
  registerFinish: async (
    username: string,
    credential: PublicKeyCredential
  ): Promise<{ status: string }> => {
    const response = credential.response as AuthenticatorAttestationResponse;

    const body = {
      username,
      id: credential.id,
      rawId: arrayBufferToBase64(credential.rawId),
      response: {
        clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
        attestationObject: arrayBufferToBase64(response.attestationObject),
      },
      type: credential.type,
    };

    return request<{ status: string }>('/webauthn/register/finish', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // 开始登录流程
  loginStart: async (username: string): Promise<LoginStartResponse> => {
    return request<LoginStartResponse>('/webauthn/login/start', {
      method: 'POST',
      body: JSON.stringify({ username }),
    });
  },

  // 完成登录流程
  loginFinish: async (
    username: string,
    assertion: PublicKeyCredential,
    challenge: string
  ): Promise<LoginFinishResponse> => {
    const response = assertion.response as AuthenticatorAssertionResponse;

    const body = {
      username,
      id: assertion.id,
      rawId: arrayBufferToBase64(assertion.rawId),
      response: {
        clientDataJSON: arrayBufferToBase64(response.clientDataJSON),
        authenticatorData: arrayBufferToBase64(response.authenticatorData),
        signature: arrayBufferToBase64(response.signature),
        userHandle: response.userHandle
          ? arrayBufferToBase64(response.userHandle)
          : null,
      },
      type: assertion.type,
      challenge,
    };

    return request<LoginFinishResponse>('/webauthn/login/finish', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // 获取用户信息
  getProfile: async (token: string): Promise<ProfileResponse> => {
    return request<ProfileResponse>('/webauthn/profile', { token });
  },
};

// ============ WebAuthn 认证流程封装 ============

export async function webAuthnRegister(username: string): Promise<boolean> {
  try {
    // 1. 开始注册
    const options = await authApi.registerStart(username);

    // 2. 创建凭证
    const credential = (await navigator.credentials.create({
      publicKey: {
        rp: options.rp,
        user: {
          id: base64ToArrayBuffer(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName,
        },
        challenge: base64ToArrayBuffer(options.challenge),
        pubKeyCredParams: options.pubKeyCredParams.map((p) => ({
          type: p.type as 'public-key',
          alg: p.alg,
        })),
        timeout: options.timeout,
        attestation: options.attestation as AttestationConveyancePreference,
      },
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Failed to create credential');
    }

    // 3. 完成注册
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
    // 1. 开始登录
    const options = await authApi.loginStart(username);

    // 2. 获取断言
    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: base64ToArrayBuffer(options.challenge),
        rpId: options.rpId,
        allowCredentials: options.allowCredentials.map((cred) => ({
          id: base64ToArrayBuffer(cred.id),
          type: cred.type as 'public-key',
        })),
        timeout: options.timeout,
        userVerification: options.userVerification as UserVerificationRequirement,
      },
    })) as PublicKeyCredential;

    if (!assertion) {
      throw new Error('Failed to get assertion');
    }

    // 3. 完成登录
    const result = await authApi.loginFinish(
      username,
      assertion,
      options.challenge
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
