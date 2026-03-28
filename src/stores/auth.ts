import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import {
  webAuthnLogin,
  webAuthnRegister,
  getStoredToken,
  getStoredUser,
  saveAuth,
  clearAuth,
  authApi,
  type User,
} from 'src/api/auth';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(getStoredToken());
  const user = ref<User | null>(getStoredUser());
  const loading = ref(false);
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function login(username: string) {
    loading.value = true;
    error.value = null;

    try {
      const result = await webAuthnLogin(username);
      token.value = result.access_token;
      user.value = result.user;
      saveAuth(result.access_token, result.user);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '登录失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function register(username: string) {
    loading.value = true;
    error.value = null;

    try {
      await webAuthnRegister(username);
    } catch (e) {
      error.value = e instanceof Error ? e.message : '注册失败';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProfile() {
    if (!token.value) return;

    try {
      const result = await authApi.getProfile(token.value);
      user.value = result.user;
    } catch {
      // Token 可能已过期
      logout();
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    clearAuth();
  }

  return {
    token,
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    register,
    fetchProfile,
    logout,
  };
});
