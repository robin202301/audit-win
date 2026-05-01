import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHashHistory } from 'vue-router';
import App from './App.vue';
import './styles/main.css';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('./views/Home.vue'),
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('./views/Settings.vue'),
    },
    {
      path: '/project/:id',
      name: 'project-detail',
      component: () => import('./views/ProjectDetail.vue'),
      props: true,
    },
    {
      path: '/project/:id/stage/:stage',
      name: 'stage',
      component: () => import('./views/StageView.vue'),
      props: true,
    },
  ],
});

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);
app.mount('#app');
