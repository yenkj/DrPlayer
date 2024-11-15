<template>
  <a-breadcrumb :style="{ margin: '16px 0' }">
    <a-breadcrumb-item>{{ navigation_title }}</a-breadcrumb-item>

    <div class="header-left">
      <a-button type="outline" status="success" shape="round" @click="handleOpenForm">
        <template #icon>
          <icon-apps />
        </template>
        <template #default>{{ now_site_title }}</template>
      </a-button>

      <a-button type="outline" status="success" shape="round" @click="refreshPage">
        <template #icon>
          <icon-refresh />
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
        style="width: 300px"
      />
    </div>

    <!-- 右侧控制按钮 -->
    <div class="header-right">
      <a-button type="outline" status="success" shape="round" @click="minimize">
        <template #icon>
          <icon-bug />
        </template>
        <template #default>调试</template>
      </a-button>

      <a-button type="outline" status="success" shape="round" @click="maximize">
        <template #icon>
          <icon-settings />
        </template>
        <template #default>设置</template>
      </a-button>
      <a-button type="outline" status="success" shape="round" @click="closeWindow">
        <template #icon>
          <icon-user />
        </template>
        <template #default>用户设置</template>
      </a-button>
      <slot name="default"></slot>
    </div>
  </a-breadcrumb>
</template>

<script setup>
const props = defineProps({
  navigation_title: {
    type: String,
    default: "Video",
  },

  now_site_title: String,
});
const emit = defineEmits([
  "handleOpenForm",
  "closeWindow",
  "maximize",
  "minimize",
  "refreshPage",
  "onSearch",
]);

const handleOpenForm = () => {
  emit("handleOpenForm");
};
const refreshPage = () => {
  emit("refreshPage");
};
const onSearch = (value) => {
  emit("onSearch", value);
};

const closeWindow = () => {
  emit("closeWindow");
};
const minimize = () => {
  emit("minimize");
};
const maximize = () => {
  emit("maximize");
};
</script>

<style scoped>
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
