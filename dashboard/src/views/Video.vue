<template>
  <!-- 内容上方面包屑-->
  <a-breadcrumb :style="{ margin: '16px 0' }">
    <a-breadcrumb-item>Video</a-breadcrumb-item>

    <div class="header-left">
      <a-button type="outline" status="success" shape="round" @click="handleOpenForm">
        <template #icon>
          <icon-apps/>
        </template>
        <template #default>{{ form.now_site_title }}</template>
      </a-button>

      <a-button type="outline" status="success" shape="round" @click="refreshPage">
        <template #icon>
          <icon-refresh/>
        </template>
        <template #default>重载源</template>
      </a-button>
    </div>

    <!-- 中间搜索框 -->
    <div class="header-center">
      <a-input-search
          placeholder="搜索视频"
          enter-button
          @search="onSearch"
          style="width: 300px;"
      />
    </div>

    <!-- 右侧控制按钮 -->
    <div class="header-right">
      <a-button type="outline" status="success" shape="round" @click="minimize">
        <template #icon>
          <icon-bug/>
        </template>
        <template #default>调试</template>
      </a-button>

      <a-button type="outline" status="success" shape="round" @click="maximize">
        <template #icon>
          <icon-settings/>
        </template>
        <template #default>设置</template>
      </a-button>
      <a-button type="outline" status="success" shape="round" @click="closeWindow">
        <template #icon>
          <icon-user/>
        </template>
        <template #default>用户设置</template>
      </a-button>

      <!-- 当前时间显示 -->
      <div class="current-time">
        <span>{{ currentDateTime }}</span>
      </div>
    </div>
  </a-breadcrumb>

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

  <!-- 换源对话框 -->
  <a-modal
      v-model:visible="form.open"
      :title="form.form_title"
      :width="dialogWidth"
      class="change_rule_dialog"
      append-to-body
  >
    <a-input
        v-model="siteFilter"
        placeholder="请输入站源名称"
        class="site_filter_input"
        allow-clear
    />

    <a-form
        :model="form"
        label-width="120px"
        class="change_rule_form"
    >
      <div class="button-container">
        <div
            v-for="(site, index) in filteredSites"
            :key="index"
            :ref="site.key === form.new_site.key ? 'currentSite' : ''"
            class="btn-item"
        >
          <a-button
              :ref="form.new_site.key === site.key ? 'currentSite' : ''"
              type="primary"
              :status="form.new_site.key === site.key ? 'success' : 'primary'"
              size="medium"
              @click="handleChangeRule(site)"
          >
            {{ site.name }}
          </a-button>
        </div>
      </div>
    </a-form>

    <template #footer>
      <div class="dialog-footer-right dialog-footer">
        <a-button type="primary" status="danger" @click="handleConfirmClear">清除缓存</a-button>
        <a-button type="primary" @click="handleConfirmChange">确认换源</a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup>
import {ref, reactive, computed, onMounted, onBeforeUnmount, nextTick} from 'vue';
import req from '@/utils/req'; // 假设这是你封装的 axios 请求
import {useSiteStore} from '@/stores/siteStore'

const {nowSite, setCurrentSite} = useSiteStore()
// 响应式数据
const currentDateTime = ref('');
const form = reactive({
  sites: [],
  now_site_title: 'hipy影视',
  now_site: {},
  new_site: {},
  open: false, // 控制弹出框是否可见
  form_title: '', // 弹出框标题
});
const siteFilter = ref(''); // 搜索框的绑定值
const timer = ref(null);
const currentSite = ref(null);

// 获取站点数据
const getData = async () => {
  try {
    const response = await req.get('/config'); // 假设这个请求返回 sites 数组
    form.sites = response.sites; // 给 form.sites 赋值
  } catch (error) {
    console.error('请求数据失败:', error);
  }
};

const getNowSite = () => {
  if (nowSite && nowSite.name) {
    form.now_site = nowSite;
    form.now_site_title = nowSite.name;
  }
}

const checkNowSite = () => {
  form.new_site = form.now_site
  if (!form.new_site.key && form.sites.length > 0) {
    form.new_site = form.sites[0]
  } else if (form.new_site.key && !form.sites.map(i => i.key).includes(form.new_site.key)) {
    form.new_site = form.sites[0]
  }
}

// 格式化日期
const formatDate = (date) => {
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
  return date.toLocaleString('zh-CN', options);
};

// 过滤站点
const filteredSites = computed(() => {
  const inputLower = siteFilter.value.toLowerCase();
  return form.sites.filter((site) => site.name.toLowerCase().includes(inputLower));
});

// 对话框宽度
const dialogWidth = computed(() => {
  return window.innerWidth < 768 ? '100%' : '600px';
});

// 启动定时器
const startClock = () => {
  timer.value = setInterval(() => {
    currentDateTime.value = formatDate(new Date());
  }, 1000); // 每秒更新时间
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

// 页面刷新
const refreshPage = () => {
  window.location.reload();
};

// 最小化窗口
const minimize = () => {
  // 最小化窗口的逻辑
};

// 最大化窗口
const maximize = () => {
  // 最大化窗口的逻辑
};

// 关闭窗口
const closeWindow = () => {
  // 关闭窗口的逻辑
};

// 搜索操作
const onSearch = (value) => {
  console.log('搜索内容:', value);
};

// 处理换源操作
const handleChangeRule = (site) => {
  form.new_site = site;
};

// 清除缓存操作
const handleConfirmClear = () => {
  console.log('清除缓存');
  form.now_site = form.new_site
  setCurrentSite(form.now_site)
  form.open = false
  getData()
  checkNowSite()
};

// 确认换源操作
const handleConfirmChange = () => {
  console.log('确认换源');
  form.now_site = form.new_site
  setCurrentSite(form.now_site)
  form.now_site_title = form.new_site.name
  form.open = false
};

const scrollToCurrentSite = () => {
  nextTick(() => {
    // 确保 DOM 更新完成后滚动到当前源位置
    if (currentSite.value) {
      currentSite.value[0].$el.scrollIntoView({behavior: 'smooth', block: 'center'});
    }
  });
};

// 打开对话框并设置标题
const handleOpenForm = () => {
  form.open = true;
  form.form_title = `请选择数据源(${form.sites.length})`;
  checkNowSite();
  scrollToCurrentSite();
};
</script>

<style>
.change_rule_dialog .arco-modal-body {
  padding: 1px !important; /* 使用 !important 强制覆盖 */
}
</style>

<style scoped>
/* 页面样式 */

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

.change_rule_form {
  min-height: 200px;
  max-height: 400px;
}

.site_filter_input {
  padding: 5px 5px 5px 5px;
  border-radius: 12px;
  width: calc(31.3% * 3);
}

.dialog-footer button {
  margin-right: 20px;
}

.dialog-footer-left {
  display: flex;
  justify-content: flex-start; /* 将按钮对齐到左侧 */
}

.dialog-footer-right {
  display: flex;
  justify-content: flex-end; /* 将按钮对齐到右侧 */
}

.custom-confirm {
  max-width: 90%; /* 最大宽度为 90% */
  width: auto; /* 宽度自适应内容 */
}

.button-container {
  width: 100%;
  max-height: 400px;
  //overflow: hidden;
  overflow-y: scroll;
  overflow-x: hidden;
  display: flex;
  flex-wrap: wrap;

  .btn-item {
    text-align: center;
    width: calc(31.3%);
    padding: 2px 2px 2px 2px;

    &:nth-child(8) {
      margin-right: 0;
    }

    button {
      width: 100%;
    }
  }
}
</style>
