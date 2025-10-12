<template>
  <div class="search-aggregation">
    <!-- 顶部Header已移至全局Header组件 -->

    <!-- 主要内容区域 -->
    <div class="search-content">
      <!-- 最近搜索记录（仅在搜索前显示，有记录时） -->
      <div v-if="!hasSearched && recentSearches.length > 0" class="recent-search-floating">
        <div class="recent-search-section">
          <div class="section-header">
            <h3 class="section-title">
              <icon-history class="title-icon"/>
              最近搜索记录
            </h3>
            <a-button type="text" size="small" class="refresh-btn" @click="clearRecentSearches">
              <template #icon>
                <icon-delete/>
              </template>
              清空
            </a-button>
          </div>
          <div class="recent-search-tags">
            <a-tag 
                v-for="tag in recentSearches" 
                :key="tag"
                class="recent-tag"
                @click="searchRecentTag(tag)"
            >
              {{ tag }}
            </a-tag>
          </div>
        </div>
      </div>

      <!-- 搜索前的状态：建议+热门 -->
      <div v-if="!hasSearched" class="search-home">
        <!-- 猜你想搜（有输入草稿时显示） -->
        <div v-if="suggestions.length > 0" class="search-suggestions">
          <div class="section-header">
            <h3 class="section-title">
              <icon-bulb class="title-icon"/>
              猜你想搜
            </h3>
          </div>
          <div class="suggestions-tags">
              <a-tag 
                  v-for="suggestion in suggestions" 
                  :key="suggestion"
                  class="suggestion-tag"
                  @click="searchSuggestion(suggestion)"
              >
                {{ suggestion }}
              </a-tag>
          </div>
        </div>



        <!-- 热门搜索 -->
        <div class="hot-search-section">
          <div class="section-header">
            <h3 class="section-title">
              <icon-fire class="title-icon"/>
              热门搜索
            </h3>
            <a-button 
                type="text" 
                size="small" 
                @click="randomizeHotSearchTags"
                class="refresh-btn"
            >
              <template #icon>
                <icon-refresh/>
              </template>
              换一批
            </a-button>
          </div>
          <div class="hot-search-tags">
            <a-tag 
                v-for="tag in hotSearchTags" 
                :key="tag"
                class="hot-tag"
                @click="searchHotTag(tag)"
            >
              {{ tag }}
            </a-tag>
          </div>
        </div>
      </div>

      <!-- 搜索结果页面 -->
      <div v-if="hasSearched" class="search-results">
        <div class="results-layout">
          <!-- 左侧源分组 -->
          <div class="sources-sidebar">
            <div class="sources-header">
              <h4>搜索源</h4>
              <span class="sources-count">({{ searchStats.completed }}/{{ searchStats.total }})</span>
              <span class="sources-result-tag" v-if="searchStats.withData > 0">{{ searchStats.withData }}</span>
            </div>
            <div class="sources-list">
              <div 
                  v-for="source in sourcesWithResults" 
                  :key="source.key"
                  class="source-item"
                  :class="{ active: activeSource === source.key }"
                  @click="selectSource(source.key)"
              >
                <div class="source-info">
                  <span class="source-name">{{ source.name }}</span>
                  <span class="source-count" v-if="searchResults[source.key]">
                    ({{ searchResults[source.key].length }})
                  </span>
                </div>
                <div class="source-status">
                  <a-spin v-if="loadingStates[source.key]" :size="14"/>
                  <icon-check-circle 
                      v-else-if="searchResults[source.key]" 
                      class="status-success"
                  />
                  <icon-close-circle 
                      v-else-if="errorStates[source.key]" 
                      class="status-error"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 右侧搜索结果 -->
          <div class="results-content">
            <div v-if="activeSource && searchResults[activeSource]" class="results-list">
              <div class="results-header">
                <h4>{{ getSourceName(activeSource) }} 搜索结果</h4>
                <span class="results-count">
                  共 {{ searchResults[activeSource].length }} 条结果
                </span>
              </div>
              <a-scrollbar
                ref="scrollbarRef"
                @scroll="handleScroll"
                class="search-scroll-container"
                :style="'height:' + scrollAreaHeight + 'px; overflow: auto;'"
              >
                <!-- 搜索结果网格 -->
                <a-grid 
                  v-if="searchResults[activeSource] && searchResults[activeSource].length > 0"
                  :cols="{ xs: 2, sm: 3, md: 4, lg: 5, xl: 6, xxl: 8 }" 
                  :rowGap="16" 
                  :colGap="12"
                  class="video-grid"
                >
                  <a-grid-item 
                    v-for="(video, index) in displayedResults" 
                    :key="video.vod_id || index"
                    class="video-card-item"
                  >
                    <div class="video-card" @click="handleVideoClick(video)">
                      <div class="video-poster">
                        <!-- 优先显示vod_pic图片，如果有值的话 -->
                        <img
                          v-if="video.vod_pic && video.vod_pic.trim() !== ''"
                          class="video-poster-img"
                          :src="video.vod_pic"
                          :alt="video.vod_name"
                          @error="handleImageError"
                        />
                        <!-- 文件夹图标 (当vod_pic为空且是文件夹时) -->
                        <div v-else-if="isFolder(video)" class="folder-icon-container">
                          <i class="iconfont icon-wenjianjia folder-icon"></i>
                        </div>
                        <!-- 文件类型图标 (当vod_pic为空且是目录模式下的非文件夹项目时) -->
                        <div v-else-if="isDirectoryFile(video)" class="file-icon-container">
                          <svg style="width:30%">
                            <use :href="`#${getFileTypeIcon(video.vod_name)}`"></use>
                          </svg>
                        </div>
                        <!-- 默认图片 (当vod_pic为空且没有特殊标识时) -->
                        <img
                          v-else
                          class="video-poster-img"
                          :src="video.vod_pic || '/default-poster.svg'"
                          :alt="video.vod_name"
                          @error="handleImageError"
                        />
                        <!-- Action标识 -->
                        <div v-if="video.vod_tag === 'action'" class="action-badge">
                          <icon-thunderbolt />
                        </div>
                        <!-- 播放按钮覆盖层 -->
                        <div class="play-overlay">
                          <icon-play-arrow-fill />
                        </div>
                        <!-- vod_remarks 浮层 -->
                        <div v-if="video.vod_remarks" class="video-remarks-overlay" v-html="video.vod_remarks">
                        </div>
                      </div>
                      <div class="video-info">
                        <h3 class="video-title" :title="video.vod_name">{{ video.vod_name }}</h3>
                        <div class="video-meta">
                          <span v-if="video.vod_year" class="video-year">{{ video.vod_year }}</span>
                          <span v-if="video.vod_area" class="video-area">{{ video.vod_area }}</span>
                        </div>
                      </div>
                    </div>
                  </a-grid-item>
                </a-grid>

                <!-- 加载更多 -->
                <div v-if="loadingMore" class="loading-container">
                  <a-spin />
                  <div class="loading-text">加载更多...</div>
                </div>
                
                <!-- 没有更多数据提示 -->
                <div v-else-if="!hasMoreData && searchResults[activeSource] && searchResults[activeSource].length > 0" class="no-more-data">
                  没有更多数据了
                </div>

                <!-- 底部间距 -->
                <div class="bottom-spacer"></div>
              </a-scrollbar>
            </div>

            
            <!-- 加载状态 -->
            <div v-else-if="activeSource && loadingStates[activeSource]" class="loading-state">
              <a-spin :size="32"/>
              <p>正在搜索 {{ getSourceName(activeSource) }}...</p>
            </div>
            
            <!-- 错误状态 -->
            <div v-else-if="activeSource && errorStates[activeSource]" class="error-state">
              <icon-exclamation-circle class="error-icon"/>
              <p>{{ getSourceName(activeSource) }} 搜索失败</p>
              <a-button @click="retrySearch(activeSource)">重试</a-button>
            </div>
            
            <!-- 空状态 -->
            <div v-else-if="activeSource" class="empty-state">
              <icon-empty class="empty-icon"/>
              <p>{{ getSourceName(activeSource) }} 暂无搜索结果</p>
            </div>
          </div>
          
          <!-- ActionRenderer组件 -->
          <ActionRenderer
            v-if="showActionRenderer"
            :action-data="currentActionData"
            @close="handleActionClose"
          />
        </div>
      </div>
    </div>

    <!-- 搜索设置弹窗 -->
    <SearchSettingsModal 
        v-model:visible="showSearchSettings"
        @confirm="onSearchSettingsConfirm"
    />
  </div>
</template>

<script>
import { defineComponent, ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { 
  IconHistory, 
  IconBulb, 
  IconFire, 
  IconRefresh, 
  IconCheckCircle, 
  IconCloseCircle, 
  IconExclamationCircle, 
  IconEmpty,
  IconDelete 
} from '@arco-design/web-vue/es/icon';
import SearchSettingsModal from '@/components/SearchSettingsModal.vue';
import ActionRenderer from '@/components/actions/ActionRenderer.vue';
import { getFileTypeIcon, isFolder, isDirectoryFile } from '@/utils/fileTypeUtils';
import { usePaginationStore } from '@/stores/paginationStore';
import { usePageStateStore } from '@/stores/pageStateStore';
import { useVisitedStore } from '@/stores/visitedStore';
import siteService from '@/api/services/site';
import videoService from '@/api/services/video';

export default defineComponent({
  name: 'SearchAggregation',
  components: {
    SearchSettingsModal,
    ActionRenderer,
    IconHistory,
    IconBulb,
    IconFire,
    IconRefresh,
    IconCheckCircle,
    IconCloseCircle,
    IconExclamationCircle,
    IconEmpty,
    IconDelete
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    // Stores
    const paginationStore = usePaginationStore();
    const pageStateStore = usePageStateStore();
    const visitedStore = useVisitedStore();
    
    // 搜索相关状态
    const searchKeyword = ref('');
    const hasSearched = ref(false);
    const showSearchSettings = ref(false);
    const recentSearches = ref([]);
    
    // 搜索源和结果
    const searchSources = ref([]);
    const searchResults = ref({});
    const loadingStates = ref({});
    const errorStates = ref({});
    const activeSource = ref('');
    
    // 滚动翻页相关
    const scrollbarRef = ref(null);
    const scrollAreaHeight = ref(600);
    const displayedCount = ref(20); // 当前显示的结果数量
    const pageSize = ref(20); // 每次加载的数量
    const loadingMore = ref(false);
    
    // 分页状态管理
    const currentPages = ref({}); // 每个源的当前页码
    const hasMorePages = ref({}); // 每个源是否还有更多页面
    
    // ActionRenderer相关
    const showActionRenderer = ref(false);
    const currentActionData = ref(null);
    
    // 所有热门搜索标签
    const allHotSearchTags = [
      '最新电影', '热门电视剧', '经典动漫', '综艺节目', '纪录片',
      '科幻大片', '动作电影', '喜剧片', '爱情剧', '悬疑剧',
      '国产剧', '韩剧', '日剧', '美剧', '港剧',
      '2024新片', '高分电影', '经典老片', '院线大片', '网络电影',
      '武侠片', '古装剧', '现代剧', '都市剧', '农村剧',
      '青春剧', '校园剧', '职场剧', '医疗剧', '律政剧'
    ];
    
    // 当前显示的热门搜索标签
    const hotSearchTags = ref([]);
    
    // 搜索建议
    const suggestions = ref([]);
    
    // 计算属性
    const displayedResults = computed(() => {
      if (!activeSource.value || !searchResults.value[activeSource.value]) {
        return [];
      }
      return searchResults.value[activeSource.value].slice(0, displayedCount.value);
    });
    
    const hasMoreData = computed(() => {
      if (!activeSource.value) {
        return false;
      }
      // 检查是否还有更多页面可以加载，或者当前显示的数量少于已加载的数据
      const hasMoreFromServer = hasMorePages.value[activeSource.value] || false;
      const hasMoreFromLocal = searchResults.value[activeSource.value] && 
        displayedCount.value < searchResults.value[activeSource.value].length;
      return hasMoreFromServer || hasMoreFromLocal;
    });
    
    // 过滤有结果的搜索源
    const sourcesWithResults = computed(() => {
      return searchSources.value.filter(source => {
        const results = searchResults.value[source.key];
        // 严格只显示有结果的源
        return results && results.length > 0;
      });
    });
    
    // 搜索统计计算属性
    const searchStats = computed(() => {
      const totalSources = searchSources.value.length;
      let completedSources = 0;
      let sourcesWithData = 0;
      let sourcesWithoutData = 0;
      
      // 计算已完成搜索的源数量（包括成功和失败的）
      searchSources.value.forEach(source => {
        const isLoading = loadingStates.value[source.key];
        const hasResults = searchResults.value[source.key] !== undefined;
        const hasError = errorStates.value[source.key] !== undefined;
        const resultCount = searchResults.value[source.key]?.length || 0;
        
        // 如果不在加载中，且有结果或有错误，则认为已完成
        if (!isLoading && (hasResults || hasError)) {
          completedSources++;
          
          // 区分有数据和无数据的源
          if (resultCount > 0) {
            sourcesWithData++;
          } else {
            sourcesWithoutData++;
          }
        }
      });
      
      return {
        completed: completedSources,
        total: totalSources,
        withData: sourcesWithData,
        withoutData: sourcesWithoutData
      };
    });
    
    // 方法
    const loadSearchSources = () => {
      try {
        const allSites = siteService.getAllSites();
        
        // 获取用户配置的搜索源
        const searchSettings = getSearchSettings();
        
        // 过滤出可搜索的源
        const availableSources = allSites.filter(site => 
          site.searchable && site.searchable !== 0
        );
        
        // 根据用户设置过滤
        searchSources.value = availableSources.filter(site => 
          searchSettings.selectedSources.includes(site.key)
        );
        
        // 如果没有配置，默认选择所有可搜索的源
        if (searchSources.value.length === 0) {
          searchSources.value = availableSources;
        }
        
      } catch (error) {
        console.error('加载搜索源失败:', error);
        Message.error('加载搜索源失败');
      }
    };
    
    const getSearchSettings = () => {
      try {
        const settings = localStorage.getItem('searchAggregationSettings');
        if (settings) {
          const parsed = JSON.parse(settings);
          // 验证设置格式
          if (parsed && Array.isArray(parsed.selectedSources)) {
            console.log('已加载搜索设置:', parsed);
            return parsed;
          } else {
            console.warn('搜索设置格式无效，使用默认配置');
          }
        } else {
          console.log('未找到搜索设置，使用默认配置');
        }
      } catch (error) {
        console.error('获取搜索设置失败:', error);
      }
      return { selectedSources: [] };
    };
    
    const performSearch = async (keyword) => {
      if (!keyword || !keyword.trim()) {
        Message.warning('请输入搜索关键词');
        return;
      }
      
      searchKeyword.value = keyword.trim();
      hasSearched.value = true;
      
      // 重置状态
      searchResults.value = {};
      loadingStates.value = {};
      errorStates.value = {};
      currentPages.value = {};
      hasMorePages.value = {};
      displayedCount.value = pageSize.value;
      
      // 重置活跃源，让自动激活逻辑来处理
      activeSource.value = '';
      
      // 并行搜索所有源
      const searchPromises = searchSources.value.map(source => 
        searchSource(source, keyword.trim())
      );
      
      await Promise.allSettled(searchPromises);
      // 记录最近搜索
      try {
        const HISTORY_KEY = 'drplayer_search_history';
        const stored = localStorage.getItem(HISTORY_KEY);
        let history = [];
        try { history = stored ? JSON.parse(stored) : []; } catch { history = []; }
        const k = searchKeyword.value;
        // 过滤空字符串和无效值
        if (k && k.trim()) {
          const idx = history.findIndex(item => item === k);
          if (idx !== -1) history.splice(idx, 1);
          history.unshift(k);
          // 过滤历史记录中的空字符串
          history = history.filter(item => item && item.trim());
          if (history.length > 10) history = history.slice(0, 10);
          localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
          // console.log('保存搜索历史记录:',history);
          // 直接更新最近搜索记录
          recentSearches.value = [...history];
        }
      } catch (e) {
        console.error('保存搜索历史失败:', e);
      }
    };
    
    const searchSource = async (source, keyword, page = 1) => {
      loadingStates.value[source.key] = true;
      
      try {
        const searchData = await videoService.searchVideo(source.key, {
          keyword: keyword,
          page: page,
          extend: source.ext,
          apiUrl: source.api
        });
        
        const newVideos = searchData.videos || [];
        
        if (page === 1) {
          // 第一页，直接设置结果
          searchResults.value[source.key] = newVideos;
          currentPages.value[source.key] = 1;
        } else {
          // 后续页面，追加到现有结果
          if (!searchResults.value[source.key]) {
            searchResults.value[source.key] = [];
          }
          
          // 过滤重复数据
          const existingIds = new Set(searchResults.value[source.key].map(v => v.vod_id));
          const uniqueNewVideos = newVideos.filter(video => 
            !existingIds.has(video.vod_id) && 
            video.vod_id !== 'no_data' && 
            video.vod_name !== 'no_data'
          );
          
          searchResults.value[source.key] = [...searchResults.value[source.key], ...uniqueNewVideos];
          currentPages.value[source.key] = page;
        }
        
        // 更新分页状态
        hasMorePages.value[source.key] = searchData.pagination?.hasNext !== false;
        
        delete errorStates.value[source.key];
      } catch (error) {
        console.error(`搜索源 ${source.name} 失败:`, error);
        errorStates.value[source.key] = error.message || '搜索失败';
        if (page === 1) {
          searchResults.value[source.key] = [];
          currentPages.value[source.key] = 1;
          hasMorePages.value[source.key] = false;
        }
      } finally {
        loadingStates.value[source.key] = false;
      }
    };
    
    const selectSource = (sourceKey) => {
      activeSource.value = sourceKey;
      displayedCount.value = pageSize.value; // 重置显示数量
      updateScrollAreaHeight();
      updateGlobalStats();
    };
    
    // 滚动事件处理
    const handleScroll = (e) => {
      // 获取真正的滚动容器（arco-scrollbar内部容器）
      const rawTarget = e?.target || e?.srcElement;
      const container = rawTarget?.closest ? rawTarget.closest('.arco-scrollbar-container') : rawTarget;
      if (!container) return;

      const scrollHeight = container.scrollHeight - container.clientHeight;
      const scrollTop = container.scrollTop;
      
      // 当滚动到距离底部50px以内时触发加载
      if (scrollHeight - scrollTop < 50 && hasMoreData.value && !loadingMore.value) {
        loadMore();
      }
    };
    
    // 加载更多数据
    const loadMore = async () => {
      if (!hasMoreData.value || loadingMore.value || !activeSource.value) return;
      
      loadingMore.value = true;
      
      try {
        // 检查是否需要从服务器加载更多数据
        const currentResults = searchResults.value[activeSource.value] || [];
        const needMoreFromServer = hasMorePages.value[activeSource.value] && 
          displayedCount.value >= currentResults.length;
        
        if (needMoreFromServer) {
          // 从服务器加载下一页
          const currentPage = currentPages.value[activeSource.value] || 1;
          const nextPage = currentPage + 1;
          
          const activeSourceObj = searchSources.value.find(s => s.key === activeSource.value);
          if (activeSourceObj && searchKeyword.value) {
            await searchSource(activeSourceObj, searchKeyword.value, nextPage);
          }
        }
        
        // 增加显示数量
        displayedCount.value += pageSize.value;
        updateGlobalStats();
      } catch (error) {
        console.error('加载更多数据失败:', error);
        Message.error('加载更多数据失败');
      } finally {
        loadingMore.value = false;
      }
    };
    
    // 动态计算滚动区域高度
    const updateScrollAreaHeight = () => {
      // 计算可用高度：总高度减去头部和其他固定元素
      const availableHeight = window.innerHeight - 112; // 减去导航栏等固定高度
      scrollAreaHeight.value = Math.max(availableHeight - 120, 400); // 减去results-header等，最小400px
    };
    
    // 新的视频点击处理方法，支持action类型
    const handleVideoClick = (video) => {
      if (video && video.vod_id) {
        // 检查是否为action类型
        if (video.vod_tag === 'action') {
          try {
            // 尝试解析vod_id中的JSON字符串获取action配置
            const actionConfig = JSON.parse(video.vod_id);
            console.log('SearchAggregation解析action配置:', actionConfig);
            
            // 传递解析后的action配置给ActionRenderer
            currentActionData.value = actionConfig;
            showActionRenderer.value = true;
            return;
          } catch (error) {
            console.log('SearchAggregation vod_id不是JSON格式，作为普通文本处理:', video.vod_id);
            
            // 如果解析失败，说明vod_id是普通文本，显示Toast提示
            Message.info({
              content: video.vod_id,
              duration: 3000,
              closable: true
            });
            return;
          }
        }
        
        // 记录最后点击的视频
        visitedStore.setLastClicked(video.vod_id, video.name);
        
        // 跳转到视频详情页面
        const currentSource = searchSources.value.find(s => s.key === activeSource.value);
        if (currentSource) {
          router.push({
            name: 'VideoDetail',
            params: { id: video.vod_id },
            query: {
              name: video.name,
              pic: video.pic,
              year: video.year,
              area: video.area,
              type: video.type,
              remarks: video.note,
              content: video.content,
              actor: video.actor,
              director: video.director,
              site: currentSource.key,
              api: currentSource.api,
              ext: currentSource.ext,
              from: 'search-aggregation',
              // 添加来源图片信息，用于详情页图片备用
              sourcePic: video.pic
            }
          });
        }
       }
     };
     
     // 更新全局统计信息
     const updateGlobalStats = () => {
       console.log('[updateGlobalStats] 更新全局统计信息');
       if (!activeSource.value || !searchResults.value[activeSource.value]) {
         paginationStore.updateStats('');
         return;
       }
       
       const totalResults = searchResults.value[activeSource.value].length;
       const displayedResults = Math.min(displayedCount.value, totalResults);
       const sourceName = getSourceName(activeSource.value);
       
       let statsText = `搜索"${searchKeyword.value}"：${sourceName} - 已显示${displayedResults}条，共${totalResults}条`;
       // 检查是否还有更多数据可以加载
       const hasMore = hasMoreData.value;
       if (hasMore) {
         statsText += '，可继续加载';
       } else if (totalResults > 0) {
         statsText += '，已全部加载';
       }
       console.log('[updateGlobalStats] <statsText>:', statsText);
       paginationStore.updateStats(statsText);
     };
     
     // ActionRenderer相关方法
     const handleActionClose = () => {
       showActionRenderer.value = false;
       currentActionData.value = null;
     };
    
    const getSourceName = (sourceKey) => {
      const source = searchSources.value.find(s => s.key === sourceKey);
      return source ? source.name : sourceKey;
    };
    
    const retrySearch = (sourceKey) => {
      const source = searchSources.value.find(s => s.key === sourceKey);
      if (source && searchKeyword.value) {
        searchSource(source, searchKeyword.value);
      }
    };
    
    const onSearchInput = (value) => {
      if (value && value.trim()) {
        // 生成搜索建议
        generateSuggestions(value.trim());
      } else {
        suggestions.value = [];
      }
    };
    
    const generateSuggestions = (keyword) => {
      if (!keyword || keyword.length < 1) {
        suggestions.value = [];
        return;
      }
      
      // 基础建议模板
      const suggestionTemplates = [
        `${keyword} 电影`,
        `${keyword} 电视剧`,
        `${keyword} 动漫`,
        `${keyword} 纪录片`,
        `${keyword} 综艺`,
        `最新 ${keyword}`,
        `${keyword} 高清`,
        `${keyword} 完整版`,
        `${keyword} 免费观看`,
        `${keyword} 在线播放`
      ];
      
      // 热门关键词联想
      const popularKeywords = [
        '2024', '最新', '高清', '免费', '完整版', '在线',
        '国产', '日本', '韩国', '美国', '欧美', '港台',
        '爱情', '动作', '喜剧', '科幻', '悬疑', '恐怖', '战争', '历史'
      ];
      
      // 根据关键词长度和内容生成不同的建议
      let suggestions_list = [];
      
      if (keyword.length === 1) {
        // 单字符时提供更多类型建议
        suggestions_list = [
          `${keyword}开头的电影`,
          `${keyword}字电视剧`,
          `${keyword}相关动漫`,
          `${keyword}类纪录片`
        ];
      } else if (keyword.length <= 3) {
        // 短关键词时提供基础建议
        suggestions_list = suggestionTemplates.slice(0, 6);
      } else {
        // 长关键词时提供更精确的建议
        suggestions_list = suggestionTemplates.slice(0, 4);
        
        // 添加一些智能联想
        popularKeywords.forEach(popular => {
          if (keyword.toLowerCase().includes(popular.toLowerCase()) === false) {
            suggestions_list.push(`${keyword} ${popular}`);
          }
        });
      }
      
      // 去重并限制数量
      suggestions.value = [...new Set(suggestions_list)].slice(0, 8);
    };
    
    const searchHotTag = (tag) => {
      router.push({
        name: 'SearchAggregation',
        query: { keyword: tag }
      });
    };
    
    const searchSuggestion = (suggestion) => {
      router.push({
        name: 'SearchAggregation',
        query: { keyword: suggestion }
      });
    };
    
    const searchRecentTag = (tag) => {
      router.push({
        name: 'SearchAggregation',
        query: { keyword: tag }
      });
    };
    
    const onSearchSettingsConfirm = (settings) => {
      // 保存搜索设置
      localStorage.setItem('searchAggregationSettings', JSON.stringify(settings));
      // 重新加载搜索源
      loadSearchSources();
      Message.success('搜索设置已保存');
    };
    
    const playVideo = (video) => {
      // 跳转到视频详情页面
      const currentSource = searchSources.value.find(s => s.key === activeSource.value);
      if (currentSource && video.vod_id) {
        router.push({
          name: 'VideoDetail',
          params: { id: video.vod_id },
          query: {
            site: currentSource.key,
            api: currentSource.api,
            ext: currentSource.ext,
            from: 'search'
          }
        });
      } else {
        Message.warning('无法播放该视频');
      }
    };
    
    const handleImageError = (event) => {
      event.target.style.display = 'none';
    };
    

    
    // 随机化热门搜索标签
    const randomizeHotSearchTags = () => {
      const shuffled = [...allHotSearchTags].sort(() => 0.5 - Math.random());
      hotSearchTags.value = shuffled.slice(0, 12); // 显示12个标签
    };
    
    // 最近搜索读取与清空
    const loadRecentSearches = () => {
      try {
        const HISTORY_KEY = 'drplayer_search_history';
        const stored = localStorage.getItem(HISTORY_KEY);
        let history = stored ? JSON.parse(stored) : [];
        if (!Array.isArray(history)) history = [];
        // 过滤空字符串和无效值
        recentSearches.value = history.filter(item => item && item.trim());
        // 如果过滤后的数据与原数据不同，更新localStorage
        if (recentSearches.value.length !== history.length) {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(recentSearches.value));
        }
      } catch {
        recentSearches.value = [];
      }
    };
    const clearRecentSearches = () => {
      localStorage.removeItem('drplayer_search_history');
      recentSearches.value = [];
      Message.success('已清空最近搜索记录');
    };
    
    // 监听路由参数
    watch(() => route.query.keyword, (keyword) => {
      if (keyword) {
        searchKeyword.value = keyword;
        performSearch(keyword);
      } else {
        // 当没有keyword参数时，重置搜索状态
        hasSearched.value = false;
        searchKeyword.value = '';
        searchResults.value = {};
        activeSource.value = '';
        displayedCount.value = pageSize.value;
      }
    }, { immediate: true });
    // 监听输入草稿用于生成建议
    watch(() => route.query.keywordDraft, (draft) => {
      const val = typeof draft === 'string' ? draft : '';
      // 只有在没有进行搜索时才更新searchKeyword.value，避免在搜索过程中被重置
      if (!hasSearched.value) {
        searchKeyword.value = val;
      }
      onSearchInput(val);
    });
    
    // 监听activeSource变化，更新统计
    watch(activeSource, () => {
      updateGlobalStats();
    });

    // 监听搜索结果变化，自动激活第一个有结果的源
    watch(searchResults, (newResults) => {
      // 只有在有搜索结果且当前没有活跃源或当前活跃源没有结果时才自动切换
      if (Object.keys(newResults).length > 0) {
        // 找到第一个有结果的源
        const firstSourceWithResults = sourcesWithResults.value.find(source => {
          const results = newResults[source.key];
          return results && results.length > 0;
        });
        
        // 如果找到有结果的源，且当前没有活跃源或当前活跃源没有结果，则自动切换
        if (firstSourceWithResults) {
          const currentActiveHasResults = activeSource.value && 
            newResults[activeSource.value] && 
            newResults[activeSource.value].length > 0;
          
          // 如果当前没有活跃源，或当前活跃源没有结果，则切换到第一个有结果的源
          if (!activeSource.value || !currentActiveHasResults) {
            activeSource.value = firstSourceWithResults.key;
            console.log(`自动激活第一个有结果的搜索源: ${firstSourceWithResults.name}`);
          }
        }
      }
    }, { deep: true });
    
    // 组件挂载时初始化
    onMounted(() => {
      loadSearchSources();
      randomizeHotSearchTags();
      loadRecentSearches();
      updateScrollAreaHeight();
      
      // 监听窗口大小变化
      window.addEventListener('resize', updateScrollAreaHeight);
      
      // 显示当前配置状态
      const settings = getSearchSettings();
      if (settings.selectedSources.length > 0) {
        console.log(`已恢复搜索源配置，共 ${settings.selectedSources.length} 个源`);
      }
    });
    
    onUnmounted(() => {
      window.removeEventListener('resize', updateScrollAreaHeight);
    });
    
    return {
      searchKeyword,
      hasSearched,
      showSearchSettings,
      searchSources,
      sourcesWithResults,
      searchResults,
      loadingStates,
      errorStates,
      activeSource,
      displayedResults,
      hasMoreData,
      loadingMore,
      scrollbarRef,
      scrollAreaHeight,
      hotSearchTags,
      suggestions,
      showActionRenderer,
      currentActionData,
      searchStats,
      performSearch,
      selectSource,
      getSourceName,
      retrySearch,
      onSearchInput,
      searchHotTag,
      searchSuggestion,
      searchRecentTag,
      onSearchSettingsConfirm,
      handleVideoClick,
      handleImageError,
      handleScroll,
      handleActionClose,
      randomizeHotSearchTags,
      // 最近搜索
      recentSearches,
      clearRecentSearches,
      // 工具函数
      getFileTypeIcon,
      isFolder,
      isDirectoryFile
    };
  }
});
</script>

<style scoped>
.search-aggregation {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
}

/* 头部样式已移至全局Header组件 */

/* 主要内容区域 */
.search-content {
  flex: 1;
  overflow: hidden;
}

/* 搜索首页样式 */
.search-home {
  padding: 40px 20px;
  max-width: 800px;
  margin: 0 auto;
}

.hot-search-section {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  margin-bottom: 40px;
  margin-top: 0;
}

.recent-search-section {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto 20px auto;
}
.recent-search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.recent-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 16px;
  padding: 6px 16px;
}
.recent-tag:hover {
  background: var(--color-fill-2);
  transform: translateY(-1px);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0;
}

.refresh-btn {
  color: var(--color-text-3);
  transition: all 0.2s ease;
}

.refresh-btn:hover {
  color: var(--color-primary-6);
}

.title-icon {
  font-size: 20px;
  color: var(--color-primary-6);
}

.hot-search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.hot-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 16px;
  padding: 6px 16px;
}

.hot-tag:hover {
  background: var(--color-primary-1);
  border-color: var(--color-primary-6);
  color: var(--color-primary-6);
  transform: translateY(-1px);
}

/* 最近搜索记录浮动区域 */
.recent-search-floating {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  margin-bottom: 8px;
}

/* 搜索建议样式 */
.search-suggestions {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  margin-bottom: 8px;
}

.suggestions-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.suggestion-tag {
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 16px;
  padding: 6px 16px;
}

.suggestion-tag:hover {
  background: var(--color-primary-1);
  border-color: var(--color-primary-6);
  color: var(--color-primary-6);
  transform: translateY(-1px);
}

/* 搜索结果样式 */
.search-results {
  height: calc(100vh - 112px); /* 减去顶部导航(64px)和底部(48px)的高度 */
  overflow: hidden;
}

.results-layout {
  display: flex;
  height: 100%;
}

/* 左侧源分组 */
.sources-sidebar {
  width: 280px;
  background: var(--color-bg-2);
  border-right: 1px solid var(--color-border-2);
  display: flex;
  flex-direction: column;
  height: 100%;
}

.sources-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.sources-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
}

.sources-count {
  color: var(--color-text-3);
  font-size: 14px;
}

.sources-result-tag {
  background: #52c41a;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
  margin-left: 8px;
}

.sources-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  height: 0; /* 强制flex子元素计算高度 */
}

.source-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.source-item:hover {
  background: var(--color-fill-2);
}

.source-item.active {
  background: var(--color-primary-1);
  border: 1px solid var(--color-primary-6);
}

.source-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.source-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.source-count {
  font-size: 12px;
  color: var(--color-text-3);
}

.source-status {
  display: flex;
  align-items: center;
}

.status-success {
  color: var(--color-success-6);
  font-size: 16px;
}

.status-error {
  color: var(--color-danger-6);
  font-size: 16px;
}

/* 右侧搜索结果 */
.results-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.results-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-2);
  background: var(--color-bg-1);
  position: sticky;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
}

.results-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
}

.results-count {
  color: var(--color-text-3);
  font-size: 14px;
}

/* 搜索结果滚动容器 */
.search-scroll-container {
  border-radius: 8px;
  border: 1px solid var(--color-border-2);
}

.search-results-grid {
  padding: 16px;
}

/* 视频卡片样式 */
.video-card-item {
  width: 100%;
}

.video-card {
  background: var(--color-bg-2);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid var(--color-border-2);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary-light-4);
}

.video-poster {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  flex-shrink: 0;
  background: var(--color-fill-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-poster img,
.video-poster-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.video-card:hover .video-poster img,
.video-card:hover .video-poster-img {
  transform: scale(1.05);
}

.folder-icon-container,
.file-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--color-fill-3);
}

.folder-icon {
  font-size: 48px;
  color: var(--color-text-3);
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 50px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card:hover .play-overlay {
  opacity: 1;
}

.action-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: var(--color-warning-6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  z-index: 2;
}

.video-info {
  padding: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.video-title {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-desc {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: var(--color-text-3);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--color-text-3);
  flex-wrap: wrap;
}

.video-note {
  background: var(--color-primary-light-1);
  color: var(--color-primary-6);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
}

.video-year,
.video-area {
  color: var(--color-text-3);
}

.video-remarks-overlay {
  position: absolute;
  top: 4px;
  right: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 2;
}

.meta-item {
  font-size: 11px;
  color: var(--color-text-4);
  background: var(--color-fill-2);
  padding: 2px 6px;
  border-radius: 4px;
}

/* 加载更多和无更多数据提示 */
.loading-container,
.no-more-data {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 20px;
  color: var(--color-text-3);
  font-size: 14px;
}

.loading-container {
  color: var(--color-primary-6);
}

.loading-text {
  margin-left: 8px;
}

.bottom-spacer {
  height: 20px;
}



/* 状态样式 */
.loading-state,
.error-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--color-text-3);
}

.error-icon,
.empty-icon {
  font-size: 48px;
  color: var(--color-text-4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .results-layout {
    flex-direction: column;
  }
  
  .sources-sidebar {
    width: 100%;
    height: 200px;
  }
  
  .sources-list {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    padding: 8px 12px;
  }
  
  .source-item {
    min-width: 120px;
    margin-right: 8px;
    margin-bottom: 0;
  }
  
  .video-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 16px;
    padding: 16px;
  }
  
  .search-header {
    padding: 0 16px;
  }
  
  .header-left,
  .header-right {
    min-width: 100px;
  }
}
</style>