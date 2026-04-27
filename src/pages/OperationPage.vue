<template>
  <q-page class="app-page">
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
      <q-banner rounded class="bg-blue-1 text-blue-10 q-mb-md">
        <div class="row items-center q-col-gutter-sm">
          <div class="col-auto">
            <q-icon name="place" />
            当前设施：<span class="text-weight-bold">{{ selectedSiteLabel }}</span>
          </div>
          <div class="col-auto">
            <q-icon name="pets" />
            当前猫咪：<span class="text-weight-bold">{{ selectedCatLabel }}</span>
          </div>
          <div class="col-auto">
            <q-btn flat dense size="sm" icon="restart_alt" label="清空选择" @click="onTreeSelect(null)" />
          </div>
        </div>
      </q-banner>

      <!-- 选择区域：树形选择器 -->
      <q-card class="q-mb-lg">
        <q-card-section>
          <div class="row items-center q-col-gutter-sm">
            <div class="col">
              <q-item-label header class="q-pa-none">
                <q-icon name="account_tree" class="q-mr-sm" />
                选择工作地点和猫咪
              </q-item-label>
            </div>
            <div class="col-auto">
              <q-btn flat dense size="sm" icon="unfold_more" label="展开全部" @click="expandAllSites" />
            </div>
            <div class="col-auto">
              <q-btn flat dense size="sm" icon="unfold_less" label="收起全部" @click="collapseAllSites" />
            </div>
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          <q-input
            v-model="treeFilter"
            outlined
            dense
            clearable
            class="q-mb-sm"
            placeholder="搜索设施或猫咪"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
          <q-tree
            :nodes="filteredTreeNodes"
            node-key="id"
            label-key="label"
            :selected="treeSelected"
            :expanded="treeExpanded"
            @update:selected="onTreeSelect"
            @update:expanded="onTreeExpand"
            selected-color="primary"
            class="q-mt-sm"
          >
            <template v-slot:default-header="prop">
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
                  <q-item-label caption v-if="prop.node.type === 'cat' && prop.node.catInfo">
                    {{ prop.node.catInfo.cat_type }} · {{ prop.node.catInfo.cat_gender }}
                  </q-item-label>
                </q-item-section>
                <q-item-section side v-if="prop.node.type === 'cat' && prop.node.catInfo?.cat_gender">
                  <q-badge
                    :color="prop.node.catInfo.cat_gender === '公' ? 'blue' : 'pink'"
                    :label="prop.node.catInfo.cat_gender"
                  />
                </q-item-section>
              </q-item>
            </template>
          </q-tree>
          <q-item v-if="filteredTreeNodes.length === 0" class="text-grey">
            <q-item-section class="text-center">
              <q-item-label caption>{{ treeNodes.length === 0 ? '暂无设施数据' : '没有匹配的搜索结果' }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-card-section>
      </q-card>

      <!-- 设施信息面板 -->
      <q-card v-if="selectedSite" class="q-mb-lg">
        <q-inner-loading :showing="siteInfoLoading">
          <q-spinner-gears size="40px" color="primary" />
        </q-inner-loading>

        <template v-if="siteDetail">
          <q-card-section class="q-pa-md">
            <div class="row q-col-gutter-md">
              <!-- 左侧：基本信息 -->
              <div class="col-12 col-md-4">
              <q-item class="q-pa-none">
                <q-item-section avatar>
                  <q-avatar size="50px" color="primary" text-color="white" icon="domain" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-h6 text-weight-bold">{{ siteDetail.site_name }}</q-item-label>
                </q-item-section>
              </q-item>

              <q-separator class="q-my-md" />

              <q-item-label header class="q-pa-none q-mb-sm">联系方式</q-item-label>
              <q-item dense class="q-pa-none">
                <q-item-section avatar class="q-pr-sm">
                  <q-icon name="place" color="grey" size="20px" />
                </q-item-section>
                <q-item-label class="text-body2">{{ siteDetail.site_address || '未记录' }}</q-item-label>
              </q-item>
              <q-item dense class="q-pa-none">
                <q-item-section avatar class="q-pr-sm">
                  <q-icon name="phone" color="grey" size="20px" />
                </q-item-section>
                <q-item-label class="text-body2">{{ siteDetail.site_admin_phone_number || '未记录' }}</q-item-label>
              </q-item>
              </div>

              <!-- 右侧：状态和近期记录 -->
              <div class="col-12 col-md-8">
              <!-- 状态指标 -->
              <q-item-label header class="q-pa-none q-mb-sm">最近操作时间</q-item-label>
              <q-card flat bordered class="q-mb-md">
                <q-card-section class="q-pa-sm">
                  <div class="row q-col-gutter-sm">
                    <div class="col-6 col-sm-4 col-md-4 col-lg-3">
                      <q-card flat bordered class="site-metric-card">
                        <q-card-section class="text-center q-pa-sm">
                          <q-icon name="restaurant" color="primary" size="24px" />
                          <div class="text-caption q-mt-xs">{{ siteFsm?.last_feed_time ? formatDateTime(siteFsm.last_feed_time) : '-' }}</div>
                          <div class="text-grey-7">喂食</div>
                        </q-card-section>
                      </q-card>
                    </div>
                    <div class="col-6 col-sm-4 col-md-4 col-lg-3">
                      <q-card flat bordered class="site-metric-card">
                        <q-card-section class="text-center q-pa-sm">
                          <q-icon name="water_drop" color="info" size="24px" />
                          <div class="text-caption q-mt-xs">{{ siteFsm?.last_give_water_time ? formatDateTime(siteFsm.last_give_water_time) : '-' }}</div>
                          <div class="text-grey-7">喂水</div>
                        </q-card-section>
                      </q-card>
                    </div>
                    <div class="col-6 col-sm-4 col-md-4 col-lg-3">
                      <q-card flat bordered class="site-metric-card">
                        <q-card-section class="text-center q-pa-sm">
                          <q-icon name="cleaning_services" color="positive" size="24px" />
                          <div class="text-caption q-mt-xs">{{ siteFsm?.last_disinfect_time ? formatDateTime(siteFsm.last_disinfect_time) : '-' }}</div>
                          <div class="text-grey-7">消毒</div>
                        </q-card-section>
                      </q-card>
                    </div>
                    <div class="col-6 col-sm-4 col-md-4 col-lg-3">
                      <q-card flat bordered class="site-metric-card">
                        <q-card-section class="text-center q-pa-sm">
                          <q-icon name="sports_esports" color="secondary" size="24px" />
                          <div class="text-caption q-mt-xs">{{ siteFsm?.last_play_time ? formatDateTime(siteFsm.last_play_time) : '-' }}</div>
                          <div class="text-grey-7">逗猫</div>
                        </q-card-section>
                      </q-card>
                    </div>
                    <div class="col-6 col-sm-4 col-md-4 col-lg-3">
                      <q-card flat bordered class="site-metric-card">
                        <q-card-section class="text-center q-pa-sm">
                          <q-icon name="delete_outline" color="accent" size="24px" />
                          <div class="text-caption q-mt-xs">{{ siteFsm?.last_clean_litter_time ? formatDateTime(siteFsm.last_clean_litter_time) : '-' }}</div>
                          <div class="text-grey-7">清理猫砂</div>
                        </q-card-section>
                      </q-card>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- 近期操作记录 -->
              <q-item-label header class="q-pa-none q-mb-sm">近期操作</q-item-label>
              <q-list dense bordered class="rounded-borders" v-if="recentSiteActions.length > 0">
                <q-item v-for="action in recentSiteActions" :key="action.action_id">
                  <q-item-section avatar>
                    <q-avatar :color="getSiteActionColor(action.action_type)" text-color="white" size="28px">
                      <q-icon :name="getSiteActionIcon(action.action_type)" size="16px" />
                    </q-avatar>
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ action.action_type }}</q-item-label>
                    <q-item-label caption>{{ formatDateTime(action.created_at) }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <q-item v-else dense class="text-grey bordered">
                <q-item-section class="text-center">
                  <q-item-label caption>暂无操作记录</q-item-label>
                </q-item-section>
              </q-item>
              </div>
            </div>
          </q-card-section>
        </template>
      </q-card>

      <!-- 猫咪信息面板 -->
      <q-card v-if="selectedCat" class="q-mb-lg">
        <q-inner-loading :showing="catInfoLoading">
          <q-spinner-gears size="40px" color="primary" />
        </q-inner-loading>

        <template v-if="catDetail">
          <!-- 头部：头像和基本信息 -->
          <q-card-section class="q-pa-md">
            <div class="row q-col-gutter-md">
            <q-card-section class="col-12 col-md-4 q-pa-md">
              <q-item class="q-pa-none">
                <q-item-section avatar>
                  <q-avatar size="80px">
                    <img
                      v-if="catDetail.cat_photo_uri"
                      :src="catDetail.cat_photo_uri"
                      @error="($event.target as HTMLImageElement).style.display='none'"
                    />
                    <q-icon v-else name="pets" size="50px" color="grey-5" />
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-h5 text-weight-bold">{{ catDetail.cat_name }}</q-item-label>
                  <q-item-label>
                    <q-badge :color="catDetail.cat_gender === '公' ? 'blue' : 'pink'" :label="catDetail.cat_gender" class="q-mr-xs" />
                    <q-badge color="grey" :label="catDetail.cat_type" />
                  </q-item-label>
                </q-item-section>
              </q-item>

              <q-separator class="q-my-md" />

              <!-- 主人信息 -->
              <q-item-label header class="q-pa-none q-mb-sm">主人信息</q-item-label>
              <q-item dense class="q-pa-none">
                <q-item-section avatar class="q-pr-sm">
                  <q-icon name="person" color="grey" />
                </q-item-section>
                <q-item-label>{{ catDetail.master_name || '未记录' }}</q-item-label>
              </q-item>
              <q-item dense class="q-pa-none">
                <q-item-section avatar class="q-pr-sm">
                  <q-icon name="phone" color="grey" />
                </q-item-section>
                <q-item-label>{{ catDetail.master_phone_number || '未记录' }}</q-item-label>
              </q-item>
            </q-card-section>

            <!-- 右侧：状态和历史记录 -->
            <q-card-section class="col-12 col-md-8 q-pa-md">
              <!-- 状态指标 -->
              <q-item-label header class="q-pa-none q-mb-sm">当前状态</q-item-label>
              <q-card flat bordered class="q-mb-md">
                <q-card-section class="q-pa-sm">
                  <div class="row q-col-gutter-sm">
                    <div class="col-12 col-sm-4">
                      <q-card flat bordered class="status-metric-card">
                        <q-card-section class="text-center q-pa-sm">
                          <q-icon
                            name="thermostat"
                            :color="catFsm && isTemperatureNormal(catFsm.temperature_c) ? 'positive' : 'negative'"
                            size="28px"
                          />
                          <div class="text-subtitle1 q-mt-xs">{{ catFsm?.temperature_c?.toFixed(1) || '-' }}°C</div>
                          <div class="text-caption text-grey-7">体温</div>
                          <q-badge
                            v-if="catFsm"
                            :color="isTemperatureNormal(catFsm.temperature_c) ? 'positive' : 'negative'"
                            :label="isTemperatureNormal(catFsm.temperature_c) ? '正常' : '异常'"
                            class="q-mt-xs"
                          />
                        </q-card-section>
                      </q-card>
                    </div>
                    <div class="col-12 col-sm-4">
                      <q-card flat bordered class="status-metric-card">
                        <q-card-section class="text-center q-pa-sm">
                          <q-icon name="monitor_weight" color="primary" size="28px" />
                          <div class="text-subtitle1 q-mt-xs">{{ catFsm?.weight_kg?.toFixed(1) || '-' }}kg</div>
                          <div class="text-caption text-grey-7">体重</div>
                        </q-card-section>
                      </q-card>
                    </div>
                    <div class="col-12 col-sm-4">
                      <q-card flat bordered class="status-metric-card">
                        <q-card-section class="text-center q-pa-sm">
                          <q-icon name="content_cut" color="secondary" size="28px" />
                          <div class="text-caption q-mt-xs">{{ catFsm?.trim_nails_time ? formatDateTime(catFsm.trim_nails_time) : '-' }}</div>
                          <div class="text-caption text-grey-7">上次修甲</div>
                        </q-card-section>
                      </q-card>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- 近期记录 -->
              <q-item-label header class="q-pa-none q-mb-sm">近期记录</q-item-label>
              <q-card flat bordered>
                <q-card-section class="row q-col-gutter-md">
                  <!-- 近期操作 -->
                  <q-card-section class="q-pa-sm col-12 col-md-6">
                    <q-item-label caption class="q-mb-xs">操作记录</q-item-label>
                    <q-list dense v-if="recentActions.length > 0">
                      <q-item v-for="action in recentActions" :key="action.action_id" class="q-pa-xs">
                        <q-item-section avatar class="q-pr-xs">
                          <q-avatar :color="getActionColor(action.action_type)" text-color="white" size="24px">
                            <q-icon :name="getActionIcon(action.action_type)" size="14px" />
                          </q-avatar>
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ action.action_type }}</q-item-label>
                          <q-item-label caption>{{ formatDateTime(action.created_at) }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                    <q-item v-else dense class="text-grey">
                      <q-item-section class="text-center">
                        <q-item-label caption>暂无操作记录</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-card-section>

                  <q-separator vertical class="gt-sm" />
                  <q-separator class="lt-md q-my-sm" />

                  <!-- 近期事件 -->
                  <q-card-section class="q-pa-sm col-12 col-md-6">
                    <q-item-label caption class="q-mb-xs">事件记录</q-item-label>
                    <q-list dense v-if="recentEvents.length > 0">
                      <q-item v-for="event in recentEvents" :key="event.event_id" class="q-pa-xs">
                        <q-item-section avatar class="q-pr-xs">
                          <q-avatar :color="getEventColor(event.event_type)" text-color="white" size="24px">
                            <q-icon :name="getEventIcon(event.event_type)" size="14px" />
                          </q-avatar>
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>{{ event.event_type }}</q-item-label>
                          <q-item-label caption>{{ event.detail || formatDateTime(event.created_at) }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </q-list>
                    <q-item v-else dense class="text-grey">
                      <q-item-section class="text-center">
                        <q-item-label caption>暂无事件记录</q-item-label>
                      </q-item-section>
                    </q-item>
                  </q-card-section>
                </q-card-section>
              </q-card>
            </q-card-section>
            </div>
          </q-card-section>
        </template>

        <q-card-section v-else-if="!catInfoLoading" class="text-center text-grey q-py-lg">
          <q-icon name="pets" size="48px" color="grey-4" />
          <q-item-label class="q-mt-sm">请选择一只猫咪查看详细信息</q-item-label>
        </q-card-section>
      </q-card>

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
          <q-banner
            v-if="!selectedSite || !selectedCat"
            rounded
            class="bg-grey-2 text-grey-8 q-mb-md"
          >
            先在上方树中选择设施和猫咪后，可使用全部快捷操作（仅设施操作可在未选猫咪时使用）。
          </q-banner>

          <!-- 设施操作 -->
          <div class="text-subtitle2 text-grey q-mb-sm">设施操作</div>
          <div class="row q-col-gutter-sm q-mb-md">
            <div class="col-6 col-sm-4 col-md-3">
              <q-btn
                unelevated
                class="full-width operation-btn"
                color="primary"
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
                color="info"
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
                color="positive"
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
                color="secondary"
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
                color="accent"
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
                color="warning"
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
                color="primary"
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
                color="secondary"
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
                color="info"
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
                color="accent"
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
                color="negative"
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
                color="positive"
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
                color="secondary"
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
                color="negative"
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
                color="warning"
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
                color="secondary"
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
                color="accent"
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
                color="dark"
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
                color="primary"
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
              正常体温范围：37.5°C - 39.5°C
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
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  catApi,
  siteApi,
  catActionApi,
  catEventApi,
  siteActionApi,
  catFsmApi,
  siteFsmApi,
  type Cat,
  type Site,
  type SiteActionType,
  type CatFSM,
  type CatAction,
  type CatEvent,
  type SiteFSM,
  type SiteAction,
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

// 猫咪详细信息
const catDetail = ref<Cat | null>(null);
const catFsm = ref<CatFSM | null>(null);
const recentActions = ref<CatAction[]>([]);
const recentEvents = ref<CatEvent[]>([]);
const catInfoLoading = ref(false);

// 设施详细信息
const siteDetail = ref<Site | null>(null);
const siteFsm = ref<SiteFSM | null>(null);
const recentSiteActions = ref<SiteAction[]>([]);
const siteInfoLoading = ref(false);

// 所有猫咪 FSM 数据（用于确定猫咪归属设施）
const allCatFsms = ref<CatFSM[]>([]);

// 树形选择器数据
interface TreeNode {
  id: string;
  label: string;
  type: 'site' | 'cat';
  siteId?: number;
  catId?: number;
  catInfo?: Cat;
  children?: TreeNode[];
  icon?: string;
}

const treeSelected = ref<string | null>(null);
const treeExpanded = ref<string[]>([]);
const treeFilter = ref('');

// 构建 cat_id -> site_id 的映射（只记录有效的 site_id）
const catSiteMap = computed(() => {
  const map = new Map<number, number>();
  allCatFsms.value.forEach((fsm) => {
    // 只有 site_id 大于 0 才认为是有效分配
    if (fsm.site_id && fsm.site_id > 0) {
      map.set(fsm.cat_id, fsm.site_id);
    }
  });
  return map;
});

// 构建树形节点
const treeNodes = computed<TreeNode[]>(() => {
  const nodes: TreeNode[] = [];
  const siteIds = new Set(sites.value.map((s) => s.site_id));

  // 为每个设施创建节点
  sites.value.forEach((site) => {
    const catsInSite = cats.value.filter((cat) => catSiteMap.value.get(cat.cat_id) === site.site_id);

    nodes.push({
      id: `site-${site.site_id}`,
      label: site.site_name,
      type: 'site',
      siteId: site.site_id,
      children: catsInSite.map((cat) => ({
        id: `cat-${cat.cat_id}`,
        label: cat.cat_name,
        type: 'cat' as const,
        siteId: site.site_id,
        catId: cat.cat_id,
        catInfo: cat,
      })),
    });
  });

  // 找出未分配设施的猫咪（包括：无 FSM 记录、FSM 中 site_id 无效、FSM 中 site_id 对应的设施不存在）
  const unassignedCats = cats.value.filter((cat) => {
    const siteId = catSiteMap.value.get(cat.cat_id);
    return !siteId || !siteIds.has(siteId);
  });

  if (unassignedCats.length > 0) {
    nodes.push({
      id: 'site-unassigned',
      label: '未分配设施',
      type: 'site',
      siteId: -1, // 特殊标记
      children: unassignedCats.map((cat) => ({
        id: `cat-${cat.cat_id}`,
        label: cat.cat_name,
        type: 'cat' as const,
        siteId: -1,
        catId: cat.cat_id,
        catInfo: cat,
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
        if (children.length > 0) {
          result.push({
            ...node,
            children,
          });
        } else {
          result.push({ ...node });
        }
      }
    }
    return result;
  };

  return filterNodes(treeNodes.value);
});

const selectedSiteLabel = computed(() => {
  if (!selectedSite.value) return '未选择';
  return sites.value.find((s) => s.site_id === selectedSite.value)?.site_name || `设施 #${selectedSite.value}`;
});

const selectedCatLabel = computed(() => {
  if (!selectedCat.value) return '未选择';
  return cats.value.find((c) => c.cat_id === selectedCat.value)?.cat_name || `猫咪 #${selectedCat.value}`;
});

// 今日记录
interface TodayRecord {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  timestamp: Date; // 用于排序的原始时间
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

// 树形选择处理
function onTreeSelect(nodeId: string | null) {
  if (!nodeId) {
    selectedSite.value = null;
    selectedCat.value = null;
    catDetail.value = null;
    catFsm.value = null;
    recentActions.value = [];
    recentEvents.value = [];
    siteDetail.value = null;
    siteFsm.value = null;
    recentSiteActions.value = [];
    return;
  }

  if (nodeId === 'site-unassigned') {
    // 选择了"未分配设施"节点
    selectedSite.value = null;
    selectedCat.value = null;
    catDetail.value = null;
    catFsm.value = null;
    recentActions.value = [];
    recentEvents.value = [];
    siteDetail.value = null;
    siteFsm.value = null;
    recentSiteActions.value = [];
    return;
  }

  if (nodeId.startsWith('site-')) {
    // 选择了设施节点
    const siteId = parseInt(nodeId.replace('site-', ''), 10);
    selectedSite.value = siteId;
    selectedCat.value = null;
    catDetail.value = null;
    catFsm.value = null;
    recentActions.value = [];
    recentEvents.value = [];
    void loadSiteInfo();
  } else if (nodeId.startsWith('cat-')) {
    // 选择了猫咪节点
    const catId = parseInt(nodeId.replace('cat-', ''), 10);
    const cat = cats.value.find((c) => c.cat_id === catId);
    if (cat) {
      // 从节点获取 siteId
      const node = findNodeById(nodeId);
      const nodeSiteId = node?.siteId;

      // 如果是未分配设施的猫咪 (siteId === -1)，不设置设施
      if (nodeSiteId && nodeSiteId !== -1) {
        selectedSite.value = nodeSiteId;
        void loadSiteInfo();
      } else {
        selectedSite.value = null;
        siteDetail.value = null;
        siteFsm.value = null;
        recentSiteActions.value = [];
      }

      selectedCat.value = catId;
      void loadCatInfo();
    }
  }
}

// 查找节点
function findNodeById(id: string, nodes?: TreeNode[]): TreeNode | null {
  const searchNodes = nodes || treeNodes.value;
  for (const node of searchNodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNodeById(id, node.children);
      if (found) return found;
    }
  }
  return null;
}

// 树形展开处理
function onTreeExpand(expanded: readonly string[]) {
  treeExpanded.value = [...expanded];
}

function expandAllSites() {
  treeExpanded.value = treeNodes.value
    .filter((n) => n.type === 'site')
    .map((n) => n.id);
}

function collapseAllSites() {
  treeExpanded.value = [];
}

// 加载设施详细信息
async function loadSiteInfo() {
  if (!selectedSite.value) {
    siteDetail.value = null;
    siteFsm.value = null;
    recentSiteActions.value = [];
    return;
  }

  siteInfoLoading.value = true;
  try {
    const [site, fsm, actions] = await Promise.all([
      siteApi.get(selectedSite.value),
      siteFsmApi.getBySite(selectedSite.value),
      siteActionApi.getBySite(selectedSite.value),
    ]);

    siteDetail.value = site;
    siteFsm.value = fsm || null;
    // 按时间降序排序后取最近 5 条
    recentSiteActions.value = actions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  } catch (error) {
    console.error('加载设施信息失败：', error);
    $q.notify({
      type: 'negative',
      message: '加载设施信息失败',
      position: 'top',
    });
  } finally {
    siteInfoLoading.value = false;
  }
}

// 加载猫咪详细信息
async function loadCatInfo() {
  if (!selectedCat.value || !selectedSite.value) {
    catDetail.value = null;
    catFsm.value = null;
    recentActions.value = [];
    recentEvents.value = [];
    return;
  }

  catInfoLoading.value = true;
  try {
    // 并行加载基本信息、FSM 状态、历史操作和事件
    const [cat, fsmList, actions, events] = await Promise.all([
      catApi.get(selectedCat.value),
      catFsmApi.getBySite(selectedSite.value),
      catActionApi.getByCat(selectedCat.value),
      catEventApi.getByCat(selectedCat.value),
    ]);

    catDetail.value = cat;
    // 从 FSM 列表中筛选出当前猫咪的记录
    catFsm.value = fsmList.find((f) => f.cat_id === selectedCat.value) || null;
    // 按时间降序排序后取最近 5 条
    recentActions.value = actions
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
    recentEvents.value = events
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  } catch (error) {
    console.error('加载猫咪信息失败：', error);
    $q.notify({
      type: 'negative',
      message: '加载猫咪信息失败',
      position: 'top',
    });
  } finally {
    catInfoLoading.value = false;
  }
}

// 判断体温是否正常
function isTemperatureNormal(temp: number): boolean {
  return temp >= 37.5 && temp <= 39.5;
}

// 格式化日期时间
function formatDateTime(timeStr: string): string {
  if (!timeStr) return '-';
  let dateStr = timeStr;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    dateStr = dateStr + 'Z';
  }
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
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
        // 设施操作 - 创建 SiteAction 记录，由后端驱动状态机
        if (isFacilityAction && selectedSite.value) {
          const actionTypeMap: Record<string, SiteActionType> = {
            feed: '喂食',
            water: '喂水',
            disinfect: '消毒',
            play: '逗猫',
            litter: '清理猫砂',
          };

          const actionDetailMap: Record<string, string> = {
            feed: JSON.stringify({ note: '通过操作台快速记录' }),
            water: JSON.stringify({ note: '通过操作台快速记录' }),
            disinfect: JSON.stringify({ note: '通过操作台快速记录' }),
            play: JSON.stringify({ note: '通过操作台快速记录' }),
            litter: JSON.stringify({ note: '通过操作台快速记录' }),
          };

          await siteActionApi.create({
            site_id: selectedSite.value,
            user_id: authStore.user?.id || 0,
            action_type: actionTypeMap[action]!,
            action_detail: actionDetailMap[action]!,
          });
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
        console.error('操作失败：', error);
        $q.notify({
          type: 'negative',
          message: '记录失败，请重试',
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

        if (!selectedSite.value) return;

        await catActionApi.create({
          cat_id: selectedCat.value,
          site_id: selectedSite.value,
          user_id: authStore.user?.id || 0,
          action_type: '称重',
          action_detail: JSON.stringify({ weight_kg: weight }),
        });

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
    // 创建操作记录（后端会驱动FSM更新）
    await catActionApi.create({
      cat_id: selectedCat.value,
      site_id: selectedSite.value,
      user_id: authStore.user?.id || 0,
      action_type: '测体温',
      action_detail: JSON.stringify({ temperature_c: temperatureDialog.value.value }),
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
    console.error('记录事件失败：', error);
    $q.notify({
      type: 'negative',
      message: '记录失败，请重试',
      position: 'top',
    });
  } finally {
    eventDialog.value.loading = false;
  }
}

// 解析时间字符串为 Date 对象（处理时区）
function parseDate(timeStr: string): Date {
  let dateStr = timeStr;
  // ISO 格式但不带时区后缀 (Z 或 +/-HH:MM)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    dateStr = dateStr + 'Z';
  }
  return new Date(dateStr);
}

// 加载今日记录
async function loadTodayRecords() {
  try {
    // 使用本地时区的日期范围
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const records: TodayRecord[] = [];

    // 加载今日设施操作记录（从 SiteAction 表读取）
    if (selectedSite.value) {
      const siteActions = await siteActionApi.getBySite(selectedSite.value);
      const todaySiteActions = siteActions.filter((a) => {
        const actionDate = parseDate(a.created_at);
        return actionDate >= todayStart && actionDate < todayEnd;
      });

      todaySiteActions.forEach((action) => {
        records.push({
          id: `site-action-${action.action_id}`,
          title: action.action_type,
          subtitle: getSiteName(action.site_id),
          time: formatTime(action.created_at),
          timestamp: parseDate(action.created_at),
          icon: getSiteActionIcon(action.action_type),
          color: getSiteActionColor(action.action_type),
        });
      });
    }

    // 加载今日猫咪操作记录
    if (selectedCat.value) {
      const actions = await catActionApi.getByCat(selectedCat.value);
      const todayActions = actions.filter((a) => {
        const actionDate = parseDate(a.created_at);
        return actionDate >= todayStart && actionDate < todayEnd;
      });

      todayActions.forEach((action) => {
        records.push({
          id: `action-${action.action_id}`,
          title: action.action_type,
          subtitle: getCatName(action.cat_id),
          time: formatTime(action.created_at),
          timestamp: parseDate(action.created_at),
          icon: getActionIcon(action.action_type),
          color: getActionColor(action.action_type),
        });
      });
    }

    // 加载今日猫咪事件记录
    if (selectedCat.value) {
      const events = await catEventApi.getByCat(selectedCat.value);
      const todayEvents = events.filter((e) => {
        const eventDate = parseDate(e.created_at);
        return eventDate >= todayStart && eventDate < todayEnd;
      });

      todayEvents.forEach((event) => {
        records.push({
          id: `event-${event.event_id}`,
          title: event.event_type,
          subtitle: event.detail || getCatName(event.cat_id),
          time: formatTime(event.created_at),
          timestamp: parseDate(event.created_at),
          icon: getEventIcon(event.event_type),
          color: getEventColor(event.event_type),
        });
      });
    }

    // 按时间倒序排序（最新的在前）
    todayRecords.value = records.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  } catch (error) {
    console.error('加载今日记录失败：', error);
  }
}

function getCatName(catId: number) {
  const cat = cats.value.find((c) => c.cat_id === catId);
  return cat?.cat_name || `猫咪 #${catId}`;
}

function getSiteName(siteId: number) {
  const site = sites.value.find((s) => s.site_id === siteId);
  return site?.site_name || `设施 #${siteId}`;
}

function formatTime(timeStr: string) {
  // 处理时区：如果时间字符串不包含时区信息，假定其为 UTC 时间
  let dateStr = timeStr;
  // ISO 格式但不带时区后缀 (Z 或 +/-HH:MM)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(dateStr)) {
    dateStr = dateStr + 'Z'; // 添加 Z 后缀，让 JS 把它当作 UTC 时间
  }
  const date = new Date(dateStr);
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
    测体温: 'warning',
    绝育: 'secondary',
    体检: 'positive',
    驱虫: 'accent',
    修剪指甲: 'secondary',
    洗澡: 'info',
    疫苗: 'negative',
  };
  return colors[type] || 'grey';
}

function getSiteActionIcon(type: string) {
  const icons: Record<string, string> = {
    喂食: 'restaurant',
    喂水: 'water_drop',
    消毒: 'cleaning_services',
    逗猫: 'sports_esports',
    清理猫砂: 'delete_outline',
  };
  return icons[type] || 'build';
}

function getSiteActionColor(type: string) {
  const colors: Record<string, string> = {
    喂食: 'primary',
    喂水: 'info',
    消毒: 'positive',
    逗猫: 'secondary',
    清理猫砂: 'accent',
  };
  return colors[type] || 'grey';
}

function getEventColor(type: string) {
  const colors: Record<string, string> = {
    生病: 'negative',
    受伤: 'warning',
    怀孕: 'secondary',
    分娩: 'accent',
    死亡: 'dark',
    合同解除: 'primary',
  };
  return colors[type] || 'grey';
}

// 初始化数据
async function loadData() {
  loading.value = true;
  try {
    const [sitesRes, catsRes, fsmsRes] = await Promise.all([
      siteApi.list(1, 100),
      catApi.list(1, 100),
      catFsmApi.list(1, 100), // 获取所有 FSM 数据用于确定猫咪归属
    ]);

    sites.value = sitesRes.data || [];
    cats.value = catsRes.data || [];
    allCatFsms.value = fsmsRes.data || [];

    // 默认选择第一个设施并加载设施信息
    if (sites.value.length > 0) {
      const firstSiteId = sites.value[0]!.site_id;
      selectedSite.value = firstSiteId;
      treeSelected.value = `site-${firstSiteId}`;
      treeExpanded.value = [`site-${firstSiteId}`];
      await loadSiteInfo();
    }
  } catch (error) {
    console.error('加载数据失败：', error);
    $q.notify({
      type: 'negative',
      message: '加载数据失败',
      position: 'top',
    });
  } finally {
    loading.value = false;
  }
}

// 监听设施和猫咪选择变化，自动刷新今日记录和猫咪详情
watch([selectedSite, selectedCat], () => {
  void loadTodayRecords();
  void loadCatInfo();
});

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

.site-metric-card {
  height: 100%;
}

.status-metric-card {
  height: 100%;
}

@media (max-width: 1023px) {
  .operation-btn {
    height: 72px;
  }
}

@media (max-width: 599px) {
  .operation-btn {
    height: 64px;
    border-radius: 10px;
  }
}
</style>
