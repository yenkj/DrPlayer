<template>
  <a-layout class="layout-demo">
    <a-layout-sider collapsible breakpoint="xl">
      <div class="logo">
        <a-popover title="提示">
        <a-image
            width="100%"
            :src="logoSrc"
            :alt="logoDesc"
            :preview="false"
            @click="()=>this.$message.success('欢迎使用Hipy定制版壳子')"
        />
          <template #content>
            <p>{{logoDesc}}</p>
          </template>
        </a-popover>
      </div>
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
            <!--            <IconHome></IconHome>-->
            <icon-font :type="item.icon" :size="16"/>
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
import {Icon} from '@arco-design/web-vue';
import logo from '@/assets/logo.png';

const IconFont = Icon.addFromIconFontCn({src: '//at.alicdn.com/t/c/font_4736032_ctp1csi3adp.js'});

export default defineComponent({
  components: {
    IconCaretRight,
    IconCaretLeft,
    IconHome,
    IconCalendar,
    Header,
    Footer,
    IconFont,
  },
  data() {
    return {
      menuItems: [
        {id: 1, name: '主页', icon: 'icon-shouye', route: '/'},
        {id: 2, name: '点播', icon: 'icon-dianbo', route: '/video'},
        {id: 3, name: '点播2', icon: 'icon-dianbo', route: '/video2'},
        {id: 4, name: '直播', icon: 'icon-dianshizhibo', route: '/live'},
        {id: 5, name: '书画柜', icon: 'icon-2zushushishujia', route: '/reader'},
        {id: 6, name: '解析', icon: 'icon-yumingjiexi', route: '/parser'},
        {id: 7, name: '收藏', icon: 'icon-shoucang', route: '/collection'},
        {id: 8, name: '历史', icon: 'icon-lishi', route: '/history'},
        {id: 9, name: '设置', icon: 'icon-shezhi', route: '/settings'}
      ],
      logoSrc: logo,
      logoDesc:'the logo for this application',
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
  /*height: 32px;*/
  margin: 12px 12px;
  background: rgba(255, 255, 255, 0.2);
  text-align: center;
  max-width: 100px;
}

.layout-demo :deep(.arco-layout-sider-light) .logo {
  background: var(--color-fill-2);
}

.layout-demo :deep(.arco-layout-sider-light) .logo img {
  max-width: 100px;
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
  max-height: calc(98vh - 64px - 48px - 80px); /* 去除头部、底部和面包屑后的可用空间 */
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
