/**
* 弹出 message 页面顶部提示
*/
export default (msg, type = '', duration = 2000) => {
  let that = window.$vue;
  if (typeof msg == "object") msg = JSON.stringify(msg);
  if (type == '') {
    that.$message({
      showClose: true,
      message: msg,
      duration,
      type: "success"
    });
    return true;
  }
  
  switch (type) {
    case '1':
    case 'yes':
    case 1:
      type = 'success'
      break;
    case '0':
    case 'error':
    case 0:
      type = 'error'
    default:
      break;
  }
  
  that.$message({
    showClose: true,
    message: msg,
    type,
    duration
  })
  
  return true;
}