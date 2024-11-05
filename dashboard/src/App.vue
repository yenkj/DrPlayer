<template>
  <div class="app-container">
    <!-- 侧边栏 -->
    <SideBarMenu
        :isCollapsed="sidebarStore.isCollapsed"
        @toggleSidebar="sidebarStore.toggleSidebar"
        :selectedTab="selectedTab"
        @selectTab="updateSelectedTab"
    />
    <!-- 头部工具栏 -->
    <HeaderToolbar/>
    <!-- 内容区域 -->
    <div class="content">
      <!-- 路由视图 -->
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import { useSidebarStore } from './stores/sidebarStore';
import SideBarMenu from './components/SideBarMenu.vue';
import HeaderToolbar from './components/HeaderToolbar.vue';

export default {
  components: {
    SideBarMenu,
    HeaderToolbar,
  },
  setup() {
    const sidebarStore = useSidebarStore(); // 使用 Pinia store
    return { sidebarStore };
  },
  data() {
    return {
      selectedTab: 1  // 默认选中的 Tab
    };
  },
  computed: {
    // 根据侧边栏的状态动态调整内容区域的样式
    contentStyle() {
      const sidebarWidth = this.sidebarStore.isCollapsed ? 80 : this.sidebarStore.sidebarWidth;  // 获取侧边栏宽度，并考虑是否收缩
      return {
        marginTop: '60px',  // 头部工具栏的高度
        marginLeft: `${sidebarWidth}px`,  // 动态设置左边距
        padding: '20px',
        flex: 1,
        overflowY: 'auto',  // 启用纵向滚动
        boxSizing: 'border-box',
      };
    },
  },
  methods: {
    // 更新 selectedTab 的值
    updateSelectedTab(tabId) {
      this.selectedTab = tabId;
    }
  }
};
</script>

<style>
/* 确保html和body的高度为100% */
html, body {
  height: 100%;
  margin: 0;
}

/* 使 app-container 占满全高，并设置flex布局 */
.app-container {
  display: flex;
  height: 100%;  /* 占满屏幕高度 */
  flex-direction: column;  /* 使 header 在顶部，sidebar 和 content 在下方 */
}

/* 内容区域样式 */
.content {
  flex: 1;
  overflow-y: auto;  /* 启用纵向滚动 */
  padding: 20px;
  box-sizing: border-box;
  margin-top: 60px;  /* 确保内容区域位于头部工具栏下方 */
  margin-left: 250px; /* 假设侧边栏宽度为250px */
}

@media (max-width: 768px) {
  .content {
    margin-left: 0;  /* 在小屏幕下，移除侧边栏 */
    margin-top: 0;   /* 确保在小屏幕下内容不被头部遮挡 */
  }
}
</style>
