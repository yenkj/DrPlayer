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
              <span class="sources-count">({{ searchSources.length }})</span>
            </div>
            <div class="sources-list">
              <div 
                  v-for="source in searchSources" 
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
              <div class="video-grid">
                <div 
                    v-for="(video, index) in paginatedResults" 
                    :key="index"
                    class="video-card"
                    @click="playVideo(video)"
                >
                  <div class="video-poster">
                    <img 
                        v-if="video.pic" 
                        :src="video.pic" 
                        :alt="video.name"
                        @error="handleImageError"
                    />
                    <div v-else class="poster-placeholder">
                      <icon-play-arrow class="play-icon"/>
                    </div>
                  </div>
                  <div class="video-info">
                    <h5 class="video-title" :title="video.name">{{ video.name }}</h5>
                    <p class="video-desc" v-if="video.note">{{ video.note }}</p>
                    <div class="video-meta">
                      <span v-if="video.year" class="meta-item">{{ video.year }}</span>
                      <span v-if="video.area" class="meta-item">{{ video.area }}</span>
                      <span v-if="video.lang" class="meta-item">{{ video.lang }}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 分页 -->
              <div v-if="totalPages > 1" class="pagination-container">
                <a-pagination
                    v-model:current="currentPage"
                    :total="searchResults[activeSource].length"
                    :page-size="pageSize"
                    :show-total="true"
                    :show-jumper="true"
                    :show-size-changer="true"
                    @change="onPageChange"
                    @page-size-change="onPageSizeChange"
                />
              </div>
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
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
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
import siteService from '@/api/services/site';
import videoService from '@/api/services/video';

export default defineComponent({
  name: 'SearchAggregation',
  components: {
    SearchSettingsModal,
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
    
    // 分页
    const currentPage = ref(1);
    const pageSize = ref(20);
    
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
    const totalPages = computed(() => {
      if (!activeSource.value || !searchResults.value[activeSource.value]) {
        return 0;
      }
      return Math.ceil(searchResults.value[activeSource.value].length / pageSize.value);
    });
    
    const paginatedResults = computed(() => {
      if (!activeSource.value || !searchResults.value[activeSource.value]) {
        return [];
      }
      const start = (currentPage.value - 1) * pageSize.value;
      const end = start + pageSize.value;
      return searchResults.value[activeSource.value].slice(start, end);
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
      currentPage.value = 1;
      
      // 设置第一个源为活跃源
      if (searchSources.value.length > 0) {
        activeSource.value = searchSources.value[0].key;
      }
      
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
    
    const searchSource = async (source, keyword) => {
      loadingStates.value[source.key] = true;
      
      try {
        const searchData = await videoService.searchVideo(source.key, {
          keyword: keyword,
          page: 1,
          extend: source.ext,
          apiUrl: source.api
        });
        searchResults.value[source.key] = searchData.videos || [];
        delete errorStates.value[source.key];
      } catch (error) {
        console.error(`搜索源 ${source.name} 失败:`, error);
        errorStates.value[source.key] = error.message || '搜索失败';
        searchResults.value[source.key] = [];
      } finally {
        loadingStates.value[source.key] = false;
      }
    };
    
    const selectSource = (sourceKey) => {
      activeSource.value = sourceKey;
      currentPage.value = 1;
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
    
    const onPageChange = (page) => {
      currentPage.value = page;
    };
    
    const onPageSizeChange = (size) => {
      pageSize.value = size;
      currentPage.value = 1;
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
        currentPage.value = 1;
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
    
    // 组件挂载时初始化
    onMounted(() => {
      loadSearchSources();
      randomizeHotSearchTags();
      loadRecentSearches();
      
      // 显示当前配置状态
      const settings = getSearchSettings();
      if (settings.selectedSources.length > 0) {
        console.log(`已恢复搜索源配置，共 ${settings.selectedSources.length} 个源`);
      }
    });
    
    return {
      searchKeyword,
      hasSearched,
      showSearchSettings,
      searchSources,
      searchResults,
      loadingStates,
      errorStates,
      activeSource,
      currentPage,
      pageSize,
      hotSearchTags,
      suggestions,
      totalPages,
      paginatedResults,
      performSearch,
      selectSource,
      getSourceName,
      retrySearch,
      onSearchInput,
      searchHotTag,
      searchSuggestion,
      searchRecentTag,
      onSearchSettingsConfirm,
      playVideo,
      handleImageError,
      onPageChange,
      onPageSizeChange,
      randomizeHotSearchTags,
      // 最近搜索
      recentSearches,
      clearRecentSearches
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
  height: 100%;
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
}

.sources-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-2);
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

.sources-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
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
}

.results-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-2);
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

.video-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.video-card {
  background: var(--color-bg-2);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid var(--color-border-2);
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary-6);
}

.video-poster {
  position: relative;
  width: 100%;
  height: 120px;
  background: var(--color-fill-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-poster img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.poster-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--color-fill-3);
}

.play-icon {
  font-size: 32px;
  color: var(--color-text-3);
}

.video-info {
  padding: 12px;
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
  flex-wrap: wrap;
  gap: 8px;
}

.meta-item {
  font-size: 11px;
  color: var(--color-text-4);
  background: var(--color-fill-2);
  padding: 2px 6px;
  border-radius: 4px;
}

/* 分页样式 */
.pagination-container {
  padding: 20px;
  border-top: 1px solid var(--color-border-2);
  display: flex;
  justify-content: center;
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