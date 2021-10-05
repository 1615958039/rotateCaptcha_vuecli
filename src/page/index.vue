<template>
  <div>
    
    <h2>旋转验证码：</h2>
    <p>(vue-cli版本)</p>
    
    <el-button icon="el-icon-picture-outline-round" type="primary" @click="showCaptcha">打开验证码</el-button>
    <el-button icon="el-icon-delete" @click="cleanLog">清空验证记录</el-button>
    
    <hr/>
    手机端测试页UNIAPP: <a href="./uniapp.html">./uniapp.html</a>
    <hr/>
    本项目总开源地址：<a href="https://github.com/1615958039/rotateCaptcha">https://github.com/1615958039/rotateCaptcha</a>
    <hr/>
    
    
    <captchaDialog ref="captchaDialog" />
  </div>
</template>
<script>
import captchaDialog from '../components/captchaDialog.vue';
export default {
  components: {
    captchaDialog,
  },
  methods: {
    /**
     * 展示验证码
     */
    showCaptcha(){
      this.$refs.captchaDialog.init().then(()=>{
        
        this.$message({
          message: '验证成功！',
          type: 'success'
        });
        
      }).catch(()=>{
        
        this.$message({
          message: '验证码弹窗关闭',
          type: 'warning'
        });
        
      })
    },
    /**
     * 清空验证记录
     */
    cleanLog(){
      let that = this;
      that.$axios({
        url: "/demo/resetTryNum.json",
        showLoading: "清空中..."
      }).then(res=>{
        that.tw("清空成功！您可重新获取验证码");
      });
    },
  },
}
</script>
<style lang="scss" scoped>

</style>