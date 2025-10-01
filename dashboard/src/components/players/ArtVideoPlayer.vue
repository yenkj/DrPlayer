<template>
  <a-card v-if="visible && videoUrl" class="art-video-player-section">
    <PlayerHeader
      :episode-name="episodeName"
      :player-type="playerType"
      :episodes="episodes"
      :auto-next-enabled="autoNextEnabled"
      :countdown-enabled="countdownEnabled"
      :skip-enabled="skipEnabled"
      @toggle-auto-next="toggleAutoNext"
      @toggle-countdown="toggleCountdown"
      @player-change="handlePlayerTypeChange"
      @open-skip-settings="openSkipSettingsDialog"
      @close="closePlayer"
    />
    <div class="art-player-wrapper" v-show="props.visible">
    
    <div ref="artPlayerContainer" class="art-player-container">
      <!-- ArtPlayer 将在这里初始化 -->
    </div>
    
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
    
    <!-- 选集列表弹窗 -->
    <div v-if="showEpisodeDialog" class="episode-dialog">
      <div class="episode-dialog-overlay" @click="closeEpisodeDialog"></div>
      <div class="episode-dialog-content">
        <div class="episode-dialog-header">
          <h3>选择集数</h3>
          <button @click="closeEpisodeDialog" class="episode-close-btn">×</button>
        </div>
        <div ref="episodeListRef" class="episode-list">
          <button 
            v-for="(episode, index) in props.episodes" 
            :key="index"
            :ref="el => { if (index === props.currentEpisodeIndex) currentEpisodeRef = el }"
            @click="selectEpisode(episode)"
            :class="['episode-item', { 'current': index === props.currentEpisodeIndex }]"
          >
            <span class="episode-number">{{ index + 1 }}</span>
            <span class="episode-name">{{ episode.name || `第${index + 1}集` }}</span>
          </button>
        </div>
      </div>
    </div>
    
    <!-- 片头片尾设置弹窗 -->
    <SkipSettingsDialog
      :visible="showSkipSettingsDialog"
      :skip-intro-enabled="skipIntroEnabled"
      :skip-outro-enabled="skipOutroEnabled"
      :skip-intro-seconds="skipIntroSeconds"
      :skip-outro-seconds="skipOutroSeconds"
      @close="closeSkipSettingsDialog"
      @save="saveSkipSettings"
    />
  </div>
  </a-card>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import { IconClose } from '@arco-design/web-vue/es/icon'
import Artplayer from 'artplayer'
import Hls from 'hls.js'

// 配置自定义倍速选项
Artplayer.PLAYBACK_RATE = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3, 4, 5]
import PlayerHeader from './PlayerHeader.vue'
import SkipSettingsDialog from './SkipSettingsDialog.vue'
import { useSkipSettings } from '@/composables/useSkipSettings'

// Props - 已添加 HLS 支持、动态高度自适应和自动下一集功能
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
  },
  // 自动下一集功能相关 props
  episodes: {
    type: Array,
    default: () => []
  },
  currentEpisodeIndex: {
    type: Number,
    default: 0
  },
  autoNext: {
    type: Boolean,
    default: true
  }
})

// Emits
const emit = defineEmits(['close', 'error', 'player-change', 'next-episode', 'episode-selected'])

// 响应式数据
const artPlayerContainer = ref(null)
const artPlayerInstance = ref(null)
const retryCount = ref(0) // 重连次数计数器
const maxRetries = ref(3) // 最大重连次数
const isRetrying = ref(false) // 是否正在重连
const dynamicHeight = ref(450) // 动态计算的高度

// 自动下一集功能相关数据
const autoNextEnabled = ref(true) // 自动下一集开关，默认关闭
const autoNextCountdown = ref(0) // 自动下一集倒计时
const autoNextTimer = ref(null) // 自动下一集定时器
const showAutoNextDialog = ref(false) // 显示自动下一集对话框
const countdownEnabled = ref(false) // 倒计时开关，默认关闭

// 选集弹窗相关数据
const showEpisodeDialog = ref(false) // 显示选集弹窗
const episodeListRef = ref(null) // 选集列表容器引用
const currentEpisodeRef = ref(null) // 当前选集按钮引用

// 使用片头片尾设置组合式函数
const {
  showSkipSettingsDialog,
  skipIntroEnabled,
  skipOutroEnabled,
  skipIntroSeconds,
  skipOutroSeconds,
  skipEnabled,
  initSkipSettings,
  resetSkipState,
  applySkipSettings,
  applyIntroSkipImmediate,
  handleTimeUpdate,
  closeSkipSettingsDialog,
  saveSkipSettings: saveSkipSettingsComposable,
  onUserSeekStart,
  onUserSeekEnd,
  onFullscreenChangeStart,
  onFullscreenChangeEnd
} = useSkipSettings({
  onSkipToNext: () => {
    if (autoNextEnabled.value && hasNextEpisode()) {
      playNextEpisode()
    }
  },
  getCurrentTime: () => artPlayerInstance.value?.video?.currentTime || 0,
  setCurrentTime: (time) => {
    if (artPlayerInstance.value?.video) {
      artPlayerInstance.value.video.currentTime = time
    }
  },
  getDuration: () => artPlayerInstance.value?.video?.duration || 0
})

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
  
  // 重置片头片尾状态
  resetSkipState()
  
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
  
  // 如果播放器实例已存在，使用 switchUrl 方法切换视频源
  if (artPlayerInstance.value) {
    console.log('使用 switchUrl 方法切换视频源:', url)
    
    try {
      // 使用 switchUrl 方法切换视频源，这样可以保持全屏状态和其他用户设置
      await artPlayerInstance.value.switchUrl(url)
      console.log('视频源切换成功')
      
      // 重新应用片头片尾设置
      applySkipSettings()
      
      return // 切换成功，直接返回
    } catch (error) {
      console.error('switchUrl 切换失败，回退到销毁重建方式:', error)
      // 如果 switchUrl 失败，回退到原来的销毁重建方式
      
      // 清理缓冲区清理定时器
      if (artPlayerInstance.value.bufferCleanupInterval) {
        clearInterval(artPlayerInstance.value.bufferCleanupInterval)
        artPlayerInstance.value.bufferCleanupInterval = null
      }
      
      // 清理 HLS 实例
      if (artPlayerInstance.value.hls) {
        artPlayerInstance.value.hls.destroy()
        artPlayerInstance.value.hls = null
      }
      
      artPlayerInstance.value.destroy()
      artPlayerInstance.value = null
    }
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
              lowLatencyMode: false, // 关闭低延迟模式，提高稳定性
              
              // 缓冲区配置 - 关键优化
              backBufferLength: 15, // 减少后缓冲长度，避免内存占用过多
              maxBufferLength: 30,  // 减少最大缓冲长度到30秒，避免内存问题
              maxBufferSize: 30 * 1000 * 1000, // 减少最大缓冲大小到30MB
              maxBufferHole: 0.3,   // 减少最大缓冲空洞到0.3秒
              
              // 网络配置
              maxLoadingDelay: 3,   // 减少最大加载延迟到3秒
              maxRetryDelay: 6,     // 减少最大重试延迟到6秒
              maxRetry: 2,          // 减少最大重试次数到2次，避免过度重试
              
              // 片段配置
              fragLoadingTimeOut: 15000,    // 减少片段加载超时到15秒
              manifestLoadingTimeOut: 8000, // 减少清单加载超时到8秒
              fragLoadingMaxRetry: 2,       // 片段加载最大重试次数
              manifestLoadingMaxRetry: 2,   // 清单加载最大重试次数
              
              // 启用自动质量切换
              enableSoftwareAES: true,
              startLevel: -1,       // 自动选择起始质量
              capLevelToPlayerSize: true, // 根据播放器大小限制质量
              
              // 错误恢复配置
              liveSyncDurationCount: 3,
              liveMaxLatencyDurationCount: Infinity,
              liveDurationInfinity: false,
              
              // 新增配置项，提高稳定性
              nudgeOffset: 0.1,     // 微调偏移量
              nudgeMaxRetry: 3,     // 微调最大重试次数
              maxSeekHole: 2,       // 最大寻址空洞
              
              // 调试配置（生产环境可关闭）
              debug: false,
            })
            
            hls.loadSource(url)
            hls.attachMedia(video)
            
            // 存储 hls 实例到 art 对象上，方便后续清理
            art.hls = hls
            
            // HLS 事件监听
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log('HLS manifest 解析完成')
            })
            
            // 错误重试计数器
            let networkErrorRetries = 0
            let mediaErrorRetries = 0
            const maxErrorRetries = 2 // 减少重试次数
            
            hls.on(Hls.Events.ERROR, (event, data) => {
              // 只记录致命错误，减少控制台噪音
              if (data.fatal) {
                console.error('HLS 致命错误:', data.type, data.details)
                
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    networkErrorRetries++
                    
                    if (networkErrorRetries <= maxErrorRetries) {
                      console.log(`网络错误恢复中... (${networkErrorRetries}/${maxErrorRetries})`)
                      // 延迟重试，避免频繁请求
                      setTimeout(() => {
                        hls.startLoad()
                      }, 1000 * networkErrorRetries) // 递增延迟
                    } else {
                      console.error('网络错误重试次数超限')
                      Message.error('网络连接不稳定，请检查网络后重试')
                      hls.destroy()
                    }
                    break
                    
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    mediaErrorRetries++
                    
                    if (mediaErrorRetries <= maxErrorRetries) {
                      console.log(`媒体错误恢复中... (${mediaErrorRetries}/${maxErrorRetries})`)
                      setTimeout(() => {
                        hls.recoverMediaError()
                      }, 500 * mediaErrorRetries) // 递增延迟
                    } else {
                      console.error('媒体错误恢复次数超限')
                      Message.error('视频解码错误，请尝试刷新页面')
                      hls.destroy()
                    }
                    break
                    
                  default:
                    // 对于其他致命错误，不显示用户提示，只记录日志
                    console.error('无法恢复的HLS错误:', data.details)
                    hls.destroy()
                    break
                }
              } else {
                // 非致命错误，只在调试模式下记录
                if (data.details !== 'bufferAppendError' && data.details !== 'bufferStalledError') {
                  console.debug('HLS 非致命错误:', data.details)
                }
                
                // 对于缓冲区错误，尝试自动恢复
                if (data.details === 'bufferStalledError') {
                  console.debug('检测到缓冲停滞，自动处理中...')
                  // HLS.js 会自动处理这类错误，无需手动干预
                }
              }
            })
            
            // 监听缓冲区事件，用于性能优化
            hls.on(Hls.Events.BUFFER_APPENDED, () => {
              // 缓冲区数据追加成功，可以在这里做一些清理工作
            })
            
            hls.on(Hls.Events.BUFFER_EOS, () => {
              console.debug('缓冲区到达流结束')
            })
            
            // 监听缓冲区清理事件
            hls.on(Hls.Events.BUFFER_FLUSHED, () => {
              console.debug('缓冲区已清理')
            })
            
            // 重置错误计数器（当播放成功时）
            hls.on(Hls.Events.FRAG_LOADED, () => {
              // 片段加载成功，重置错误计数
              if (networkErrorRetries > 0 || mediaErrorRetries > 0) {
                console.log('连接恢复正常，重置错误计数器')
                networkErrorRetries = 0
                mediaErrorRetries = 0
              }
            })
            
            // 监听质量切换事件
            hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
              console.debug(`质量切换到: ${data.level}`)
            })
            
            // 定期清理缓冲区，避免内存占用过多
            let bufferCleanupInterval = setInterval(() => {
              if (hls && video && !video.paused) {
                const currentTime = video.currentTime
                // 清理当前播放位置前15秒以外的缓冲区
                if (currentTime > 15) {
                  try {
                    hls.trigger(Hls.Events.BUFFER_FLUSHING, {
                      startOffset: 0,
                      endOffset: currentTime - 15,
                      type: 'video'
                    })
                  } catch (e) {
                    console.debug('缓冲区清理失败:', e)
                  }
                }
              }
            }, 30000) // 每30秒清理一次
            
            // 存储清理定时器，用于后续清理
            art.bufferCleanupInterval = bufferCleanupInterval
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
          html: hasNextEpisode() ? '下一集' : '',
          tooltip: hasNextEpisode() ? '播放下一集' : '',
          style: hasNextEpisode() ? {} : { display: 'none' },
          click: function () {
            playNextEpisode()
          },
        },
        {
          position: 'right',
          html: props.episodes.length > 1 ? '选集' : '',
          tooltip: props.episodes.length > 1 ? '选择集数' : '',
          style: props.episodes.length > 1 ? {} : { display: 'none' },
          click: function () {
            toggleEpisodeDialog()
          },
        },
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
      // 应用片头片尾设置
      applySkipSettings()
    })

    art.on('video:loadstart', () => {
      console.log('开始加载视频')
      // 重置片头片尾跳过状态
      resetSkipState()
    })

    art.on('video:canplay', () => {
      console.log('视频可以播放')
      // 视频可以播放时，重置重连计数器
      resetRetryState()
      // 应用片头片尾设置
      applySkipSettings()
    })

    art.on('video:timeupdate', () => {
      handleTimeUpdate()
    })

    // 监听用户拖动进度条事件
    art.on('video:seeking', () => {
      onUserSeekStart()
    })

    art.on('video:seeked', () => {
      onUserSeekEnd()
    })

    art.on('video:playing', () => {
      console.log('视频开始播放')
      // 视频开始播放时，重置重连计数器
      resetRetryState()
      
      // 立即尝试片头跳过（针对视频刚开始播放的情况）
      const immediateSkipped = applyIntroSkipImmediate()
      
      // 如果立即跳过未执行，则使用常规跳过逻辑
      if (!immediateSkipped) {
        applySkipSettings()
        
        // 为了确保片头跳过生效，再次检查（短延迟）
        setTimeout(() => {
          applySkipSettings()
        }, 50) // 减少延迟到50ms
      }
    })

    // 监听全屏状态变化
    art.on('fullscreen', (isFullscreen) => {
      console.log('全屏状态变化:', isFullscreen)
      
      // 标记全屏状态开始变化
      onFullscreenChangeStart()
      
      // 500ms后标记全屏状态变化结束
      setTimeout(() => {
        onFullscreenChangeEnd()
      }, 500)
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

    art.on('video:ended', () => {
      console.log('视频播放结束')
      // 视频结束时启动自动下一集
      if (autoNextEnabled.value && hasNextEpisode()) {
        startAutoNextCountdown()
      } else if (!hasNextEpisode()) {
        Message.info('全部播放完毕')
      }
    })

    art.on('destroy', () => {
      console.log('ArtPlayer 已销毁')
      // 清理自动下一集相关资源
      cancelAutoNext()
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

// 打开片头片尾设置弹窗
const openSkipSettingsDialog = () => {
  showSkipSettingsDialog.value = true
}

// 保存片头片尾设置
const saveSkipSettings = (settings) => {
  saveSkipSettingsComposable(settings)
  Message.success('片头片尾设置已保存')
  closeSkipSettingsDialog()
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

// 自动下一集功能相关函数

// 检查是否有下一集
const hasNextEpisode = () => {
  return props.episodes.length > 0 && props.currentEpisodeIndex < props.episodes.length - 1
}

// 获取下一集信息
const getNextEpisode = () => {
  if (!hasNextEpisode()) return null
  return props.episodes[props.currentEpisodeIndex + 1]
}

// 开始自动下一集倒计时
const startAutoNextCountdown = () => {
  if (!autoNextEnabled.value || !hasNextEpisode()) return
  
  console.log('开始自动下一集')
  
  // 如果开启了倒计时，显示倒计时弹窗
  if (countdownEnabled.value) {
    autoNextCountdown.value = 10 // 10秒倒计时
    showAutoNextDialog.value = true
    
    autoNextTimer.value = setInterval(() => {
      autoNextCountdown.value--
      
      if (autoNextCountdown.value <= 0) {
        clearInterval(autoNextTimer.value)
        autoNextTimer.value = null
        showAutoNextDialog.value = false
        playNextEpisode()
      }
    }, 1000)
  } else {
    // 直接播放下一集，不显示倒计时
    playNextEpisode()
  }
}

// 取消自动下一集
const cancelAutoNext = () => {
  if (autoNextTimer.value) {
    clearInterval(autoNextTimer.value)
    autoNextTimer.value = null
  }
  autoNextCountdown.value = 0
  showAutoNextDialog.value = false
  console.log('用户取消自动下一集')
}

// 立即播放下一集
const playNextEpisode = () => {
  if (!hasNextEpisode()) {
    console.log('已经是最后一集')
    Message.info('已经是最后一集了')
    return
  }
  
  const nextEpisode = getNextEpisode()
  console.log('播放下一集:', nextEpisode.name)
  
  // 清理倒计时
  cancelAutoNext()
  
  // 通知父组件切换到下一集
  emit('next-episode', props.currentEpisodeIndex + 1)
  
  // 移除重复的播放提示，由父组件VideoDetail统一处理
  // Message.success(`开始播放: ${nextEpisode.name}`)
}

// 切换自动下一集开关
const toggleAutoNext = () => {
  autoNextEnabled.value = !autoNextEnabled.value
  console.log('自动下一集开关:', autoNextEnabled.value ? '开启' : '关闭')
  
  if (!autoNextEnabled.value) {
    cancelAutoNext()
  }
}

// 切换倒计时开关
const toggleCountdown = () => {
  countdownEnabled.value = !countdownEnabled.value
  console.log('倒计时开关:', countdownEnabled.value ? '开启' : '关闭')
  
  if (!countdownEnabled.value) {
    cancelAutoNext()
  }
}

// 滚动到当前选集位置
const scrollToCurrentEpisode = async () => {
  // 等待DOM更新
  await nextTick()
  
  if (!episodeListRef.value || props.currentEpisodeIndex < 0) {
    return
  }
  
  // 查找当前选集按钮
  const currentButton = episodeListRef.value.querySelector('.episode-item.current')
  if (!currentButton) {
    return
  }
  
  const container = episodeListRef.value
  const containerHeight = container.clientHeight
  const containerScrollHeight = container.scrollHeight
  const buttonTop = currentButton.offsetTop
  const buttonHeight = currentButton.offsetHeight
  
  // 计算滚动位置，让当前选集出现在容器的中间偏上位置（约30%处）
  const targetPosition = buttonTop + (buttonHeight / 2) - (containerHeight * 0.3)
  
  // 确保滚动位置在有效范围内
  const maxScrollTop = containerScrollHeight - containerHeight
  const targetScrollTop = Math.max(0, Math.min(targetPosition, maxScrollTop))
  
  // 只有当需要滚动的距离超过一定阈值时才执行滚动
  const currentScrollTop = container.scrollTop
  const scrollDistance = Math.abs(targetScrollTop - currentScrollTop)
  
  if (scrollDistance > 50) { // 滚动距离超过50px才执行
    container.scrollTo({
      top: targetScrollTop,
      behavior: 'smooth'
    })
    console.log(`自动滚动到当前选集: 第${props.currentEpisodeIndex + 1}集，滚动距离: ${scrollDistance}px`)
  } else {
    console.log(`当前选集已在可视区域中心，无需滚动: 第${props.currentEpisodeIndex + 1}集`)
  }
}

// 切换选集弹窗显示状态
const toggleEpisodeDialog = async () => {
  showEpisodeDialog.value = !showEpisodeDialog.value
  console.log('选集弹窗:', showEpisodeDialog.value ? '显示' : '隐藏')
  
  // 如果弹窗打开，等待弹窗动画完成后再滚动
  if (showEpisodeDialog.value) {
    // 延迟350ms，等待弹窗动画完成（CSS动画时长为300ms）
    setTimeout(async () => {
      await scrollToCurrentEpisode()
    }, 350)
  }
}

// 关闭选集弹窗
const closeEpisodeDialog = () => {
  showEpisodeDialog.value = false
}

// 选择剧集
const selectEpisode = (episode) => {
  console.log('选择剧集:', episode)
  
  // 关闭弹窗
  closeEpisodeDialog()
  
  // 发送选集事件给父组件
  emit('episode-selected', episode)
}

// 监听视频URL变化
watch(() => props.videoUrl, async (newUrl) => {
  if (newUrl && props.visible) {
    resetRetryState() // 重置重连状态
    resetSkipState() // 重置片头片尾跳过状态
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
  // 初始化片头片尾设置
  initSkipSettings()
})

// 组件卸载时清理资源
onUnmounted(() => {
  console.log('ArtVideoPlayer 组件即将卸载')
  
  // 移除窗口大小变化监听器
  window.removeEventListener('resize', handleResize)
  
  // 清理自动下一集相关资源
  cancelAutoNext()
  
  // 销毁播放器实例
  if (artPlayerInstance.value) {
    // 清理缓冲区清理定时器
    if (artPlayerInstance.value.bufferCleanupInterval) {
      clearInterval(artPlayerInstance.value.bufferCleanupInterval)
      artPlayerInstance.value.bufferCleanupInterval = null
    }
    
    // 清理 HLS 实例
    if (artPlayerInstance.value.hls) {
      artPlayerInstance.value.hls.destroy()
      artPlayerInstance.value.hls = null
    }
    
    // 销毁播放器实例
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

/* 紧凑按钮组样式 */
.compact-button-group {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.compact-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  height: 28px;
  background: #ffffff;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  box-sizing: border-box;
}

.compact-btn:hover {
  background: #f5f5f5;
  border-color: #40a9ff;
  color: #40a9ff;
}

.compact-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.compact-btn.active:hover {
  background: #40a9ff;
  border-color: #40a9ff;
}

.compact-btn .btn-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
}

.compact-btn .btn-text {
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}

/* 选择框按钮特殊样式 */
.compact-btn.selector-btn {
  padding: 4px 6px;
  position: relative;
}

.compact-btn.selector-btn .compact-select {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  font-size: 11px;
  min-width: 60px;
  height: 20px;
}

:deep(.compact-btn.selector-btn .compact-select .arco-select-view-single) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  padding: 0 !important;
  height: 20px !important;
  min-height: 20px !important;
}

:deep(.compact-btn.selector-btn .compact-select .arco-select-view-value) {
  color: inherit !important;
  font-weight: 500;
  font-size: 11px;
  line-height: 20px;
  padding: 0 !important;
}

:deep(.compact-btn.selector-btn .compact-select .arco-select-view-suffix) {
  color: inherit !important;
  font-size: 10px;
}

/* 关闭按钮特殊样式 */
.compact-btn.close-btn {
  background: #fff2f0;
  border-color: #ffccc7;
  color: #ff4d4f;
}

.compact-btn.close-btn:hover {
  background: #ff4d4f;
  border-color: #ff4d4f;
  color: white;
}

 /* 自动下一集倒计时弹窗样式 */
 .auto-next-dialog {
   position: absolute;
   top: 50%;
   left: 50%;
   transform: translate(-50%, -50%);
   background: rgba(0, 0, 0, 0.9);
   color: white;
   padding: 20px;
   border-radius: 8px;
   text-align: center;
   z-index: 1000;
   min-width: 280px;
   box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
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

/* 选集弹窗样式 */
.episode-dialog {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.episode-dialog-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.episode-dialog-content {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  max-height: 80vh;
  width: 90%;
  overflow: hidden;
  animation: episodeDialogShow 0.3s ease-out;
}

@keyframes episodeDialogShow {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.episode-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e8e8e8;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.episode-dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.episode-close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.episode-close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #333;
}

.episode-list {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.episode-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  min-height: 60px;
}

.episode-item:hover {
  border-color: #23ade5;
  background: #f8fcff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(35, 173, 229, 0.2);
}

.episode-item.current {
  border-color: #23ade5;
  background: linear-gradient(135deg, #23ade5 0%, #1e90ff 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(35, 173, 229, 0.3);
}

.episode-item.current:hover {
  background: linear-gradient(135deg, #1e90ff 0%, #23ade5 100%);
}

.episode-number {
  font-size: 16px;
  font-weight: bold;
  margin-right: 12px;
  min-width: 24px;
  text-align: center;
}

.episode-name {
  font-size: 14px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


</style>