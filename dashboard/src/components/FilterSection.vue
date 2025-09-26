<template>
  <div v-if="filters" class="filter-section">
    <div class="filter-header">
      <a-button 
        type="text" 
        @click="toggleVisible"
        class="filter-toggle-btn"
      >
        <template #icon>
          <icon-filter />
        </template>
        筛选条件
        <icon-down v-if="!visible" />
        <icon-up v-else />
      </a-button>
      <a-button 
        v-if="hasActiveFilters"
        type="text" 
        size="small"
        @click="handleResetFilters"
        class="filter-reset-btn"
      >
        重置
      </a-button>
    </div>
    
    <a-collapse-transition>
      <div v-show="visible" class="filter-content">
        <div 
          v-for="filterGroup in filters" 
          :key="filterGroup.key"
          class="filter-group"
        >
          <div class="filter-group-title">{{ filterGroup.name }}</div>
          <div class="filter-options">
            <a-tag
              v-for="option in filterGroup.value"
              :key="option.v"
              :color="isSelected(filterGroup.key, option.v) ? 'green' : ''"
              :checkable="true"
              :checked="isSelected(filterGroup.key, option.v)"
              @check="handleToggleFilter(filterGroup.key, option.v, option.n)"
              class="filter-option-tag"
            >
              {{ option.n }}
            </a-tag>
          </div>
        </div>
      </div>
    </a-collapse-transition>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { IconFilter, IconDown, IconUp } from '@arco-design/web-vue/es/icon';

const props = defineProps({
  filters: {
    type: Array,
    default: null
  },
  selectedFilters: {
    type: Object,
    default: () => ({})
  },
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'update:selectedFilters', 'toggle-filter', 'reset-filters']);

const hasActiveFilters = computed(() => {
  return props.selectedFilters && Object.keys(props.selectedFilters).length > 0;
});

const isSelected = (filterKey, filterValue) => {
  return props.selectedFilters?.[filterKey] === filterValue;
};

const toggleVisible = () => {
  emit('update:visible', !props.visible);
};

const handleToggleFilter = (filterKey, filterValue, filterName) => {
  emit('toggle-filter', filterKey, filterValue, filterName);
};

const handleResetFilters = () => {
  emit('reset-filters');
};
</script>

<style scoped>
.filter-section {
  flex-shrink: 0;
  background: white;
  z-index: 99;
  border-bottom: 1px solid var(--color-border-2);
  margin-bottom: 8px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

.filter-reset-btn {
  color: var(--color-text-3);
  font-size: 12px;
}

.filter-reset-btn:hover {
  color: var(--color-primary-6);
}

.filter-content {
  padding: 0 16px 16px;
}

.filter-group {
  margin-bottom: 16px;
}

.filter-group:last-child {
  margin-bottom: 0;
}

.filter-group-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
  margin-bottom: 8px;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-option-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-option-tag:hover {
  transform: translateY(-1px);
}
</style>