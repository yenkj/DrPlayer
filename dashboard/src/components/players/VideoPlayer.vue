<template>
  <a-card v-if="visible && videoUrl" class="video-player-section">
    <div class="player-header">
      <h3>正在播放: {{ episodeName }}</h3>
      <div class="player-controls">
        <div class="compact-button-group">
          <div class="compact-btn" :class="{ active: autoNext }" @click="toggleAutoNext">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3l14 9-14 9V3z" fill="currentColor"/>
              <path d="M19 3v18" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span class="btn-text">自动连播</span>
          </div>
          
          <div class="compact-btn" :class="{ active: showCountdown }" @click="toggleCountdown">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <polyline points="12,6 12,12 16,14" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span class="btn-text">倒计时</span>
          </div>
          
          <div class="compact-btn selector-btn">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
              <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/>
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="currentColor" stroke-width="2"/>
            </svg>
            <a-select
              :model-value="playerType"
              @change="handlePlayerTypeChange"
              class="compact-select"
              size="small"
            >
              <a-option value="default">默认播放器</a-option>
              <a-option value="artplayer">ArtPlayer</a-option>
            </a-select>
          </div>
          
          <div class="compact-btn" :class="{ active: skipEnabled }" @click="showSkipSettingsDialog = true">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 4l10 8-10 8V4z" fill="currentColor"/>
              <path d="M19 5v14" stroke="currentColor" stroke-width="2"/>
              <path d="M3 12h2" stroke="currentColor" stroke-width="2"/>
              <path d="M19 12h2" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span class="btn-text">片头片尾</span>
          </div>
          
          <div class="compact-btn close-btn" @click="closePlayer">
            <svg class="btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" stroke-width="2"/>
              <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" stroke-width="2"/>
            </svg>
            <span class="btn-text">关闭</span>
          </div>
        </div>
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
      
      <!-- 自动下一集倒计时弹窗 -->
      <div v-if="showAutoNextDialog" class="auto-next-dialog">
        <div class="auto-next-content">
          <div class="auto-next-title">
            <span>即将播放下一集</span>
          </div>
          <div class="auto-next-episode" v-if="getNextEpisode()">
            {{ getNextEpisode().name }}
          </div>
          <div class="auto-next-countdown">
            {{ autoNextCountdown }} 秒后自动播放
          </div>
          <div class="auto-next-buttons">
            <button @click="playNextEpisode" class="btn-play-now">立即播放</button>
            <button @click="cancelAutoNext" class="btn-cancel">取消</button>
          </div>
        </div>
      </div>
      
      <!-- 片头片尾设置弹窗 -->
      <div v-if="showSkipSettingsDialog" class="skip-settings-dialog">
        <div class="skip-settings-overlay" @click="closeSkipSettingsDialog"></div>
        <div class="skip-settings-content">
          <div class="skip-settings-header">
            <h3>片头片尾设置</h3>
            <button @click="closeSkipSettingsDialog" class="skip-close-btn">×</button>
          </div>
          <div class="skip-settings-body">
            <div class="skip-setting-row">
              <div class="skip-setting-label">
                <a-switch v-model="skipIntroEnabled" size="small" />
                <span>跳过片头</span>
              </div>
              <div class="skip-setting-input">
                <a-input-number 
                  v-model="skipIntroSeconds" 
                  :min="0" 
                  :max="300" 
                  :disabled="!skipIntroEnabled"
                  size="small"
                  style="width: 80px"
                />
                <span class="unit">秒</span>
              </div>
            </div>
            <div class="skip-setting-row">
              <div class="skip-setting-label">
                <a-switch v-model="skipOutroEnabled" size="small" />
                <span>跳过片尾</span>
              </div>
              <div class="skip-setting-input">
                <a-input-number 
                  v-model="skipOutroSeconds" 
                  :min="0" 
                  :max="300" 
                  :disabled="!skipOutroEnabled"
                  size="small"
                  style="width: 80px"
                />
                <span class="unit">秒</span>
              </div>
            </div>
            <div class="skip-setting-tip">
              <p>• 片头跳过：视频开始播放时自动跳过设定的秒数</p>
              <p>• 片尾跳过：视频快结束时根据自动连播设置跳过片尾</p>
            </div>
          </div>
          <div class="skip-settings-footer">
            <button @click="saveSkipSettings" class="btn-save">保存</button>
            <button @click="closeSkipSettingsDialog" class="btn-cancel">取消</button>
          </div>
        </div>
      </div>
    </div>
  </a-card>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
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
  },
  // 自动下一集功能相关 props
  episodes: {
    type: Array,
    default: () => []
  },
  currentEpisodeIndex: {
    type: Number,
    default: 0
  }
})

// Emits
const emit = defineEmits(['close', 'error', 'player-change', 'next-episode'])

// 响应式数据
const videoPlayer = ref(null)
const hlsInstance = ref(null)
const autoNext = ref(true) // 默认开启自动连播
const showCountdown = ref(false)
const showAutoNextDialog = ref(false)
const autoNextCountdown = ref(10)
const countdownTimer = ref(null)
const isProcessingAutoNext = ref(false) // 防止重复触发自动连播

// 片头片尾跳过功能相关数据
const showSkipSettingsDialog = ref(false)
const skipIntroEnabled = ref(false)
const skipOutroEnabled = ref(false)
const skipIntroSeconds = ref(30)
const skipOutroSeconds = ref(30)
const skipIntroApplied = ref(false) // 标记片头跳过是否已应用
const skipOutroTimer = ref(null) // 片尾跳过定时器

// 计算属性：是否启用了任一跳过功能
const skipEnabled = computed(() => {
  return skipIntroEnabled.value || skipOutroEnabled.value
})

// 切换自动连播
const toggleAutoNext = () => {
  autoNext.value = !autoNext.value
}

// 切换倒计时显示
const toggleCountdown = () => {
  showCountdown.value = !showCountdown.value
}

// 检查是否有下一集
const hasNextEpisode = () => {
  return props.episodes && props.episodes.length > 0 && 
         props.currentEpisodeIndex < props.episodes.length - 1
}

// 获取下一集信息
const getNextEpisode = () => {
  if (hasNextEpisode()) {
    return props.episodes[props.currentEpisodeIndex + 1]
  }
  return null
}

// 播放下一集
const playNextEpisode = () => {
  if (hasNextEpisode()) {
    const nextIndex = props.currentEpisodeIndex + 1
    emit('next-episode', nextIndex)
    hideAutoNextDialog()
    // 重置防抖标志
    setTimeout(() => {
      isProcessingAutoNext.value = false
    }, 2000) // 2秒后重置，给视频切换足够的时间
  }
}

// 显示自动下一集对话框
const showAutoNextDialogFunc = () => {
  if (!autoNext.value || !hasNextEpisode()) return
  
  showAutoNextDialog.value = true
  autoNextCountdown.value = 10
  
  countdownTimer.value = setInterval(() => {
    autoNextCountdown.value--
    if (autoNextCountdown.value <= 0) {
      playNextEpisode()
    }
  }, 1000)
}

// 隐藏自动下一集对话框
const hideAutoNextDialog = () => {
  showAutoNextDialog.value = false
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

// 取消自动下一集
const cancelAutoNext = () => {
  hideAutoNextDialog()
  // 重置防抖标志
  isProcessingAutoNext.value = false
}

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
  
  // 重置片头跳过标记和片尾定时器
  skipIntroApplied.value = false
  if (skipOutroTimer.value) {
    clearInterval(skipOutroTimer.value)
    skipOutroTimer.value = null
  }
  
  // 加载片头片尾设置
  loadSkipSettings()
  
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
  
  // 视频结束事件处理函数
  const handleVideoEnded = () => {
    console.log('视频播放结束')
    
    // 防抖：如果正在处理自动连播，则忽略
    if (isProcessingAutoNext.value) {
      console.log('正在处理自动连播，忽略重复的ended事件')
      return
    }
    
    if (autoNext.value && hasNextEpisode()) {
      isProcessingAutoNext.value = true
      
      if (showCountdown.value) {
        showAutoNextDialogFunc()
      } else {
        // 如果不显示倒计时，直接播放下一集
        setTimeout(() => {
          playNextEpisode()
        }, 1000)
      }
    }
  }

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
      return // 如果不支持HLS，直接返回，不添加事件监听器
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
      
      // 应用片头片尾设置
      applySkipSettings()
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
    video.removeEventListener('timeupdate', handleTimeUpdate)
    
    // 添加新的事件监听器
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('error', handleError)
    video.addEventListener('loadstart', handleLoadStart)
    video.addEventListener('timeupdate', handleTimeUpdate)
    
    // 开始加载视频
    video.load()
  }
  
  // 统一添加视频结束事件监听器（避免重复添加）
  video.removeEventListener('ended', handleVideoEnded)
  video.addEventListener('ended', handleVideoEnded)
}

// 片头片尾跳过功能相关方法

// 关闭片头片尾设置弹窗
const closeSkipSettingsDialog = () => {
  showSkipSettingsDialog.value = false
}

// 保存片头片尾设置
const saveSkipSettings = () => {
  const settings = {
    skipIntroEnabled: skipIntroEnabled.value,
    skipOutroEnabled: skipOutroEnabled.value,
    skipIntroSeconds: skipIntroSeconds.value,
    skipOutroSeconds: skipOutroSeconds.value
  }
  
  localStorage.setItem('videoSkipSettings', JSON.stringify(settings))
  Message.success('片头片尾设置已保存')
  closeSkipSettingsDialog()
  
  // 应用新设置
  applySkipSettings()
}

// 加载片头片尾设置
const loadSkipSettings = () => {
  try {
    const saved = localStorage.getItem('videoSkipSettings')
    if (saved) {
      const settings = JSON.parse(saved)
      skipIntroEnabled.value = settings.skipIntroEnabled || false
      skipOutroEnabled.value = settings.skipOutroEnabled || false
      skipIntroSeconds.value = settings.skipIntroSeconds || 30
      skipOutroSeconds.value = settings.skipOutroSeconds || 30
    }
  } catch (error) {
    console.error('加载片头片尾设置失败:', error)
  }
}

// 应用片头片尾设置
const applySkipSettings = () => {
  if (!videoPlayer.value) return
  
  const video = videoPlayer.value
  
  // 应用片头跳过
  if (skipIntroEnabled.value && skipIntroSeconds.value > 0 && !skipIntroApplied.value) {
    if (video.currentTime < skipIntroSeconds.value) {
      video.currentTime = skipIntroSeconds.value
      skipIntroApplied.value = true
      console.log(`跳过片头 ${skipIntroSeconds.value} 秒`)
    }
  }
  
  // 设置片尾跳过
  if (skipOutroEnabled.value && skipOutroSeconds.value > 0) {
    setupOutroSkip()
  }
}

// 设置片尾跳过
const setupOutroSkip = () => {
  if (!videoPlayer.value || skipOutroTimer.value) return
  
  const video = videoPlayer.value
  
  const checkOutroSkip = () => {
    if (!video.duration || !skipOutroEnabled.value) return
    
    const remainingTime = video.duration - video.currentTime
    
    // 如果剩余时间小于等于设定的片尾跳过时间，且开启了自动连播
    if (remainingTime <= skipOutroSeconds.value && autoNext.value && hasNextEpisode()) {
      console.log(`剩余时间 ${remainingTime.toFixed(1)} 秒，跳过片尾`)
      
      // 清理定时器
      if (skipOutroTimer.value) {
        clearInterval(skipOutroTimer.value)
        skipOutroTimer.value = null
      }
      
      // 触发自动下一集
      if (showCountdown.value) {
        showAutoNextDialogFunc()
      } else {
        setTimeout(() => {
          playNextEpisode()
        }, 500)
      }
    }
  }
  
  // 每秒检查一次
  skipOutroTimer.value = setInterval(checkOutroSkip, 1000)
}

// 处理视频时间更新事件
const handleTimeUpdate = () => {
  if (!videoPlayer.value) return
  
  const video = videoPlayer.value
  
  // 检查片头跳过
  if (skipIntroEnabled.value && skipIntroSeconds.value > 0 && !skipIntroApplied.value) {
    if (video.currentTime < skipIntroSeconds.value && video.currentTime > 0) {
      video.currentTime = skipIntroSeconds.value
      skipIntroApplied.value = true
      console.log(`跳过片头 ${skipIntroSeconds.value} 秒`)
    }
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
  
  // 清理片尾跳过定时器
  if (skipOutroTimer.value) {
    clearInterval(skipOutroTimer.value)
    skipOutroTimer.value = null
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
  
  // 清理视频播放器
  if (videoPlayer.value) {
    videoPlayer.value.pause()
    videoPlayer.value.src = ''
    videoPlayer.value.load() // 这会清理所有事件监听器
  }
  
  if (hlsInstance.value) {
    hlsInstance.value.destroy()
    hlsInstance.value = null
  }
  
  // 清理倒计时定时器
  if (countdownTimer.value) {
    clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
  
  // 清理片尾跳过定时器
  if (skipOutroTimer.value) {
    clearInterval(skipOutroTimer.value)
    skipOutroTimer.value = null
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
  padding: 12px 16px;
  /* background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%); */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.player-header h3 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
  font-weight: 600;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.compact-button-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.compact-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  height: 28px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  color: #666;
}

.compact-btn:hover {
  border-color: #1890ff;
  color: #1890ff;
}

.compact-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.compact-btn.close-btn {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

.compact-btn.close-btn:hover {
  background: #ff7875;
  border-color: #ff7875;
}

.btn-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.btn-text {
  font-size: 12px;
  white-space: nowrap;
}

.compact-select {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: 12px;
  min-width: 80px;
}

.compact-select .arco-select-view-single {
  border: none !important;
  background: transparent !important;
  padding: 0 !important;
  height: auto !important;
  min-height: auto !important;
}

.selector-btn {
  min-width: 120px;
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

/* 自动下一集倒计时弹窗样式 */
.auto-next-dialog {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.9);
  border-radius: 12px;
  padding: 24px;
  z-index: 1000;
  min-width: 300px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
}

.auto-next-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auto-next-title {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.auto-next-episode {
  font-size: 14px;
  color: #23ade5;
  font-weight: 500;
}

.auto-next-countdown {
  font-size: 18px;
  font-weight: bold;
  color: #ff6b6b;
}

.auto-next-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 8px;
}

.btn-play-now,
.btn-cancel {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-play-now {
  background: #23ade5;
  color: white;
}

.btn-play-now:hover {
  background: #1890d5;
}

.btn-cancel {
  background: #666;
  color: white;
}

.btn-cancel:hover {
  background: #555;
}

/* 片头片尾设置弹窗样式 */
.skip-settings-dialog {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.skip-settings-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.skip-settings-content {
  position: relative;
  background: white;
  border-radius: 12px;
  width: 400px;
  max-width: 90vw;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.skip-settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.skip-settings-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.skip-close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #666;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.skip-close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.skip-settings-body {
  padding: 20px;
}

.skip-setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.skip-setting-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
}

.skip-setting-input {
  display: flex;
  align-items: center;
  gap: 6px;
}

.skip-setting-input .unit {
  font-size: 12px;
  color: #666;
}

.skip-setting-tip {
  margin-top: 16px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border-left: 3px solid #1890ff;
}

.skip-setting-tip p {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.5;
}

.skip-setting-tip p + p {
  margin-top: 4px;
}

.skip-settings-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 20px;
  background: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.btn-save {
  padding: 6px 16px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-save:hover {
  background: #40a9ff;
}

.skip-settings-footer .btn-cancel {
  padding: 6px 16px;
  background: #f5f5f5;
  color: #666;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.skip-settings-footer .btn-cancel:hover {
  background: #e6f7ff;
  border-color: #91d5ff;
  color: #1890ff;
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
  
  .skip-settings-content {
    width: 350px;
  }
  
  .skip-setting-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>