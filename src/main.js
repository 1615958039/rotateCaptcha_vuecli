import Vue from 'vue';
import './plugins/axios';
import App from './App.vue';
import router from './router';
import store from './store';
import './plugins/element.js';

import md5 from 'js-md5';
Vue.prototype.$md5 = md5;

Vue.config.productionTip = false;

import tw from './assets/tw';
Vue.prototype.tw = tw;


window.$vue = new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app');
