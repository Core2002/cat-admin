import { defineBoot } from '#q-app/wrappers';
import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

interface RouteMeta {
  requiresAuth?: boolean;
  guest?: boolean;
}

export default defineBoot(({ router }) => {
  const authStore = useAuthStore();

  // 初始化时验证 token
  const authPromise = authStore.fetchProfile();

  router.beforeEach(
    async (
      to: RouteLocationNormalized & { matched: Array<{ meta: RouteMeta }> },
      _from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      // 等待初始化完成
      await authPromise;

      const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);
      const isGuestRoute = to.matched.some((record) => record.meta.guest);

      // 如果需要认证但未登录
      if (requiresAuth && !authStore.isAuthenticated) {
        next('/login');
        return;
      }

      // 如果已登录但访问登录页
      if (isGuestRoute && authStore.isAuthenticated) {
        next('/');
        return;
      }

      next();
    }
  );
});
