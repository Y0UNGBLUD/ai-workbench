import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Notify } from 'quasar'
import 'quasar/src/css/index.sass'
import './style/app.scss'
import App from './App.vue'
import router from './router'
import '@quasar/extras/material-icons/material-icons.css'
import { initializeApp } from '@/boot/init'

// msw
import { setupMsw } from '@/boot/msw'
await setupMsw()

// app 인스턴스 생성
const app = createApp(App)

app.use(createPinia())
app.use(Quasar, { plugins: { Notify } })
app.use(router)

//
await initializeApp()

app.mount('#app')
