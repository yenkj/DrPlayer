import {createApp} from 'vue'
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import './style.css'
import 'primeflex/primeflex.css'
import 'primeflex/themes/primeone-light.css' // 亮系主题
// import 'primeflex/themes/primeone-dark.css'  // 暗系主题
import 'primeicons/primeicons.css';  // 图标
import router from './router';  // 引入路由
import App from './App.vue'
import { createPinia } from 'pinia';

const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Aura
    }
});
app.use(router)
app.use(createPinia())
app.mount('#app')
