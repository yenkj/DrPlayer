<template>
  <a-breadcrumb :style="{ margin: '16px 0' }">
    <a-breadcrumb-item>Settings</a-breadcrumb-item>
  </a-breadcrumb>

  <a-layout-content class="content">
<!--  <div>-->
<!--    <h1>设置</h1>-->
<!--    <p>这是设置页面的内容。</p>-->
<!--  </div>-->

    <div class="grid-demo-background">
      <a-space direction="vertical" :size="16" style="display: block;">

        <a-row class="grid-demo">
          <a-col :span="24" class="col-title">
            <div> <strong>设置</strong>
            </div>
          </a-col>
        </a-row>

        <a-row class="grid-demo">
          <a-col :span="23">
            <div>配置地址</div>
          </a-col>
          <a-col :span="1">
            <a-button type="primary" size="large">
              <template #icon>
                <icon-history />
              </template>
            </a-button>
          </a-col>
        </a-row>
        <a-row class="grid-demo">
          <a-col :span="12" class="col-title">
            <div><icon-home />  <strong>首页</strong>
            </div>
          </a-col>
          <a-col :span="12" class="col-title">
            <div><icon-play-circle />  <strong>播放器</strong>
            </div>
          </a-col>
        </a-row>

        <a-row class="grid-demo">
          <a-col :span="12">
            <div>数据源<span class="col-more"> ></span></div>
          </a-col>
          <a-col :span="12">
            <div>窗口预览<span class="col-more">开启 ></span></div>
          </a-col>
        </a-row>

        <a-row class="grid-demo">
          <a-col :span="6">
            <div>数据源显示<span class="col-more">开启 ></span></div>
          </a-col>
          <a-col :span="6">
            <div>按钮位置<span class="col-more"> ></span></div>
          </a-col>
          <a-col :span="6">
            <div>页面缩放<span class="col-more">默认 ></span></div>
          </a-col>
          <a-col :span="6">
            <div>后台<span class="col-more">关闭 ></span></div>
          </a-col>
        </a-row>
        <a-row class="grid-demo">
          <a-col :span="6">
            <div>推荐<span class="col-more">站点推荐 ></span></div>
          </a-col>
          <a-col :span="6">
            <div>历史条数<span class="col-more">100条 ></span></div>
          </a-col>
          <a-col :span="6">
            <div>播放器<span class="col-more">IJK ></span></div>
          </a-col>
          <a-col :span="6">
            <div>IJK解码<span class="col-more">硬解码 ></span></div>
          </a-col>
        </a-row>
        <a-row class="grid-demo">
          <a-col :span="12">
            <div>启动时进直播<span class="col-more">关闭 ></span></div>
          </a-col>
          <a-col :span="6">
            <div>广告过滤<span class="col-more">开启 ></span></div>
          </a-col>
          <a-col :span="6">
            <div>IJK缓存<span class="col-more">关闭 ></span></div>
          </a-col>
        </a-row>

        <a-row class="grid-demo">
          <a-col :span="24" class="col-title">
            <div><icon-settings />  <strong>系统</strong>
            </div>
          </a-col>
        </a-row>

        <a-row class="grid-demo">
          <a-col :span="6">
            <div>语言<span class="col-more">中文 ></span></div>
          </a-col>
          <a-col :span="6">
            <div>主题<span class="col-more">奈飞 ></span></div>
          </a-col>
          <a-col :span="6">
            <div>换张壁纸<span class="col-more"> ></span></div>
          </a-col>
          <a-col :span="6">
            <div>重置壁纸<span class="col-more"> ></span></div>
          </a-col>
        </a-row>

        <a-row class="grid-demo">
          <a-col :span="12">
            <div>渲染方式<span class="col-more">TextureView ></span></div>
          </a-col>
          <a-col :span="12">
            <div>搜索展示<span class="col-more">缩略图 ></span></div>
          </a-col>
        </a-row>

        <a-row class="grid-demo">
          <a-col :span="12">
            <div>嗅探Webview<span class="col-more">系统自带 ></span></div>
          </a-col>
          <a-col :span="12">
            <div>安全DNS<span class="col-more">关闭 ></span></div>
          </a-col>
        </a-row>

        <a-row class="grid-demo">
          <a-col :span="6">
            <div>数据备份还原<span class="col-more"> ></span></div>
          </a-col>
          <a-col :span="6">
            <div>重置<span class="col-more"> ></span></div>
          </a-col>
          <a-col :span="6">
            <div>聚搜<span class="col-more">已关闭 ></span></div>
          </a-col>
          <a-col :span="6">
            <div>关于<span class="col-more"> ></span></div>
          </a-col>
        </a-row>


      </a-space>
    </div>

  </a-layout-content>
</template>

<script>
export default {
  name: 'Settings'
};
</script>

<style scoped>
/* 页面样式 */

/*.grid-demo-background {*/
/*  background-image: linear-gradient(*/
/*      90deg,*/
/*      var(--color-fill-2) 4.16666667%,*/
/*      transparent 4.16666667%,*/
/*      transparent 8.33333333%,*/
/*      var(--color-fill-2) 8.33333333%,*/
/*      var(--color-fill-2) 12.5%,*/
/*      transparent 12.5%,*/
/*      transparent 16.66666667%,*/
/*      var(--color-fill-2) 16.66666667%,*/
/*      var(--color-fill-2) 20.83333333%,*/
/*      transparent 20.83333333%,*/
/*      transparent 25%,*/
/*      var(--color-fill-2) 25%,*/
/*      var(--color-fill-2) 29.16666667%,*/
/*      transparent 29.16666667%,*/
/*      transparent 33.33333333%,*/
/*      var(--color-fill-2) 33.33333333%,*/
/*      var(--color-fill-2) 37.5%,*/
/*      transparent 37.5%,*/
/*      transparent 41.66666667%,*/
/*      var(--color-fill-2) 41.66666667%,*/
/*      var(--color-fill-2) 45.83333333%,*/
/*      transparent 45.83333333%,*/
/*      transparent 50%,*/
/*      var(--color-fill-2) 50%,*/
/*      var(--color-fill-2) 54.16666667%,*/
/*      transparent 54.16666667%,*/
/*      transparent 58.33333333%,*/
/*      var(--color-fill-2) 58.33333333%,*/
/*      var(--color-fill-2) 62.5%,*/
/*      transparent 62.5%,*/
/*      transparent 66.66666667%,*/
/*      var(--color-fill-2) 66.66666667%,*/
/*      var(--color-fill-2) 70.83333333%,*/
/*      transparent 70.83333333%,*/
/*      transparent 75%,*/
/*      var(--color-fill-2) 75%,*/
/*      var(--color-fill-2) 79.16666667%,*/
/*      transparent 79.16666667%,*/
/*      transparent 83.33333333%,*/
/*      var(--color-fill-2) 83.33333333%,*/
/*      var(--color-fill-2) 87.5%,*/
/*      transparent 87.5%,*/
/*      transparent 91.66666667%,*/
/*      var(--color-fill-2) 91.66666667%,*/
/*      var(--color-fill-2) 95.83333333%,*/
/*      transparent 95.83333333%*/
/*  );*/
/*}*/

.grid-demo .arco-col {
  height: 48px;
  line-height: 48px;
  color: var(--color-white);
  text-align: left;
  padding-left: 20px;
  padding-right: 20px;
}
.grid-demo .arco-col:nth-child(2n) {
  background-color: rgba(var(--arcoblue-6), 0.9);
}
.grid-demo .arco-col:nth-child(2n + 1) {
  background-color: var(--color-primary-light-4);
}
.col-more {
  text-align: center;
  float: right;
}
.grid-demo .arco-col.col-title {
  background-color: rgba(var(--arcoblue-6), 0.9);
}

</style>
