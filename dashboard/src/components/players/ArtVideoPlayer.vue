<template>
  <a-card v-if="visible && videoUrl" class="art-video-player-section">
    <div class="player-header">
      <h3>正在播放: {{ episodeName }}</h3>
      <div class="player-controls">
        <a-select 
          :model-value="playerType" 
          @change="handlePlayerTypeChange"
          size="small" 
          style="width: 120px; margin-right: 8px;"
        >
          <a-option value="default">默认播放器</a-option>
          <a-option value="artplayer">ArtPlayer</a-option>
        </a-select>
        <a-button @click="closePlayer" size="small" type="outline">
          <template #icon>
            <icon-close />
          </template>
          关闭播放器
        </a-button>
      </div>
    </div>
    <div class="art-player-container">
      <div ref="artPlayerContainer" class="art-player"></div>
    </div>
  </a-card>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconClose } from '@arco-design/web-vue/es/icon'
import Artplayer from 'artplayer'
import Hls from 'hls.js'

// Props - 已添加 HLS 支持和动态高度自适应
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  videoUrl: {
    type: String,
    default: ''
  },
  episodeName: {
    type: String,
    default: '未知选集'
  },
  poster: {
    type: String,
    default: ''
  },
  playerType: {
    type: String,
    default: 'artplayer'
  }
})

// Emits
const emit = defineEmits(['close', 'error', 'player-change'])

// 响应式数据
const artPlayerContainer = ref(null)
const artPlayerInstance = ref(null)
const retryCount = ref(0) // 重连次数计数器
const maxRetries = ref(3) // 最大重连次数
const isRetrying = ref(false) // 是否正在重连
const dynamicHeight = ref(450) // 动态计算的高度

// 链接类型判断函数
const isDirectVideoLink = (url) => {
  if (!url) return false
  
  // 视频文件扩展名
  const videoExtensions = [
    '.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv', 
    '.m4v', '.3gp', '.ts', '.m3u8', '.mpd'
  ]
  
  // 检查URL是否包含视频扩展名
  const hasVideoExtension = videoExtensions.some(ext => 
    url.toLowerCase().includes(ext)
  )
  
  // 检查是否是流媒体格式
  const isStreamingFormat = url.toLowerCase().includes('m3u8') || 
                           url.toLowerCase().includes('mpd') ||
                           url.toLowerCase().includes('rtmp') ||
                           url.toLowerCase().includes('rtsp')
  
  // 检查是否看起来像网页链接
  const looksLikeWebpage = url.includes('://') && 
                          (url.includes('.html') || 
                           url.includes('.php') || 
                           url.includes('.asp') || 
                           url.includes('.jsp') ||
                           url.match(/\/[^.]*$/) || // 没有扩展名的路径
                           url.includes('?') || // 包含查询参数
                           url.includes('#')) // 包含锚点
  
  // 如果有视频扩展名或是流媒体格式，认为是直链
  if (hasVideoExtension || isStreamingFormat) {
    return true
  }
  
  // 如果看起来像网页，认为不是直链
  if (looksLikeWebpage && !hasVideoExtension && !isStreamingFormat) {
    return false
  }
  
  // 默认尝试作为直链处理
  return true
}

// 初始化 ArtPlayer
const initArtPlayer = async (url) => {
  if (!artPlayerContainer.value || !url) return
  
  console.log('初始化 ArtPlayer:', url)
  
  // 重置重连状态
  resetRetryState()
  
  // 等待 DOM 更新后计算动态高度
  await nextTick()
  dynamicHeight.value = calculateDynamicHeight()
  
  // 应用动态高度到容器
  artPlayerContainer.value.style.height = `${dynamicHeight.value}px`
  
  // 首先判断链接类型
  if (!isDirectVideoLink(url)) {
    console.log('检测到网页链接，在新窗口打开:', url)
    Message.info('检测到网页链接，正在新窗口打开...')
    window.open(url, '_blank')
    emit('close') // 关闭播放器
    return
  }
  
  // 清理之前的播放器实例
  if (artPlayerInstance.value) {
    // 清理 HLS 实例
    if (artPlayerInstance.value.hls) {
      artPlayerInstance.value.hls.destroy()
      artPlayerInstance.value.hls = null
    }
    
    artPlayerInstance.value.destroy()
    artPlayerInstance.value = null
  }
  
  try {
    // 检查是否为 HLS 流
    const isHLS = url.includes('.m3u8') || url.includes('m3u8')
    
    // 创建 ArtPlayer 实例
    const art = new Artplayer({
      container: artPlayerContainer.value,
      url: url,
      poster: props.poster,
      volume: 0.7,
      isLive: false,
      muted: false,
      autoplay: true,
      pip: true,
      autoSize: false,
      autoMini: true,
      width: '100%',
      height: dynamicHeight.value,
      screenshot: true,
      setting: true,
      loop: false,
      flip: true,
      playbackRate: true,
      aspectRatio: true,
      fullscreen: true,
      fullscreenWeb: true,
      subtitleOffset: true,
      miniProgressBar: true,
      mutex: true,
      backdrop: true,
      playsInline: true,
      autoPlayback: true,
      airplay: true,
      theme: '#23ade5',
      lang: 'zh-cn',
      whitelist: ['*'],
      moreVideoAttr: {
        crossOrigin: 'anonymous',
      },
      // 自定义视频类型处理
      type: isHLS ? 'm3u8' : '',
      // 自定义加载器
      customType: isHLS ? {
        m3u8: function (video, url, art) {
          if (Hls.isSupported()) {
            const hls = new Hls({
              // HLS 配置选项
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90,
            })
            
            hls.loadSource(url)
            hls.attachMedia(video)
            
            // 存储 hls 实例到 art 对象上，方便后续清理
            art.hls = hls
            
            // HLS 事件监听
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log('HLS manifest 解析完成')
            })
            
            hls.on(Hls.Events.ERROR, (event, data) => {
              console.error('HLS 错误:', data)
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.log('网络错误，尝试恢复...')
                    hls.startLoad()
                    break
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.log('媒体错误，尝试恢复...')
                    hls.recoverMediaError()
                    break
                  default:
                    console.log('无法恢复的错误，销毁 HLS 实例')
                    hls.destroy()
                    break
                }
              }
            })
          } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari 原生支持 HLS
            video.src = url
          } else {
            console.error('此浏览器不支持 HLS 播放')
            Message.error('此浏览器不支持 HLS 播放')
          }
        }
      } : {},
      // 自定义控制栏
      controls: [
        {
          position: 'right',
          html: '关闭',
          tooltip: '关闭播放器',
          click: function () {
            closePlayer()
          },
        },
      ],
      // 质量选择器（如果支持）
      quality: [],
      // 字幕配置
      subtitle: {
        url: '',
        type: 'srt',
        encoding: 'utf-8',
        escape: true,
      },
      // 右键菜单
      contextmenu: [
        {
          html: '自定义菜单',
          click: function () {
            console.log('点击了自定义菜单')
          },
        },
      ],
      // 图层配置
      layers: [],
      // 插件配置
      plugins: [],
    })

    // 事件监听
    art.on('ready', () => {
      console.log('ArtPlayer 准备就绪')
    })

    art.on('video:loadstart', () => {
      console.log('开始加载视频')
    })

    art.on('video:canplay', () => {
      console.log('视频可以播放')
      // 视频可以播放时，重置重连计数器
      resetRetryState()
    })

    art.on('video:playing', () => {
      console.log('视频开始播放')
      // 视频开始播放时，重置重连计数器
      resetRetryState()
    })

    art.on('video:error', (err) => {
      console.error('ArtPlayer 播放错误:', err)
      
      // 如果播放失败，再次检查是否为网页链接
      if (!isDirectVideoLink(url)) {
        console.log('播放失败，检测到可能是网页链接，在新窗口打开:', url)
        Message.info('视频播放失败，检测到网页链接，正在新窗口打开...')
        window.open(url, '_blank')
        emit('close') // 关闭播放器
        return
      }
      
      // 处理重连逻辑
      handleRetry(url)
    })

    art.on('destroy', () => {
      console.log('ArtPlayer 已销毁')
    })

    artPlayerInstance.value = art

  } catch (error) {
    console.error('创建 ArtPlayer 实例失败:', error)
    Message.error('播放器初始化失败')
    emit('error', '播放器初始化失败')
  }
}

// 关闭播放器
const closePlayer = () => {
  console.log('关闭 ArtPlayer 播放器')
  
  // 重置重连状态
  resetRetryState()
  
  // 清理播放器实例
  if (artPlayerInstance.value) {
    // 清理 HLS 实例
    if (artPlayerInstance.value.hls) {
      artPlayerInstance.value.hls.destroy()
      artPlayerInstance.value.hls = null
    }
    
    artPlayerInstance.value.destroy()
    artPlayerInstance.value = null
  }
  
  emit('close')
}

// 处理播放器类型变更
const handlePlayerTypeChange = (newType) => {
  emit('player-change', newType)
}

// 处理重连逻辑
const handleRetry = (url) => {
  if (isRetrying.value) {
    return // 如果正在重连，避免重复触发
  }
  
  if (retryCount.value < maxRetries.value) {
    isRetrying.value = true
    retryCount.value++
    
    console.log(`ArtPlayer 播放失败，正在进行第 ${retryCount.value} 次重连...`)
    Message.warning(`播放失败，正在进行第 ${retryCount.value} 次重连...`)
    
    // 延迟重连，避免频繁重试
    setTimeout(() => {
      if (artPlayerInstance.value) {
        try {
          // 重新加载视频
          artPlayerInstance.value.switchUrl(url)
          isRetrying.value = false
        } catch (error) {
          console.error('重连时出错:', error)
          isRetrying.value = false
          handleRetry(url) // 递归重试
        }
      }
    }, 2000 * retryCount.value) // 递增延迟：2秒、4秒、6秒
  } else {
    // 超过最大重连次数
    console.error('ArtPlayer 重连次数已达上限，停止重连')
    Message.error(`视频播放失败，已重试 ${maxRetries.value} 次，请检查视频链接或网络连接`)
    emit('error', '视频播放失败，重连次数已达上限')
    
    // 重置重连计数器
    retryCount.value = 0
    isRetrying.value = false
  }
}

// 重置重连状态
const resetRetryState = () => {
  retryCount.value = 0
  isRetrying.value = false
  console.log('重连状态已重置')
}

// 计算动态高度
const calculateDynamicHeight = () => {
  if (!artPlayerContainer.value) return 450
  
  const containerWidth = artPlayerContainer.value.offsetWidth
  if (containerWidth === 0) return 450
  
  // 按照 16:9 的比例计算高度
  const aspectRatio = 16 / 9
  let calculatedHeight = containerWidth / aspectRatio
  
  // 设置最小和最大高度限制
  const minHeight = 300
  const maxHeight = Math.min(window.innerHeight * 0.7, 600)
  
  calculatedHeight = Math.max(minHeight, Math.min(calculatedHeight, maxHeight))
  
  console.log(`容器宽度: ${containerWidth}px, 计算高度: ${calculatedHeight}px`)
  return Math.round(calculatedHeight)
}

// 监听视频URL变化
watch(() => props.videoUrl, async (newUrl) => {
  if (newUrl && props.visible) {
    resetRetryState() // 重置重连状态
    await nextTick()
    await initArtPlayer(newUrl)
  }
}, { immediate: true })

// 监听显示状态变化
watch(() => props.visible, async (newVisible) => {
  if (newVisible && props.videoUrl) {
    await nextTick()
    await initArtPlayer(props.videoUrl)
  } else if (!newVisible) {
    // 隐藏时清理资源
    if (artPlayerInstance.value) {
      artPlayerInstance.value.destroy()
      artPlayerInstance.value = null
    }
  }
})

// 窗口大小变化处理
const handleResize = () => {
  if (artPlayerContainer.value && artPlayerInstance.value) {
    const newHeight = calculateDynamicHeight()
    if (newHeight !== dynamicHeight.value) {
      dynamicHeight.value = newHeight
      artPlayerContainer.value.style.height = `${newHeight}px`
      // 通知 ArtPlayer 更新尺寸
      artPlayerInstance.value.resize()
    }
  }
}

// 组件挂载时的初始化
onMounted(() => {
  console.log('ArtVideoPlayer 组件已挂载 - 动态高度版本')
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
})

// 组件卸载时清理资源
onUnmounted(() => {
  console.log('ArtVideoPlayer组件卸载，清理播放器资源')
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize)
  if (artPlayerInstance.value) {
    artPlayerInstance.value.destroy()
    artPlayerInstance.value = null
  }
})
</script>

<style scoped>
/* ArtPlayer 播放器样式 */
.art-video-player-section {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.player-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  margin: 0;
}

.player-controls {
  display: flex;
  gap: 8px;
}

.art-player-container {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.art-player {
  width: 100%;
  background: #000;
  /* 高度由 JavaScript 动态设置 */
}

/* 响应式设计 */
@media (max-width: 768px) {
  .player-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .player-header h3 {
    font-size: 14px;
  }

  .art-player {
    /* 移动端高度也由 JavaScript 动态设置 */
  }
}

/* ArtPlayer 主题定制 */
:deep(.art-video-player) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.art-bottom) {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
}

:deep(.art-control) {
  color: #fff;
}

:deep(.art-control:hover) {
  color: #23ade5;
}
</style>