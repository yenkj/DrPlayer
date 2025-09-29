<template>
  <a-card v-if="visible && videoUrl" class="video-player-section">
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
    <div class="video-player-container">
      <video 
        ref="videoPlayer"
        class="video-player"
        controls
        autoplay
        preload="auto"
        :poster="poster"
      >
        您的浏览器不支持视频播放
      </video>
    </div>
  </a-card>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconClose } from '@arco-design/web-vue/es/icon'
import Hls from 'hls.js'

// Props
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
    default: 'default'
  }
})

// Emits
const emit = defineEmits(['close', 'error', 'player-change'])

// 响应式数据
const videoPlayer = ref(null)
const hlsInstance = ref(null)

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

// 初始化视频播放器
const initVideoPlayer = (url) => {
  if (!videoPlayer.value || !url) return
  
  console.log('初始化视频播放器:', url)
  
  // 首先判断链接类型
  if (!isDirectVideoLink(url)) {
    console.log('检测到网页链接，在新窗口打开:', url)
    Message.info('检测到网页链接，正在新窗口打开...')
    window.open(url, '_blank')
    emit('close') // 关闭播放器
    return
  }
  
  // 清理之前的HLS实例
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
    hlsInstance.value = null
  }
  
  const video = videoPlayer.value
  
  // 检测视频格式
  const isM3u8 = url.toLowerCase().includes('.m3u8') || url.toLowerCase().includes('m3u8')
  
  if (isM3u8) {
    // 处理m3u8格式
    if (Hls.isSupported()) {
      // 使用HLS.js播放m3u8
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      })
      
      hls.loadSource(url)
      hls.attachMedia(video)
      
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('HLS manifest 解析完成，开始播放')
        video.play().catch(err => {
          console.warn('自动播放失败:', err)
        })
      })
      
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS播放错误:', data)
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              Message.error('网络错误，请检查网络连接')
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              Message.error('媒体错误，尝试恢复播放')
              hls.recoverMediaError()
              break
            default:
              // 播放器错误时，检查是否为网页链接
              if (!isDirectVideoLink(url)) {
                console.log('HLS播放失败，检测到可能是网页链接，在新窗口打开:', url)
                Message.info('视频播放失败，检测到网页链接，正在新窗口打开...')
                window.open(url, '_blank')
                emit('close') // 关闭播放器
              } else {
                Message.error('播放器错误，请重试')
                emit('error', '播放器错误')
              }
              hls.destroy()
              break
          }
        }
      })
      
      hlsInstance.value = hls
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari原生支持HLS
      video.src = url
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(err => {
          console.warn('自动播放失败:', err)
        })
      })
    } else {
      Message.error('您的浏览器不支持HLS播放')
      emit('error', '浏览器不支持HLS播放')
    }
  } else {
    // 处理其他格式的视频（mp4, webm, avi等）
    console.log('播放普通视频格式:', url)
    video.src = url
    
    // 添加事件监听器
    const handleLoadedMetadata = () => {
      console.log('视频元数据加载完成，开始播放')
      video.play().catch(err => {
        console.warn('自动播放失败:', err)
        Message.warning('自动播放失败，请手动点击播放')
      })
    }
    
    const handleError = (e) => {
      console.error('视频播放错误:', e)
      
      // 如果播放失败，再次检查是否为网页链接
      if (!isDirectVideoLink(url)) {
        console.log('播放失败，检测到可能是网页链接，在新窗口打开:', url)
        Message.info('视频播放失败，检测到网页链接，正在新窗口打开...')
        window.open(url, '_blank')
        emit('close') // 关闭播放器
      } else {
        Message.error('视频播放失败，请检查视频链接或格式')
        emit('error', '视频播放失败')
      }
    }
    
    const handleLoadStart = () => {
      console.log('开始加载视频')
    }
    
    // 移除之前的事件监听器（如果有）
    video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    video.removeEventListener('error', handleError)
    video.removeEventListener('loadstart', handleLoadStart)
    
    // 添加新的事件监听器
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)
    video.addEventListener('loadstart', handleLoadStart)
    
    // 开始加载视频
    video.load()
  }
}

// 关闭播放器
const closePlayer = () => {
  console.log('关闭视频播放器')
  
  // 停止播放
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.currentTime = 0
  }
  
  // 清理HLS实例
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
    hlsInstance.value = null
  }
  
  emit('close')
}

// 处理播放器类型变更
const handlePlayerTypeChange = (newType) => {
  emit('player-change', newType)
}

// 监听视频URL变化
watch(() => props.videoUrl, (newUrl) => {
  if (newUrl && props.visible) {
    nextTick(() => {
      initVideoPlayer(newUrl)
    })
  }
}, { immediate: true })

// 监听显示状态变化
watch(() => props.visible, (newVisible) => {
  if (newVisible && props.videoUrl) {
    nextTick(() => {
      initVideoPlayer(props.videoUrl)
    })
  } else if (!newVisible) {
    // 隐藏时清理资源
    if (hlsInstance.value) {
      hlsInstance.value.destroy()
      hlsInstance.value = null
    }
  }
})

// 组件卸载时清理资源
onUnmounted(() => {
  console.log('VideoPlayer组件卸载，清理播放器资源')
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
    hlsInstance.value = null
  }
})
</script>

<style scoped>
/* 视频播放器样式 */
.video-player-section {
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

.video-player-container {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.video-player {
  width: 100%;
  height: auto;
  min-height: 400px;
  max-height: 70vh;
  background: #000;
  outline: none;
}

.video-player::-webkit-media-controls-panel {
  background-color: transparent;
}

.video-player::-webkit-media-controls-play-button,
.video-player::-webkit-media-controls-volume-slider,
.video-player::-webkit-media-controls-timeline,
.video-player::-webkit-media-controls-current-time-display,
.video-player::-webkit-media-controls-time-remaining-display {
  color: #fff;
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

  .video-player {
    min-height: 200px;
  }
}
</style>