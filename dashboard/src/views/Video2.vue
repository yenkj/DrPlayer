<template>
  <Breadcrumb
    :navigation_title="'点播'"
    @handleOpenForm="handleOpenForm"
    @refreshPage="refreshPage"
    @minimize="minimize"
    @maximize="maximize"
    @closeWindow="closeWindow"
    @onSearch="onSearch"
    :now_site_title="form.now_site_title"
  >
    <template v-slot:default>
      <!-- 默认default 插槽的内容放这里 -->
      <div class="current-time">
        <span>{{ currentDateTime }}</span>
      </div>
    </template>
  </Breadcrumb>

  <!-- 内容区域 -->
  <a-layout-content class="content">
    <div>
      <h1>点播</h1>
      <p>这是点播页面的内容。</p>
      <ul v-if="form.sites.length > 0">
        <li v-for="site in form.sites" :key="site.key">{{ site.name }}</li>
      </ul>
      <p v-else>没有站点信息。</p>
    </div>
  </a-layout-content>

  <SourceDialog
    :visible="form.visible"
    :title="form.form_title"
    :sites="form.sites"
    :currentSiteKey="form.now_site.key"
    @update:visible="(val) => (form.visible = val)"
    @confirm-clear="handleConfirmClear"
    @confirm-change="handleConfirmChange"
    @change-rule="handleChangeRule"
  />
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import SourceDialog from "../components/SourceDialog.vue";
import Breadcrumb from "../components/Breadcrumb.vue";
import req from "@/utils/req";
import { useSiteStore } from "@/stores/siteStore";

const { nowSite, setCurrentSite } = useSiteStore();

const currentDateTime = ref("");
const form = reactive({
  sites: [],
  now_site_title: "hipy影视",
  now_site: {},
  visible: false,
  form_title: "",
});
const timer = ref(null);
const getData = async () => {
  try {
    let response;
    if (req.defaults.baseURL === "") {
      response = await req.get("/mock/data.json");
      response = response.config;
    } else {
      response = await req.get("/config"); // 假设这个请求返回 sites 数组
    }
    form.sites = response.sites; // 给 form.sites 赋值
  } catch (error) {
    console.error("请求数据失败:", error);
  }
};

const getNowSite = () => {
  if (nowSite && nowSite.name) {
    form.now_site = nowSite;
    form.now_site_title = nowSite.name;
  }
};

const checkNowSite = () => {
  form.new_site = form.now_site;
  if (!form.new_site.key && form.sites.length > 0) {
    form.new_site = form.sites[0];
  } else if (
    form.new_site.key &&
    !form.sites.map((i) => i.key).includes(form.new_site.key)
  ) {
    form.new_site = form.sites[0];
  }
};

const formatDate = (date) => {
  const options = {
    weekday: "long", // 星期几
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true, // 12小时制
  };
  return date.toLocaleString("zh-CN", options);
};

// 启动定时器
const startClock = () => {
  timer.value = setInterval(() => {
    currentDateTime.value = formatDate(new Date());
  }, 1000); // 每秒更新时间
};

const refreshPage = () => {
  window.location.reload();
};

const minimize = () => {};
const maximize = () => {};
const closeWindow = () => {};
const onSearch = (value) => console.log("搜索内容:", value);

const handleChangeRule = (site) => (form.new_site = site);

const handleConfirmClear = () => {
  form.now_site = form.new_site;
  setCurrentSite(form.now_site);
  form.visible = false;
  getData();
  checkNowSite();
};

const handleConfirmChange = (site) => {
  console.log("确认换源");
  form.now_site = site;
  setCurrentSite(site);
  form.now_site_title = site.name;
  form.visible = false;
};

const handleOpenForm = () => {
  form.visible = true;
  form.form_title = `请选择数据源(${form.sites.length})`;
  checkNowSite();
};

// 页面加载时获取数据
onMounted(() => {
  getData(); // 页面加载时获取数据
  getNowSite(); // 获取储存的当前源
  startClock(); // 启动时钟
});

// 清理定时器
onBeforeUnmount(() => {
  if (timer.value) {
    clearInterval(timer.value); // 销毁时清除定时器
  }
});
</script>

<style scoped>
/* 样式代码 */
.header-left,
.header-right {
  display: flex;
  align-items: center;
}

.header-left button,
.header-right button {
  margin-right: 10px;
}

.header-center {
  flex-grow: 1;
  display: flex;
  justify-content: center;
}

.header-center a-input-search {
  width: 300px;
}
</style>
