<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer" />

        <q-toolbar-title> 猫咪管理系统 </q-toolbar-title>

        <q-space />

        <q-item-label v-if="authStore.user" class="q-mr-md">
          {{ authStore.user.username }}
          <q-badge v-if="authStore.isAdmin" color="warning" label="管理员" class="q-ml-xs" />
        </q-item-label>

        <q-btn flat round dense icon="logout" @click="onLogout">
          <q-tooltip>退出登录</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" bordered>
      <q-list>
        <q-item-label header> 导航 </q-item-label>

        <EssentialLink v-for="link in linksList" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useQuasar } from 'quasar';
import EssentialLink, { type EssentialLinkProps } from 'components/EssentialLink.vue';
import { useAuthStore } from 'src/stores/auth';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const linksList: EssentialLinkProps[] = [
  {
    title: '数据看板',
    caption: '多源数据可视化集中展示工具，用于实时监控指标、辅助业务决策。',
    icon: 'home',
    link: '/',
  },
  {
    title: '操作台',
    caption: '简洁直观的操作界面，快速记录日常操作和事件。',
    icon: 'dashboard_customize',
    link: '/operation',
  },
  {
    title: '数据库管理系统',
    caption: '高效管理数据的存储、查询、更新与删除，同时通过安全性、完整性、并发控制和故障恢复机制，保障数据的一致性与可靠性。',
    icon: 'table_chart',
    link: '/data',
  },
  {
    title: '出入院管理',
    caption: '办理猫咪入院与出院，后端自动完成状态初始化与结算处理。',
    icon: 'local_hospital',
    link: '/hospitalization',
  },
  {
    title: 'Docs',
    caption: 'quasar.dev',
    icon: 'school',
    link: 'https://quasar.dev',
  },
  {
    title: 'Github',
    caption: 'github.com/quasarframework',
    icon: 'code',
    link: 'https://github.com/quasarframework',
  },
];

const leftDrawerOpen = ref(false);

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function onLogout() {
  $q.dialog({
    title: '确认退出',
    message: '确定要退出登录吗？',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    authStore.logout();
    void router.push('/login');
  });
}
</script>
