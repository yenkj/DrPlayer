<template>
  <a-modal
      :visible="visible"
      :title="title"
      :width="dialogWidth"
      class="change_rule_dialog"
      append-to-body
      :on-before-cancel="handleConfirmClear"
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
            class="btn-item"
        >
          <a-button
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
import { ref, computed, nextTick } from 'vue';

const props = defineProps({
  visible: Boolean,
  title: String,
  sites: Array,
  currentSiteKey: String,
});
const emit = defineEmits(['update:visible', 'confirm-clear', 'confirm-change', 'change-rule']);

const siteFilter = ref('');
const form = ref({ new_site: {} });

const filteredSites = computed(() => {
  const inputLower = siteFilter.value.toLowerCase();
  return props.sites.filter(site => site.name.toLowerCase().includes(inputLower));
});

const dialogWidth = computed(() => (window.innerWidth < 768 ? '100%' : '600px'));

const handleChangeRule = (site) => {
  form.value.new_site = site;
  emit('change-rule', site);
};

const handleConfirmClear = () => {
  emit('confirm-clear');
  emit('update:visible', false);
};

const handleConfirmChange = () => {
  emit('confirm-change', form.value.new_site);
  emit('update:visible', false);
};
</script>

<style>
.change_rule_dialog .arco-modal-body {
  padding: 1px !important; /* 使用 !important 强制覆盖 */
}
</style>


<style scoped>

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
  overflow-y: scroll;
  display: flex;
  flex-wrap: wrap;
}
/* .btn-item:nth-child(8) {
      margin-right: 0;
} */
.btn-item {
  text-align: center;
  width: calc(31.3%);
  padding: 2px;
}
.btn-item button {width: 100%;}
</style>
