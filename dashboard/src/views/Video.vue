<template>
  <div class="video-page">
    <!-- 原头部 -->
    <div class="header">

      <div class="source-name">
        <button @click="showDialog = true" @mousedown="handleLongPress" class="source-button">
          <i class="pi pi-video"></i> 源名称
        </button>
      </div>

      <!-- 搜索框 (中间) -->
      <div class="search-box">
        <input type="text" v-model="searchQuery" placeholder="搜索视频" @input="searchVideos"/>
      </div>

      <!-- 齿轮按钮 (最右侧) -->
      <div class="settings-buttons">
        <button @click="openSettings" class="pi pi-cog" title="设置"></button>
        <button @click="openProfile" class="pi pi-user" title="用户设置"></button>
      </div>

      <!-- 当前时间显示 -->
      <div class="current-time">
        <span>{{ currentDateTime }}</span>
      </div>
    </div>

    <!-- 新增的按钮栏 -->
    <div class="sub-header">
      <button
          v-for="category in categories"
          :key="category.type_id"
          :class="['sub-header-button', { 'active': selectedCategory?.type_id === category.type_id }]"
          @click="selectCategory(category)"
      >
        {{ category.type_name }}
      </button>
    </div>

    <div v-if="selectedCategory" class="selected-category-info">
      <p>当前选择的分类：{{ selectedCategory.type_name }} (ID: {{ selectedCategory.type_id }})</p>
    </div>

  </div>
</template>

<script>
import {ref, computed} from 'vue';
import {useCategoryStore} from '../stores/categoryStore';

export default {
  name: 'VideoPage',
  data() {
    return {
      showDialog: false, // 控制弹出框显示
      searchQuery: '', // 搜索框绑定值
      longPressTimeout: null,  // 用于长按操作
      selectedCategory: null, // 当前选中的分类ID
    };
  },
  computed: {
    selectedCategory() {
      const categoryStore = useCategoryStore();
      return categoryStore.selectedCategory;
    },
    categories() {
      return [
        {type_id: '1', type_name: '电影'},
        {type_id: '2', type_name: '连续剧'},
        {type_id: '3', type_name: '综艺'},
        {type_id: '4', type_name: '动漫'},
        {type_id: '26', type_name: '短剧'}
      ];
    },
    currentDateTime() {
      const options = {
        weekday: 'long', // 星期几
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true, // 12小时制
      };
      const date = new Date();
      return date.toLocaleString('zh-CN', options);
    },
  },
  methods: {
    selectCategory(category) {
      const categoryStore = useCategoryStore();
      categoryStore.selectCategory(category);
    },
    clearCategory() {
      const categoryStore = useCategoryStore();
      categoryStore.clearCategory();
    },
    handleLongPress() {
      this.longPressTimeout = setTimeout(() => {
        this.clearCategory();
      }, 1000); // 1秒后清除分类
    },
    searchVideos() {
      // 处理搜索功能
    },
    openSettings() {
      alert('打开设置');
    },
    openProfile() {
      alert('打开用户设置');
    },
  },
  beforeDestroy() {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
    }
  }
};
</script>

<style scoped>
.video-page {
  box-sizing: border-box;
}

.header {
  display: flex;
  align-items: center; /* 保证头部内容垂直居中 */
  justify-content: space-between; /* 保证头部内容左右分布 */
  background-color: #2c3e50;
  padding-left: 10%;
  padding-right: 20%;
  color: white;
  position: fixed;
  left: 260px;
  top: 50px;
  width: calc(100% - 260px); /* 头部占满剩余空间 */
  z-index: 1000; /* 保证原头部在最上层 */
}

.sub-header {
  display: flex;
  justify-content: flex-start; /* 左对齐按钮 */
  background-color: #34495e;
  padding: 10px 0;
  position: fixed;
  left: 260px;
  top: 90px; /* 下移，紧贴原头部 */
  width: calc(100% - 260px); /* 同样占满剩余空间 */
  z-index: 999; /* 保证在原头部下方，但在内容区域上方 */
}

.sub-header-button {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  padding: 10px;
  margin: 0 15px;
  cursor: pointer;
}

/* 样式与之前类似，略作修改 */
.sub-header-button.active {
  background-color: #1abc9c; /* 选中按钮时的背景色 */
  color: #fff;
}

.sub-header-button:hover {
  background-color: #2c3e50;
}

.source-name button {
  background: none;
  border: none;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

.search-box input {
  padding: 5px;
  font-size: 14px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.settings-buttons button {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  margin-left: 10px;
  cursor: pointer;
}

.current-time {
  font-size: 14px;
  color: #fff;
  margin-left: 10px; /* 给当前时间加点空间 */
}

.selected-category-info {
  margin-top: 20px;
  padding: 10px;
  background-color: #f1f1f1;
  color: #333;
  border-radius: 4px;
  font-size: 16px;
}
</style>
