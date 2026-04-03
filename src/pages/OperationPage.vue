<template>
  <q-page class="q-pa-md">
    <!-- 加载状态 -->
    <q-inner-loading :showing="loading">
      <q-spinner-gears size="50px" color="primary" />
    </q-inner-loading>

    <!-- 主内容 -->
    <div v-if="!loading">
      <!-- 顶部标题 -->
      <div class="text-h4 text-weight-bold q-mb-md">
        <q-icon name="dashboard_customize" class="q-mr-sm" />
        操作台
      </div>

      <!-- 选择区域 -->
      <div class="row q-col-gutter-md q-mb-lg">
        <!-- 选择设施 -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6">
                <q-icon name="domain" class="q-mr-sm" />
                选择工作地点
              </div>
            </q-card-section>
            <q-card-section class="q-pt-none">
              <q-select
                v-model="selectedSite"
                :options="siteOptions"
                label="请选择设施"
                outlined
                map-options
                emit-value
                @update:model-value="onSiteChange"
              >
                <template v-slot:prepend>
                  <q-icon name="store" />
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">暂无设施数据</q-item-section>
                  </q-item>
                </template>
              </q-select>
            </q-card-section>
          </q-card>
        </div>

        <!-- 选择猫咪 -->
        <div class="col-12 col-md-6">
          <q-card>
            <q-card-section>
              <div class="text-h6">
                <q-icon name="pets" class="q-mr-sm" />
                选择猫咪
              </div>
            </q-card-section>
            <q-card-section class="q-pt-none">
              <q-select
                v-model="selectedCat"
                :options="catOptions"
                label="请选择猫咪"
                outlined
                map-options
                emit-value
                :disable="!selectedSite"
              >
                <template v-slot:prepend>
                  <q-icon name="pets" />
                </template>
                <template v-slot:no-option>
                  <q-item>
                    <q-item-section class="text-grey">请先选择设施</q-item-section>
                  </q-item>
                </template>
              </q-select>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- 快捷操作区域 -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="flash_on" class="q-mr-sm" />
            快捷操作
          </div>
          <div class="text-caption text-grey q-mb-md">
            点击下方按钮快速记录日常操作
          </div>

          <!-- 设施操作 -->
          <div class="text-subtitle2 text-grey q-mb-sm">设施操作</div>
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="blue"
                size="lg"
                :disable="!selectedSite"
                @click="quickAction('feed')"
              >
                <div class="column items-center">
                  <q-icon name="restaurant" size="32px" />
                  <div class="q-mt-xs">喂食</div>
                </div>
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="cyan"
                size="lg"
                :disable="!selectedSite"
                @click="quickAction('water')"
              >
                <div class="column items-center">
                  <q-icon name="water_drop" size="32px" />
                  <div class="q-mt-xs">喂水</div>
                </div>
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="green"
                size="lg"
                :disable="!selectedSite"
                @click="quickAction('disinfect')"
              >
                <div class="column items-center">
                  <q-icon name="cleaning_services" size="32px" />
                  <div class="q-mt-xs">消毒清洁</div>
                </div>
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="purple"
                size="lg"
                :disable="!selectedSite"
                @click="quickAction('play')"
              >
                <div class="column items-center">
                  <q-icon name="sports_esports" size="32px" />
                  <div class="q-mt-xs">互动玩耍</div>
                </div>
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="brown"
                size="lg"
                :disable="!selectedSite"
                @click="quickAction('litter')"
              >
                <div class="column items-center">
                  <q-icon name="delete_outline" size="32px" />
                  <div class="q-mt-xs">清理猫砂</div>
                </div>
              </q-btn>
            </div>
          </div>

          <!-- 猫咪操作 -->
          <div class="text-subtitle2 text-grey q-mb-sm">猫咪操作</div>
          <div class="row q-col-gutter-sm">
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="orange"
                size="lg"
                :disable="!selectedCat"
                @click="openActionDialog('测体温')"
              >
                <div class="column items-center">
                  <q-icon name="thermostat" size="32px" />
                  <div class="q-mt-xs">测体温</div>
                </div>
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="amber"
                size="lg"
                :disable="!selectedCat"
                @click="quickAction('weight')"
              >
                <div class="column items-center">
                  <q-icon name="monitor_weight" size="32px" />
                  <div class="q-mt-xs">称体重</div>
                </div>
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="pink"
                size="lg"
                :disable="!selectedCat"
                @click="quickAction('nails')"
              >
                <div class="column items-center">
                  <q-icon name="content_cut" size="32px" />
                  <div class="q-mt-xs">修剪指甲</div>
                </div>
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="teal"
                size="lg"
                :disable="!selectedCat"
                @click="quickAction('bath')"
              >
                <div class="column items-center">
                  <q-icon name="bathtub" size="32px" />
                  <div class="q-mt-xs">洗澡</div>
                </div>
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="indigo"
                size="lg"
                :disable="!selectedCat"
                @click="quickAction('deworm')"
              >
                <div class="column items-center">
                  <q-icon name="pest_control" size="32px" />
                  <div class="q-mt-xs">驱虫</div>
                </div>
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="red"
                size="lg"
                :disable="!selectedCat"
                @click="quickAction('vaccine')"
              >
                <div class="column items-center">
                  <q-icon name="vaccines" size="32px" />
                  <div class="q-mt-xs">打疫苗</div>
                </div>
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="light-green"
                size="lg"
                :disable="!selectedCat"
                @click="quickAction('checkup')"
              >
                <div class="column items-center">
                  <q-icon name="medical_services" size="32px" />
                  <div class="q-mt-xs">体检</div>
                </div>
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="deep-orange"
                size="lg"
                :disable="!selectedCat"
                @click="quickAction('neuter')"
              >
                <div class="column items-center">
                  <q-icon name="pets" size="32px" />
                  <div class="q-mt-xs">绝育</div>
                </div>
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- 事件记录 -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="text-h6 q-mb-md">
            <q-icon name="event_note" class="q-mr-sm" />
            记录事件
          </div>
          <div class="text-caption text-grey q-mb-md">
            记录猫咪特殊情况（生病、受伤等）
          </div>
          <div class="row q-col-gutter-sm">
            <div class="col-6 col-sm-4 col-md-2">
              <q-btn
                outline
                class="full-width"
                color="red"
                :disable="!selectedCat"
                @click="openEventDialog('生病')"
              >
                <q-icon name="local_hospital" class="q-mr-xs" />
                生病
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-2">
              <q-btn
                outline
                class="full-width"
                color="orange"
                :disable="!selectedCat"
                @click="openEventDialog('受伤')"
              >
                <q-icon name="healing" class="q-mr-xs" />
                受伤
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-2">
              <q-btn
                outline
                class="full-width"
                color="pink"
                :disable="!selectedCat"
                @click="openEventDialog('怀孕')"
              >
                <q-icon name="pregnant_woman" class="q-mr-xs" />
                怀孕
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-2">
              <q-btn
                outline
                class="full-width"
                color="purple"
                :disable="!selectedCat"
                @click="openEventDialog('分娩')"
              >
                <q-icon name="child_care" class="q-mr-xs" />
                分娩
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-2">
              <q-btn
                outline
                class="full-width"
                color="grey"
                :disable="!selectedCat"
                @click="openEventDialog('死亡')"
              >
                <q-icon name="heart_broken" class="q-mr-xs" />
                死亡
              </q-btn>
            </div>
            <div class="col-6 col-sm-4 col-md-2">
              <q-btn
                outline
                class="full-width"
                color="blue"
                :disable="!selectedCat"
                @click="openEventDialog('合同解除')"
              >
                <q-icon name="assignment_return" class="q-mr-xs" />
                合同解除
              </q-btn>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- 今日操作记录 -->
      <q-card>
        <q-card-section>
          <div class="row items-center justify-between">
            <div class="text-h6">
              <q-icon name="history" class="q-mr-sm" />
              今日操作记录
            </div>
            <q-btn
              flat
              dense
              color="primary"
              icon="refresh"
              label="刷新"
              @click="loadTodayRecords"
            />
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section v-if="todayRecords.length > 0">
          <q-list separator>
            <q-item v-for="record in todayRecords" :key="record.id">
              <q-item-section avatar>
                <q-avatar :color="record.color" text-color="white" size="40px">
                  <q-icon :name="record.icon" />
                </q-avatar>
              </q-item-section>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ record.title }}</q-item-label>
                <q-item-label caption>{{ record.subtitle }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-item-label caption>{{ record.time }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-section v-else class="text-center text-grey q-py-lg">
          <q-icon name="event_busy" size="48px" color="grey-4" />
          <div class="q-mt-sm">今日暂无操作记录</div>
        </q-card-section>
      </q-card>
    </div>

    <!-- 测体温对话框 -->
    <q-dialog v-model="temperatureDialog.show">
      <q-card style="min-width: 300px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            <q-icon name="thermostat" class="q-mr-sm" />
            记录体温
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="temperatureDialog.value"
            type="number"
            label="体温 (°C)"
            outlined
            suffix="°C"
            :rules="[(val: number) => val >= 35 && val <= 45 || '请输入合理体温(35-45°C)']"
          >
            <template v-slot:hint>
              正常体温范围: 37.5°C - 39.5°C
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn
            unelevated
            color="primary"
            label="确认记录"
            @click="submitTemperature"
            :loading="temperatureDialog.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- 事件详情对话框 -->
    <q-dialog v-model="eventDialog.show">
      <q-card style="min-width: 300px">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            <q-icon :name="getEventIcon(eventDialog.type)" class="q-mr-sm" />
            记录{{ eventDialog.type }}
          </div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="eventDialog.detail"
            type="textarea"
            label="详细说明"
            outlined
            rows="3"
            :placeholder="getEventPlaceholder(eventDialog.type)"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="取消" v-close-popup />
          <q-btn
            unelevated
            color="primary"
            label="确认记录"
            @click="submitEvent"
            :loading="eventDialog.loading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import {
  catApi,
  siteApi,
  catActionApi,
  catEventApi,
  catFsmApi,
  siteFsmApi,
  type Cat,
  type Site,
} from 'src/api';
import { useAuthStore } from 'src/stores/auth';

const $q = useQuasar();
const authStore = useAuthStore();

// 加载状态
const loading = ref(true);

// 数据
const sites = ref<Site[]>([]);
const cats = ref<Cat[]>([]);
const selectedSite = ref<number | null>(null);
const selectedCat = ref<number | null>(null);

// 设施选项
const siteOptions = computed(() =>
  sites.value.map((s) => ({ label: s.site_name, value: s.site_id }))
);

// 猫咪选项
const catOptions = computed(() => {
  if (!selectedSite.value) return [];
  // 显示所有猫咪（可根据需要添加设施筛选逻辑）
  return cats.value.map((c) => ({
    label: c.cat_name,
    value: c.cat_id,
  }));
});

// 今日记录
interface TodayRecord {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  icon: string;
  color: string;
}
const todayRecords = ref<TodayRecord[]>([]);

// 测体温对话框
const temperatureDialog = ref({
  show: false,
  value: 38.5,
  loading: false,
});

// 事件对话框
const eventDialog = ref({
  show: false,
  type: '',
  detail: '',
  loading: false,
});

// 设施变化时清空猫咪选择
function onSiteChange() {
  selectedCat.value = null;
}

// 快捷操作
function quickAction(action: string) {
  // 设施操作只需要选择设施
  const isFacilityAction = ['feed', 'water', 'disinfect', 'play', 'litter'].includes(action);

  if (isFacilityAction && !selectedSite.value) {
    $q.notify({
      type: 'warning',
      message: '请先选择设施',
      position: 'top',
    });
    return;
  }

  if (!isFacilityAction && (!selectedSite.value || !selectedCat.value)) {
    $q.notify({
      type: 'warning',
      message: '请先选择设施和猫咪',
      position: 'top',
    });
    return;
  }

  let title = '';

  switch (action) {
    case 'feed':
      title = '喂食';
      break;
    case 'water':
      title = '喂水';
      break;
    case 'disinfect':
      title = '消毒清洁';
      break;
    case 'play':
      title = '互动玩耍';
      break;
    case 'litter':
      title = '清理猫砂';
      break;
    case 'weight':
      openWeightDialog();
      return;
    case 'nails':
      title = '修剪指甲';
      break;
    case 'bath':
      title = '洗澡';
      break;
    case 'deworm':
      title = '驱虫';
      break;
    case 'vaccine':
      title = '打疫苗';
      break;
    case 'checkup':
      title = '体检';
      break;
    case 'neuter':
      title = '绝育';
      break;
  }

  // 确认对话框
  $q.dialog({
    title: '确认操作',
    message: `确定要记录"${title}"吗？`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        const now = toLocalISOString(new Date());

        // 设施操作 - 使用专门的 PATCH API
        if (isFacilityAction && selectedSite.value) {
          if (action === 'feed') {
            await siteFsmApi.updateFeedTime(selectedSite.value, now);
          } else if (action === 'water') {
            await siteFsmApi.updateGiveWaterTime(selectedSite.value, now);
          } else if (action === 'disinfect') {
            await siteFsmApi.updateDisinfectTime(selectedSite.value, now);
          } else if (action === 'play') {
            await siteFsmApi.updatePlayTime(selectedSite.value, now);
          } else if (action === 'litter') {
            await siteFsmApi.updateCleanLitterTime(selectedSite.value, now);
          }
        }

        // 猫咪操作
        if (!isFacilityAction && selectedCat.value && selectedSite.value) {
          const actionTypeMap: Record<string, string> = {
            nails: '修剪指甲',
            bath: '洗澡',
            deworm: '驱虫',
            vaccine: '疫苗',
            checkup: '体检',
            neuter: '绝育',
          };

          if (actionTypeMap[action]) {
            await catActionApi.create({
              cat_id: selectedCat.value,
              site_id: selectedSite.value,
              user_id: authStore.user?.id || 0,
              action_type: actionTypeMap[action],
              action_detail: JSON.stringify({ note: '通过操作台快速记录' }),
            });
          }
        }

        $q.notify({
          type: 'positive',
          message: `${title}已记录`,
          icon: 'check_circle',
          position: 'top',
        });

        await loadTodayRecords();
      } catch (error) {
        console.error('操作失败:', error);
        $q.notify({
          type: 'negative',
          message: '记录失败,请重试',
          position: 'top',
        });
      }
    })();
  });
}

// 打开测体温对话框
function openActionDialog(type: string) {
  if (type === '测体温') {
    temperatureDialog.value.show = true;
    temperatureDialog.value.value = 38.5;
  }
}

// 打开体重对话框
function openWeightDialog() {
  $q.dialog({
    title: '记录体重',
    message: '请输入猫咪体重',
    prompt: {
      model: '',
      type: 'number',
    },
    cancel: true,
    persistent: true,
  }).onOk((value) => {
    void (async () => {
      if (!selectedCat.value) return;

      try {
        const weight = parseFloat(value as string);
        if (isNaN(weight) || weight <= 0) {
          $q.notify({
            type: 'warning',
            message: '请输入有效的体重',
            position: 'top',
          });
          return;
        }

        await catFsmApi.updateWeight(selectedCat.value, weight);

        $q.notify({
          type: 'positive',
          message: '体重已记录',
          icon: 'check_circle',
          position: 'top',
        });

        await loadTodayRecords();
      } catch (error) {
        console.error('记录体重失败:', error);
        $q.notify({
          type: 'negative',
          message: '记录失败,请重试',
          position: 'top',
        });
      }
    })();
  });
}

// 提交体温
async function submitTemperature() {
  if (!selectedCat.value || !selectedSite.value) return;

  temperatureDialog.value.loading = true;
  try {
    // 更新体温
    await catFsmApi.updateTemperature(selectedCat.value, temperatureDialog.value.value);

    // 创建操作记录
    await catActionApi.create({
      cat_id: selectedCat.value,
      site_id: selectedSite.value,
      user_id: authStore.user?.id || 0,
      action_type: '测体温',
      action_detail: JSON.stringify({ temperature: temperatureDialog.value.value }),
    });

    $q.notify({
      type: 'positive',
      message: '体温已记录',
      icon: 'check_circle',
      position: 'top',
    });

    temperatureDialog.value.show = false;
    await loadTodayRecords();
  } catch (error) {
    console.error('记录体温失败:', error);
    $q.notify({
      type: 'negative',
      message: '记录失败,请重试',
      position: 'top',
    });
  } finally {
    temperatureDialog.value.loading = false;
  }
}

// 打开事件对话框
function openEventDialog(type: string) {
  eventDialog.value.show = true;
  eventDialog.value.type = type;
  eventDialog.value.detail = '';
}

// 获取事件图标
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

// 获取事件占位符
function getEventPlaceholder(type: string) {
  const placeholders: Record<string, string> = {
    生病: '请描述症状、已采取措施等...',
    受伤: '请描述受伤情况、处理方式等...',
    怀孕: '请描述怀孕相关信息...',
    分娩: '请描述分娩情况、幼猫数量等...',
    死亡: '请描述原因、处理方式等...',
    合同解除: '请描述合同解除原因等...',
  };
  return placeholders[type] || '请输入详细信息...';
}

// 提交事件
async function submitEvent() {
  if (!selectedCat.value || !selectedSite.value) return;

  eventDialog.value.loading = true;
  try {
    await catEventApi.create({
      cat_id: selectedCat.value,
      site_id: selectedSite.value,
      user_id: authStore.user?.id || 0,
      event_type: eventDialog.value.type,
      detail: eventDialog.value.detail,
    });

    $q.notify({
      type: 'positive',
      message: `${eventDialog.value.type}已记录`,
      icon: 'check_circle',
      position: 'top',
    });

    eventDialog.value.show = false;
    await loadTodayRecords();
  } catch (error) {
    console.error('记录事件失败:', error);
    $q.notify({
      type: 'negative',
      message: '记录失败,请重试',
      position: 'top',
    });
  } finally {
    eventDialog.value.loading = false;
  }
}

// 加载今日记录
async function loadTodayRecords() {
  try {
    const today = new Date().toDateString();
    const records: TodayRecord[] = [];

    // 加载今日操作记录
    if (selectedCat.value) {
      const actions = await catActionApi.getByCat(selectedCat.value);
      const todayActions = actions.filter(
        (a) => new Date(a.created_at).toDateString() === today
      );

      todayActions.forEach((action) => {
        records.push({
          id: `action-${action.action_id}`,
          title: action.action_type,
          subtitle: getCatName(action.cat_id),
          time: formatTime(action.created_at),
          icon: getActionIcon(action.action_type),
          color: getActionColor(action.action_type),
        });
      });
    }

    // 加载今日事件记录
    if (selectedCat.value) {
      const events = await catEventApi.getByCat(selectedCat.value);
      const todayEvents = events.filter(
        (e) => new Date(e.created_at).toDateString() === today
      );

      todayEvents.forEach((event) => {
        records.push({
          id: `event-${event.event_id}`,
          title: event.event_type,
          subtitle: event.detail || getCatName(event.cat_id),
          time: formatTime(event.created_at),
          icon: getEventIcon(event.event_type),
          color: getEventColor(event.event_type),
        });
      });
    }

    // 按时间排序
    todayRecords.value = records.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  } catch (error) {
    console.error('加载今日记录失败:', error);
  }
}

// 辅助函数 - 获取本地时区的 ISO 时间字符串 (UTC+8)
function toLocalISOString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`;
}

function getCatName(catId: number) {
  const cat = cats.value.find((c) => c.cat_id === catId);
  return cat?.cat_name || `猫咪 #${catId}`;
}

function formatTime(timeStr: string) {
  const date = new Date(timeStr);
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function getActionIcon(type: string) {
  const icons: Record<string, string> = {
    测体温: 'thermostat',
    绝育: 'pets',
    体检: 'medical_services',
    驱虫: 'pest_control',
    修剪指甲: 'content_cut',
    洗澡: 'bathtub',
    疫苗: 'vaccines',
  };
  return icons[type] || 'build';
}

function getActionColor(type: string) {
  const colors: Record<string, string> = {
    测体温: 'blue',
    绝育: 'deep-orange',
    体检: 'light-green',
    驱虫: 'indigo',
    修剪指甲: 'pink',
    洗澡: 'teal',
    疫苗: 'red',
  };
  return colors[type] || 'grey';
}

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

// 初始化数据
async function loadData() {
  loading.value = true;
  try {
    const [sitesRes, catsRes] = await Promise.all([
      siteApi.list(1, 100),
      catApi.list(1, 100),
    ]);

    sites.value = sitesRes.data || [];
    cats.value = catsRes.data || [];

    // 默认选择第一个设施
    if (sites.value.length > 0) {
      selectedSite.value = sites.value[0]!.site_id;
    }
  } catch (error) {
    console.error('加载数据失败:', error);
    $q.notify({
      type: 'negative',
      message: '加载数据失败',
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
.operation-btn {
  height: 80px;
  border-radius: 12px;
  transition: transform 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.5;
  }
}
</style>
