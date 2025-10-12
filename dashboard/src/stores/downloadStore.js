import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { downloadService } from '@/services/downloadService'

export const useDownloadStore = defineStore('download', () => {
  // 任务列表
  const tasks = ref([])
  
  // 加载状态
  const loading = ref(false)
  
  // 从downloadService加载任务
  const loadTasks = () => {
    tasks.value = downloadService.getAllTasks()
  }
  
  // 保存任务到downloadService
  const saveTasks = () => {
    downloadService.saveTasksToStorage()
  }
  
  // 添加下载任务
  const addTask = (taskData) => {
    const task = downloadService.createTask(taskData)
    loadTasks() // 重新加载任务列表
    return task
  }
  
  // 开始任务
  const startTask = (taskId) => {
    downloadService.startTask(taskId)
    loadTasks()
  }
  
  // 暂停任务
  const pauseTask = (taskId) => {
    downloadService.pauseTask(taskId)
    loadTasks()
  }
  
  // 恢复任务
  const resumeTask = (taskId) => {
    downloadService.startTask(taskId)
    loadTasks()
  }
  
  // 取消任务
  const cancelTask = (taskId) => {
    downloadService.cancelTask(taskId)
    loadTasks()
  }
  
  // 删除任务
  const deleteTask = (taskId) => {
    downloadService.deleteTask(taskId)
    loadTasks()
  }
  
  // 重试任务
  const retryTask = (taskId) => {
    downloadService.startTask(taskId)
    loadTasks()
  }
  
  // 重试章节
  const retryChapter = (taskId, chapterIndex) => {
    downloadService.retryChapter(taskId, chapterIndex)
    loadTasks()
  }
  
  // 导出任务
  const exportTask = (taskId) => {
    return downloadService.exportToTxt(taskId)
  }
  
  // 清理已完成的任务
  const clearCompleted = () => {
    const completedTasks = tasks.value.filter(task => task.status === 'completed')
    completedTasks.forEach(task => {
      downloadService.deleteTask(task.id)
    })
    loadTasks()
  }
  
  // 计算属性
  const taskStats = computed(() => {
    return downloadService.getTaskStats()
  })
  
  // 根据状态过滤任务
  const getTasksByStatus = (status) => {
    return downloadService.getTasksByStatus(status)
  }
  
  // 设置任务更新回调
  downloadService.setTaskUpdateCallback(() => {
    loadTasks()
  })
  
  // 初始化时加载任务
  loadTasks()
  
  return {
    tasks,
    loading,
    taskStats,
    loadTasks,
    saveTasks,
    addTask,
    startTask,
    pauseTask,
    resumeTask,
    cancelTask,
    deleteTask,
    retryTask,
    retryChapter,
    exportTask,
    clearCompleted,
    getTasksByStatus
  }
})