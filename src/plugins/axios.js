"use strict";

import Vue from 'vue';
import axios from "axios";

import baseConfig from "../config";

// Full config:  https://github.com/axios/axios#request-config


let config = {
  baseURL: baseConfig.apiUrl,
  timeout: baseConfig.httpTimeOut, // Timeout
  // withCredentials: true, // Check cross-site Access-Control
};


/**
 * ajax请求出错提示
 */
function ajaxTips(that,message,type='error'){
  that.$message({
    showClose: true,
    message,
    type,
    customClass: "zIndex99999"
  });
}

const _axios = axios.create(config);
_axios.interceptors.request.use(
  async function(config) {
    let that = window.$vue;
    
    // Do something before request is sent
    if(config.configCheckSuccess)return config;
    
    /**
     * 请求之前先判断是否存在 Token
     * 没有则直接获取一个Token写入本地
     */
    if(
      !localStorage.getItem("token")
      && config.getToken!=true
    ){
      localStorage.setItem("token","");
      let getToken = async () => {
        console.log("获取Token");
        await that.$axios({
          url: "/public/getToken.json",
          datas: {
            type: 'b',
          },
          getToken: true
        }).then(res=>{
          localStorage.setItem("token",res.token);
        }).catch(err=>{
          console.log("getToken -> ",err);
        })
      }
      await getToken()
    }
    
    if(localStorage.getItem("token")){
      config.headers["Token"] = localStorage.getItem("token");
    }else{
      console.log("未携带token");
    }
    
    if(config['doReturn']){
      return config;
    }
    
    /**
     * url = api + "?"
     * 自动判断 ‘?’是否在结尾，如果是的话把datas拼接入url
     */
    try {
      if (
        ((config.url.indexOf("?") + 1) == config.url.length)
        && (config.datas != undefined && config.datas != "")
      ) {
        let i = 0
        for (let key in config.datas) {
          config.url += ((i++ == 0) ? "" : "&") + key + "=" + config.datas[key]
        }
        config.datas = undefined
      }
    } catch (error) {
      //
    }


    try {
      try { //自动判断 method 请求方式
        if (config.method == undefined) {
          if (config.data == undefined && config.datas == undefined) { // get方式
            config.method = "GET"
          } else {
            config.method = "POST"
          }
        } else if (config.method == "get" && config.datas != undefined) {
          config.method = "POST"
        }
      } catch (error) {
        console.log("请求前拦截器 -> 自动判断method出错:", error)
      }
      try { //判断是否传入 datas 参数，拼接json为传统post格式 
        if (config.datas != undefined && config.data == undefined) {
          let key, data = new URLSearchParams();
          for (key in config.datas) {
            data.append(key, config.datas[key]);
          }
          config.data = data
        }
      } catch (error) {
        console.log("拦截器请求前 -> datas参数传入 报错:", error)
      }
      config.headers["Content-Type"] = "application/x-www-form-urlencoded";
      
    } catch (error) {
      console.log("axios请求前 报错 -> " + error)
    }

    try {
      if (config.jsonDatas != undefined) {
        config.method = "POST"
        config.headers["Content-Type"] = "application/json"
        config.data = config.jsonDatas
        config.withCredentials = true
        config.dataType = "json"
      }
    } catch (error) {
      console.log("axios请求前 报错 -> " + error)
    }
    
    /**
     * 弹出请求加载框
     */
    if(config.showLoading){
      config.$loading = that.$loading({
        lock: true,
        text: config.showLoading==true?'加载中,请稍等...':config.showLoading,
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.1)'
      });
    }
    
    
    /**
     * 对象按字母正序排列返回
     */
    function ksort(o) {
      let sorted = {};
      Object.keys(o).sort().map(key => {
        sorted[key] = o[key];
      });
      return sorted;
    }
    /**
     * 解析url内的键值对
     */
    function getUrlObj(url) {
      var u = url.split("?");
      if (typeof (u[1]) == "string") {
        u = u[1].split("&");
        var get = {};
        for (var i in u) {
          var j = u[i].split("=");
          get[j[0]] = j[1];
        }
        return get;
      } else {
        return {};
      }
    }
    /**
     * 对象转成url编码格式
     */
    function objToUrlCode(obj) {
      let str = '';
      Object.keys(obj).map(key => {
        str = str + `&${key}=${obj[key]}`
      })
      return str;
    }
    
    /**
     * 数据签名
     */
    config.headers.Sign = that.$md5(objToUrlCode(ksort({
      ...(typeof config.datas == "object"?config.datas:{}),
      ...getUrlObj(config.url),
      appKey: baseConfig.appKey,
    })));
    
    config.configCheckSuccess = true;
    return config;
  },
  function(error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
_axios.interceptors.response.use(
  function(response) {
    // Do something with response data
    return new Promise((yes,err)=>{
      
      let that = window.$vue;
      try {
        //存在加载弹窗，先关闭弹窗
        if(response.config.$loading){
          response.config.$loading.close(); 
          delete response.config.$loading;
        }
      } catch (error) {
        
      }
      
      /**
       * 接口响应状态码 判断
       */
      try {
        if (typeof (response.data) == "object") {
          response.data.code = Number(response.data.code)
          switch (response.data.code) {
            case -2: //登录已失效
              // TODO: 清空登录状态跳转到未登录页
              break;
            case -1: //无Token需要获取 token
              localStorage.setItem("token","");
              setTimeout(() => {
                that.$axios({
                  url: "/public/getToken.json",
                  datas: {
                    type: 'a',
                  },
                  getToken: true
                }).then(res=>{
                  localStorage.setItem("token",res.token);
                  response.config.headers.Token = res.token; //更新旧TOKEN
                  that.$axios(response.config).then(yes).catch(err)
                }).catch(error=>{
                  console.log("axios响应拦截器 - 获取token报错",error);
                  err("获取token失败！")
                })
              }, 500);
              break;
            case 0: //正常报错
              if(!response.config.noTips){
                ajaxTips(that,response.data.message)
              }
              if(response.config.returnErrorData){
                err(response.data)
              }else{
                err(response.data.message)
              }
              break;
            case 1: //响应成功
              yes(response.data)
              break;
            default:
              break;
          }

        } else { // 返回值非json,可能是接口报错
          try {
            response.config.getToken;
          } catch (error) {
            console.log(response);
            ajaxTips(that,"服务器响应失败！请稍后重试")
          }
          
          err("拦截器 报错 |--> code " + response.data.code)
        }
      } catch (error) {
        ajaxTips(that,"当前页面出现错误 -> "+error)
        console.log("(axios) 拦截器出错 -> " + error)
        err("拦截器 报错 |--> error " + error)
      }
    })
  },
  function(error) {
    // Do something with response error
    return Promise.reject(error);
  }
);

Plugin.install = function(Vue, options) {
  Vue.axios = _axios;
  window.axios = _axios;
  Object.defineProperties(Vue.prototype, {
    axios: {
      get() {
        return _axios;
      }
    },
    $axios: {
      get() {
        return _axios;
      }
    },
  });
};

Vue.use(Plugin)

export default Plugin;
