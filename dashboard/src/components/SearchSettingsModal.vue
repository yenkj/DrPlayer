<template>
  <a-modal
      v-model:visible="modalVisible"
      title="搜索设置"
      :width="600"
      :mask-closable="false"
      @ok="handleConfirm"
      @cancel="handleCancel"
  >
    <div class="search-settings">
      <div class="settings-header">
        <h4>选择搜索源</h4>
        <p class="settings-desc">选择要参与聚合搜索的数据源</p>
      </div>
      
      <div class="sources-section">
        <div class="section-header">
          <div class="select-all-container">
            <a-checkbox 
                v-model="selectAll"
                :indeterminate="indeterminate"
                @change="handleSelectAll"
            >
              全选
            </a-checkbox>
            <span class="selected-count">
              已选择 {{ selectedSources.length }} / {{ filteredSources.length }} 个源
            </span>
          </div>
          <div class="header-actions">
            <a-button size="small" @click="resetToDefault">
              <template #icon>
                <icon-undo/>
              </template>
              重置
            </a-button>
            <a-button size="small" @click="refreshSources">
              <template #icon>
                <icon-refresh/>
              </template>
              刷新
            </a-button>
          </div>
        </div>
        
        <!-- 搜索框 -->
        <div class="search-filter-container">
          <a-input
              v-model="searchFilter"
              placeholder="搜索源名称、API或分组..."
              allow-clear
              @input="onSearchFilterChange"
          >
            <template #prefix>
              <icon-search/>
            </template>
          </a-input>
        </div>
        
        <div class="sources-list">
          <div 
              v-for="source in filteredSources" 
              :key="source.key"
              class="source-item"
          >
            <a-checkbox 
                v-model="selectedSources"
                :value="source.key"
                @change="handleSourceChange"
            >
              <div class="source-info">
                <div class="source-main">
                  <span class="source-name">{{ source.name }}</span>
                  <div class="source-tags">
                    <a-tag 
                        v-if="source.quickSearch" 
                        color="green" 
                        size="small"
                    >
                      快搜
                    </a-tag>
                    <a-tag 
                        v-if="source.searchable === 1" 
                        color="blue" 
                        size="small"
                    >
                      标准搜索
                    </a-tag>
                    <a-tag 
                        v-if="source.searchable === 2" 
                        color="orange" 
                        size="small"
                    >
                      高级搜索
                    </a-tag>
                  </div>
                </div>
                <div class="source-meta">
                  <span v-if="source.api" class="meta-item">{{ source.api }}</span>
                  <span v-if="source.group" class="meta-item">{{ source.group }}</span>
                </div>
              </div>
            </a-checkbox>
          </div>
        </div>
        
        <div v-if="filteredSources.length === 0" class="empty-sources">
          <icon-empty class="empty-icon"/>
          <p v-if="availableSources.length === 0">暂无可用的搜索源</p>
          <p v-else>未找到匹配的搜索源</p>
          <p class="empty-desc" v-if="availableSources.length === 0">请确保已配置支持搜索的数据源</p>
          <p class="empty-desc" v-else>请尝试其他关键词或清空搜索条件</p>
        </div>
      </div>
      
      <div class="settings-footer">
        <div class="footer-info">
          <icon-info-circle class="info-icon"/>
          <span class="info-text">
            只有 searchable 属性不为 0 的源才支持搜索功能
          </span>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="modal-footer">
        <a-button @click="handleCancel">取消</a-button>
        <a-button 
            type="primary" 
            @click="handleConfirm"
            :disabled="selectedSources.length === 0"
        >
          确定 ({{ selectedSources.length }})
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script>
import { defineComponent, ref, computed, watch, onMounted } from 'vue';
import { Message } from '@arco-design/web-vue';
import siteService from '@/api/services/site';

export default defineComponent({
  name: 'SearchSettingsModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:visible', 'confirm'],
  setup(props, { emit }) {
    const modalVisible = ref(false);
    const availableSources = ref([]);
    const selectedSources = ref([]);
    const selectAll = ref(false);
    const searchFilter = ref('');
    
    // 计算属性
    const indeterminate = computed(() => {
      return selectedSources.value.length > 0 && 
             selectedSources.value.length < filteredSources.value.length;
    });
    
    // 筛选后的搜索源
    const filteredSources = computed(() => {
      if (!searchFilter.value.trim()) {
        return availableSources.value;
      }
      
      const keyword = searchFilter.value.toLowerCase().trim();
      return availableSources.value.filter(source => {
        return (
          source.name.toLowerCase().includes(keyword) ||
          (source.api && source.api.toLowerCase().includes(keyword)) ||
          (source.group && source.group.toLowerCase().includes(keyword)) ||
          source.key.toLowerCase().includes(keyword)
        );
      });
    });
    
    // 方法
    const loadAvailableSources = () => {
      try {
        const allSites = siteService.getAllSites();
        
        // 过滤出支持搜索的源
        availableSources.value = allSites.filter(site => 
          site.searchable && site.searchable !== 0
        ).map(site => ({
          key: site.key,
          name: site.name || site.key,
          api: site.api,
          group: site.group,
          searchable: site.searchable,
          quickSearch: site.quickSearch
        }));
        
        console.log('可用搜索源:', availableSources.value);
        
      } catch (error) {
        console.error('加载搜索源失败:', error);
        Message.error('加载搜索源失败');
        availableSources.value = [];
      }
    };
    
    const loadCurrentSettings = () => {
      try {
        const settings = localStorage.getItem('searchAggregationSettings');
        if (settings) {
          const parsed = JSON.parse(settings);
          // 验证保存的设置是否有效
          if (parsed && Array.isArray(parsed.selectedSources)) {
            // 过滤掉不存在的源
            const validSources = parsed.selectedSources.filter(sourceKey => 
              availableSources.value.some(source => source.key === sourceKey)
            );
            selectedSources.value = validSources;
            console.log('已加载搜索设置:', { selectedSources: validSources });
          } else {
            // 设置格式无效，使用默认值
            selectedSources.value = availableSources.value.map(source => source.key);
            console.log('设置格式无效，使用默认配置');
          }
        } else {
          // 没有保存的设置，默认选择所有可用源
          selectedSources.value = availableSources.value.map(source => source.key);
          console.log('未找到保存的设置，使用默认配置');
        }
        
        // 如果没有选中任何源，至少选择第一个可用源
        if (selectedSources.value.length === 0 && availableSources.value.length > 0) {
          selectedSources.value = [availableSources.value[0].key];
          console.log('没有有效的选中源，选择第一个可用源');
        }
        
        // 更新全选状态
        updateSelectAllState();
        
      } catch (error) {
        console.error('加载搜索设置失败:', error);
        // 发生错误时使用默认配置
        selectedSources.value = availableSources.value.map(source => source.key);
        updateSelectAllState();
      }
    };
    
    const updateSelectAllState = () => {
      const filteredKeys = filteredSources.value.map(source => source.key);
      const selectedFilteredCount = selectedSources.value.filter(key => 
        filteredKeys.includes(key)
      ).length;
      selectAll.value = selectedFilteredCount === filteredSources.value.length && filteredSources.value.length > 0;
    };
    
    const handleSelectAll = (checked) => {
      const filteredKeys = filteredSources.value.map(source => source.key);
      
      if (checked) {
        // 添加当前筛选结果中未选中的源
        const newSelected = [...selectedSources.value];
        filteredKeys.forEach(key => {
          if (!newSelected.includes(key)) {
            newSelected.push(key);
          }
        });
        selectedSources.value = newSelected;
      } else {
        // 移除当前筛选结果中已选中的源
        selectedSources.value = selectedSources.value.filter(key => 
          !filteredKeys.includes(key)
        );
      }
    };
    
    const handleSourceChange = () => {
      updateSelectAllState();
    };
    
    const refreshSources = () => {
      loadAvailableSources();
      Message.success('已刷新搜索源列表');
    };
    
    const resetToDefault = () => {
      // 重置为默认配置（选择所有可用源）
      selectedSources.value = availableSources.value.map(source => source.key);
      updateSelectAllState();
      
      // 清除localStorage中的配置
      try {
        localStorage.removeItem('searchAggregationSettings');
        console.log('已重置搜索源配置');
        Message.success('已重置为默认配置');
      } catch (error) {
        console.error('重置配置失败:', error);
        Message.error('重置配置失败');
      }
    };
    
    const onSearchFilterChange = () => {
      // 当搜索条件改变时，更新全选状态
      updateSelectAllState();
    };
    
    const handleConfirm = () => {
      if (selectedSources.value.length === 0) {
        Message.warning('请至少选择一个搜索源');
        return;
      }
      
      const settings = {
        selectedSources: selectedSources.value,
        updatedAt: Date.now()
      };
      
      // 立即保存到localStorage
      try {
        localStorage.setItem('searchAggregationSettings', JSON.stringify(settings));
        console.log('搜索设置已保存:', settings);
      } catch (error) {
        console.error('保存搜索设置失败:', error);
        Message.error('保存设置失败');
        return;
      }
      
      emit('confirm', settings);
      modalVisible.value = false;
    };
    
    const handleCancel = () => {
      modalVisible.value = false;
      // 恢复之前的设置
      loadCurrentSettings();
    };
    
    // 监听器
    watch(() => props.visible, (newVal) => {
      modalVisible.value = newVal;
      if (newVal) {
        loadAvailableSources();
        loadCurrentSettings();
      }
    });
    
    watch(modalVisible, (newVal) => {
      emit('update:visible', newVal);
    });
    
    watch(selectedSources, () => {
      updateSelectAllState();
    }, { deep: true });
    
    watch(filteredSources, () => {
      updateSelectAllState();
    }, { deep: true });
    
    // 组件挂载时初始化
    onMounted(() => {
      loadAvailableSources();
    });
    
    return {
      modalVisible,
      availableSources,
      filteredSources,
      selectedSources,
      selectAll,
      indeterminate,
      searchFilter,
      handleSelectAll,
      handleSourceChange,
      refreshSources,
      resetToDefault,
      onSearchFilterChange,
      handleConfirm,
      handleCancel
    };
  }
});
</script>

<style scoped>
.search-settings {
  padding: 8px 0;
}

.settings-header {
  margin-bottom: 24px;
}

.settings-header h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-1);
}

.settings-desc {
  margin: 0;
  font-size: 14px;
  color: var(--color-text-3);
  line-height: 1.5;
}

.sources-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border-2);
}

.select-all-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.selected-count {
  font-size: 13px;
  color: var(--color-text-3);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.search-filter-container {
  margin-bottom: 16px;
}

.search-filter-container :deep(.arco-input) {
  border-radius: 8px;
}

.search-filter-container :deep(.arco-input-prefix) {
  color: var(--color-text-3);
}

.sources-list {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--color-border-2);
  border-radius: 6px;
  background: var(--color-bg-1);
}

.source-item {
  padding: 16px;
  border-bottom: 1px solid var(--color-border-2);
  transition: background-color 0.2s ease;
}

.source-item:last-child {
  border-bottom: none;
}

.source-item:hover {
  background: var(--color-fill-1);
}

.source-item :deep(.arco-checkbox) {
  width: 100%;
}

.source-item :deep(.arco-checkbox-label) {
  width: 100%;
  padding-left: 8px;
}

.source-info {
  width: 100%;
}

.source-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.source-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

.source-tags {
  display: flex;
  gap: 6px;
}

.source-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 12px;
  color: var(--color-text-3);
  background: var(--color-fill-2);
  padding: 2px 8px;
  border-radius: 4px;
}

.empty-sources {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--color-text-3);
}

.empty-icon {
  font-size: 48px;
  color: var(--color-text-4);
  margin-bottom: 16px;
}

.empty-sources p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.empty-desc {
  font-size: 12px;
  color: var(--color-text-4);
}

.settings-footer {
  padding-top: 16px;
  border-top: 1px solid var(--color-border-2);
}

.footer-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-fill-1);
  border-radius: 6px;
}

.info-icon {
  font-size: 16px;
  color: var(--color-primary-6);
  flex-shrink: 0;
}

.info-text {
  font-size: 13px;
  color: var(--color-text-2);
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 滚动条样式 */
.sources-list::-webkit-scrollbar {
  width: 6px;
}

.sources-list::-webkit-scrollbar-track {
  background: var(--color-fill-2);
  border-radius: 3px;
}

.sources-list::-webkit-scrollbar-thumb {
  background: var(--color-fill-4);
  border-radius: 3px;
}

.sources-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .select-all-container {
    width: 100%;
  }
  
  .search-filter-container {
    margin-bottom: 12px;
  }
  
  .source-main {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .source-tags {
    align-self: flex-end;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .modal-footer .arco-btn {
    width: 100%;
  }
}
</style>