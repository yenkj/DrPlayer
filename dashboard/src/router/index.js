import {createRouter, createWebHistory} from 'vue-router';
import Home from '@/views/Home.vue';
import Video from '@/views/Video.vue';
import Live from '@/views/Live.vue';
import Settings from '@/views/Settings.vue';
import Collection from '@/views/Collection.vue';
import History from '@/views/History.vue';
import Reader from '@/views/Reader.vue';
import Parser from '@/views/Parser.vue';

const routes = [
    {path: '/', component: Home},
    {path: '/video', component: Video},
    {path: '/live', component: Live},
    {path: '/settings', component: Settings},
    {path: '/collection', component: Collection},
    {path: '/history', component: History},
    {path: '/reader', component: Reader},
    {path: '/parser', component: Parser},
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
});

export default router;
