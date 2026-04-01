<template>
  <q-page class="row no-wrap q-pa-md">
    <!-- 左侧数据表列表 -->
    <transition name="slide">
      <q-card
        v-show="sidebarOpen"
        flat
        bordered
        class="sidebar-card"
      >
        <q-toolbar class="bg-grey-1">
          <q-toolbar-title class="text-subtitle2 text-grey">数据表</q-toolbar-title>
        </q-toolbar>
        <q-separator />
        <q-scroll-area style="height: calc(100vh - 250px)">
          <q-list dense padding>
            <q-item
              v-for="table in tables"
              :key="table.name"
              clickable
              :active="selectedTable === table.name"
              @click="onSelectTable(table.name)"
              :class="{ 'text-primary': selectedTable === table.name }"
            >
              <q-item-section avatar>
                <q-icon :name="table.icon" size="sm" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ table.label }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :label="table.count" color="grey-4" text-color="grey-8" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-scroll-area>
      </q-card>
    </transition>

    <!-- 右侧内容区 -->
    <q-card flat class="col content-card">
      <!-- Header -->
      <q-toolbar>
        <q-btn
          flat
          round
          dense
          :icon="sidebarOpen ? 'chevron_left' : 'chevron_right'"
          @click="toggleSidebar"
        >
          <q-tooltip>{{ sidebarOpen ? '收起' : '展开' }}数据表</q-tooltip>
        </q-btn>
        <q-toolbar-title>
          <q-item-label class="text-h6">{{ currentTable?.label || '请选择数据表' }}</q-item-label>
        </q-toolbar-title>
        <q-btn-group v-if="currentTable" flat>
          <q-btn flat icon="refresh" label="刷新" @click="loadData" />
          <q-btn color="primary" icon="add" label="新增" @click="onAdd" />
        </q-btn-group>
      </q-toolbar>

      <q-separator />

      <!-- Table -->
      <q-scroll-area style="height: calc(100vh - 250px)">
        <q-table
          v-if="currentTable"
          flat
          bordered
          :rows="tableData"
          :columns="currentColumns"
          :row-key="currentTable?.primaryKey"
          :loading="loading"
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 20, 50, 100]"
          @request="onRequest"
          class="q-ma-md"
        >
          <!-- Dynamic cell templates -->
          <template #body-cell="props">
            <q-td :props="props">
              <template v-if="isBooleanField()">
                <q-badge :color="props.value ? 'positive' : 'grey'">
                  {{ props.value ? '是' : '否' }}
                </q-badge>
              </template>
              <template v-else-if="isTimeField(props.col.name)">
                {{ formatTime(props.value) }}
              </template>
              <template v-else-if="isLongText(props.value)">
                <q-btn flat dense size="sm" label="查看" @click="showDetail(props.col.label, props.value)" />
              </template>
              <template v-else-if="isEditableColumn(props.col.name)">
                <span class="editable-cell cursor-pointer" @click.stop>
                  {{ props.value ?? '-' }}
                  <q-popup-edit
                    :model-value="props.value"
                    :title="props.col.label"
                    buttons
                    v-slot="scope"
                    @save="onPopupSave(props.row, props.col.name, $event)"
                  >
                    <q-input
                      v-if="getColumnType(props.col.name) === 'string'"
                      v-model="scope.value"
                      dense
                      autofocus
                      outlined
                      @keyup.enter="scope.set"
                    />
                    <q-input
                      v-else-if="getColumnType(props.col.name) === 'number'"
                      v-model.number="scope.value"
                      dense
                      autofocus
                      outlined
                      type="number"
                      @keyup.enter="scope.set"
                    />
                    <q-select
                      v-else-if="getColumnType(props.col.name) === 'select'"
                      v-model="scope.value"
                      :options="getColumnOptions(props.col.name)"
                      dense
                      outlined
                      emit-value
                      map-options
                      @keyup.enter="scope.set"
                    />
                    <q-input
                      v-else-if="getColumnType(props.col.name) === 'textarea'"
                      v-model="scope.value"
                      dense
                      autofocus
                      outlined
                      type="textarea"
                      rows="3"
                    />
                    <q-input
                      v-else-if="getColumnType(props.col.name) === 'url'"
                      v-model="scope.value"
                      dense
                      autofocus
                      outlined
                      type="url"
                      @keyup.enter="scope.set"
                    />
                    <q-input
                      v-else-if="getColumnType(props.col.name) === 'phone'"
                      v-model="scope.value"
                      dense
                      autofocus
                      outlined
                      :rules="[(v) => !v || /^1[3-9]\d{9}$/.test(v) || '请输入有效的手机号']"
                      @keyup.enter="scope.set"
                    />
                    <q-input
                      v-else-if="getColumnType(props.col.name) === 'time'"
                      v-model="scope.value"
                      dense
                      autofocus
                      outlined
                      type="datetime-local"
                    />
                    <q-input
                      v-else
                      v-model="scope.value"
                      dense
                      autofocus
                      outlined
                      @keyup.enter="scope.set"
                    />
                  </q-popup-edit>
                  <q-icon name="edit" size="xs" class="q-ml-xs text-grey-5" />
                </span>
              </template>
              <template v-else>
                {{ props.value ?? '-' }}
              </template>
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat round dense icon="edit" size="sm" @click="onEdit(props.row)">
                <q-tooltip>编辑</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="delete" size="sm" color="negative" @click="onDelete(props.row)">
                <q-tooltip>删除</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>

        <!-- Empty state -->
        <q-card v-else flat bordered class="q-ma-md q-py-xl">
          <q-card-section class="column items-center justify-center">
            <q-icon name="table_chart" size="80px" color="grey-4" />
            <q-item-label class="text-grey q-mt-md">请从左侧选择要管理的数据表</q-item-label>
          </q-card-section>
        </q-card>
      </q-scroll-area>
    </q-card>

    <!-- Edit Dialog -->
    <q-dialog
      v-model="editDialog.show"
      persistent
      :maximized="$q.screen.lt.md"
      transition-show="slide-up"
      transition-hide="slide-down"
    >
      <q-card class="q-dialog-plugin" :style="$q.screen.lt.md ? '' : 'min-width: 400px; max-width: 80vw'">
        <q-card-section class="row items-center bg-primary text-white">
          <q-item-label class="text-h6 text-white">{{ editDialog.isEdit ? '编辑' : '新增' }}{{ currentTable?.label }}</q-item-label>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-md scroll" :style="$q.screen.lt.md ? 'max-height: 70vh' : 'max-height: 60vh'">
          <q-form @submit="onSave" class="q-gutter-md">
            <template v-for="col in editableColumns" :key="col.name">
              <q-input
                v-if="col.type === 'string'"
                :model-value="editDialog.form[col.name] as string"
                @update:model-value="setFormField(col.name, $event)"
                :label="col.label"
                outlined
                dense
                :rules="col.required ? [(v) => !!v || '必填'] : []"
              />
              <q-input
                v-else-if="col.type === 'number'"
                :model-value="editDialog.form[col.name] as number"
                @update:model-value="setFormField(col.name, $event)"
                :label="col.label"
                outlined
                dense
                type="number"
                :rules="col.required ? [(v) => v !== null && v !== undefined || '必填'] : []"
              />
              <q-select
                v-else-if="col.type === 'select'"
                :model-value="editDialog.form[col.name] as string"
                @update:model-value="setFormField(col.name, $event)"
                :label="col.label"
                :options="col.options || []"
                outlined
                dense
                emit-value
                map-options
                :rules="col.required ? [(v) => v !== null && v !== undefined && v !== '' || '必填'] : []"
              />
              <q-input
                v-else-if="col.type === 'textarea'"
                :model-value="editDialog.form[col.name] as string"
                @update:model-value="setFormField(col.name, $event)"
                :label="col.label"
                outlined
                dense
                type="textarea"
                rows="3"
              />
              <q-input
                v-else-if="col.type === 'url'"
                :model-value="editDialog.form[col.name] as string"
                @update:model-value="setFormField(col.name, $event)"
                :label="col.label"
                outlined
                dense
                type="url"
              />
              <q-input
                v-else-if="col.type === 'phone'"
                :model-value="editDialog.form[col.name] as string"
                @update:model-value="setFormField(col.name, $event)"
                :label="col.label"
                outlined
                dense
                :rules="[(v) => !v || /^1[3-9]\d{9}$/.test(v) || '请输入有效的手机号']"
              />
              <q-input
                v-else-if="col.type === 'time'"
                :model-value="formatDateTimeLocal(editDialog.form[col.name] as string)"
                @update:model-value="setFormField(col.name, $event)"
                :label="col.label"
                outlined
                dense
                type="datetime-local"
              />
            </template>
          </q-form>
        </q-card-section>

        <q-card-actions align="right" class="q-px-md q-pb-md">
          <q-btn flat label="取消" v-close-popup />
          <q-btn color="primary" label="保存" @click="onSave" :loading="editDialog.loading" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Detail Dialog -->
    <q-dialog
      v-model="detailDialog.show"
      :maximized="$q.screen.lt.md"
    >
      <q-card class="q-dialog-plugin" :style="$q.screen.lt.md ? '' : 'min-width: 300px; max-width: 80vw'">
        <q-card-section class="row items-center">
          <q-item-label class="text-h6">{{ detailDialog.title }}</q-item-label>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="scroll">
          <q-item-label class="text-body2" style="white-space: pre-wrap; word-break: break-all">{{ detailDialog.content }}</q-item-label>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  catApi,
  siteApi,
  catActionApi,
  catEventApi,
  catFsmApi,
  siteFsmApi,
  type Cat,
  type Site,
  type CatAction,
  type CatEvent,
  type CatFSM,
  type SiteFSM,
} from 'src/api';

type TableRow = Cat | Site | CatAction | CatEvent | CatFSM | SiteFSM;

interface ColumnDef {
  name: string;
  label: string;
  field: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  type?: 'string' | 'number' | 'select' | 'textarea' | 'url' | 'phone' | 'time';
  options?: string[];
  required?: boolean;
  editable?: boolean;
}

interface TableDef {
  name: string;
  label: string;
  icon: string;
  primaryKey: string;
  columns: ColumnDef[];
  count: number;
}

const sidebarOpen = ref(true);
const selectedTable = ref<string | null>(null);
const tableData = ref<TableRow[]>([]);
const loading = ref(false);
const pagination = ref({
  sortBy: '',
  descending: false,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
});

// Table definitions
const tables = ref<TableDef[]>([
  {
    name: 'cats',
    label: '猫咪',
    icon: 'pets',
    primaryKey: 'cat_id',
    count: 0,
    columns: [
      { name: 'cat_id', label: 'ID', field: 'cat_id', align: 'left', sortable: true, type: 'number', editable: false },
      { name: 'cat_name', label: '名称', field: 'cat_name', align: 'left', sortable: true, type: 'string', required: true, editable: true },
      { name: 'cat_type', label: '品种', field: 'cat_type', align: 'left', type: 'string', required: true, editable: true },
      { name: 'cat_gender', label: '性别', field: 'cat_gender', align: 'center', type: 'select', options: ['公', '母'], required: true, editable: true },
      { name: 'cat_photo_uri', label: '照片', field: 'cat_photo_uri', type: 'url', required: true, editable: true },
      { name: 'master_name', label: '主人', field: 'master_name', align: 'left', type: 'string', required: true, editable: true },
      { name: 'master_phone_number', label: '主人电话', field: 'master_phone_number', type: 'phone', required: true, editable: true },
      { name: 'created_at', label: '创建时间', field: 'created_at', align: 'left', type: 'time', sortable: true, editable: false },
    ],
  },
  {
    name: 'sites',
    label: '设施',
    icon: 'home',
    primaryKey: 'site_id',
    count: 0,
    columns: [
      { name: 'site_id', label: 'ID', field: 'site_id', align: 'left', sortable: true, type: 'number', editable: false },
      { name: 'site_name', label: '名称', field: 'site_name', align: 'left', sortable: true, type: 'string', required: true, editable: true },
      { name: 'site_address', label: '地址', field: 'site_address', align: 'left', type: 'string', required: true, editable: true },
      { name: 'site_admin_phone_number', label: '管理员电话', field: 'site_admin_phone_number', type: 'phone', required: true, editable: true },
      { name: 'created_at', label: '创建时间', field: 'created_at', align: 'left', type: 'time', sortable: true, editable: false },
    ],
  },
  {
    name: 'cat_actions',
    label: '操作记录',
    icon: 'history',
    primaryKey: 'action_id',
    count: 0,
    columns: [
      { name: 'action_id', label: 'ID', field: 'action_id', align: 'left', sortable: true, type: 'number', editable: false },
      { name: 'cat_id', label: '猫咪ID', field: 'cat_id', align: 'left', type: 'number', required: true, editable: true },
      { name: 'site_id', label: '设施ID', field: 'site_id', align: 'left', type: 'number', required: true, editable: true },
      { name: 'user_id', label: '用户ID', field: 'user_id', align: 'left', type: 'number', required: true, editable: true },
      { name: 'action_type', label: '动作类型', field: 'action_type', align: 'left', type: 'select', options: ['测体温', '绝育', '体检', '驱虫', '修剪指甲', '洗澡', '疫苗'], required: true, editable: true },
      { name: 'action_detail', label: '详情', field: 'action_detail', type: 'textarea', editable: true },
      { name: 'created_at', label: '创建时间', field: 'created_at', align: 'left', type: 'time', sortable: true, editable: false },
    ],
  },
  {
    name: 'cat_events',
    label: '事件记录',
    icon: 'event',
    primaryKey: 'event_id',
    count: 0,
    columns: [
      { name: 'event_id', label: 'ID', field: 'event_id', align: 'left', sortable: true, type: 'number', editable: false },
      { name: 'cat_id', label: '猫咪ID', field: 'cat_id', align: 'left', type: 'number', required: true, editable: true },
      { name: 'site_id', label: '设施ID', field: 'site_id', align: 'left', type: 'number', required: true, editable: true },
      { name: 'user_id', label: '用户ID', field: 'user_id', align: 'left', type: 'number', required: true, editable: true },
      { name: 'event_type', label: '事件类型', field: 'event_type', align: 'left', type: 'select', options: ['生病', '受伤', '怀孕', '分娩', '死亡', '合同解除'], required: true, editable: true },
      { name: 'detail', label: '详情', field: 'detail', type: 'textarea', required: true, editable: true },
      { name: 'created_at', label: '创建时间', field: 'created_at', align: 'left', type: 'time', sortable: true, editable: false },
    ],
  },
  {
    name: 'cat_fsms',
    label: '猫咪状态机',
    icon: 'settings_suggest',
    primaryKey: 'cat_id',
    count: 0,
    columns: [
      { name: 'cat_id', label: '猫咪ID', field: 'cat_id', align: 'left', sortable: true, type: 'number', required: true, editable: true },
      { name: 'site_id', label: '设施ID', field: 'site_id', align: 'left', type: 'number', required: true, editable: true },
      { name: 'temperature_c', label: '体温(℃)', field: 'temperature_c', align: 'right', type: 'number', editable: true },
      { name: 'weight_kg', label: '体重(kg)', field: 'weight_kg', align: 'right', type: 'number', editable: true },
      { name: 'trim_nails_time', label: '修剪指甲时间', field: 'trim_nails_time', align: 'left', type: 'time', editable: true },
    ],
  },
  {
    name: 'site_fsms',
    label: '设施状态机',
    icon: 'tune',
    primaryKey: 'site_id',
    count: 0,
    columns: [
      { name: 'site_id', label: '设施ID', field: 'site_id', align: 'left', sortable: true, type: 'number', required: true, editable: true },
      { name: 'last_disinfect_time', label: '上次消毒', field: 'last_disinfect_time', align: 'left', type: 'time', editable: true },
      { name: 'last_feed_time', label: '上次喂食', field: 'last_feed_time', align: 'left', type: 'time', editable: true },
      { name: 'last_give_water_time', label: '上次喂水', field: 'last_give_water_time', align: 'left', type: 'time', editable: true },
      { name: 'last_play_time', label: '上次逗猫', field: 'last_play_time', align: 'left', type: 'time', editable: true },
      { name: 'last_clean_litter', label: '上次清理猫砂', field: 'last_clean_litter', align: 'left', type: 'time', editable: true },
    ],
  },
]);

const currentTable = computed(() => tables.value.find((t) => t.name === selectedTable.value));

const currentColumns = computed(() => {
  if (!currentTable.value) return [];
  return [
    ...currentTable.value.columns.map((col) => ({
      name: col.name,
      label: col.label,
      field: col.field,
      align: col.align || 'left',
      sortable: col.sortable || false,
    })),
    { name: 'actions', label: '操作', field: 'actions', align: 'center' as const },
  ];
});

const editableColumns = computed(() => {
  return currentTable.value?.columns.filter((col) => col.editable) || [];
});

// Edit Dialog
const editDialog = ref({
  show: false,
  isEdit: false,
  loading: false,
  id: null as number | null,
  form: {} as Record<string, unknown>,
});

// Detail Dialog
const detailDialog = ref({
  show: false,
  title: '',
  content: '',
});

// Popup Edit (state no longer needed, values passed directly)

// Select table
function onSelectTable(tableName: string) {
  selectedTable.value = tableName;
  pagination.value.page = 1;
  void loadData();
}

// Toggle sidebar
function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value;
}

// Load data
async function loadData() {
  if (!selectedTable.value) return;

  loading.value = true;
  try {
    const { page, rowsPerPage } = pagination.value;
    let result;

    switch (selectedTable.value) {
      case 'cats':
        result = await catApi.list(page, rowsPerPage);
        break;
      case 'sites':
        result = await siteApi.list(page, rowsPerPage);
        break;
      case 'cat_actions':
        result = await catActionApi.list(page, rowsPerPage);
        break;
      case 'cat_events':
        result = await catEventApi.list(page, rowsPerPage);
        break;
      case 'cat_fsms':
        result = await catFsmApi.list(page, rowsPerPage);
        break;
      case 'site_fsms':
        result = await siteFsmApi.list(page, rowsPerPage);
        break;
      default:
        return;
    }

    tableData.value = result.data;
    pagination.value.rowsNumber = result.total;

    // Update count
    const table = tables.value.find((t) => t.name === selectedTable.value);
    if (table) table.count = result.total;
  } catch (e) {
    console.error('Failed to load data:', e);
  } finally {
    loading.value = false;
  }
}

// Load all counts
async function loadCounts() {
  try {
    const [cats, sites, actions, events, catFsms, siteFsms] = await Promise.all([
      catApi.list(1, 1),
      siteApi.list(1, 1),
      catActionApi.list(1, 1),
      catEventApi.list(1, 1),
      catFsmApi.list(1, 1),
      siteFsmApi.list(1, 1),
    ]);

    tables.value.forEach((t, i) => {
      const totals = [cats.total, sites.total, actions.total, events.total, catFsms.total, siteFsms.total];
      t.count = totals[i] ?? 0;
    });
  } catch (e) {
    console.error('Failed to load counts:', e);
  }
}

function onRequest(props: {
  pagination: { sortBy: string; descending: boolean; page: number; rowsPerPage: number };
}) {
  pagination.value = { ...pagination.value, ...props.pagination };
  void loadData();
}

// Form field setter for reliable reactivity
function setFormField(field: string, value: unknown) {
  const col = currentTable.value?.columns.find((c) => c.name === field);
  if (col?.type === 'number' && value !== null && value !== undefined && value !== '') {
    editDialog.value.form[field] = Number(value);
  } else {
    editDialog.value.form[field] = value;
  }
}

// CRUD Operations
function onAdd() {
  if (!currentTable.value) return;

  const form: Record<string, unknown> = {};
  editableColumns.value.forEach((col) => {
    form[col.name] = col.type === 'select' ? col.options?.[0] : null;
  });

  editDialog.value = {
    show: true,
    isEdit: false,
    loading: false,
    id: null,
    form,
  };
}

function onEdit(row: TableRow) {
  if (!currentTable.value) return;

  const form: Record<string, unknown> = {};
  editableColumns.value.forEach((col) => {
    form[col.name] = (row as unknown as Record<string, unknown>)[col.name];
  });

  const primaryKey = currentTable.value.primaryKey;
  editDialog.value = {
    show: true,
    isEdit: true,
    loading: false,
    id: (row as unknown as Record<string, number>)[primaryKey] as number,
    form,
  };
}

// Prepare form data for submission (convert types, format times)
function prepareFormData(formData: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const columns = currentTable.value?.columns || [];

  for (const [key, value] of Object.entries(formData)) {
    if (value === null || value === undefined || value === '') continue;

    const col = columns.find((c) => c.name === key);

    if (col?.type === 'number') {
      result[key] = Number(value);
    } else if (col?.type === 'time' || key.endsWith('_time')) {
      if (typeof value !== 'string') {
        result[key] = value;
        continue;
      }
      let dateStr = value;
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateStr)) {
        dateStr = dateStr + ':00';
      }
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        const offset = -date.getTimezoneOffset();
        const sign = offset >= 0 ? '+' : '-';
        const absOffset = Math.abs(offset);
        const hours = String(Math.floor(absOffset / 60)).padStart(2, '0');
        const minutes = String(absOffset % 60).padStart(2, '0');
        const iso = date.toISOString().slice(0, 19);
        result[key] = `${iso}${sign}${hours}:${minutes}`;
      } else {
        result[key] = dateStr;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function onSave() {
  if (!selectedTable.value || !currentTable.value) return;

  editDialog.value.loading = true;
  try {
    const { form, isEdit, id } = editDialog.value;
    const data = prepareFormData(form);

    switch (selectedTable.value) {
      case 'cats':
        if (isEdit) {
          await catApi.update(id!, data);
        } else {
          await catApi.create(data as Omit<Cat, 'cat_id' | 'created_at'>);
        }
        break;
      case 'sites':
        if (isEdit) {
          await siteApi.update(id!, data);
        } else {
          await siteApi.create(data as Omit<Site, 'site_id' | 'created_at'>);
        }
        break;
      case 'cat_actions':
        await catActionApi.create(data as Omit<CatAction, 'action_id' | 'created_at'>);
        break;
      case 'cat_events':
        await catEventApi.create(data as Omit<CatEvent, 'event_id' | 'created_at'>);
        break;
      case 'cat_fsms':
        if (isEdit) {
          await catFsmApi.update(id!, data);
        } else {
          await catFsmApi.create(data as Omit<CatFSM, 'id'>);
        }
        break;
      case 'site_fsms':
        if (isEdit) {
          await siteFsmApi.update(id!, data);
        } else {
          await siteFsmApi.create(data as Omit<SiteFSM, 'id'>);
        }
        break;
    }

    editDialog.value.show = false;
    void loadData();
    void loadCounts();
  } catch (e) {
    console.error('Failed to save:', e);
  } finally {
    editDialog.value.loading = false;
  }
}

async function onDelete(row: TableRow) {
  if (!selectedTable.value || !currentTable.value) return;

  const primaryKey = currentTable.value.primaryKey;
  const id = (row as unknown as Record<string, number>)[primaryKey] as number;

  try {
    switch (selectedTable.value) {
      case 'cats':
        await catApi.delete(id);
        break;
      case 'sites':
        await siteApi.delete(id);
        break;
      case 'cat_actions':
        await catActionApi.delete(id);
        break;
      case 'cat_events':
        await catEventApi.delete(id);
        break;
      case 'cat_fsms':
        await catFsmApi.delete(id);
        break;
      case 'site_fsms':
        await siteFsmApi.delete(id);
        break;
    }

    void loadData();
    void loadCounts();
  } catch (e) {
    console.error('Failed to delete:', e);
  }
}

// Helpers
function isBooleanField(): boolean {
  return false; // Add boolean field names if needed
}

function isTimeField(name: string): boolean {
  // Only auto-generated timestamps (ending with _at) are considered system time fields
  return name.endsWith('_at');
}

function formatDateTimeLocal(value: string | null | undefined): string {
  if (!value) return '';
  // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function isLongText(value: unknown): boolean {
  return typeof value === 'string' && value.length > 50;
}

function formatTime(value: string | null | undefined): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('zh-CN');
}

function showDetail(title: string, content: string) {
  detailDialog.value = { show: true, title, content };
}

// Popup Edit helpers
function isEditableColumn(name: string): boolean {
  const col = currentTable.value?.columns.find((c) => c.name === name);
  return col?.editable === true && !isTimeField(name);
}

function getColumnType(name: string): string | undefined {
  const col = currentTable.value?.columns.find((c) => c.name === name);
  return col?.type;
}

function getColumnOptions(name: string): string[] {
  const col = currentTable.value?.columns.find((c) => c.name === name);
  return col?.options || [];
}

async function onPopupSave(row: TableRow, field: string, newValue: unknown) {
  if (!selectedTable.value || !currentTable.value) return;

  const primaryKey = currentTable.value.primaryKey;
  const id = (row as unknown as Record<string, number>)[primaryKey] as number;

  try {
    // Build complete update data from current row, only changing the edited field
    const updateData: Record<string, unknown> = {};
    editableColumns.value.forEach((col) => {
      updateData[col.name] = (row as unknown as Record<string, unknown>)[col.name];
    });
    updateData[field] = newValue;

    const data = prepareFormData(updateData);

    switch (selectedTable.value) {
      case 'cats':
        await catApi.update(id, data);
        break;
      case 'sites':
        await siteApi.update(id, data);
        break;
      case 'cat_fsms':
        await catFsmApi.update(id, data);
        break;
      case 'site_fsms':
        await siteFsmApi.update(id, data);
        break;
      default:
        return;
    }

    // Update local data
    const index = tableData.value.findIndex(
      (r) => (r as unknown as Record<string, number>)[primaryKey] === id
    );
    if (index !== -1) {
      (tableData.value[index] as unknown as Record<string, unknown>)[field] = newValue;
    }
  } catch (e) {
    console.error('Failed to update field:', e);
    void loadData(); // Reload on error
  }
}

// Initialize
watch(selectedTable, () => {
  if (selectedTable.value) {
    pagination.value.sortBy = currentTable.value?.primaryKey || '';
  }
});

void loadCounts();
</script>

<style scoped>
.sidebar-card {
  min-width: 240px;
  max-width: 240px;
  margin-right: 8px;
}

.content-card {
  min-width: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}

.editable-cell {
  display: inline-flex;
  align-items: center;
  padding: 4px 6px;
  margin: 2px 0;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.editable-cell:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.editable-cell:hover .q-icon {
  opacity: 1;
}

.editable-cell .q-icon {
  opacity: 0;
  transition: opacity 0.2s;
}
</style>
