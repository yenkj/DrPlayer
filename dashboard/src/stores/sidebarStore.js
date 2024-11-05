// src/stores/sidebarStore.js
import { defineStore } from 'pinia';

export const useSidebarStore = defineStore('sidebar', {
    state: () => ({
        isCollapsed: JSON.parse(localStorage.getItem('sidebar-collapsed') || 'false'), // 从 localStorage 获取初始状态
    }),
    actions: {
        toggleSidebar() {
            this.isCollapsed = !this.isCollapsed;
            localStorage.setItem('sidebar-collapsed', JSON.stringify(this.isCollapsed)); // 保存状态到 localStorage
        },
    },
    getters: {
        sidebarWidth: (state) => state.isCollapsed ? 80 : 250, // 收缩时宽度为 80px，展开时为 250px
    },
});
