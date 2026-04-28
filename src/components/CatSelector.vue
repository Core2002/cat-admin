<template>
  <div class="cat-selector">
    <div class="row items-center q-col-gutter-sm q-mb-sm">
      <div v-if="showTreeMode" class="col-auto">
        <q-btn-toggle
          v-model="selectorMode"
          dense
          unelevated
          rounded
          color="primary"
          text-color="white"
          toggle-color="primary"
          :options="[
            { label: '精准筛选', value: 'precise', icon: 'manage_search' },
            { label: '树形浏览', value: 'tree', icon: 'account_tree' }
          ]"
        />
      </div>
      <div class="col text-caption text-grey">
        {{ helperText }}
      </div>
    </div>

    <template v-if="selectorMode === 'precise'">
      <div class="row q-col-gutter-sm">
        <div v-if="showSiteFilter" class="col-12 col-md-4">
          <q-select
            v-model="selectedSiteFilter"
            outlined
            dense
            clearable
            emit-value
            map-options
            :options="siteFilterOptions"
            option-value="value"
            option-label="label"
            label="按设施筛选"
          >
            <template #prepend>
              <q-icon name="domain" />
            </template>
          </q-select>
        </div>
        <div :class="showSiteFilter ? 'col-12 col-md-8' : 'col-12'">
          <q-select
            v-model="innerValue"
            outlined
            dense
            clearable
            use-input
            fill-input
            hide-selected
            input-debounce="0"
            emit-value
            map-options
            option-value="catId"
            option-label="name"
            :options="filteredCatOptions"
            :display-value="selectedCatSummary"
            :label="label"
            @filter="filterCatOptions"
          >
            <template #prepend>
              <q-icon name="pets" />
            </template>
            <template #option="scope">
              <q-item v-bind="scope.itemProps" dense class="q-py-sm">
                <q-item-section avatar>
                  <q-avatar color="secondary" text-color="white" size="32px">
                    <q-icon name="pets" size="18px" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ scope.opt.name }}
                    <q-badge class="q-ml-xs" color="grey-7" text-color="white" :label="`#${scope.opt.catId}`" />
                  </q-item-label>
                  <q-item-label caption>
                    {{ scope.opt.siteName }} · {{ scope.opt.type }} · {{ scope.opt.gender }} · 主人：{{ scope.opt.master }}
                  </q-item-label>
                  <q-item-label caption>
                    电话：{{ scope.opt.phone }}
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
        </div>
      </div>
      <div class="text-caption text-grey q-mt-xs">
        当前候选：{{ filteredCatOptions.length }} 只
      </div>
    </template>

    <template v-else>
      <q-input
        v-model="treeFilter"
        outlined
        dense
        clearable
        class="q-mb-sm"
        placeholder="搜索设施或猫咪"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
      <q-tree
        :nodes="filteredTreeNodes"
        node-key="id"
        label-key="label"
        :selected="treeSelected"
        :expanded="treeExpanded"
        selected-color="primary"
        @update:selected="onTreeSelect"
        @update:expanded="onTreeExpand"
      >
        <template #default-header="prop">
          <q-item class="full-width q-pa-xs" dense>
            <q-item-section avatar class="q-pr-sm">
              <q-avatar
                :color="prop.node.type === 'site' ? 'primary' : 'secondary'"
                text-color="white"
                size="32px"
              >
                <q-icon :name="prop.node.type === 'site' ? 'domain' : 'pets'" size="18px" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-weight-medium">{{ prop.node.label }}</q-item-label>
              <q-item-label caption v-if="prop.node.type === 'cat'">
                {{ prop.node.typeText }} · {{ prop.node.genderText }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>
      </q-tree>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Cat, Site } from 'src/api';

interface TreeNode {
  id: string;
  label: string;
  type: 'site' | 'cat';
  siteId: number | null;
  catId?: number;
  typeText?: string;
  genderText?: string;
  children?: TreeNode[];
}

interface CatOption {
  catId: number;
  name: string;
  type: string;
  gender: string;
  master: string;
  phone: string;
  siteId: number | null;
  siteName: string;
  searchText: string;
}

const props = withDefaults(defineProps<{
  modelValue: number | null;
  cats: Cat[];
  sites: Site[];
  catSiteMap: Record<number, number | null>;
  label?: string;
  helperText?: string;
  showTreeMode?: boolean;
  defaultMode?: 'precise' | 'tree';
  allowUnassigned?: boolean;
  autoSelectSiteFromCat?: boolean;
  showSiteFilter?: boolean;
  siteFilterValue?: number | null;
}>(), {
  label: '选择猫咪（支持姓名/编号/品种/主人/电话搜索）',
  helperText: '先精准筛选，找不到时可切换树形浏览',
  showTreeMode: true,
  defaultMode: 'precise',
  allowUnassigned: true,
  autoSelectSiteFromCat: true,
  showSiteFilter: true,
  siteFilterValue: null,
});

const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
  (e: 'site-change', value: number | null): void;
}>();

const selectorMode = ref<'precise' | 'tree'>(props.showTreeMode ? props.defaultMode : 'precise');
const selectedSiteFilter = ref<number | null>(null);
const catQuery = ref('');
const treeSelected = ref<string | null>(null);
const treeExpanded = ref<string[]>([]);
const treeFilter = ref('');

const innerValue = computed({
  get: () => props.modelValue,
  set: (value: number | null) => {
    emit('update:modelValue', value);
    const siteId = value ? props.catSiteMap[value] ?? null : null;
    emit('site-change', props.autoSelectSiteFromCat ? siteId : null);
    if (value) {
      treeSelected.value = `cat-${value}`;
      if (siteId && props.autoSelectSiteFromCat) {
        selectedSiteFilter.value = siteId;
      }
    } else {
      treeSelected.value = null;
    }
  },
});

const siteFilterOptions = computed(() => {
  return props.sites.map((site) => ({ label: site.site_name, value: site.site_id }));
});

function getSiteName(siteId: number | null) {
  if (!siteId) return '未分配设施';
  return props.sites.find((s) => s.site_id === siteId)?.site_name || `设施#${siteId}`;
}

const catOptions = computed<CatOption[]>(() => {
  return props.cats.map((cat) => {
    const siteId = props.catSiteMap[cat.cat_id] ?? null;
    const siteName = getSiteName(siteId);
    const master = cat.master_name || '未记录';
    const phone = cat.master_phone_number || '未记录';
    return {
      catId: cat.cat_id,
      name: cat.cat_name,
      type: cat.cat_type || '未记录',
      gender: cat.cat_gender || '未记录',
      master,
      phone,
      siteId,
      siteName,
      searchText: [cat.cat_id, cat.cat_name, cat.cat_type, cat.cat_gender, master, phone, siteName].join(' ').toLowerCase(),
    };
  });
});

const filteredCatOptions = computed(() => {
  const keyword = catQuery.value.trim().toLowerCase();
  const currentSiteFilter = props.siteFilterValue ?? selectedSiteFilter.value;
  return catOptions.value.filter((item) => {
    const siteMatched = !currentSiteFilter || item.siteId === currentSiteFilter;
    const unassignedMatched = props.allowUnassigned || item.siteId !== null;
    const keywordMatched = !keyword || item.searchText.includes(keyword);
    return siteMatched && unassignedMatched && keywordMatched;
  });
});

const selectedCatSummary = computed(() => {
  if (!props.modelValue) return '';
  const selected = catOptions.value.find((item) => item.catId === props.modelValue);
  if (!selected) return '';
  return `${selected.name} · ${selected.siteName} · ${selected.type} · ${selected.gender} · 主人:${selected.master}`;
});

const treeNodes = computed<TreeNode[]>(() => {
  const nodes: TreeNode[] = [];
  const siteIds = new Set(props.sites.map((s) => s.site_id));

  props.sites.forEach((site) => {
    const catsInSite = props.cats.filter((cat) => (props.catSiteMap[cat.cat_id] ?? null) === site.site_id);
    nodes.push({
      id: `site-${site.site_id}`,
      label: site.site_name,
      type: 'site',
      siteId: site.site_id,
      children: catsInSite.map((cat) => ({
        id: `cat-${cat.cat_id}`,
        label: cat.cat_name,
        type: 'cat',
        siteId: site.site_id,
        catId: cat.cat_id,
        typeText: cat.cat_type || '未记录',
        genderText: cat.cat_gender || '未记录',
      })),
    });
  });

  const unassigned = props.cats.filter((cat) => {
    const siteId = props.catSiteMap[cat.cat_id] ?? null;
    return !siteId || !siteIds.has(siteId);
  });

  if (props.allowUnassigned && unassigned.length > 0) {
    nodes.push({
      id: 'site-unassigned',
      label: '未分配设施',
      type: 'site',
      siteId: null,
      children: unassigned.map((cat) => ({
        id: `cat-${cat.cat_id}`,
        label: cat.cat_name,
        type: 'cat',
        siteId: null,
        catId: cat.cat_id,
        typeText: cat.cat_type || '未记录',
        genderText: cat.cat_gender || '未记录',
      })),
    });
  }

  return nodes;
});

const filteredTreeNodes = computed<TreeNode[]>(() => {
  const keyword = treeFilter.value.trim().toLowerCase();
  if (!keyword) return treeNodes.value;

  const filterNodes = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];
    for (const node of nodes) {
      const labelMatched = node.label.toLowerCase().includes(keyword);
      const children = node.children ? filterNodes(node.children) : [];
      if (labelMatched || children.length > 0) {
        result.push(children.length > 0 ? { ...node, children } : { ...node });
      }
    }
    return result;
  };
  return filterNodes(treeNodes.value);
});

function filterCatOptions(val: string, update: (callback: () => void) => void) {
  update(() => {
    catQuery.value = val;
  });
}

function onTreeExpand(expanded: readonly string[]) {
  treeExpanded.value = [...expanded];
}

function onTreeSelect(nodeId: string | null) {
  treeSelected.value = nodeId;
  if (!nodeId || nodeId.startsWith('site-')) {
    return;
  }
  const catId = Number(nodeId.replace('cat-', ''));
  if (!Number.isNaN(catId)) {
    innerValue.value = catId;
  }
}

watch(
  () => props.modelValue,
  (value) => {
    treeSelected.value = value ? `cat-${value}` : null;
  },
  { immediate: true }
);

watch(
  () => props.showTreeMode,
  (show) => {
    if (!show) {
      selectorMode.value = 'precise';
    }
  }
);

watch(
  () => props.siteFilterValue,
  (siteId) => {
    if (siteId !== undefined) {
      selectedSiteFilter.value = siteId;
    }
  },
  { immediate: true }
);
</script>
