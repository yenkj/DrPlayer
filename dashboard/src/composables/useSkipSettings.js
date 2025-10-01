import { ref, computed, onUnmounted } from 'vue'

/**
 * 片头片尾跳过功能的组合式函数
 * @param {Object} options - 配置选项
 * @param {Function} options.onSkipToNext - 跳转到下一集的回调函数（仅用于片尾跳过到下一集的场景）
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
  const skipOutroApplied = ref(false)
  const skipOutroTimer = ref(null)
  const lastSkipTime = ref(0) // 记录上次跳过的时间戳，用于防抖
  
  // 用户交互状态
  const userSeeking = ref(false) // 用户是否正在拖动进度条
  const lastUserSeekTime = ref(0) // 上次用户拖动的时间戳

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
      console.log('从 localStorage 加载设置:', saved)
      if (saved) {
        const settings = JSON.parse(saved)
        skipIntroEnabled.value = settings.skipIntroEnabled || false
        skipOutroEnabled.value = settings.skipOutroEnabled || false
        skipIntroSeconds.value = settings.skipIntroSeconds || 90
        skipOutroSeconds.value = settings.skipOutroSeconds || 90
        console.log('加载的设置:', {
          skipIntroEnabled: skipIntroEnabled.value,
          skipOutroEnabled: skipOutroEnabled.value,
          skipIntroSeconds: skipIntroSeconds.value,
          skipOutroSeconds: skipOutroSeconds.value
        })
      } else {
        console.log('没有找到保存的设置，使用默认值')
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
   * 立即应用片头跳过逻辑（用于视频刚开始播放时）
   */
  const applyIntroSkipImmediate = () => {
    console.log('applyIntroSkipImmediate 被调用')
    
    if (!skipIntroEnabled.value) {
      console.log('片头跳过未启用')
      return
    }
    
    if (skipIntroApplied.value) {
      console.log('片头跳过已应用，跳过')
      return
    }

    const currentTime = getCurrentTime()
    const now = Date.now()
    
    // 检查用户是否正在拖动或刚刚拖动过（3秒内）
    if (userSeeking.value || (lastUserSeekTime.value > 0 && now - lastUserSeekTime.value < 3000)) {
      console.log('用户正在拖动进度条或刚刚拖动过，跳过自动片头跳过')
      return
    }
    
    // 立即跳过模式：如果当前时间很小（小于等于1秒）且在片头跳过范围内，立即跳过
    if (currentTime <= 1 && currentTime <= skipIntroSeconds.value) {
      console.log(`立即跳过片头：从 ${currentTime} 秒跳转到 ${skipIntroSeconds.value} 秒`)
      setCurrentTime(skipIntroSeconds.value)
      skipIntroApplied.value = true
      lastSkipTime.value = now
      console.log(`已立即跳过片头 ${skipIntroSeconds.value} 秒`)
      return true // 返回 true 表示已执行跳过
    }
    
    return false // 返回 false 表示未执行跳过
  }

  /**
   * 应用片头跳过逻辑
   */
  const applyIntroSkip = () => {
    console.log('applyIntroSkip 被调用', {
      skipIntroEnabled: skipIntroEnabled.value,
      skipIntroApplied: skipIntroApplied.value,
      currentTime: getCurrentTime(),
      skipIntroSeconds: skipIntroSeconds.value,
      userSeeking: userSeeking.value
    })
    
    if (!skipIntroEnabled.value) {
      console.log('片头跳过未启用')
      return
    }
    
    if (skipIntroApplied.value) {
      console.log('片头跳过已应用，跳过')
      return
    }

    const currentTime = getCurrentTime()
    const now = Date.now()
    
    // 检查用户是否正在拖动或刚刚拖动过（3秒内）
    if (userSeeking.value || (lastUserSeekTime.value > 0 && now - lastUserSeekTime.value < 3000)) {
      console.log('用户正在拖动进度条或刚刚拖动过，跳过自动片头跳过')
      return
    }
    
    // 防抖：如果距离上次跳过不足1秒，则忽略（但如果是新视频，lastSkipTime为0，允许跳过）
    // 减少防抖时间，提高响应速度
    if (lastSkipTime.value > 0 && now - lastSkipTime.value < 1000) {
      console.log('防抖限制，跳过')
      return
    }
    
    // 如果当前时间在片头跳过范围内，则跳过
    if (currentTime <= skipIntroSeconds.value) {
      console.log(`准备跳过片头：从 ${currentTime} 秒跳转到 ${skipIntroSeconds.value} 秒`)
      setCurrentTime(skipIntroSeconds.value)
      skipIntroApplied.value = true
      lastSkipTime.value = now
      console.log(`已跳过片头 ${skipIntroSeconds.value} 秒`)
    } else {
      console.log(`当前时间 ${currentTime} 秒已超过片头跳过范围 ${skipIntroSeconds.value} 秒`)
    }
  }

  /**
   * 应用片尾跳过逻辑
   */
  const applyOutroSkip = () => {
    if (!skipOutroEnabled.value || skipOutroApplied.value) return

    const duration = getDuration()
    if (duration <= 0) return

    const currentTime = getCurrentTime()
    const timeToSkip = duration - skipOutroSeconds.value
    const now = Date.now()
    
    // 防抖：如果距离上次跳过不足2秒，则忽略
    if (now - lastSkipTime.value < 2000) {
      return
    }

    // 当播放时间达到片尾跳过点时，直接跳转到视频结束位置
    if (currentTime >= timeToSkip && currentTime < duration - 1) {
      setCurrentTime(duration - 0.1) // 跳转到接近结束的位置，触发 ended 事件
      skipOutroApplied.value = true
      lastSkipTime.value = now
      console.log(`已跳过片尾 ${skipOutroSeconds.value} 秒，跳转到视频结束位置`)
    }
  }

  /**
   * 应用片头片尾设置
   */
  const applySkipSettings = () => {
    // 优先尝试立即片头跳过（用于视频刚开始播放时）
    const immediateSkipped = applyIntroSkipImmediate()
    
    // 如果立即跳过未执行，则使用常规片头跳过
    if (!immediateSkipped) {
      applyIntroSkip()
    }
    
    // 应用片尾跳过
    applyOutroSkip()
  }

  /**
   * 处理时间更新事件
   */
  const handleTimeUpdate = () => {
    // 应用片头跳过（仅在未应用时）
    if (skipIntroEnabled.value && !skipIntroApplied.value) {
      applyIntroSkip()
    }

    // 应用片尾跳过（仅在未应用时）
    if (skipOutroEnabled.value && !skipOutroApplied.value) {
      applyOutroSkip()
    }
  }

  /**
   * 重置跳过状态
   */
  const resetSkipState = () => {
    skipIntroApplied.value = false
    skipOutroApplied.value = false
    lastSkipTime.value = 0 // 重置防抖时间戳
    
    // 重置用户交互状态
    userSeeking.value = false
    lastUserSeekTime.value = 0
    
    // 清除片尾跳过定时器（如果存在）
    if (skipOutroTimer.value) {
      clearTimeout(skipOutroTimer.value)
      skipOutroTimer.value = null
    }
  }

  /**
   * 标记用户开始拖动进度条
   */
  const onUserSeekStart = () => {
    userSeeking.value = true
    console.log('用户开始拖动进度条')
  }

  /**
   * 标记用户结束拖动进度条
   */
  const onUserSeekEnd = () => {
    userSeeking.value = false
    lastUserSeekTime.value = Date.now()
    console.log('用户结束拖动进度条')
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
    applyIntroSkipImmediate,
    handleTimeUpdate,
    resetSkipState,
    initSkipSettings,
    openSkipSettingsDialog,
    closeSkipSettingsDialog,
    cleanup,
    onUserSeekStart,
    onUserSeekEnd
  }
}