<template>
  <div
    :style="{zIndex}"
    class="dialog"
    v-if="show"
  >
    <div class="captche"> 
      
      <div class="subhead">人机验证</div>
      <div class="tips">滑动滑块,使图片角度为正</div>
      
      <div class="image">
        <div
          v-if="captchaSrc!=''"
          :style="{
            backgroundImage: `url(${captchaSrc})`,
            transform:  `rotate(${imageTransform}deg)`
          }"
          class="src"
        />
        <div class="icon" v-if="pageLoading || captchaSrcLoading">
          <i class="loading el-icon-loading"></i>
        </div>
        <div class="icon" v-if="captchaError">
          <i class="error el-icon-close"></i>
        </div>
        
        <div class="icon" v-if="isDrag">
          <!-- 辅助虚线 -->
          <div class="verticalArrow"></div>
          <div class="transverseArrow"></div>
        </div>
        
      </div>
      
      <div class="capFoot">
        <div class="slider" ref="slider">
          <div
            class="sliderItem clickActive-gray"
            :class="captchaError?'shake':''"
            ref="sliderItem"
            @touchstart="dragStart"
            @touchmove.prevent="dragMove"
            @touchend="dragEnd"
            @mousedown="dragStart"
            @mousemove.prevent="dragMove"
            @mouseup="dragEnd"
            @dragstart="dragStart"
            @dragend="dragEnd"
            @dragover.stop
            @drop="dragMove"
            :style="{
              left: `${sliderItemLeft}px`,
              backgroundColor: captchaError?'red':(isDrag?'#409EFF':'#fff')
            }"
          >
            <div class="i-loading" v-if="dragLoading || pageLoading || captchaSrcLoading">
              <i class="el-icon-loading"></i>
            </div>
            <div
              v-else
              :style="{
                backgroundImage: `url(${dragIcon})`
              }"
              class="i-drag"
            />
          </div>
        </div>
      </div>
      

      <div class="copyright">
        由<a>犭申</a>提供技术支持
      </div>


      <div class="close" @click.stop="close">
        <i class="el-icon-circle-close"></i>
      </div>

    </div>
  </div>
</template>
<script>
let pmsSuccess = null;
let pmsError = null;
export default {
  props: {
    /**
     * 弹窗层级
     */
    zIndex: {
      type: Number,
      default: 999999999999
    }
  },
  data() {
    return {
      
      show: false,
      captchaSrc: "", 
      
      isDrag: false, //是否拖动中
      dragStartTime: 0, //拖动开始时间
      dragUseTime: 0, //拖动用时
      mouseTrackList: [], //鼠标轨迹列表
      
      sliderItemInitX: 0, //滑动按钮初始X坐标
      sliderItemLeftMax: 0, //滑块允许距离左边最大长度
      sliderItemLeft: 0,
      
      captchaSrcLoading: false, //请求图片验证码中
      pageLoading: false, //页面加载中，验证码图片加载中
      dragLoading: false, //拖动按钮loading状态
      captchaError: false,

      
      
    }
  },
  computed: {
    /**
     * 图片旋转角度
     */
    imageTransform(){
      let that = this;
      if(that.sliderItemLeft==0)return 0;
      return Math.ceil((360 / that.sliderItemLeftMax) * that.sliderItemLeft * 100) / 100;
    },
    /**
     * 拖动条上的图标
     */
    dragIcon(){
      let that = this;
      let white = '/preview/icon/png/drag_white.png';
      let black = '/preview/icon/png/drag_black.png';
      if(that.captchaError)return white;
      if(that.isDrag)return white;
      return black;
    }
  },
  methods: {
    /**
     * 外部调用
     */
    init(){
      let that = this;
      return new Promise((yes,err)=>{
        pmsSuccess = yes;
        pmsError = err;
        
        that.captchaSrc = false;
        that.captchaError = false;
        that.isDrag = false;
        that.captchaSrcLoading = false;
        that.pageLoading = false;
        that.dragLoading = false;
        that.show = true;
        
        if(that.sliderItemLeftMax==0){
          that.pageLoading = true;
          setTimeout(()=>{
            that.$nextTick(()=>{
              
              let slider = that.$refs.slider.getBoundingClientRect()
              let sliderWidth = slider.width;
              let sliderItem = that.$refs.sliderItem.getBoundingClientRect()
              that.sliderItemInitX = sliderItem.left;
              that.sliderItemLeftMax = sliderWidth - sliderItem.width;
              that.pageLoading = false;
              that.getCaptchaSrc();
              
            })
          },500)
        }else{
          that.getCaptchaSrc()
        }
        
      })
    },
    /**
     * 拖动开始事件
     */
    dragStart(e){
      let that = this;
      if(that.dragLoading)return false;
      if(that.pageLoading)return false;
      if(that.captchaSrcLoading)return false;
      that.mouseTrackList = []; //初始化轨迹列表
      that.dragStartTime = new Date().getTime(); //记录开始时间
      that.isDrag = true;
      that.addMouseTrack(e);
    },
    /**
     * 手指移动事件
     */
    dragMove(e){
      let that = this;
      if(that.dragLoading)return false;
      if(that.pageLoading)return false;
      if(that.captchaSrcLoading)return false;
      if(!that.isDrag)return false;
      let maringLeft = (!e.changedTouches?e.clientX:e.changedTouches[0].clientX) - that.sliderItemInitX - 30;
      if(maringLeft<0)maringLeft = 0;
      if(maringLeft>that.sliderItemLeftMax)maringLeft = that.sliderItemLeftMax;
      that.sliderItemLeft = maringLeft;
      that.addMouseTrack(e);
    },
    /**
     * 拖动结束事件
     */
    dragEnd(e){
      let that = this;
      if(that.dragLoading)return false;
      if(that.pageLoading)return false;
      if(that.captchaSrcLoading)return false;
      if(!that.isDrag)return false;
      that.addMouseTrack(e);
      that.isDrag = false;
      that.dragLoading = true; //开启loading准备ajax
      that.dragUseTime = new Date().getTime() - that.dragStartTime; //计算拖动时间
      that.checkCaptche();
    },
    /**
     * 加载验证码
     */
    getCaptchaSrc(){
      let that = this;
      that.captchaSrcLoading = true;
      that.sliderItemLeft = 0;
      that.captchaSrc = '';
      
      that.$axios({
        url: "/public/captcha/getCaptcha.json",
      }).then(res=>{
        if(res.src){
          that.dragLoading = false;
          that.captchaSrc = `data:image/png;base64,${res.src}`
        }
        that.captchaSrcLoading = false;
      }).catch(err=>{
        that.captchaSrcLoading = false;
        that.tw(err.message)
        setTimeout(()=>{ // 防止闪烁，延迟一秒
          that.close()
        },1000)
      })
    },
    
    /**
     * 添加滑动数据进鼠标轨迹列表
     */
    addMouseTrack(){
      let that = this;
      let lastTime = that.mouseTrackList==''?that.dragStartTime:that.mouseTrackList[that.mouseTrackList.length-1].t;
      let now = new Date().getTime();
      if(lastTime + 200 <= now){
        that.mouseTrackList.push({
          r: Math.ceil(that.imageTransform / 360 * 10000) / 100, //当前角度
          t: now, //当前时间戳
        })
      }
    },
    /**
     * 提交效验参数是否正确
     */
    checkCaptche(){
      let that = this;
      that.$axios({
        url: "/public/captcha/checkCaptcha.json",
        datas: {
          rotationAngle: that.imageTransform, //旋转角度
          mouseTrackList: JSON.stringify(that.mouseTrackList), //鼠标轨迹记录
          dragUseTime: that.dragUseTime, //拖动用时
          dragStartTime: that.dragStartTime, //拖动开始时间
          /**
           * 以下为混淆参数，无用
           */
          key_1: new Date().getTime() * Math.random(),
          key_2: new Date().getTime() * Math.random(),
          key_3: new Date().getTime() * Math.random(),
          hash: new Date().getTime() * Math.random(),
          md5Key: new Date().getTime() * Math.random(),
        },
        noTips: true,
        returnErrorData: true
      }).then(res=>{ //效验成功
        
        that.show = false;
        pmsSuccess(); //回调
        
      }).catch(data=>{
        that.dragLoading = false;
        that.captchaError = true;
        setTimeout(()=>{
          that.captchaError = false;
          if(data.getNewCaptcha)that.getCaptchaSrc();
          else{
            that.captchaSrcLoading = false;
            that.sliderItemLeft = 0;
          }
        },1000)
      })
    },
    /**
     * 点击关闭事件
     */
    close(){
      this.show = false;
      pmsError();
    }
  }
}
</script>
<style lang="scss" scoped>

.dialog{
  height: 100vh;
  width: 100vw;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 0;
  left: 0;
  .captche{
    position: relative;
    width: 320px;
    border-radius: 20px;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    .subhead{
      color: #8799a3;
      font-size: 14px;
      margin-top: 20px;
    }
    .tips{
      font-size: 17px;
      color: #333333;
      margin-top: 15px;
    }
    .image{
      position: relative;
      height: 170px;
      width: 170px;
      margin-top: 15px;
      .src{
        background-position: center center;
        background-size: cover;
        background-repeat: no-repeat;
        height: 170px;
        width: 170px;
        border-radius: 50%;
      }
      .icon{
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        .loading{
          color: #409EFF;
          font-size: 50px;
        }
        .error{
          color: #fff;
          font-size: 80px;
        }
        .verticalArrow{
          position: absolute;
          height: 100%;
          border-left: 1px dashed #fff;
          margin-left: 1px;
          width: 1px;
        }
        .transverseArrow{
          position: absolute;
          height: 1px;
          width: 100%;
          border-top: 1px dashed #fff;
          margin-top: 1px;
          overflow: visible;
        }
      }
    }
    .capFoot{
      height: 50px;
      width: auto;
      display: flex;
      flex-direction: row;
      justify-content: center;
      margin-top: 15px;
      
      .slider{
        width: 280px;
        height: 50px;
        background-color: #f5f5f5;
        border-radius: 500px;
        overflow: hidden;
        position: relative;
        border: 1px solid rgba(0, 0, 0, 0.1);
        
        .sliderItem{
          height: 46px;
          width: 60px;
          border-radius: 500px;
          background-color: white;
          position: absolute;
          left: 0;
          top: 2px;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          -webkit-box-shadow: 0 21px 52px 0 rgba(82,82,82,.2);
          box-shadow: 0 21px 52px 0 rgba(82,82,82,.2);
          .i-loading{
            i{
              color: #8799a3;
              font-size: 25px;
            }
          }
          .i-drag{
            background-position: center center;
            background-size: cover;
            background-repeat: no-repeat;
            height: 28px;
            width: 28px;
          }
        }
      }
    }
    .copyright{
      margin: 15px;
      font-size: 12px;
      color: #aaaaaa;
      a{
        color: #409EFF;
        margin-left: 5px;
        margin-right: 5px;
      }
    }
    .close{
      color: #fff;
      position: absolute;
      bottom: -60px;
      width: 100%;
      text-align: center;
      i{
        cursor: pointer;
        font-size: 26px;
      }
    }
  }
}
.shake{
  animation: shake 800ms ease-in-out;
}
@keyframes shake { /* 水平抖动，核心代码 */
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(+2px, 0, 0); }
  30%, 70% { transform: translate3d(-3px, 0, 0); }
  40%, 60% { transform: translate3d(+3px, 0, 0); }
  50% { transform: translate3d(-3px, 0, 0); }
}
</style>