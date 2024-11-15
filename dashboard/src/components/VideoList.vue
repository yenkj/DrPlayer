<template>
  <a-tabs
    lazy-load
    size="large"
    justify
    animation
    v-model:activeKey="activeKey"
    :trigger="trigger"
    @change="getListData"
  >
    <a-tab-pane key="recommendTuijian404" title="推荐">
      <a-scrollbar
        @scroll="scrollToBottom($event)"
        :style="'height:' + listHeight + 'px; overflow: auto;margin-right: 14px;'"
      >
        <a-grid :cols="{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }" :rowGap="10">
          <a-grid-item
            v-for="item in listData[activeKey]"
            :key="item.vod_id"
            class="video_list_hover"
          >
            <div class="video_list_item">
              <div class="video_list_item_img">
                <a-image
                  :preview="false"
                  class="video_list_item_img_cover"
                  fit="cover"
                  :src="item.vod_pic"
                >
                </a-image>
              </div>

              <div class="video_list_item_title">{{ item.vod_name }}</div>
            </div>
          </a-grid-item>
        </a-grid>
        <div style="height: 60px"></div>
      </a-scrollbar>
    </a-tab-pane>
    <a-tab-pane
      v-for="item in classList.class"
      :key="item.type_id"
      :title="item.type_name"
    >
      <a-scrollbar
        @scroll="scrollToBottom($event)"
        :style="'height:' + listHeight + 'px; overflow: auto;margin-right: 14px;'"
      >
        <a-grid :cols="{ xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 }" :rowGap="10">
          <a-grid-item
            v-for="item in listData[item.type_id]"
            :key="item.vod_id"
            class="video_list_hover"
          >
            <div class="video_list_item">
              <div class="video_list_item_img">
                <a-image
                  :preview="false"
                  class="video_list_item_img_cover"
                  fit="cover"
                  :src="item.vod_pic"
                >
                </a-image>
              </div>

              <div class="video_list_item_title">{{ item.vod_name }}</div>
            </div>
          </a-grid-item>
        </a-grid>
        <div style="height: 60px"></div>
      </a-scrollbar>
    </a-tab-pane>
  </a-tabs>
</template>

<script setup>
import req from "@/utils/req";
import { ref, reactive, onMounted } from "vue";
//分类选中id
const activeKey = ref("recommendTuijian404"); //key设置一个网站永远不会设置type_id
const listData = reactive({});
const listHeight = ref(0);
const props = defineProps({
  classList: Object,
  trigger: {
    type: String,
    default: "click",
  },
});

//获取分类列表数据
const getListData = async (key) => {
  console.log(key, "选中分类id"); //记得判断一下key=activeKey的默认值是不是推荐列表
  if (!listData.hasOwnProperty(key)) {
    //已存在的就不用在次请求了
    try {
      let response;
      if (req.defaults.baseURL === "") {
        response = await req.get("/mock/data.json");
        listData[key] = response.homeVod.list;
      } else {
        response = await req.get("/homeVod"); // 假设这个请求返回 sites 数组
        listData[key] = response.list;
      }
    } catch (error) {
      console.error("请求数据失败:", error);
    }
  }
};
const scrollToBottom = (e) => {
  //e.srcElement.offsetHeight = e.srcElement.clientHeight
  const scrollHeight = e.srcElement.scrollHeight - e.srcElement.clientHeight;
  if (scrollHeight - e.srcElement.scrollTop < 1) {
    console.log("触发底部加载事件");
  }
};

//帮我写一个函数，判断是否加载完毕，如果加载完毕就执行，否则就定时器11213
onMounted(() => {
  //默认加载推荐列表
  getListData(activeKey.value);
  //加载完成后开始计算滚动条高度
  listHeight.value = document.querySelector(".arco-tabs-content-list").offsetHeight - 16;
});
</script>

<style scoped>
.arco-tabs::v-deep(.arco-tabs-tab-title) {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 8px;
  text-align: center;
  text-indent: 8px;
}

.arco-tabs::v-deep(.arco-tabs-tab-active),
.arco-tabs::v-deep(.arco-tabs-tab-active:hover) {
  color: rgb(var(--success-6));
}
.arco-tabs::v-deep(.arco-tabs-nav-ink) {
  background-color: rgb(var(--success-6));
}

.video_list_item {
  transition: all 0.3s ease-in-out;
  box-shadow: 0 2px 12px 0 rgb(190, 190, 190);
  border: 1px solid rgb(207, 207, 207);
  border-radius: 8px;
  margin: 10px 10px 0 10px;
}
.video_list_hover {
  cursor: pointer;
  transition: all 0.3s ease-in-out;
}

.video_list_hover:hover {
  transform: translateY(-5px);
}
.video_list_hover:hover .video_list_item {
  box-shadow: 0 8px 16px 0 rgb(68, 68, 68);
  color: rgb(var(--success-6));
}

.video_list_item_img_cover {
  width: 100%;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  overflow: hidden;
  vertical-align: top;
}
.video_list_item::v-deep(.arco-image-img) {
  width: 100%;

  height: 300px;
}
.video_list_item_title {
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: center;
  padding: 10px 10px;
}
</style>
