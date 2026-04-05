<template>
  <q-page class="q-pa-md">
    <!-- 加载状态 -->
    <q-inner-loading :showing="loading" label="加载中..." />

    <!-- 错误提示 -->
    <q-banner v-if="error" class="bg-negative text-white q-mb-md">
      <template v-slot:avatar>
        <q-icon name="error" />
      </template>
      {{ error }}
      <template v-slot:action>
        <q-btn flat color="white" label="重试" @click="loadData" />
      </template>
    </q-banner>

    <template v-if="!loading && !error">
      <!-- 顶部工具栏 -->
      <q-toolbar class="q-px-none q-mb-md">
        <q-toolbar-title class="text-h5 text-weight-bold">数据看板</q-toolbar-title>
        <q-btn flat round icon="refresh" @click="loadData" :loading="loading">
          <q-tooltip>刷新数据</q-tooltip>
        </q-btn>
      </q-toolbar>

      <!-- 统计卡片 -->
      <div class="row q-col-gutter-md q-mb-md">
        <div class="col-6 col-md-3">
          <q-card class="stat-card cursor-pointer" @click="$router.push('/data')">
            <q-card-section class="row items-center">
              <q-icon name="pets" color="primary" size="42px" class="q-mr-md" />
              <div>
                <q-item-label class="text-h4 text-weight-bold">{{ stats.cats }}</q-item-label>
                <q-item-label caption>猫咪总数</q-item-label>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="stat-card cursor-pointer" @click="$router.push('/data')">
            <q-card-section class="row items-center">
              <q-icon name="domain" color="green" size="42px" class="q-mr-md" />
              <div>
                <q-item-label class="text-h4 text-weight-bold">{{ stats.sites }}</q-item-label>
                <q-item-label caption>设施数量</q-item-label>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="stat-card cursor-pointer" @click="$router.push('/data')">
            <q-card-section class="row items-center">
              <q-icon name="medical_services" color="orange" size="42px" class="q-mr-md" />
              <div>
                <q-item-label class="text-h4 text-weight-bold">{{ stats.todayActions }}</q-item-label>
                <q-item-label caption>今日操作</q-item-label>
              </div>
            </q-card-section>
          </q-card>
        </div>
        <div class="col-6 col-md-3">
          <q-card class="stat-card cursor-pointer" @click="$router.push('/data')">
            <q-card-section class="row items-center">
              <q-icon name="warning" color="red" size="42px" class="q-mr-md" />
              <div>
                <q-item-label class="text-h4 text-weight-bold">{{ stats.pendingEvents }}</q-item-label>
                <q-item-label caption>待处理事件</q-item-label>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 图表区域 -->
      <div class="row q-col-gutter-md q-mb-md">
        <!-- 猫咪品种分布 -->
        <div class="col-12 col-md-4">
          <q-card>
            <q-card-section>
              <q-item-label header class="text-h6 q-pa-none">品种分布</q-item-label>
            </q-card-section>
            <q-card-section v-if="breedData.length > 0">
              <q-list dense>
                <q-item v-for="(item, index) in breedData" :key="index">
                  <q-item-section avatar>
                    <q-badge :color="breedColors[index % breedColors.length]" rounded style="width: 12px; height: 12px" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ item.breed }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-item-label>{{ item.count }} 只</q-item-label>
                  </q-item-section>
                  <q-item-section side style="min-width: 80px">
                    <q-linear-progress
                      :value="item.count / maxBreedCount"
                      :color="breedColors[index % breedColors.length]"
                      class="q-ml-sm"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
            <q-card-section v-else class="text-center text-grey">
              暂无数据
            </q-card-section>
          </q-card>
        </div>

        <!-- 性别比例 -->
        <div class="col-12 col-md-4">
          <q-card>
            <q-card-section>
              <q-item-label header class="text-h6 q-pa-none">性别比例</q-item-label>
            </q-card-section>
            <q-card-section v-if="genderData.male + genderData.female > 0" class="text-center">
              <q-circular-progress
                show-value
                font-size="16px"
                :value="genderData.male"
                :max="genderData.male + genderData.female"
                size="120px"
                :thickness="0.2"
                color="blue"
                track-color="pink"
                class="q-my-md"
              >
                {{ genderPercent.male }}%
              </q-circular-progress>
              <q-separator class="q-my-md" />
              <div class="row justify-around">
                <q-chip color="blue" text-color="white" size="md">
                  公: {{ genderData.male }} 只
                </q-chip>
                <q-chip color="pink" text-color="white" size="md">
                  母: {{ genderData.female }} 只
                </q-chip>
              </div>
            </q-card-section>
            <q-card-section v-else class="text-center text-grey">
              暂无数据
            </q-card-section>
          </q-card>
        </div>

        <!-- 操作类型统计 -->
        <div class="col-12 col-md-4">
          <q-card>
            <q-card-section>
              <q-item-label header class="text-h6 q-pa-none">操作类型统计</q-item-label>
            </q-card-section>
            <q-card-section v-if="actionTypeData.length > 0" class="q-pt-none">
              <q-list dense>
                <q-item v-for="(item, index) in actionTypeData" :key="index" class="q-px-none">
                  <q-item-section>
                    <q-item-label>{{ item.type }}</q-item-label>
                    <q-linear-progress
                      :value="item.count / maxActionCount"
                      color="primary"
                      class="q-mt-xs"
                      size="8px"
                    />
                  </q-item-section>
                  <q-item-section side>
                    <q-badge :label="item.count" color="primary" />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
            <q-card-section v-else class="text-center text-grey">
              暂无数据
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 最近活动 -->
      <div class="row q-col-gutter-md">
        <!-- 最近操作记录 -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section class="row items-center justify-between q-pb-none">
              <q-item-label header class="text-h6 q-pa-none">最近操作记录</q-item-label>
              <q-btn flat dense color="primary" label="查看更多" to="/data" />
            </q-card-section>
            <q-separator />
            <q-list separator v-if="recentActions.length > 0">
              <q-item
                v-for="action in recentActions"
                :key="action.action_id"
                clickable
                v-ripple
                @click="showActionDetail(action)"
              >
                <q-item-section avatar>
                  <q-avatar :color="getActionColor(action.action_type)" text-color="white" size="36px">
                    <q-icon :name="getActionIcon(action.action_type)" size="20px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    <q-badge :color="getActionColor(action.action_type)" :label="action.action_type" class="q-mr-xs" />
                    {{ getCatName(action.cat_id) }}
                  </q-item-label>
                  <q-item-label caption>{{ formatTime(action.created_at) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" color="grey" />
                </q-item-section>
              </q-item>
            </q-list>
            <q-card-section v-else class="text-center text-grey q-py-lg">
              暂无操作记录
            </q-card-section>
          </q-card>
        </div>

        <!-- 最近事件记录 -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section class="row items-center justify-between q-pb-none">
              <q-item-label header class="text-h6 q-pa-none">最近事件记录</q-item-label>
              <q-btn flat dense color="primary" label="查看更多" to="/data" />
            </q-card-section>
            <q-separator />
            <q-list separator v-if="recentEvents.length > 0">
              <q-item
                v-for="event in recentEvents"
                :key="event.event_id"
                clickable
                v-ripple
                @click="showEventDetail(event)"
              >
                <q-item-section avatar>
                  <q-avatar :color="getEventColor(event.event_type)" text-color="white" size="36px">
                    <q-icon :name="getEventIcon(event.event_type)" size="20px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label>
                    <q-badge :color="getEventColor(event.event_type)" :label="event.event_type" class="q-mr-xs" />
                    {{ getCatName(event.cat_id) }}
                  </q-item-label>
                  <q-item-label caption>{{ event.detail || '无详情' }}</q-item-label>
                  <q-item-label caption>{{ formatTime(event.created_at) }}</q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-icon name="chevron_right" color="grey" />
                </q-item-section>
              </q-item>
            </q-list>
            <q-card-section v-else class="text-center text-grey q-py-lg">
              暂无事件记录
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 状态监控 -->
      <q-slide-transition>
        <div v-if="alertCats.length > 0" class="q-mt-md">
          <q-card class="bg-orange-1">
            <q-card-section>
              <q-item-label header class="text-h6 text-orange-8 q-pa-none">
                <q-icon name="notification_important" class="q-mr-sm" />
                需要关注的猫咪
              </q-item-label>
            </q-card-section>
            <q-separator />
            <q-card-section>
              <div class="row q-col-gutter-sm">
                <div class="col-12 col-sm-6 col-md-4" v-for="cat in alertCats" :key="cat.cat_id">
                  <q-card flat bordered>
                    <q-card-section horizontal>
                      <q-avatar size="60px" class="q-ma-sm">
                        <img v-if="cat.cat_photo_uri" :src="cat.cat_photo_uri" />
                        <q-icon v-else name="pets" color="grey" size="40px" />
                      </q-avatar>
                      <q-card-section class="q-pt-xs">
                        <div class="text-weight-bold">{{ cat.cat_name }}</div>
                        <div class="text-caption text-grey">{{ cat.cat_type }} · {{ cat.cat_gender }}</div>
                        <div v-if="cat.alert" class="text-caption text-orange-8 q-mt-xs">
                          <q-icon name="warning" size="16px" />
                          {{ cat.alert }}
                        </div>
                      </q-card-section>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-slide-transition>

      <!-- 空数据提示 -->
      <div v-if="cats.length === 0 && sites.length === 0" class="row q-mt-lg">
        <div class="col-12">
          <q-card class="text-center q-pa-xl">
            <q-icon name="pets" color="grey-5" size="80px" />
            <div class="text-h6 text-grey-7 q-mt-md">暂无数据</div>
            <div class="text-body2 text-grey q-mt-sm">请先添加猫咪和设施数据</div>
            <q-btn color="primary" label="前往数据管理" to="/data" class="q-mt-md" />
          </q-card>
        </div>
      </div>
    </template>

    <!-- 详情对话框 -->
    <q-dialog
      v-model="detailDialog.show"
      seamless
      position="standard"
      @show="onDialogShow"
      @before-hide="onBeforeHide"
    >
      <q-card style="min-width: 400px; max-width: 600px; box-shadow: 0 8px 32px rgba(0,0,0,0.3)">
        <q-card-section class="row items-center q-pb-none">
          <q-item-label header class="text-h6 q-pa-none">{{ detailDialog.title }}</q-item-label>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section>
          <!-- 操作记录详情 -->
          <template v-if="detailDialog.type === 'action' && actionData">
            <q-badge :color="getActionColor(actionData.action_type)" :label="actionData.action_type" class="q-mb-md" />

            <q-markup-table flat bordered dense separator="cell" class="q-mb-md">
              <tbody>
                <tr>
                  <td class="text-grey" style="width: 100px">猫咪</td>
                  <td>{{ getCatName(actionData.cat_id) }}</td>
                </tr>
                <tr>
                  <td class="text-grey">设施</td>
                  <td>{{ getSiteName(actionData.site_id) }}</td>
                </tr>
                <tr>
                  <td class="text-grey">时间</td>
                  <td>{{ formatTime(actionData.created_at) }}</td>
                </tr>
              </tbody>
            </q-markup-table>

            <q-separator class="q-mb-md" />
            <q-item-label caption class="q-mb-sm">详细信息</q-item-label>
            <q-markup-table flat bordered dense class="bg-grey-2">
              <tbody>
                <tr v-for="(item, index) in formatActionDetail(actionData.action_detail)" :key="index">
                  <td class="text-grey" style="width: 100px">{{ item.label }}</td>
                  <td>{{ item.value }}</td>
                </tr>
                <tr v-if="formatActionDetail(actionData.action_detail).length === 0">
                  <td colspan="2" class="text-center text-grey">暂无详细信息</td>
                </tr>
              </tbody>
            </q-markup-table>
          </template>

          <!-- 事件记录详情 -->
          <template v-else-if="detailDialog.type === 'event' && eventData">
            <q-badge :color="getEventColor(eventData.event_type)" :label="eventData.event_type" class="q-mb-md" />

            <q-markup-table flat bordered dense separator="cell" class="q-mb-md">
              <tbody>
                <tr>
                  <td class="text-grey" style="width: 100px">猫咪</td>
                  <td>{{ getCatName(eventData.cat_id) }}</td>
                </tr>
                <tr>
                  <td class="text-grey">设施</td>
                  <td>{{ getSiteName(eventData.site_id) }}</td>
                </tr>
                <tr>
                  <td class="text-grey">时间</td>
                  <td>{{ formatTime(eventData.created_at) }}</td>
                </tr>
              </tbody>
            </q-markup-table>

            <q-separator class="q-mb-md" />
            <q-item-label caption class="q-mb-sm">详情</q-item-label>
            <q-card flat bordered class="bg-grey-2">
              <q-card-section>
                {{ eventData.detail || '暂无详细信息' }}
              </q-card-section>
            </q-card>
          </template>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="关闭" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { catApi, siteApi, catActionApi, catEventApi, catFsmApi, type Cat, type CatAction, type CatEvent, type CatFSM } from 'src/api';

const $q = useQuasar();
const loading = ref(true);
const error = ref<string | null>(null);

// 详情对话框
const detailDialog = ref<{
  show: boolean;
  type: 'action' | 'event' | null;
  title: string;
}>({
  show: false,
  type: null,
  title: '',
});
const actionData = ref<CatAction | null>(null);
const eventData = ref<CatEvent | null>(null);

// 数据
const cats = ref<Cat[]>([]);
const sites = ref<{ site_id: number; site_name: string }[]>([]);
const actions = ref<CatAction[]>([]);
const events = ref<CatEvent[]>([]);
const catFsms = ref<CatFSM[]>([]);

// 统计数据
const stats = ref({
  cats: 0,
  sites: 0,
  todayActions: 0,
  pendingEvents: 0,
});

// 品种数据
const breedColors = ['primary', 'green', 'orange', 'purple', 'blue', 'red', 'teal', 'pink'];

const breedData = computed(() => {
  const breedMap = new Map<string, number>();
  cats.value.forEach((cat) => {
    const count = breedMap.get(cat.cat_type) || 0;
    breedMap.set(cat.cat_type, count + 1);
  });
  const data = Array.from(breedMap.entries())
    .map(([breed, count]) => ({ breed, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  return data;
});

const maxBreedCount = computed(() => {
  return Math.max(...breedData.value.map((d) => d.count), 1);
});

// 性别数据
const genderData = computed(() => {
  let male = 0;
  let female = 0;
  cats.value.forEach((cat) => {
    if (cat.cat_gender === '公') male++;
    else if (cat.cat_gender === '母') female++;
  });
  return { male, female };
});

const genderPercent = computed(() => {
  const total = genderData.value.male + genderData.value.female;
  if (total === 0) return { male: 0, female: 0 };
  return {
    male: Math.round((genderData.value.male / total) * 100),
    female: Math.round((genderData.value.female / total) * 100),
  };
});

// 操作类型数据
const actionTypeData = computed(() => {
  const typeMap = new Map<string, number>();
  actions.value.forEach((action) => {
    const count = typeMap.get(action.action_type) || 0;
    typeMap.set(action.action_type, count + 1);
  });
  return Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
});

const maxActionCount = computed(() => {
  return Math.max(...actionTypeData.value.map((d) => d.count), 1);
});

// 最近操作记录
const recentActions = computed(() => {
  return [...actions.value].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
});

// 最近事件记录
const recentEvents = computed(() => {
  return [...events.value].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
});

// 需要关注的猫咪
const alertCats = computed(() => {
  const alerts: (Cat & { alert?: string })[] = [];

  // 检查体温异常
  catFsms.value.forEach((fsm) => {
    const cat = cats.value.find((c) => c.cat_id === fsm.cat_id);
    if (cat) {
      if (fsm.temperature_c > 39.5 || fsm.temperature_c < 37.5) {
        alerts.push({
          ...cat,
          alert: `体温异常: ${fsm.temperature_c}°C`,
        });
      }
    }
  });

  // 检查最近事件（生病、受伤）
  const recentProblemEvents = events.value.filter(
    (e) =>
      (e.event_type === '生病' || e.event_type === '受伤') &&
      Date.now() - new Date(e.created_at).getTime() < 7 * 24 * 60 * 60 * 1000
  );

  recentProblemEvents.forEach((event) => {
    const cat = cats.value.find((c) => c.cat_id === event.cat_id);
    if (cat && !alerts.find((a) => a.cat_id === cat.cat_id)) {
      alerts.push({
        ...cat,
        alert: `${event.event_type}中`,
      });
    }
  });

  return alerts.slice(0, 6);
});

// 获取猫咪名称
function getCatName(catId: number) {
  const cat = cats.value.find((c) => c.cat_id === catId);
  return cat?.cat_name || `猫咪 #${catId}`;
}

// 格式化时间
function formatTime(timeStr: string) {
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小时前`;
  if (diff < 7 * 24 * 60 * 60 * 1000) return `${Math.floor(diff / 86400000)} 天前`;

  return date.toLocaleDateString('zh-CN');
}

// 获取操作类型颜色
function getActionColor(type: string) {
  const colors: Record<string, string> = {
    测体温: 'blue',
    绝育: 'red',
    体检: 'green',
    驱虫: 'purple',
    修剪指甲: 'orange',
    洗澡: 'cyan',
    疫苗: 'teal',
  };
  return colors[type] || 'grey';
}

// 获取操作类型图标
function getActionIcon(type: string) {
  const icons: Record<string, string> = {
    测体温: 'thermostat',
    绝育: 'content_cut',
    体检: 'medical_services',
    驱虫: 'pest_control',
    修剪指甲: 'content_cut',
    洗澡: 'bathtub',
    疫苗: 'vaccines',
  };
  return icons[type] || 'build';
}

// 获取事件类型颜色
function getEventColor(type: string) {
  const colors: Record<string, string> = {
    生病: 'red',
    受伤: 'orange',
    怀孕: 'pink',
    分娩: 'purple',
    死亡: 'grey',
    合同解除: 'blue',
  };
  return colors[type] || 'grey';
}

// 获取事件类型图标
function getEventIcon(type: string) {
  const icons: Record<string, string> = {
    生病: 'local_hospital',
    受伤: 'healing',
    怀孕: 'pregnant_woman',
    分娩: 'child_care',
    死亡: 'heart_broken',
    合同解除: 'assignment_return',
  };
  return icons[type] || 'event';
}

// 获取设施名称
function getSiteName(siteId: number) {
  const site = sites.value.find((s) => s.site_id === siteId);
  return site?.site_name || `设施 #${siteId}`;
}

// 格式化操作详情为友好显示
function formatActionDetail(data: string | undefined): { label: string; value: string }[] {
  if (!data) return [];

  try {
    const obj = typeof data === 'string' ? JSON.parse(data) : data;
    const items: { label: string; value: string }[] = [];

    // 字段映射
    const fieldMap: Record<string, { label: string; unit: string }> = {
      temperature: { label: '体温', unit: '°C' },
      temperature_c: { label: '体温', unit: '°C' },
      weight: { label: '体重', unit: 'kg' },
      weight_kg: { label: '体重', unit: 'kg' },
      drug_name: { label: '药物名称', unit: '' },
      dosage: { label: '剂量', unit: '' },
      vaccine_name: { label: '疫苗名称', unit: '' },
      batch_number: { label: '批号', unit: '' },
      note: { label: '备注', unit: '' },
    };

    // 遍历对象并格式化
    for (const [key, value] of Object.entries(obj)) {
      const field = fieldMap[key] || { label: key, unit: '' };
      items.push({
        label: field.label,
        value: `${String(value)}${field.unit}`,
      });
    }

    return items;
  } catch {
    return [{ label: '详情', value: data }];
  }
}

// 显示操作详情
function showActionDetail(action: CatAction) {
  actionData.value = action;
  eventData.value = null;
  detailDialog.value = {
    show: true,
    type: 'action',
    title: action.action_type,
  };
}

// 显示事件详情
function showEventDetail(event: CatEvent) {
  actionData.value = null;
  eventData.value = event;
  detailDialog.value = {
    show: true,
    type: 'event',
    title: event.event_type,
  };
}

// 对话框显示后立即管理焦点
function onDialogShow() {
  // seamless 模式下没有背景层，直接设置焦点到关闭按钮
  const closeBtn = document.querySelector('.q-dialog__inner .q-btn') as HTMLElement;
  if (closeBtn) {
    closeBtn.focus();
  }
}

// 对话框关闭前移除焦点
function onBeforeHide() {
  // 将焦点移到 body，避免 aria-hidden 警告
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
  // 确保焦点完全移除
  document.body.focus();
}

// 加载数据
async function loadData() {
  loading.value = true;
  error.value = null;
  
  try {
    // 并行加载所有数据
    const [catsRes, sitesRes, actionsRes, eventsRes, fsmsRes] = await Promise.all([
      catApi.list(1, 100).catch((e) => {
        console.error('加载猫咪数据失败:', e);
        return { data: [] as Cat[], total: 0, page: 1, page_size: 0 };
      }),
      siteApi.list(1, 100).catch((e) => {
        console.error('加载设施数据失败:', e);
        return { data: [] as { site_id: number; site_name: string }[], total: 0, page: 1, page_size: 0 };
      }),
      catActionApi.list(1, 100).catch((e) => {
        console.error('加载操作记录失败:', e);
        return { data: [] as CatAction[], total: 0, page: 1, page_size: 0 };
      }),
      catEventApi.list(1, 100).catch((e) => {
        console.error('加载事件记录失败:', e);
        return { data: [] as CatEvent[], total: 0, page: 1, page_size: 0 };
      }),
      catFsmApi.list(1, 100).catch((e) => {
        console.error('加载猫咪状态失败:', e);
        return { data: [] as CatFSM[], total: 0, page: 1, page_size: 0 };
      }),
    ]);

    console.log('API 响应数据:', { catsRes, sitesRes, actionsRes, eventsRes, fsmsRes });

    cats.value = catsRes.data || [];
    sites.value = sitesRes.data || [];
    actions.value = actionsRes.data || [];
    events.value = eventsRes.data || [];
    catFsms.value = fsmsRes.data || [];

    // 计算统计数据
    stats.value.cats = catsRes.total || cats.value.length;
    stats.value.sites = sitesRes.total || sites.value.length;

    // 今日操作
    const today = new Date().toDateString();
    stats.value.todayActions = actions.value.filter(
      (a) => a.created_at && new Date(a.created_at).toDateString() === today
    ).length;

    // 待处理事件（最近7天的事件）
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    stats.value.pendingEvents = events.value.filter(
      (e) => e.created_at && new Date(e.created_at).getTime() > weekAgo
    ).length;

    console.log('统计数据:', stats.value);
  } catch (e) {
    console.error('加载数据失败:', e);
    error.value = e instanceof Error ? e.message : '加载数据失败，请重试';
    $q.notify({
      type: 'negative',
      message: error.value,
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadData();
});
</script>

<style lang="scss" scoped>
.stat-card {
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.cursor-pointer {
  cursor: pointer;
}
</style>
