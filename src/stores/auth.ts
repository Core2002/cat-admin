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
  const initialized = ref(false);

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
    const storedToken = getStoredToken();
    if (!storedToken) {
      initialized.value = true;
      return;
    }

    try {
      const result = await authApi.getProfile(storedToken);
      token.value = storedToken;
      user.value = result.user;
    } catch {
      // Token 已过期或无效
      logout();
    } finally {
      initialized.value = true;
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
    initialized,
    isAuthenticated,
    isAdmin,
    login,
    register,
    fetchProfile,
    logout,
  };
});
