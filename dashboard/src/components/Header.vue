<template>
  <a-layout-header class="header">
    <!-- 左侧控制按钮 -->
    <div class="header-left">
      <!-- 聚合搜索页面模式 -->
      <template v-if="isSearchAggregationPage">
        <a-button shape="circle" @click="goBackFromSearch">
          <template #icon>
            <icon-left/>
          </template>
        </a-button>
        <span class="search-page-title">聚合搜索</span>
      </template>
      <!-- 普通页面模式 -->
      <template v-else>
        <a-button shape="circle" @click="goBack">
          <template #icon>
            <icon-left/>
          </template>
        </a-button>
        <a-button shape="circle" @click="goForward">
          <template #icon>
            <icon-right/>
          </template>
        </a-button>
        <a-button shape="circle" @click="refreshPage">
          <template #icon>
            <icon-refresh/>
          </template>
        </a-button>
      </template>
    </div>

    <!-- 中间搜索框 -->
    <div class="header-center" :class="{ 'search-page-mode': isSearchAggregationPage }" v-if="searchAggregationEnabled">
      <div class="search-container">
        <a-input-search
            v-model="searchValue"
            placeholder="搜索内容..."
            enter-button="搜索"
            allow-clear
            @search="onSearch"
            @keyup.enter="onSearch(searchValue)"
            @click="handleSearchClick"
            @input="handleSearchInput"
            @clear="handleSearchClear"
        />
        <a-button 
            class="search-settings-btn" 
            shape="circle" 
            @click="openSearchSettings"
            :title="'搜索设置'"
        >
          <template #icon>
            <icon-settings/>
          </template>
        </a-button>
        <a-button 
            v-if="hasSearchResults"
            class="close-search-btn" 
            shape="circle" 
            @click="closeSearchResults"
            :title="'关闭搜索结果'"
        >
          <template #icon>
            <icon-close/>
          </template>
        </a-button>
      </div>
    </div>

    <!-- 右侧控制按钮 -->
    <div class="header-right">
      <a-button shape="circle" @click="minimize">
        <template #icon>
          <icon-shrink/>
        </template>
      </a-button>
      <a-button shape="circle" @click="maximize">
        <template #icon>
          <icon-expand/>
        </template>
      </a-button>
      <a-button shape="circle" @click="showCloseConfirm">
        <template #icon>
          <icon-close/>
        </template>
      </a-button>
    </div>

    <!-- 全屏居中确认弹窗 -->
    <div v-if="showConfirmModal" class="confirm-modal-overlay" @click="hideCloseConfirm">
      <div class="confirm-modal" @click.stop>
        <div class="modal-header">
          <icon-exclamation-circle-fill class="warning-icon" />
          <h3 class="modal-title">确认关闭</h3>
        </div>
        <div class="modal-content">
          <p class="modal-message">你确认要关闭当前应用吗？</p>
          <p class="modal-submessage">关闭后将退出应用程序</p>
        </div>
        <div class="modal-footer">
          <a-button class="cancel-btn" @click="hideCloseConfirm">
            取消
          </a-button>
          <a-button type="primary" status="danger" class="confirm-btn" @click="confirmClose">
            确认关闭
          </a-button>
        </div>
      </div>
    </div>

    <!-- 搜索设置弹窗 -->
    <SearchSettingsModal 
      v-model:visible="showSearchSettings" 
      @confirm="onSearchSettingsConfirm"
    />
  </a-layout-header>
</template>

<script>
import {defineComponent, ref, computed, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {Message} from '@arco-design/web-vue';
import SearchSettingsModal from './SearchSettingsModal.vue';

export default defineComponent({
  components: {
    SearchSettingsModal
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const showConfirmModal = ref(false);
    const searchValue = ref('');
    
    // 检测是否在聚合搜索页面
    const isSearchAggregationPage = computed(() => {
      return route.name === 'SearchAggregation';
    });
    
    // 检测是否有搜索结果（当在搜索页面且有搜索关键词时）
    const hasSearchResults = computed(() => {
      return isSearchAggregationPage.value && route.query.keyword;
    });
    
    // 从localStorage获取聚搜功能状态
    const getSearchAggregationStatus = () => {
      try {
        const appSettings = localStorage.getItem('appSettings');
        if (appSettings) {
          const settings = JSON.parse(appSettings);
          return settings.searchAggregation || false;
        }
      } catch (error) {
        console.error('获取聚搜状态失败:', error);
      }
      return false;
    };
    
    // 响应式的聚搜状态
    const searchAggregationEnabled = ref(getSearchAggregationStatus());
    
    // 监听localStorage变化
    const updateSearchAggregationStatus = () => {
      searchAggregationEnabled.value = getSearchAggregationStatus();
    };
    
    // 监听storage事件
    window.addEventListener('storage', updateSearchAggregationStatus);
    
    // 定期检查状态变化（用于同一页面内的状态更新）
    const checkInterval = setInterval(updateSearchAggregationStatus, 1000);
    
    // 监听路由变化，同步搜索关键词
    watch(() => route.query.keyword, (keyword) => {
      if (keyword && isSearchAggregationPage.value) {
        searchValue.value = keyword;
      }
    }, { immediate: true });
    
    // 监听路由变化，清空搜索框（当离开搜索页面时）
    watch(() => route.name, (routeName) => {
      if (routeName !== 'SearchAggregation') {
        searchValue.value = '';
      }
    });
    
    return {
      showConfirmModal,
      searchAggregationEnabled,
      searchValue,
      showSearchSettings: ref(false),
      isSearchAggregationPage,
      hasSearchResults,
      router
    };
  },
  methods: {
    goBack() {
      Message.info("前进按钮");
      // 执行前进逻辑
    },
    goBackFromSearch() {
      // 从聚合搜索页面返回到上一页
      // 检查是否有历史记录可以返回
      if (window.history.length > 1) {
        this.$router.back();
      } else {
        // 如果没有历史记录，返回到首页
        this.$router.push({ name: 'Home' });
      }
    },
    goForward() {
      Message.info("后退按钮");
      // 执行后退逻辑
    },
    refreshPage() {
      Message.info("刷新页面");
      // 刷新页面逻辑
      window.location.reload();
    },
    onSearch(value) {
      if (!value || !value.trim()) {
        Message.warning('请输入搜索内容');
        return;
      }
      
      if (this.isSearchAggregationPage) {
        // 如果已经在搜索页面，直接更新查询参数
        this.$router.push({
          name: 'SearchAggregation',
          query: { keyword: value.trim() }
        });
      } else {
        // 如果不在搜索页面，跳转到聚合搜索页面并执行搜索
        this.$router.push({
          name: 'SearchAggregation',
          query: { keyword: value.trim() }
        });
      }
    },
    handleSearchClick() {
      // 点击搜索框时的处理
      if (!this.isSearchAggregationPage) {
        // 如果不在搜索页面，跳转到搜索页面
        this.$router.push({ name: 'SearchAggregation' });
      }
    },
    handleSearchInput(value) {
      // 搜索输入时的处理：在聚合搜索页写入草稿以生成建议
      if (this.isSearchAggregationPage) {
        const query = { ...this.$route.query, keywordDraft: value };
        this.$router.push({ name: 'SearchAggregation', query });
      }
    },
    handleSearchClear() {
      // 清除输入内容，同时清空聚搜页的草稿
      if (this.isSearchAggregationPage) {
        const query = { ...this.$route.query };
        delete query.keywordDraft;
        this.$router.push({ name: 'SearchAggregation', query });
      }
    },
    openSearchSettings() {
      // 打开搜索设置弹窗
      this.showSearchSettings = true;
    },
    onSearchSettingsConfirm(settings) {
      // 处理搜索设置确认
      const selectedCount = settings.selectedSources ? settings.selectedSources.length : 0;
      Message.success(`已选择 ${selectedCount} 个搜索源`);
      this.showSearchSettings = false;
    },
    closeSearchResults() {
      // 关闭搜索结果，回到搜索页面的初始状态
      this.searchValue = '';
      this.$router.push({ name: 'SearchAggregation' });
    },
    minimize() {
      Message.info("最小化窗口");
      // 最小化窗口的逻辑，可以通过调用系统接口来实现
      this.exitFullScreen()
    },
    maximize() {
      Message.info("最大化窗口");
      // 最大化窗口的逻辑
      this.enterFullScreen()
    },
    showCloseConfirm() {
      this.showConfirmModal = true;
    },
    hideCloseConfirm() {
      this.showConfirmModal = false;
    },
    confirmClose() {
      this.showConfirmModal = false;
      Message.info("正在关闭应用...");
      
      // 尝试多种关闭方式
      try {
        // 方式1: 尝试关闭当前窗口
        if (window.opener) {
          window.close();
        } else {
          // 方式2: 如果是主窗口，尝试使用about:blank方式
          window.open('about:blank', '_self');
          window.close();
        }
        
        // 方式3: 如果上述方式都失败，提供备用方案
        setTimeout(() => {
          // 检查窗口是否已关闭
          if (!window.closed) {
            Message.warning("无法自动关闭窗口，请手动关闭浏览器标签页");
            // 可以考虑跳转到一个关闭页面
            window.location.href = 'about:blank';
          }
        }, 500);
        
      } catch (error) {
        console.error('关闭窗口失败:', error);
        Message.error("关闭失败，请手动关闭浏览器标签页");
      }
    },
    enterFullScreen() {
      let element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) { /* Firefox */
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) { /* IE/Edge */
        element.msRequestFullscreen();
      }
    },
    exitFullScreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
      }
    },
  }
});
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 64px;
  padding: 0;
  background: var(--color-bg-3);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid var(--color-border-2);
  border: none;
}

.header-left {
  display: flex;
  align-items: center;
  padding-left: 20px;
  min-width: 200px;
  gap: 8px;
}

.search-page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
  margin-left: 12px;
  white-space: nowrap;
  user-select: none;
  display: flex;
  align-items: center;
}

.header-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 600px;
  margin: 0 20px;
}

.header-right {
  display: flex;
  align-items: center;
  padding-right: 20px;
  min-width: 200px;
  justify-content: flex-end;
  gap: 8px;
}

.header-left :deep(.arco-btn),
.header-right :deep(.arco-btn) {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
  color: var(--color-text-1);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.header-left :deep(.arco-btn:hover),
.header-right :deep(.arco-btn:hover) {
  background: var(--color-fill-3);
  border-color: var(--color-border-3);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.header-left :deep(.arco-btn:active),
.header-right :deep(.arco-btn:active) {
  transform: translateY(0);
  background: var(--color-fill-4);
}

/* 特殊样式：关闭按钮 */
.header-right :deep(.arco-btn:last-child) {
  background: #ff4757;
  border-color: #ff3742;
  color: white;
}

.header-right :deep(.arco-btn:last-child:hover) {
  background: #ff3742;
  border-color: #ff2f3a;
  box-shadow: 0 2px 8px rgba(255, 71, 87, 0.3);
}

/* 搜索容器样式 */
.search-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 450px;
}

/* 搜索框样式 */
.search-container :deep(.arco-input-search) {
  flex: 1;
  border-radius: 8px;
  background: var(--color-bg-1);
  border: 1px solid var(--color-border-2);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  cursor: pointer;
}

.search-container :deep(.arco-input-search:hover) {
  border-color: var(--color-border-3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 聚合搜索页面时的搜索框样式 */
.header-center.search-page-mode .search-container :deep(.arco-input-search) {
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.header-center.search-page-mode .search-container :deep(.arco-input-search .arco-input-wrapper) {
  border: 2px solid var(--color-border-2);
  transition: all 0.2s ease;
}

.header-center.search-page-mode .search-container :deep(.arco-input-search .arco-input-wrapper:focus-within) {
  border-color: var(--color-primary-6);
  box-shadow: 0 0 0 3px rgba(var(--primary-6), 0.1);
}

/* 搜索设置按钮样式 */
.search-settings-btn {
  width: 36px !important;
  height: 36px !important;
  border-radius: 8px !important;
  border: 1px solid var(--color-border-2) !important;
  background: var(--color-bg-2) !important;
  color: var(--color-text-2) !important;
  transition: all 0.2s ease !important;
  flex-shrink: 0;
}

.search-settings-btn:hover {
  background: var(--color-fill-3) !important;
  border-color: var(--color-border-3) !important;
  color: var(--color-text-1) !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.search-settings-btn:active {
  transform: translateY(0) !important;
  background: var(--color-fill-4) !important;
}

/* 关闭搜索按钮样式 */
.close-search-btn {
  width: 36px !important;
  height: 36px !important;
  border-radius: 8px !important;
  border: 1px solid var(--color-border-2) !important;
  background: var(--color-bg-2) !important;
  color: var(--color-text-2) !important;
  transition: all 0.2s ease !important;
  flex-shrink: 0;
}

.close-search-btn:hover {
  background: var(--color-danger-light-1) !important;
  border-color: var(--color-danger-light-3) !important;
  color: var(--color-danger-6) !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(245, 63, 63, 0.15) !important;
}

.close-search-btn:active {
  transform: translateY(0) !important;
  background: var(--color-danger-light-2) !important;
}

.search-container :deep(.arco-input-search:focus-within) {
  border-color: var(--color-primary-6);
  box-shadow: 0 0 0 2px var(--color-primary-1);
}

.search-container :deep(.arco-input-wrapper) {
  border-radius: 8px;
  background: transparent;
  border: none;
}

.search-container :deep(.arco-input) {
  background: transparent;
  border: none;
  color: var(--color-text-1);
  font-size: 14px;
}

.search-container :deep(.arco-input::placeholder) {
  color: var(--color-text-3);
}

.search-container :deep(.arco-input-search-btn) {
  border-radius: 0 8px 8px 0;
  background: var(--color-primary-6);
  border: none;
  color: white;
  transition: background-color 0.2s ease;
}

.search-container :deep(.arco-input-search-btn:hover) {
  background: var(--color-primary-7);
}

/* 全屏居中确认弹窗样式 */
.confirm-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

.confirm-modal {
  background: var(--color-bg-1);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  min-width: 400px;
  max-width: 500px;
  padding: 0;
  animation: slideIn 0.3s ease-out;
  border: 1px solid var(--color-border-2);
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--color-border-2);
}

.warning-icon {
  font-size: 24px;
  color: #ff6b35;
  margin-right: 12px;
}

.modal-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

.modal-content {
  padding: 20px 24px;
}

.modal-message {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--color-text-1);
  line-height: 1.5;
}

.modal-submessage {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-3);
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--color-border-2);
}

.cancel-btn {
  min-width: 80px;
  height: 36px;
  border-radius: 6px;
  font-weight: 500;
}

.confirm-btn {
  min-width: 100px;
  height: 36px;
  border-radius: 6px;
  font-weight: 500;
}

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-left,
  .header-right {
    min-width: 120px;
  }
  
  .header-center {
    margin: 0 10px;
  }
  
  .search-container {
    max-width: 280px;
  }
  
  .confirm-modal {
    min-width: 320px;
    max-width: 90vw;
    margin: 20px;
  }
}

@media (max-width: 480px) {
  .header-left,
  .header-right {
    min-width: 80px;
    gap: 4px;
  }
  
  .header-left {
    padding-left: 10px;
  }
  
  .header-right {
    padding-right: 10px;
  }
  
  .header-center {
    margin: 0 5px;
  }
  
  .search-container {
    max-width: 220px;
  }
  
  .header-left :deep(.arco-btn),
  .header-right :deep(.arco-btn) {
    width: 28px;
    height: 28px;
  }
  
  .confirm-modal {
    min-width: 280px;
    margin: 16px;
  }
  
  .modal-header,
  .modal-content,
  .modal-footer {
    padding-left: 20px;
    padding-right: 20px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 8px;
  }
  
  .cancel-btn,
  .confirm-btn {
    width: 100%;
  }
}
</style>
