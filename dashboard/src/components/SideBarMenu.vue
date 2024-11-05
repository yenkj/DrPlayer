<template>
  <div :class="['sidebar', { 'collapsed': isCollapsed }]">
    <router-link to="/" class="no-link-styles">
      <div class="logo">
        <i class="pi pi-home"></i>
      </div>
    </router-link>

    <Button
        :icon="isCollapsed ? 'pi pi-arrow-right' : 'pi pi-arrow-left'"
        class="collapse-btn"
        @click="toggleSidebar"/>

    <div class="menu">
      <router-link
          v-for="(item, index) in menuItems"
          :key="index"
          :to="item.route"
          class="menu-item"
      >
        <Button
            :label="!isCollapsed ? item.name : ''"
            :icon="item.icon"
            class="p-button-link p-button-plain"
            :class="{'active': isActive(item.id)}"
            @click="selectTab(item.id)"/>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SideBarMenu',
  props: {
    selectedTab: {
      type: Number,
      default: 1  // 默认选中的Tab
    },
    isCollapsed: Boolean, // 传入侧边栏的展开/收缩状态
  },
  data() {
    return {
      menuItems: [
        {id: 1, name: '点播', icon: 'pi pi-video', route: '/video'},
        {id: 2, name: '直播', icon: 'pi pi-video', route: '/live'},
        {id: 4, name: '收藏', icon: 'pi pi-bookmark', route: '/collection'},
        {id: 5, name: '历史', icon: 'pi pi-history', route: '/history'},
        {id: 3, name: '设置', icon: 'pi pi-cog', route: '/settings'}
      ]
    };
  },
  watch: {
    // 监听路由变化，根据路径更新选中的tab
    '$route.path'(newPath) {
      this.updateSelectedTabByRoute(newPath);
    }
  },
  mounted() {
    // 页面加载时初始化选中的Tab
    this.updateSelectedTabByRoute(this.$route.path);
  },
  methods: {
    toggleSidebar() {
      this.$emit('toggleSidebar'); // 触发父组件中的方法，切换侧边栏状态
    },
    selectTab(id) {
      this.$emit('selectTab', id); // 向父组件传递选中的Tab
    },
    isActive(itemId) {
      return this.selectedTab === itemId; // 判断当前item是否为选中的tab
    },
    // 根据路由路径更新selectedTab
    updateSelectedTabByRoute(path) {
      const selectedItem = this.menuItems.find(item => path.includes(item.route));
      if (selectedItem) {
        this.$emit('selectTab', selectedItem.id);
      } else {
        this.$emit('selectTab', 0);
      }
    }
  }
};
</script>

<style scoped>
.sidebar {
  width: 250px;
  height: 100vh;
  background-color: #2c3e50;
  color: white;
  padding: 20px;
  position: fixed;
  top: 50px;
  left: 0;
  transition: width 0.3s ease-in-out;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar .logo {
  text-align: center;
  font-size: 32px;
  margin-bottom: 20px;
}

.sidebar .menu-item {
  display: block;
  width: 100%;
  margin: 10px 0;
  text-decoration: none;
}

/* 高亮选中的菜单项 */
.sidebar .p-button-link.active {
  background-color: #3e8e41;
  color: white;
  font-weight: bold;
  border-left: 4px solid #fff;
}

.menu {
  margin-top: 0;
}

.collapse-btn {
  position: absolute;
  top: 20px;
  right: -20px;
  background-color: #3e8e41;
  color: white;
  border-radius: 50%;
  padding: 10px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  font-size: 16px;
  transition: right 0.3s ease-in-out;
}

.no-link-styles {
  text-decoration: none; /* 去掉下划线 */
  color: inherit; /* 继承父元素的颜色 */
}

.no-link-styles i {
  color: inherit; /* 确保图标颜色也不被修改 */
}

.router-link-exact-active,
.router-link-active {
  text-decoration: none;
  color: inherit; /* 不改变颜色 */
}

</style>
