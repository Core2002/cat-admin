<template>
  <q-page class="q-pa-md">
    <div class="text-h5 text-weight-bold q-mb-md">出入院管理</div>

    <q-banner
      v-if="cats.length === 0 || sites.length === 0"
      class="bg-orange-1 text-orange-10 q-mb-md"
      rounded
      inline-actions
    >
      系统当前是空库，请先完成基础登记（至少 1 个设施 + 1 只猫咪），再办理入院。
      <template #action>
        <q-btn flat color="orange-10" label="刷新基础数据" @click="loadBaseData" />
      </template>
    </q-banner>

    <q-card class="q-mb-md">
      <q-card-section class="text-subtitle1">从 0 开始登记</q-card-section>
      <q-card-section class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <q-form class="row q-col-gutter-sm" @submit.prevent="createInitialSite">
            <div class="col-12 text-subtitle2">登记设施</div>
            <div class="col-12">
              <q-input v-model="initSiteForm.site_name" label="设施名称" outlined dense :rules="[(v) => !!v || '请输入设施名称']" />
            </div>
            <div class="col-12">
              <q-input v-model="initSiteForm.site_address" label="设施地址" outlined dense :rules="[(v) => !!v || '请输入设施地址']" />
            </div>
            <div class="col-12">
              <q-input v-model="initSiteForm.site_admin_phone_number" label="管理员手机号" outlined dense :rules="[(v) => /^1[3-9]\d{9}$/.test(v) || '请输入有效手机号']" />
            </div>
            <div class="col-12">
              <q-btn color="primary" label="创建设施" type="submit" :loading="submittingInitSite" />
            </div>
          </q-form>
        </div>

        <div class="col-12 col-md-6">
          <q-form class="row q-col-gutter-sm" @submit.prevent="createInitialCat">
            <div class="col-12 text-subtitle2">登记猫咪</div>
            <div class="col-12">
              <q-input v-model="initCatForm.cat_name" label="猫咪名称" outlined dense :rules="[(v) => !!v || '请输入猫咪名称']" />
            </div>
            <div class="col-6">
              <q-input v-model="initCatForm.cat_type" label="品种" outlined dense :rules="[(v) => !!v || '请输入品种']" />
            </div>
            <div class="col-6">
              <q-select v-model="initCatForm.cat_gender" :options="['公', '母']" label="性别" outlined dense />
            </div>
            <div class="col-12">
              <q-input v-model="initCatForm.master_name" label="主人姓名" outlined dense :rules="[(v) => !!v || '请输入主人姓名']" />
            </div>
            <div class="col-12">
              <q-input v-model="initCatForm.master_phone_number" label="主人手机号" outlined dense :rules="[(v) => /^1[3-9]\d{9}$/.test(v) || '请输入有效手机号']" />
            </div>
            <div class="col-12">
              <q-input v-model="initCatForm.cat_photo_uri" label="照片 URL" outlined dense :rules="[(v) => !!v || '请输入照片 URL']" />
            </div>
            <div class="col-12">
              <q-btn color="secondary" label="创建猫咪" type="submit" :loading="submittingInitCat" />
            </div>
          </q-form>
        </div>
      </q-card-section>
    </q-card>

    <q-tabs v-model="tab" dense align="left" class="text-primary q-mb-md">
      <q-tab name="admit" label="办理入院" icon="login" />
      <q-tab name="discharge" label="办理出院" icon="logout" />
    </q-tabs>

    <q-tab-panels v-model="tab" animated>
      <q-tab-panel name="admit" class="q-pa-none">
        <q-card>
          <q-card-section class="text-subtitle1">入院初始化表单</q-card-section>
          <q-card-section>
            <q-form class="row q-col-gutter-md" @submit.prevent="submitAdmit">
              <div class="col-12 col-md-6">
                <q-select v-model="admitForm.cat_id" :options="catOptions" emit-value map-options label="猫咪" outlined dense
                  :rules="[(v) => !!v || '请选择猫咪']" />
              </div>
              <div class="col-12 col-md-6">
                <q-select v-model="admitForm.site_id" :options="siteOptions" emit-value map-options label="入院设施" outlined dense
                  :rules="[(v) => !!v || '请选择设施']" />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model.number="admitForm.initial_temperature_c" type="number" label="初始体温(°C)" outlined dense
                  :rules="[(v) => (v >= 0 && v <= 50) || '体温范围 0~50']" />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model.number="admitForm.initial_weight_kg" type="number" label="初始体重(kg)" outlined dense
                  :rules="[(v) => (v >= 0.1 && v <= 25) || '体重范围 0.1~25']" />
              </div>
              <div class="col-12">
                <q-input v-model="admitForm.admission_reason" label="入院原因" outlined dense
                  :rules="[(v) => !!v || '请输入入院原因']" />
              </div>
              <div class="col-12">
                <q-input v-model="admitForm.admission_note" type="textarea" rows="3" label="入院备注" outlined dense />
              </div>
              <div class="col-12">
                <q-btn color="primary" label="提交入院" type="submit" :loading="submittingAdmit" :disable="cats.length === 0 || sites.length === 0" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-tab-panel>

      <q-tab-panel name="discharge" class="q-pa-none">
        <q-card>
          <q-card-section class="text-subtitle1">出院结算表单</q-card-section>
          <q-card-section>
            <q-form class="row q-col-gutter-md" @submit.prevent="submitDischarge">
              <div class="col-12">
                <q-select v-model="dischargeForm.cat_id" :options="activeRecordOptions" emit-value map-options label="在院猫咪"
                  outlined dense :rules="[(v) => !!v || '请选择在院记录']" />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model.number="dischargeForm.final_temperature_c" type="number" label="出院体温(可选)" outlined dense />
              </div>
              <div class="col-12 col-md-6">
                <q-input v-model.number="dischargeForm.final_weight_kg" type="number" label="出院体重(可选)" outlined dense />
              </div>
              <div class="col-12">
                <q-input v-model="dischargeForm.discharge_reason" label="出院原因" outlined dense
                  :rules="[(v) => !!v || '请输入出院原因']" />
              </div>
              <div class="col-12">
                <q-input v-model="dischargeForm.discharge_note" type="textarea" rows="3" label="出院备注" outlined dense />
              </div>
              <div class="col-12">
                <q-btn color="negative" label="提交出院" type="submit" :loading="submittingDischarge" />
              </div>
            </q-form>
          </q-card-section>
        </q-card>
      </q-tab-panel>
    </q-tab-panels>

    <q-card class="q-mt-md">
      <q-card-section class="row items-center">
        <div class="text-subtitle1">当前在院记录</div>
        <q-space />
        <q-btn flat icon="refresh" label="刷新" @click="loadActiveRecords" />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-list bordered separator v-if="activeRecords.length > 0">
          <q-item v-for="record in activeRecords" :key="record.cat_id">
            <q-item-section>
              <q-item-label>
                {{ getCatName(record.cat_id) }} @ {{ getSiteName(record.site_id) }}
              </q-item-label>
              <q-item-label caption>
                当前体温 {{ record.temperature_c }}°C · 当前体重 {{ record.weight_kg }}kg
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-badge color="positive" label="在院" />
            </q-item-section>
          </q-item>
        </q-list>
        <div v-else class="text-grey text-center q-py-md">暂无在院记录</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { catApi, catFsmApi, hospitalizationApi, siteApi, type Cat, type CatCreate, type CatFSM, type Site, type SiteCreate } from 'src/api';
import { useAuthStore } from 'src/stores/auth';

const $q = useQuasar();
const authStore = useAuthStore();
const tab = ref<'admit' | 'discharge'>('admit');

const cats = ref<Cat[]>([]);
const sites = ref<Site[]>([]);
const activeRecords = ref<CatFSM[]>([]);
const submittingAdmit = ref(false);
const submittingDischarge = ref(false);
const submittingInitSite = ref(false);
const submittingInitCat = ref(false);

const admitForm = ref({
  cat_id: null as number | null,
  site_id: null as number | null,
  admission_reason: '',
  admission_note: '',
  initial_temperature_c: 38.5,
  initial_weight_kg: 4.0,
});

const dischargeForm = ref({
  cat_id: null as number | null,
  discharge_reason: '',
  discharge_note: '',
  final_temperature_c: null as number | null,
  final_weight_kg: null as number | null,
});

const initSiteForm = ref<SiteCreate>({
  site_name: '',
  site_address: '',
  site_admin_phone_number: '',
});

const initCatForm = ref<CatCreate>({
  cat_name: '',
  cat_photo_uri: 'https://placekitten.com/300/300',
  cat_type: '',
  cat_gender: '公',
  master_name: '',
  master_phone_number: '',
});

const catOptions = computed(() => cats.value.map((c) => ({ label: `${c.cat_name} (#${c.cat_id})`, value: c.cat_id })));
const siteOptions = computed(() => sites.value.map((s) => ({ label: `${s.site_name} (#${s.site_id})`, value: s.site_id })));
const activeRecordOptions = computed(() =>
  activeRecords.value.map((r) => ({
    label: `${getCatName(r.cat_id)} @ ${getSiteName(r.site_id)}`,
    value: r.cat_id,
  }))
);

function getCatName(catId: number) {
  return cats.value.find((c) => c.cat_id === catId)?.cat_name || `猫咪#${catId}`;
}

function getSiteName(siteId: number) {
  return sites.value.find((s) => s.site_id === siteId)?.site_name || `设施#${siteId}`;
}

async function loadBaseData() {
  const [catsRes, sitesRes] = await Promise.all([catApi.list(1, 100), siteApi.list(1, 100)]);
  cats.value = catsRes.data || [];
  sites.value = sitesRes.data || [];
}

async function createInitialSite() {
  submittingInitSite.value = true;
  try {
    await siteApi.create(initSiteForm.value);
    $q.notify({ type: 'positive', message: '设施登记成功' });
    initSiteForm.value = {
      site_name: '',
      site_address: '',
      site_admin_phone_number: '',
    };
    await loadBaseData();
  } catch (error) {
    $q.notify({ type: 'negative', message: error instanceof Error ? error.message : '设施登记失败' });
  } finally {
    submittingInitSite.value = false;
  }
}

async function createInitialCat() {
  submittingInitCat.value = true;
  try {
    await catApi.create(initCatForm.value);
    $q.notify({ type: 'positive', message: '猫咪登记成功' });
    initCatForm.value = {
      cat_name: '',
      cat_photo_uri: 'https://placekitten.com/300/300',
      cat_type: '',
      cat_gender: '公',
      master_name: '',
      master_phone_number: '',
    };
    await loadBaseData();
  } catch (error) {
    $q.notify({ type: 'negative', message: error instanceof Error ? error.message : '猫咪登记失败' });
  } finally {
    submittingInitCat.value = false;
  }
}

async function loadActiveRecords() {
  const fsmRes = await catFsmApi.list(1, 100);
  activeRecords.value = (fsmRes.data || []).filter((f) => f.site_id > 0);
}

async function submitAdmit() {
  if (!admitForm.value.cat_id || !admitForm.value.site_id || !authStore.user?.id) return;
  submittingAdmit.value = true;
  try {
    await hospitalizationApi.admit({
      cat_id: admitForm.value.cat_id,
      site_id: admitForm.value.site_id,
      user_id: authStore.user.id,
      admission_reason: admitForm.value.admission_reason,
      admission_note: admitForm.value.admission_note,
      initial_temperature_c: admitForm.value.initial_temperature_c,
      initial_weight_kg: admitForm.value.initial_weight_kg,
    });
    $q.notify({ type: 'positive', message: '入院办理成功，已完成初始化' });
    admitForm.value.admission_reason = '';
    admitForm.value.admission_note = '';
    await loadActiveRecords();
  } catch (error) {
    $q.notify({ type: 'negative', message: error instanceof Error ? error.message : '入院失败' });
  } finally {
    submittingAdmit.value = false;
  }
}

async function submitDischarge() {
  if (!dischargeForm.value.cat_id || !dischargeForm.value.discharge_reason || !authStore.user?.id) return;
  submittingDischarge.value = true;
  try {
    const payload: {
      cat_id: number;
      user_id: number;
      discharge_reason: string;
      discharge_note?: string;
      final_temperature_c?: number;
      final_weight_kg?: number;
    } = {
      cat_id: dischargeForm.value.cat_id,
      user_id: authStore.user.id,
      discharge_reason: dischargeForm.value.discharge_reason,
    };

    if (dischargeForm.value.discharge_note) {
      payload.discharge_note = dischargeForm.value.discharge_note;
    }
    if (dischargeForm.value.final_temperature_c !== null) {
      payload.final_temperature_c = dischargeForm.value.final_temperature_c;
    }
    if (dischargeForm.value.final_weight_kg !== null) {
      payload.final_weight_kg = dischargeForm.value.final_weight_kg;
    }

    await hospitalizationApi.discharge(payload);
    $q.notify({ type: 'positive', message: '出院办理成功，已完成结算' });
    dischargeForm.value.cat_id = null;
    dischargeForm.value.discharge_reason = '';
    dischargeForm.value.discharge_note = '';
    dischargeForm.value.final_temperature_c = null;
    dischargeForm.value.final_weight_kg = null;
    await loadActiveRecords();
  } catch (error) {
    $q.notify({ type: 'negative', message: error instanceof Error ? error.message : '出院失败' });
  } finally {
    submittingDischarge.value = false;
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadBaseData(), loadActiveRecords()]);
  } catch {
    $q.notify({ type: 'negative', message: '初始化出入院页面失败' });
  }
});
</script>
