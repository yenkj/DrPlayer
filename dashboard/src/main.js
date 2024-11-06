import {createApp} from 'vue'
// import './style.css'
import App from './App.vue'
import router from './router'  // 引入路由
import ArcoVue from '@arco-design/web-vue'
import ArcoVueIcon from '@arco-design/web-vue/es/icon';
import '@arco-design/web-vue/dist/arco.css'
import {createPinia} from 'pinia'


const app = createApp(App)
app.use(router)
app.use(ArcoVue);
app.use(ArcoVueIcon);
app.use(createPinia())
app.mount('#app')