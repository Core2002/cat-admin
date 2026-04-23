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
          <q-btn v-if="!currentTable.readonly" color="primary" icon="add" label="新增" @click="onAdd" />
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
              <template v-else-if="props.col.name === 'action_detail'">
                {{ formatActionDetail(props.value) }}
              </template>
              <template v-else-if="isImageField(props.col.name) && props.value">
                <q-img
                  :src="props.value"
                  style="width: 60px; height: 60px; border-radius: 4px; cursor: pointer"
                  fit="cover"
                  @click="showImagePreview(props.value)"
                >
                  <template #error>
                    <div class="absolute-full flex flex-center bg-grey-3 text-grey-6">
                      <q-icon name="broken_image" size="24px" />
                    </div>
                  </template>
                </q-img>
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
              <q-btn v-if="!currentTable?.readonly && !currentTable?.canCreate" flat round dense icon="edit" size="sm" @click="onEdit(props.row)">
                <q-tooltip>编辑</q-tooltip>
              </q-btn>
              <q-btn v-if="!currentTable?.readonly && !currentTable?.canCreate" flat round dense icon="delete" size="sm" color="negative" @click="onDelete(props.row)">
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
              >
                <template v-if="isImageField(col.name) && editDialog.form[col.name]" #append>
                  <q-btn flat round dense icon="image" size="sm" @click="showImagePreview(editDialog.form[col.name] as string)">
                    <q-tooltip>预览图片</q-tooltip>
                  </q-btn>
                </template>
              </q-input>
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
              <!-- JSON type for action_detail -->
              <template v-else-if="col.type === 'json' && col.name === 'action_detail'">
                <div class="col-12">
                  <q-item-label class="text-caption text-grey q-mb-sm">详情数据</q-item-label>
                  <template v-for="field in currentActionDetailFields" :key="field.key">
                    <q-input
                      v-if="field.type === 'number'"
                      :model-value="(editDialog.form.action_detail as Record<string, unknown>)?.[field.key] as number"
                      @update:model-value="setActionDetailField(field.key, $event)"
                      :label="field.label + (field.unit ? ` (${field.unit})` : '')"
                      outlined
                      dense
                      type="number"
                      class="q-mb-sm"
                    />
                    <q-input
                      v-else-if="field.type === 'string'"
                      :model-value="(editDialog.form.action_detail as Record<string, unknown>)?.[field.key] as string"
                      @update:model-value="setActionDetailField(field.key, $event)"
                      :label="field.label"
                      outlined
                      dense
                      class="q-mb-sm"
                    />
                    <q-select
                      v-else-if="field.type === 'select'"
                      :model-value="(editDialog.form.action_detail as Record<string, unknown>)?.[field.key] as string"
                      @update:model-value="setActionDetailField(field.key, $event)"
                      :label="field.label"
                      :options="field.options || []"
                      outlined
                      dense
                      emit-value
                      map-options
                      class="q-mb-sm"
                    />
                  </template>
                </div>
              </template>
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

    <!-- Image Preview Dialog -->
    <q-dialog v-model="imagePreview.show">
      <q-card flat class="q-dialog-plugin" style="max-width: 90vw; max-height: 90vh">
        <q-card-section class="row items-center q-pb-none">
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-img
            :src="imagePreview.url"
            style="max-width: 85vw; max-height: 80vh"
            fit="contain"
          >
            <template #error>
              <div class="absolute-full flex flex-center bg-grey-3 text-grey-6 column items-center q-pa-md">
                <q-icon name="broken_image" size="64px" />
                <div class="q-mt-md">图片加载失败</div>
              </div>
            </template>
          </q-img>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  catApi,
  siteApi,
  catActionApi,
  catEventApi,
  catFsmApi,
  siteFsmApi,
  siteActionApi,
  type Cat,
  type CatCreate,
  type Site,
  type SiteCreate,
  type CatAction,
  type CatActionCreate,
  type CatEvent,
  type CatEventCreate,
  type CatFSM,
  type SiteFSM,
  type SiteAction,
  type SiteActionCreate,
} from 'src/api';

type TableRow = Cat | Site | CatAction | CatEvent | CatFSM | SiteFSM | SiteAction;

interface ColumnDef {
  name: string;
  label: string;
  field: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  type?: 'string' | 'number' | 'select' | 'textarea' | 'url' | 'phone' | 'time' | 'json';
  options?: string[];
  required?: boolean;
  editable?: boolean;
}

// Action detail field definitions per action type
interface ActionDetailField {
  key: string;
  label: string;
  type: 'number' | 'string' | 'select';
  options?: string[];
  unit?: string;
}

const actionDetailFields: Record<string, ActionDetailField[]> = {
  '测体温': [{ key: 'temperature_c', label: '体温', type: 'number', unit: '℃' }],
  '绝育': [{ key: 'notes', label: '备注', type: 'string' }],
  '体检': [
    { key: 'temperature_c', label: '体温', type: 'number', unit: '℃' },
    { key: 'weight', label: '体重', type: 'number', unit: 'kg' },
    { key: 'notes', label: '备注', type: 'string' },
  ],
  '驱虫': [
    { key: 'drug_name', label: '药物名称', type: 'string' },
    { key: 'dosage', label: '剂量', type: 'string' },
  ],
  '修剪指甲': [{ key: 'notes', label: '备注', type: 'string' }],
  '洗澡': [{ key: 'notes', label: '备注', type: 'string' }],
  '疫苗': [
    { key: 'vaccine_name', label: '疫苗名称', type: 'string' },
    { key: 'batch_no', label: '批号', type: 'string' },
  ],
};

interface TableDef {
  name: string;
  label: string;
  icon: string;
  primaryKey: string;
  columns: ColumnDef[];
  count: number;
  readonly?: boolean; // 完全只读
  canCreate?: boolean; // 只能创建，不能编辑/删除
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
      { name: 'cat_id', label: '猫咪 ID', field: 'cat_id', align: 'left', sortable: true, type: 'number', editable: false },
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
      { name: 'site_id', label: '设施 ID', field: 'site_id', align: 'left', sortable: true, type: 'number', editable: false },
      { name: 'site_name', label: '名称', field: 'site_name', align: 'left', sortable: true, type: 'string', required: true, editable: true },
      { name: 'site_address', label: '地址', field: 'site_address', align: 'left', type: 'string', required: true, editable: true },
      { name: 'site_admin_phone_number', label: '管理员电话', field: 'site_admin_phone_number', type: 'phone', required: true, editable: false },
      { name: 'created_at', label: '创建时间', field: 'created_at', align: 'left', type: 'time', sortable: true, editable: false },
    ],
  },
  {
    name: 'cat_actions',
    label: '操作记录',
    icon: 'history',
    primaryKey: 'action_id',
    count: 0,
    canCreate: true,
    columns: [
      { name: 'action_id', label: '操作 ID', field: 'action_id', align: 'left', sortable: true, type: 'number', editable: false },
      { name: 'cat_id', label: '猫咪 ID', field: 'cat_id', align: 'left', type: 'number', required: true, editable: true },
      { name: 'site_id', label: '设施 ID', field: 'site_id', align: 'left', type: 'number', required: true, editable: true },
      { name: 'user_id', label: '用户 ID', field: 'user_id', align: 'left', type: 'number', required: true, editable: true },
      { name: 'action_type', label: '动作类型', field: 'action_type', align: 'left', type: 'select', options: ['测体温', '绝育', '体检', '驱虫', '修剪指甲', '洗澡', '疫苗'], required: true, editable: true },
      { name: 'action_detail', label: '详情', field: 'action_detail', type: 'json', required: true, editable: true },
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
      { name: 'event_id', label: '事件 ID', field: 'event_id', align: 'left', sortable: true, type: 'number', editable: false },
      { name: 'cat_id', label: '猫咪 ID', field: 'cat_id', align: 'left', type: 'number', required: true, editable: false },
      { name: 'site_id', label: '设施 ID', field: 'site_id', align: 'left', type: 'number', required: true, editable: false },
      { name: 'user_id', label: '用户 ID', field: 'user_id', align: 'left', type: 'number', required: true, editable: false },
      { name: 'event_type', label: '事件类型', field: 'event_type', align: 'left', type: 'select', options: ['生病', '受伤', '怀孕', '分娩', '死亡', '合同解除'], required: true, editable: false },
      { name: 'detail', label: '详情', field: 'detail', type: 'textarea', required: true, editable: false },
      { name: 'created_at', label: '创建时间', field: 'created_at', align: 'left', type: 'time', sortable: true, editable: false },
    ],
  },
  {
    name: 'cat_fsms',
    label: '猫咪状态机',
    icon: 'settings_suggest',
    primaryKey: 'cat_id',
    count: 0,
    readonly: true,
    columns: [
      { name: 'cat_id', label: '猫咪 ID', field: 'cat_id', align: 'left', sortable: true, type: 'number', editable: false },
      { name: 'site_id', label: '设施 ID', field: 'site_id', align: 'left', type: 'number', required: true, editable: false },
      { name: 'temperature_c', label: '体温 (℃)', field: 'temperature_c', align: 'right', type: 'number', required: true, editable: true },
      { name: 'weight_kg', label: '体重 (kg)', field: 'weight_kg', align: 'right', type: 'number', required: true, editable: true },
      { name: 'trim_nails_time', label: '修剪指甲时间', field: 'trim_nails_time', align: 'left', type: 'time', required: true, editable: false },
    ],
  },
  {
    name: 'site_fsms',
    label: '设施状态机',
    icon: 'tune',
    primaryKey: 'site_id',
    count: 0,
    readonly: true,
    columns: [
      { name: 'site_id', label: '设施 ID', field: 'site_id', align: 'left', sortable: true, type: 'number', editable: false },
      { name: 'last_disinfect_time', label: '上次消毒', field: 'last_disinfect_time', align: 'left', type: 'time', required: true, editable: false },
      { name: 'last_feed_time', label: '上次喂食', field: 'last_feed_time', align: 'left', type: 'time', required: true, editable: false },
      { name: 'last_give_water_time', label: '上次喂水', field: 'last_give_water_time', align: 'left', type: 'time', required: true, editable: false },
      { name: 'last_play_time', label: '上次逗猫', field: 'last_play_time', align: 'left', type: 'time', required: true, editable: false },
      { name: 'last_clean_litter_time', label: '上次清理猫砂', field: 'last_clean_litter_time', align: 'left', type: 'time', required: true, editable: false },
    ],
  },
  {
    name: 'site_actions',
    label: '设施操作记录',
    icon: 'construction',
    primaryKey: 'action_id',
    count: 0,
    canCreate: true,
    columns: [
      { name: 'action_id', label: '操作 ID', field: 'action_id', align: 'left', sortable: true, type: 'number', editable: false },
      { name: 'site_id', label: '设施 ID', field: 'site_id', align: 'left', type: 'number', required: true, editable: true },
      { name: 'user_id', label: '用户 ID', field: 'user_id', align: 'left', type: 'number', required: true, editable: true },
      { name: 'action_type', label: '动作类型', field: 'action_type', align: 'left', type: 'select', options: ['消毒', '喂食', '喂水', '逗猫', '清理猫砂'], required: true, editable: true },
      { name: 'action_detail', label: '详情', field: 'action_detail', type: 'textarea', required: true, editable: true },
      { name: 'created_at', label: '创建时间', field: 'created_at', align: 'left', type: 'time', sortable: true, editable: false },
      { name: 'updated_at', label: '更新时间', field: 'updated_at', align: 'left', type: 'time', sortable: true, editable: false },
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
  // 表单显示：必填字段 + 可编辑字段，排除系统自动生成的字段
  return currentTable.value?.columns.filter((col) => 
    (col.required || col.editable) && 
    !['created_at', 'updated_at'].includes(col.name)
  ) || [];
});

// Get action detail fields based on current action_type
const currentActionDetailFields = computed(() => {
  if (selectedTable.value !== 'cat_actions') return [];
  const actionType = editDialog.value.form.action_type as string;
  if (!actionType) return [];
  return actionDetailFields[actionType] || [];
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

// Image Preview Dialog
const imagePreview = ref({
  show: false,
  url: '',
});

// Popup Edit (state no longer needed, values passed directly)

// Select table
function onSelectTable(tableName: string) {
  selectedTable.value = tableName;
  pagination.value.page = 1;
  tableData.value = []; // 清空旧数据，避免键冲突
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
      case 'site_actions':
        result = await siteActionApi.list(page, rowsPerPage);
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
    const [cats, sites, actions, events, catFsms, siteFsms, siteActions] = await Promise.all([
      catApi.list(1, 1),
      siteApi.list(1, 1),
      catActionApi.list(1, 1),
      catEventApi.list(1, 1),
      catFsmApi.list(1, 1),
      siteFsmApi.list(1, 1),
      siteActionApi.list(1, 1),
    ]);

    tables.value.forEach((t, i) => {
      const totals = [cats.total, sites.total, actions.total, events.total, catFsms.total, siteFsms.total, siteActions.total];
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

// Set action detail field (for JSON type)
function setActionDetailField(key: string, value: unknown) {
  if (!editDialog.value.form.action_detail) {
    editDialog.value.form.action_detail = {};
  }
  const detail = editDialog.value.form.action_detail as Record<string, unknown>;
  const field = currentActionDetailFields.value.find((f) => f.key === key);
  if (field?.type === 'number' && value !== null && value !== undefined && value !== '') {
    detail[key] = Number(value);
  } else {
    detail[key] = value;
  }
}

// CRUD Operations
function onAdd() {
  if (!currentTable.value) return;

  const form: Record<string, unknown> = {};
  editableColumns.value.forEach((col) => {
    if (col.type === 'json') {
      form[col.name] = {};
    } else if (col.type === 'select') {
      form[col.name] = col.options?.[0];
    } else {
      form[col.name] = null;
    }
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
    const rawValue = (row as unknown as Record<string, unknown>)[col.name];
    if (col.type === 'json' && typeof rawValue === 'string') {
      // Parse JSON string to object for editing
      try {
        form[col.name] = JSON.parse(rawValue);
      } catch {
        form[col.name] = {};
      }
    } else {
      form[col.name] = rawValue;
    }
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
function prepareFormData(formData: Record<string, unknown>, isEdit: boolean): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const columns = currentTable.value?.columns || [];
  const primaryKey = currentTable.value?.primaryKey;

  for (const [key, value] of Object.entries(formData)) {
    // Skip primary key field when creating new record
    if (!isEdit && key === primaryKey) continue;
    
    if (value === null || value === undefined || value === '') continue;

    const col = columns.find((c) => c.name === key);

    if (col?.type === 'number') {
      result[key] = Number(value);
    } else if (col?.type === 'json') {
      // Serialize JSON object to string
      if (typeof value === 'object') {
        result[key] = JSON.stringify(value);
      } else {
        result[key] = value;
      }
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
    const data = prepareFormData(form, isEdit);

    switch (selectedTable.value) {
      case 'cats':
        if (isEdit) {
          await catApi.update(id!, data);
        } else {
          await catApi.create(data as unknown as CatCreate);
        }
        break;
      case 'sites':
        if (isEdit) {
          await siteApi.update(id!, data);
        } else {
          await siteApi.create(data as unknown as SiteCreate);
        }
        break;
      case 'cat_actions':
        // 只支持创建，不支持编辑
        if (!isEdit) {
          await catActionApi.create(data as unknown as CatActionCreate);
        }
        break;
      case 'cat_events':
        if (isEdit) {
          await catEventApi.update(id!, data);
        } else {
          await catEventApi.create(data as unknown as CatEventCreate);
        }
        break;
      case 'site_actions':
        // 只支持创建，不支持编辑
        if (!isEdit) {
          await siteActionApi.create(data as unknown as SiteActionCreate);
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
      case 'cat_events':
        await catEventApi.delete(id);
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
  // 处理时区：如果时间字符串不包含时区信息，假定其为 UTC 时间
  let dateStr = value;
  // ISO 格式但不带时区后缀 (Z 或 +/-HH:MM)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    dateStr = dateStr + 'Z';
  }
  // Convert ISO datetime to datetime-local format (YYYY-MM-DDTHH:mm)
  const date = new Date(dateStr);
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

function formatActionDetail(value: unknown): string {
  if (typeof value !== 'string') return '-';
  try {
    const obj = JSON.parse(value) as Record<string, unknown>;
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join(', ');
  } catch {
    return value;
  }
}

function formatTime(value: string | null | undefined): string {
  if (!value) return '-';
  // 处理时区：如果时间字符串不包含时区信息，假定其为 UTC 时间
  let dateStr = value;
  // ISO 格式但不带时区后缀 (Z 或 +/-HH:MM)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    dateStr = dateStr + 'Z'; // 添加 Z 后缀，让 JS 把它当作 UTC 时间
  }
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function showDetail(title: string, content: string) {
  detailDialog.value = { show: true, title, content };
}

// Image preview helpers
function isImageField(name: string): boolean {
  return name === 'cat_photo_uri';
}

function showImagePreview(url: string) {
  imagePreview.value = { show: true, url };
}

// Popup Edit helpers
function isEditableColumn(name: string): boolean {
  // readonly 和 canCreate 表不允许内联编辑
  if (currentTable.value?.readonly || currentTable.value?.canCreate) return false;
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

    const data = prepareFormData(updateData, true); // popup edit is always an update

    switch (selectedTable.value) {
      case 'cats':
        await catApi.update(id, data);
        break;
      case 'sites':
        await siteApi.update(id, data);
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

onMounted(() => {
  void loadCounts();
  // 默认选中猫咪表
  selectedTable.value = 'cats';
  void loadData();
});
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
