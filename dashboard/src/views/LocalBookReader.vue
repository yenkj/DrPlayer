<template>
  <div class="local-book-reader" v-if="visible">
    <!-- 阅读器头部 -->
    <ReaderHeader
      :book-title="bookData?.title || ''"
      :chapter-name="bookData?.author || ''"
      :chapters="[]"
      :current-chapter-index="0"
      :visible="true"
      :reading-settings="readingSettings"
      @close="handleClose"
      @fullscreen="handleFullscreen"
      @settings="showSettings = true"
      @bookmarks="showBookmarks = true"
    />

    <!-- 阅读内容区域 -->
    <div class="reader-content" :style="readerStyles" ref="contentRef">
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <a-spin :size="40" />
        <div class="loading-text">正在加载图书内容...</div>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error-container">
        <a-result status="error" :title="error" />
        <a-button type="primary" @click="retryLoad">重新加载</a-button>
      </div>

      <!-- 图书内容 -->
      <div v-else-if="bookContent" class="book-container" :style="bookContainerStyles">
        <!-- 图书标题 -->
        <div class="book-header">
          <h1 class="book-title">{{ bookTitle }}</h1>
          <div class="book-meta">
            <span class="author">作者：{{ bookAuthor }}</span>
            <span class="reading-time">阅读时间：{{ formatReadingTime }}</span>
          </div>
        </div>

        <!-- 图书正文 -->
        <div 
          class="book-text" 
          :style="textStyles"
          @scroll="handleScroll"
          ref="textRef"
        >
          <div 
            v-for="(paragraph, index) in formattedContent" 
            :key="index"
            class="paragraph"
            :class="{ 'chapter-title': paragraph.isChapter }"
          >
            {{ paragraph.text }}
          </div>
        </div>

        <!-- 阅读进度条 -->
        <div class="progress-bar" v-if="readingSettings.showProgress">
          <div class="progress-fill" :style="{ width: `${readingProgress}%` }"></div>
          <div class="progress-text">{{ Math.round(readingProgress) }}%</div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-container">
        <a-empty description="未找到图书内容" />
      </div>
    </div>

    <!-- 阅读设置对话框 -->
    <ReadingSettingsDialog
      v-model:visible="showSettings"
      v-model:settings="readingSettings"
      @settings-change="handleSettingsChange"
    />

    <!-- 书签管理对话框 -->
    <BookmarkDialog
      v-model:visible="showBookmarks"
      :bookmarks="bookmarks"
      @bookmark-selected="handleBookmarkSelected"
      @bookmark-added="handleBookmarkAdded"
      @bookmark-deleted="handleBookmarkDeleted"
      @bookmark-updated="handleBookmarkUpdated"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import ReaderHeader from '@/components/readers/ReaderHeader.vue'
import ReadingSettingsDialog from '@/components/readers/ReadingSettingsDialog.vue'
import BookmarkDialog from '@/components/readers/BookmarkDialog.vue'
import localBookService from '@/services/localBookService'

const route = useRoute()
const router = useRouter()

// 响应式数据
const visible = ref(true)
const loading = ref(true)
const error = ref('')
const showSettings = ref(false)
const showBookmarks = ref(false)

// 图书数据
const bookId = ref(route.params.bookId)
const bookData = ref(null)
const bookContent = ref('')
const bookTitle = ref('')
const bookAuthor = ref('')

// 阅读状态
const currentPosition = ref(0)
const readingProgress = ref(0)
const bookmarks = ref([])
const readingStartTime = ref(Date.now())

// DOM引用
const contentRef = ref(null)
const textRef = ref(null)

// 阅读设置
const readingSettings = ref({
  fontSize: 16,
  lineHeight: 1.8,
  fontFamily: 'system-ui',
  maxWidth: 800,
  theme: 'light',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  padding: 40,
  showProgress: true,
  autoSave: true,
  saveInterval: 30000 // 30秒自动保存
})

// 计算属性
const readerStyles = computed(() => ({
  backgroundColor: readingSettings.value.backgroundColor,
  color: readingSettings.value.textColor,
  fontFamily: readingSettings.value.fontFamily
}))

const bookContainerStyles = computed(() => ({
  maxWidth: `${readingSettings.value.maxWidth}px`,
  margin: '0 auto',
  padding: `${readingSettings.value.padding}px`
}))

const textStyles = computed(() => ({
  fontSize: `${readingSettings.value.fontSize}px`,
  lineHeight: readingSettings.value.lineHeight,
  color: readingSettings.value.textColor
}))

const formattedContent = computed(() => {
  if (!bookContent.value) return []
  
  const lines = bookContent.value.split('\n')
  const paragraphs = []
  
  lines.forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine) {
      // 检测章节标题（简单的规则：包含"第"和"章"的行）
      const isChapter = /第.{1,10}章/.test(trimmedLine) || 
                       /Chapter\s+\d+/i.test(trimmedLine) ||
                       trimmedLine.length < 50 && /^[第\d\s章节回部分]+/.test(trimmedLine)
      
      paragraphs.push({
        text: trimmedLine,
        isChapter
      })
    }
  })
  
  return paragraphs
})

const formatReadingTime = computed(() => {
  const now = Date.now()
  const duration = now - readingStartTime.value
  const minutes = Math.floor(duration / 60000)
  
  if (minutes < 1) return '刚开始阅读'
  if (minutes < 60) return `${minutes}分钟`
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}小时${remainingMinutes}分钟`
})

// 方法
const loadBook = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const book = localBookService.getBookById(bookId.value)
    if (!book) {
      throw new Error('未找到指定的图书')
    }
    
    bookData.value = book
    bookContent.value = book.content
    bookTitle.value = book.title
    bookAuthor.value = book.author
    
    // 加载阅读进度
    if (book.readingProgress) {
      currentPosition.value = book.readingProgress.position || 0
      readingProgress.value = book.readingProgress.percentage || 0
    }
    
    // 加载书签
    bookmarks.value = book.bookmarks || []
    
    // 恢复阅读位置
    await nextTick()
    if (currentPosition.value > 0) {
      restoreReadingPosition()
    }
    
  } catch (err) {
    console.error('加载图书失败:', err)
    error.value = err.message || '加载图书失败'
  } finally {
    loading.value = false
  }
}

const retryLoad = () => {
  loadBook()
}

const handleClose = () => {
  saveReadingProgress()
  visible.value = false
  router.push('/book-gallery')
}

const handleShowSettings = () => {
  showSettings.value = true
}

const handleSettingsChange = (newSettings) => {
  readingSettings.value = { ...readingSettings.value, ...newSettings }
  saveReadingSettings()
}

const handleBookmark = () => {
  showBookmarks.value = true
}

const handleFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  } else {
    document.documentElement.requestFullscreen()
  }
}

const handleScroll = () => {
  if (!textRef.value) return
  
  const element = textRef.value
  const scrollTop = element.scrollTop
  const scrollHeight = element.scrollHeight
  const clientHeight = element.clientHeight
  
  // 计算阅读进度
  const progress = (scrollTop / (scrollHeight - clientHeight)) * 100
  readingProgress.value = Math.min(100, Math.max(0, progress))
  currentPosition.value = scrollTop
  
  // 自动保存进度
  if (readingSettings.value.autoSave) {
    debouncedSaveProgress()
  }
}

const saveReadingProgress = () => {
  if (!bookData.value) return
  
  const progress = {
    position: currentPosition.value,
    percentage: readingProgress.value,
    lastReadTime: Date.now()
  }
  
  localBookService.updateReadingProgress(bookId.value, progress)
}

const restoreReadingPosition = () => {
  if (textRef.value && currentPosition.value > 0) {
    textRef.value.scrollTop = currentPosition.value
  }
}

const handleBookmarkSelected = (bookmark) => {
  if (textRef.value) {
    textRef.value.scrollTop = bookmark.position
    currentPosition.value = bookmark.position
  }
  showBookmarks.value = false
}

const handleBookmarkAdded = (bookmark) => {
  bookmarks.value.push({
    id: Date.now(),
    title: bookmark.title || `书签 ${bookmarks.value.length + 1}`,
    position: currentPosition.value,
    percentage: readingProgress.value,
    createdAt: Date.now()
  })
  
  // 保存书签到本地存储
  if (bookData.value) {
    bookData.value.bookmarks = bookmarks.value
    localBookService.updateBook(bookId.value, { bookmarks: bookmarks.value })
  }
  
  Message.success('书签已添加')
}

const handleBookmarkDeleted = (bookmarkId) => {
  const index = bookmarks.value.findIndex(b => b.id === bookmarkId)
  if (index !== -1) {
    bookmarks.value.splice(index, 1)
    
    // 更新本地存储
    if (bookData.value) {
      bookData.value.bookmarks = bookmarks.value
      localBookService.updateBook(bookId.value, { bookmarks: bookmarks.value })
    }
    
    Message.success('书签已删除')
  }
}

const handleBookmarkUpdated = (updatedBookmark) => {
  const index = bookmarks.value.findIndex(b => b.id === updatedBookmark.id)
  if (index !== -1) {
    bookmarks.value[index].title = updatedBookmark.title
    
    // 更新本地存储
    if (bookData.value) {
      bookData.value.bookmarks = bookmarks.value
      localBookService.updateBook(bookId.value, { bookmarks: bookmarks.value })
    }
    
    Message.success('书签已更新')
  }
}

// 防抖保存进度
let saveProgressTimer = null
const debouncedSaveProgress = () => {
  if (saveProgressTimer) {
    clearTimeout(saveProgressTimer)
  }
  saveProgressTimer = setTimeout(() => {
    saveReadingProgress()
  }, 1000)
}

// 加载阅读设置
const loadReadingSettings = () => {
  try {
    const saved = localStorage.getItem('drplayer_book_reading_settings')
    if (saved) {
      const settings = JSON.parse(saved)
      readingSettings.value = { ...readingSettings.value, ...settings }
    }
  } catch (error) {
    console.warn('加载阅读设置失败:', error)
  }
}

// 保存阅读设置
const saveReadingSettings = () => {
  try {
    localStorage.setItem('drplayer_book_reading_settings', JSON.stringify(readingSettings.value))
  } catch (error) {
    console.warn('保存阅读设置失败:', error)
  }
}

// 键盘快捷键
const handleKeydown = (event) => {
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      handleClose()
      break
    case 'F11':
      event.preventDefault()
      handleFullscreen()
      break
    case 's':
      if (event.ctrlKey) {
        event.preventDefault()
        handleShowSettings()
      }
      break
    case 'b':
      if (event.ctrlKey) {
        event.preventDefault()
        handleBookmark()
      }
      break
  }
}

// 自动保存定时器
let autoSaveTimer = null
const startAutoSave = () => {
  if (readingSettings.value.autoSave && readingSettings.value.saveInterval > 0) {
    autoSaveTimer = setInterval(() => {
      saveReadingProgress()
    }, readingSettings.value.saveInterval)
  }
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// 监听路由参数变化
watch(() => route.params.bookId, (newBookId) => {
  if (newBookId && newBookId !== bookId.value) {
    bookId.value = newBookId
    loadBook()
  }
})

// 组件挂载
onMounted(() => {
  loadReadingSettings()
  loadBook()
  startAutoSave()
  document.addEventListener('keydown', handleKeydown)
})

// 组件卸载
onUnmounted(() => {
  saveReadingProgress()
  stopAutoSave()
  document.removeEventListener('keydown', handleKeydown)
  
  if (saveProgressTimer) {
    clearTimeout(saveProgressTimer)
  }
})
</script>

<style scoped>
.local-book-reader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-1);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.reader-content {
  flex: 1;
  overflow-y: auto;
  transition: all 0.3s ease;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
}

.loading-text {
  margin-top: 16px;
  color: var(--color-text-2);
  font-size: 14px;
}

.book-container {
  min-height: 100vh;
  position: relative;
}

.book-header {
  text-align: center;
  margin-bottom: 40px;
  padding-top: 40px;
}

.book-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-1);
}

.book-meta {
  display: flex;
  justify-content: center;
  gap: 20px;
  color: var(--color-text-2);
  font-size: 14px;
}

.book-text {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 20px 0;
}

.paragraph {
  margin-bottom: 1em;
  text-align: justify;
  word-break: break-word;
  line-height: inherit;
}

.paragraph.chapter-title {
  font-size: 1.2em;
  font-weight: 600;
  text-align: center;
  margin: 2em 0 1.5em 0;
  color: var(--color-primary);
}

.progress-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--color-fill-2);
  z-index: 1001;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.progress-text {
  position: absolute;
  right: 10px;
  top: -25px;
  font-size: 12px;
  color: var(--color-text-2);
  background: var(--color-bg-1);
  padding: 2px 6px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 滚动条样式 */
.book-text::-webkit-scrollbar {
  width: 6px;
}

.book-text::-webkit-scrollbar-track {
  background: var(--color-fill-1);
  border-radius: 3px;
}

.book-text::-webkit-scrollbar-thumb {
  background: var(--color-fill-3);
  border-radius: 3px;
}

.book-text::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-4);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .book-container {
    padding: 20px !important;
  }
  
  .book-title {
    font-size: 24px;
  }
  
  .book-meta {
    flex-direction: column;
    gap: 8px;
  }
}
</style>