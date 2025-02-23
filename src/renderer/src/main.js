import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')

var version = window.navigator.userAgent.match(/photo-helper\/([\d.]+)/i)
if (version && version.length >= 2) {
  var titleElement = document.getElementsByTagName('title')[0]
  titleElement.innerText = `Photo Helper v${version[1]}`
}
