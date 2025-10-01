import { ref, computed, onUnmounted } from 'vue'

/**
 * 片头片尾跳过功能的组合式函数
 * @param {Object} options - 配置选项
 * @param {Function} options.onSkipToNext - 跳转到下一集的回调函数
 * @param {Function} options.getCurrentTime - 获取当前播放时间的函数
 * @param {Function} options.setCurrentTime - 设置播放时间的函数
 * @param {Function} options.getDuration - 获取视频总时长的函数
 * @returns {Object} 返回片头片尾跳过相关的响应式数据和方法
 */
export function useSkipSettings(options = {}) {
  const {
    onSkipToNext = () => {},
    getCurrentTime = () => 0,
    setCurrentTime = () => {},
    getDuration = () => 0
  } = options

  // 响应式数据
  const showSkipSettingsDialog = ref(false)
  const skipIntroEnabled = ref(false)
  const skipOutroEnabled = ref(false)
  const skipIntroSeconds = ref(90)
  const skipOutroSeconds = ref(90)
  const skipIntroApplied = ref(false)
  const skipOutroTimer = ref(null)

  // 计算属性
  const skipEnabled = computed(() => {
    return skipIntroEnabled.value || skipOutroEnabled.value
  })

  // 本地存储键名
  const STORAGE_KEY = 'drplayer_skip_settings'

  /**
   * 从本地存储加载设置
   */
  const loadSkipSettings = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const settings = JSON.parse(saved)
        skipIntroEnabled.value = settings.skipIntroEnabled || false
        skipOutroEnabled.value = settings.skipOutroEnabled || false
        skipIntroSeconds.value = settings.skipIntroSeconds || 90
        skipOutroSeconds.value = settings.skipOutroSeconds || 90
      }
    } catch (error) {
      console.warn('加载片头片尾设置失败:', error)
    }
  }

  /**
   * 保存设置到本地存储
   */
  const saveSkipSettings = (settings) => {
    try {
      // 更新响应式数据
      skipIntroEnabled.value = settings.skipIntroEnabled
      skipOutroEnabled.value = settings.skipOutroEnabled
      skipIntroSeconds.value = settings.skipIntroSeconds
      skipOutroSeconds.value = settings.skipOutroSeconds

      // 保存到本地存储
      const settingsToSave = {
        skipIntroEnabled: settings.skipIntroEnabled,
        skipOutroEnabled: settings.skipOutroEnabled,
        skipIntroSeconds: settings.skipIntroSeconds,
        skipOutroSeconds: settings.skipOutroSeconds
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave))
      
      // 应用新设置
      applySkipSettings()
    } catch (error) {
      console.warn('保存片头片尾设置失败:', error)
    }
  }

  /**
   * 应用片头跳过设置
   */
  const applyIntroSkip = () => {
    if (!skipIntroEnabled.value || skipIntroApplied.value) return

    const currentTime = getCurrentTime()
    if (currentTime < skipIntroSeconds.value) {
      setCurrentTime(skipIntroSeconds.value)
      skipIntroApplied.value = true
      console.log(`已跳过片头 ${skipIntroSeconds.value} 秒`)
    }
  }

  /**
   * 设置片尾跳过逻辑
   */
  const setupOutroSkip = () => {
    if (!skipOutroEnabled.value) return

    const duration = getDuration()
    if (duration <= 0) return

    const currentTime = getCurrentTime()
    const timeToSkip = duration - skipOutroSeconds.value

    if (currentTime >= timeToSkip && !skipOutroTimer.value) {
      skipOutroTimer.value = setTimeout(() => {
        console.log(`已跳过片尾 ${skipOutroSeconds.value} 秒，跳转到下一集`)
        onSkipToNext()
      }, 1000) // 延迟1秒执行，避免频繁触发
    }
  }

  /**
   * 应用片头片尾设置
   */
  const applySkipSettings = () => {
    // 应用片头跳过
    applyIntroSkip()
    
    // 设置片尾跳过
    setupOutroSkip()
  }

  /**
   * 处理时间更新事件
   */
  const handleTimeUpdate = () => {
    // 应用片头跳过（仅在未应用时）
    if (skipIntroEnabled.value && !skipIntroApplied.value) {
      applyIntroSkip()
    }

    // 处理片尾跳过
    if (skipOutroEnabled.value) {
      const duration = getDuration()
      const currentTime = getCurrentTime()
      
      if (duration > 0) {
        const timeToSkip = duration - skipOutroSeconds.value
        
        if (currentTime >= timeToSkip && !skipOutroTimer.value) {
          skipOutroTimer.value = setTimeout(() => {
            console.log(`已跳过片尾 ${skipOutroSeconds.value} 秒，跳转到下一集`)
            onSkipToNext()
          }, 1000)
        }
      }
    }
  }

  /**
   * 重置跳过状态
   */
  const resetSkipState = () => {
    skipIntroApplied.value = false
    if (skipOutroTimer.value) {
      clearTimeout(skipOutroTimer.value)
      skipOutroTimer.value = null
    }
  }

  /**
   * 初始化片头片尾设置
   */
  const initSkipSettings = () => {
    resetSkipState()
    loadSkipSettings()
  }

  /**
   * 打开设置弹窗
   */
  const openSkipSettingsDialog = () => {
    showSkipSettingsDialog.value = true
  }

  /**
   * 关闭设置弹窗
   */
  const closeSkipSettingsDialog = () => {
    showSkipSettingsDialog.value = false
  }

  /**
   * 清理资源
   */
  const cleanup = () => {
    if (skipOutroTimer.value) {
      clearTimeout(skipOutroTimer.value)
      skipOutroTimer.value = null
    }
  }

  // 组件卸载时清理资源
  onUnmounted(() => {
    cleanup()
  })

  return {
    // 响应式数据
    showSkipSettingsDialog,
    skipIntroEnabled,
    skipOutroEnabled,
    skipIntroSeconds,
    skipOutroSeconds,
    skipIntroApplied,
    skipOutroTimer,
    
    // 计算属性
    skipEnabled,
    
    // 方法
    loadSkipSettings,
    saveSkipSettings,
    applySkipSettings,
    handleTimeUpdate,
    resetSkipState,
    initSkipSettings,
    openSkipSettingsDialog,
    closeSkipSettingsDialog,
    cleanup
  }
}