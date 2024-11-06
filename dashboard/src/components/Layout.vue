<template>
  <a-layout class="layout-demo">
    <a-layout-sider collapsible breakpoint="xl">
      <div class="logo"/>
      <a-menu
          :default-open-keys="['1']"
          :default-selected-keys="['1']"
          :style="{ width: '100%' }"
          @menu-item-click="onClickMenuItem"
      >
        <router-link
            v-for="(item, index) in menuItems"
            :key="index"
            :to="item.route"
            class="menu-item"
        >
          <a-menu-item :key="item.id">
            <IconHome></IconHome>
            {{ item.name }}
          </a-menu-item>
        </router-link>
      </a-menu>
      <!-- trigger -->
      <template #trigger="{ collapsed }">
        <IconCaretRight v-if="collapsed"></IconCaretRight>
        <IconCaretLeft v-else></IconCaretLeft>
      </template>
    </a-layout-sider>

    <a-layout>
      <!-- 头部区域 -->
      <a-layout-header style="padding-left: 20px;">
        <Header/> <!-- 引入头部组件 -->
      </a-layout-header>

      <a-layout style="padding: 0 24px;">
        <!-- 内容上方面包屑-->
        <!--        <a-breadcrumb :style="{ margin: '16px 0' }">-->
        <!--          <a-breadcrumb-item>Home</a-breadcrumb-item>-->
        <!--          <a-breadcrumb-item>List</a-breadcrumb-item>-->
        <!--          <a-breadcrumb-item>App</a-breadcrumb-item>-->
        <!--        </a-breadcrumb>-->

        <!--        &lt;!&ndash; 内容区域 &ndash;&gt;-->
        <!--        <a-layout-content class="content">-->
        <!--          <slot></slot> &lt;!&ndash; 插槽，用于插入页面内容 &ndash;&gt;-->
        <!--        </a-layout-content>-->

        <slot></slot> <!-- 插槽，用于插入页面内容 -->

        <!-- 底部区域 -->
        <a-layout-footer>
          <Footer/>
        </a-layout-footer>

      </a-layout>
    </a-layout>

  </a-layout>
</template>

<script>
import {defineComponent} from 'vue';
import {Message} from '@arco-design/web-vue';
import {
  IconCaretRight,
  IconCaretLeft,
  IconHome,
  IconCalendar,
} from '@arco-design/web-vue/es/icon';
import Header from './Header.vue'; // 引入头部组件
import Footer from './Footer.vue'; // 引入底部组件

export default defineComponent({
  components: {
    IconCaretRight,
    IconCaretLeft,
    IconHome,
    IconCalendar,
    Header,
    Footer,
  },
  data() {
    return {
      menuItems: [
        {id: 1, name: '主页', icon: 'pi pi-video', route: '/'},
        {id: 2, name: '点播', icon: 'pi pi-video', route: '/video'},
        {id: 3, name: '直播', icon: 'pi pi-video', route: '/live'},
        {id: 4, name: '收藏', icon: 'pi pi-bookmark', route: '/collection'},
        {id: 5, name: '历史', icon: 'pi pi-history', route: '/history'},
        {id: 6, name: '设置', icon: 'pi pi-cog', route: '/settings'}
      ]
    };
  },
  methods: {
    onClickMenuItem(key) {
      let _name = this.menuItems.find(it => it.id === key).name
      let _content = `You select ${key},${_name}`
      console.log(_content)
      // Message.info({content: _content, showIcon: true});
    }
  }
});
</script>

<style scoped>
.layout-demo {
  height: 98vh;
  background: var(--color-fill-2);
  border: 1px solid var(--color-border);
}

.layout-demo :deep(.arco-layout-sider) .logo {
  height: 32px;
  margin: 12px 8px;
  background: rgba(255, 255, 255, 0.2);
}

.layout-demo :deep(.arco-layout-sider-light) .logo {
  background: var(--color-fill-2);
}

.layout-demo :deep(.arco-layout-header) {
  height: 64px;
  line-height: 64px;
  background: var(--color-bg-3);
}

.layout-demo :deep(.arco-layout-footer) {
  height: 48px;
  color: var(--color-text-2);
  font-weight: 400;
  font-size: 14px;
  line-height: 48px;
}

.layout-demo :deep(.arco-layout-content) {
  font-weight: 400;
  font-size: 14px;
  background: var(--color-bg-3);
  padding-left: 15px;
  padding-right: 15px;
  overflow: auto; /* 允许内容区域滚动 */
  max-height: calc(98vh - 64px - 48px - 60px); /* 去除头部、底部和面包屑后的可用空间 */
}


.layout-demo :deep(.arco-layout-footer),
.layout-demo :deep(.arco-layout-content) {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  font-size: 16px;
  font-stretch: condensed;
  text-align: left;
}
</style>