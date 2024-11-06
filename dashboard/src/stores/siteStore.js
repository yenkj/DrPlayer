// 在 Pinia store 中，currentSite 作为状态存储
import {defineStore} from 'pinia'

export const useSiteStore = defineStore('site', () => {
    const nowSite = JSON.parse(localStorage.getItem('site-nowSite')) || null

    // 设置当前源并持久化到 localStorage
    const setCurrentSite = (site) => {
        localStorage.setItem('site-nowSite', JSON.stringify(site))  // 存储到 localStorage
    }

    return {
        nowSite,
        setCurrentSite,
    }
})