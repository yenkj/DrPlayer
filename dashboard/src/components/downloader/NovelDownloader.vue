<template>
  <div class="novel-downloader">
    <!-- 下载器头部 -->
    <div class="downloader-header">
      <div class="header-left">
        <h2 class="downloader-title">
          <icon-download />
          小说下载器
        </h2>
        <div class="download-stats">
          <span class="stat-item">
            总任务: {{ totalTasks }}
          </span>
          <span class="stat-item">
            已完成: {{ completedTasks }}
          </span>
          <span class="stat-item">
            进行中: {{ downloadingTasks }}
          </span>
          <span class="stat-item">
            失败: {{ failedTasks }}
          </span>
        </div>
      </div>
      <div class="header-right">
        <a-button type="primary" @click="showAddTaskDialog = true">
          <template #icon>
            <icon-plus />
          </template>
          新建下载
        </a-button>
        <a-button @click="clearCompleted" :disabled="completedTasks === 0">
          清理已完成
        </a-button>
        <a-button @click="handleClose">
          <template #icon>
            <icon-close />
          </template>
          关闭
        </a-button>
      </div>
    </div>

    <!-- 过滤标签 -->
    <div class="filter-tabs">
      <a-radio-group v-model="activeFilter" type="button">
        <a-radio value="all">全部 ({{ totalTasks }})</a-radio>
        <a-radio value="downloading">下载中 ({{ downloadingTasks }})</a-radio>
        <a-radio value="completed">已完成 ({{ completedTasks }})</a-radio>
        <a-radio value="failed">失败 ({{ failedTasks }})</a-radio>
        <a-radio value="pending">等待中 ({{ pendingTasks }})</a-radio>
      </a-radio-group>
    </div>

    <!-- 下载任务列表 -->
    <div class="download-list">
      <div v-if="filteredTasks.length === 0" class="empty-state">
        <a-empty description="暂无下载任务" />
      </div>
      <div v-else>
        <DownloadTaskItem
          v-for="task in filteredTasks"
          :key="task.id"
          :task="task"
          @retry="handleRetryTask"
          @pause="handlePauseTask"
          @resume="handleResumeTask"
          @cancel="handleCancelTask"
          @delete="handleDeleteTask"
          @export="handleExportTask"
          @view-chapters="handleViewChapters"
        />
      </div>
    </div>

    <!-- 新建下载任务对话框 -->
    <AddDownloadTaskDialog
      :visible="showAddTaskDialog"
      @close="showAddTaskDialog = false"
      @confirm="handleAddTask"
    />

    <!-- 章节详情对话框 -->
    <ChapterDetailsDialog
      :visible="showChapterDialog"
      :task="currentSelectedTask"
      @close="showChapterDialog = false"
      @retry-chapter="handleRetryChapter"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import { 
  IconDownload, 
  IconPlus, 
  IconClose 
} from '@arco-design/web-vue/es/icon'
import DownloadTaskItem from './DownloadTaskItem.vue'
import AddDownloadTaskDialog from './AddDownloadTaskDialog.vue'
import ChapterDetailsDialog from './ChapterDetailsDialog.vue'
import { useDownloadStore } from '@/stores/downloadStore'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['close'])

// 下载状态管理
const downloadStore = useDownloadStore()

// 响应式数据
const activeFilter = ref('all')
const showAddTaskDialog = ref(false)
const showChapterDialog = ref(false)
const selectedTask = ref(null)

// 计算属性
const totalTasks = computed(() => downloadStore.tasks.length)
const completedTasks = computed(() => downloadStore.tasks.filter(task => task.status === 'completed').length)
const downloadingTasks = computed(() => downloadStore.tasks.filter(task => task.status === 'downloading').length)
const failedTasks = computed(() => downloadStore.tasks.filter(task => task.status === 'failed').length)
const pendingTasks = computed(() => downloadStore.tasks.filter(task => task.status === 'pending').length)

const filteredTasks = computed(() => {
  if (activeFilter.value === 'all') {
    return downloadStore.tasks
  }
  return downloadStore.tasks.filter(task => task.status === activeFilter.value)
})

// 实时获取选中任务的最新数据
const currentSelectedTask = computed(() => {
  if (!selectedTask.value) return null
  // 从最新的任务列表中找到对应的任务
  return downloadStore.tasks.find(task => task.id === selectedTask.value.id) || selectedTask.value
})

// 方法
const handleClose = () => {
  emit('close')
}

const handleAddTask = (taskData) => {
  downloadStore.addTask(taskData)
  showAddTaskDialog.value = false
  Message.success('下载任务已添加')
}

const handleRetryTask = (taskId) => {
  downloadStore.retryTask(taskId)
  Message.info('正在重试下载任务')
}

const handlePauseTask = (taskId) => {
  downloadStore.pauseTask(taskId)
  Message.info('下载任务已暂停')
}

const handleResumeTask = (taskId) => {
  downloadStore.resumeTask(taskId)
  Message.info('下载任务已恢复')
}

const handleCancelTask = (taskId) => {
  downloadStore.cancelTask(taskId)
  Message.info('下载任务已取消')
}

const handleDeleteTask = (taskId) => {
  downloadStore.deleteTask(taskId)
  Message.success('下载任务已删除')
}

const handleExportTask = async (taskId, options = {}) => {
  await downloadStore.exportTask(taskId, options)
}

const handleViewChapters = (task) => {
  selectedTask.value = task
  showChapterDialog.value = true
}

const handleRetryChapter = (taskId, chapterIndex) => {
  downloadStore.retryChapter(taskId, chapterIndex)
  Message.info('正在重试章节下载')
}

const clearCompleted = () => {
  downloadStore.clearCompleted()
  Message.success('已清理完成的下载任务')
}

// 生命周期
onMounted(() => {
  downloadStore.loadTasks()
})

onUnmounted(() => {
  downloadStore.saveTasks()
})
</script>

<style scoped>
.novel-downloader {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-1);
}

.downloader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border-2);
  background: var(--color-bg-2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.downloader-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
}

.download-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  font-size: 14px;
  color: var(--color-text-2);
}

.header-right {
  display: flex;
  gap: 12px;
}

.filter-tabs {
  padding: 16px 24px;
  border-bottom: 1px solid var(--color-border-2);
}

.download-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px 24px;
  scroll-behavior: smooth;
}

/* 自定义滚动条样式 */
.download-list::-webkit-scrollbar {
  width: 6px;
}

.download-list::-webkit-scrollbar-track {
  background: var(--color-fill-2);
  border-radius: 3px;
}

.download-list::-webkit-scrollbar-thumb {
  background: var(--color-fill-4);
  border-radius: 3px;
  transition: background-color 0.2s ease;
}

.download-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-fill-3);
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
}
</style>