<template>
  <a-layout-header class="header">
    <!-- 左侧控制按钮 -->
    <div class="header-left">
      <a-button shape="circle" @click="goBack">
        <template #icon>
          <icon-left/>
        </template>
      </a-button>
      <a-button shape="circle" @click="goForward">
        <template #icon>
          <icon-right/>
        </template>
      </a-button>
      <a-button shape="circle" @click="refreshPage">
        <template #icon>
          <icon-refresh/>
        </template>
      </a-button>
    </div>

    <!-- 中间搜索框 -->
    <div class="header-center">
      <a-input-search
          placeholder="请输入搜索内容"
          enter-button
          @search="onSearch"
          style="width: 300px;"
      />
    </div>

    <!-- 右侧控制按钮 -->
    <div class="header-right">
      <a-button shape="circle" @click="minimize">
        <template #icon>
          <icon-shrink/>
        </template>
      </a-button>
      <a-button shape="circle" @click="maximize">
        <template #icon>
          <icon-expand/>
        </template>
      </a-button>
      <a-popconfirm content="你确认要关闭当前应用?" @ok="closeWindow">
        <a-button shape="circle">
          <template #icon>
            <icon-close/>
          </template>
        </a-button>
      </a-popconfirm>


    </div>
  </a-layout-header>
</template>

<script>
import {defineComponent} from 'vue';
import {Message} from '@arco-design/web-vue';

export default defineComponent({
  components: {},
  methods: {
    goBack() {
      Message.info("前进按钮");
      // 执行前进逻辑
    },
    goForward() {
      Message.info("后退按钮");
      // 执行后退逻辑
    },
    refreshPage() {
      Message.info("刷新页面");
      // 刷新页面逻辑
      window.location.reload();
    },
    onSearch(value) {
      Message.info(`搜索内容: ${value}`);
      // 执行搜索逻辑
    },
    minimize() {
      Message.info("最小化窗口");
      // 最小化窗口的逻辑，可以通过调用系统接口来实现
      this.exitFullScreen()
    },
    maximize() {
      Message.info("最大化窗口");
      // 最大化窗口的逻辑
      this.enterFullScreen()
    },
    closeWindow() {
      Message.info("将在1秒后关闭窗口");
      // 关闭窗口的逻辑，可以通过调用系统接口来实现
      setTimeout(function () {
        window.open("about:blank", "_self").close()
      }, 1000)
    },
    enterFullScreen() {
      let element = document.documentElement;
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.mozRequestFullScreen) { /* Firefox */
        element.mozRequestFullScreen();
      } else if (element.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
        element.webkitRequestFullscreen();
      } else if (element.msRequestFullscreen) { /* IE/Edge */
        element.msRequestFullscreen();
      }
    },
    exitFullScreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) { /* Firefox */
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) { /* IE/Edge */
        document.msExitFullscreen();
      }
    },
  }
});
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: #fff;
}

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
