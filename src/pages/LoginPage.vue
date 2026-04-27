<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="app-page flex flex-center bg-grey-2">
        <q-card class="q-pa-lg login-card">
          <q-card-section class="text-center">
            <q-icon name="pets" size="64px" color="primary" />
            <q-item-label class="text-h5 q-mt-md">猫咪管理系统</q-item-label>
            <q-item-label class="text-grey q-mt-sm">使用通行密钥登录</q-item-label>
          </q-card-section>

          <q-separator class="q-my-md" />

          <q-card-section>
            <q-form @submit="onSubmit" class="q-gutter-md">
              <q-input
                v-model="username"
                label="用户名"
                outlined
                dense
                :rules="[(v) => !!v || '请输入用户名']"
                :disable="loading"
              />

              <q-banner
                v-if="error"
                class="bg-negative text-white"
                dense
                rounded
              >
                <q-icon name="error" class="q-mr-sm" />
                {{ error }}
              </q-banner>

              <q-banner
                v-if="!webAuthnSupported"
                class="bg-warning"
                dense
                rounded
              >
                <q-icon name="warning" class="q-mr-sm" />
                您的浏览器不支持通行密钥，请使用现代浏览器
              </q-banner>

              <q-btn
                type="submit"
                color="primary"
                label="登录"
                unelevated
                class="full-width"
                :loading="loading"
                :disable="!webAuthnSupported"
              />

              <q-btn
                flat
                color="primary"
                label="注册新账户"
                class="full-width"
                :loading="loading"
                @click="onRegister"
              />
            </q-form>
          </q-card-section>

          <q-card-section class="text-center">
            <q-item-label class="text-caption text-grey">
              通行密钥 (Passkey) 是一种安全、便捷的无密码认证方式
            </q-item-label>
          </q-card-section>
        </q-card>

        <!-- 注册对话框 -->
        <q-dialog v-model="registerDialog" persistent>
          <q-card class="register-card">
            <q-card-section class="row items-center bg-primary text-white">
              <q-item-label class="text-h6 text-white">注册新账户</q-item-label>
              <q-space />
              <q-btn flat round dense icon="close" v-close-popup />
            </q-card-section>

            <q-card-section class="q-pt-md">
              <q-form @submit="onRegisterSubmit" class="q-gutter-md">
                <q-input
                  v-model="registerUsername"
                  label="用户名"
                  outlined
                  dense
                  :rules="[(v) => !!v || '请输入用户名', (v) => v.length >= 3 || '用户名至少3个字符']"
                  :disable="loading"
                />

                <q-banner class="bg-info" dense rounded>
                  <q-icon name="info" class="q-mr-sm" />
                  注册后系统将提示您创建通行密钥
                </q-banner>

                <q-card-actions align="right" class="q-px-none">
                  <q-btn flat label="取消" v-close-popup />
                  <q-btn
                    type="submit"
                    color="primary"
                    label="注册"
                    unelevated
                    :loading="loading"
                  />
                </q-card-actions>
              </q-form>
            </q-card-section>
          </q-card>
        </q-dialog>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import { isWebAuthnSupported } from 'src/api/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const loading = ref(false);
const error = ref('');
const webAuthnSupported = ref(false);

const registerDialog = ref(false);
const registerUsername = ref('');

onMounted(() => {
  webAuthnSupported.value = isWebAuthnSupported();
});

async function onSubmit() {
  if (!username.value) return;

  loading.value = true;
  error.value = '';

  try {
    await authStore.login(username.value);
    $q.notify({
      type: 'positive',
      message: '登录成功',
      icon: 'check_circle',
    });
    void router.push('/');
  } catch (e) {
    error.value = e instanceof Error ? e.message : '登录失败';
  } finally {
    loading.value = false;
  }
}

function onRegister() {
  registerUsername.value = username.value;
  registerDialog.value = true;
}

async function onRegisterSubmit() {
  if (!registerUsername.value || registerUsername.value.length < 3) return;

  loading.value = true;

  try {
    await authStore.register(registerUsername.value);
    registerDialog.value = false;
    $q.notify({
      type: 'positive',
      message: '注册成功，请使用新账户登录',
      icon: 'check_circle',
    });
    username.value = registerUsername.value;
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: e instanceof Error ? e.message : '注册失败',
      icon: 'error',
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-card,
.register-card {
  width: min(420px, 92vw);
}
</style>
