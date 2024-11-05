import { defineStore } from 'pinia';

export const useCategoryStore  = defineStore('category', {
    state: () => ({
        selectedCategory: null,  // 存储当前选中的分类
    }),
    actions: {
        selectCategory(category) {
            this.selectedCategory = category;
        },
        clearCategory() {
            this.selectedCategory = null;  // 清除选中的分类
        }
    }
});
