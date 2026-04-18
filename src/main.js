import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import '@/styles/main.scss'

import App from './App.vue'
import HomeView from './views/HomeView.vue'
import SequenceEditor from './views/SequenceEditor.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/sequences', component: SequenceEditor },
  ],
})

const kdxgpTheme = {
  dark: true,
  colors: {
    background: '#FFFFFF'
  }
}

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'kdxgpTheme',
        themes: {
          kdxgpTheme,
        },
    },
  })

const app = createApp(App)
app.use(vuetify)
app.use(createPinia())
app.use(router)
app.mount('#app')
