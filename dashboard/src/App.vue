<template>
  <Layout>
    <!-- 使用 slot 渲染页面内容 -->
    <router-view />
  </Layout>
</template>

<script>
import Layout from './components/Layout.vue';

export default {
  name: 'App',
  components: {
    Layout,
  },
};
</script>

<style>
/* 你可以在这里写一些全局样式 */
</style>
