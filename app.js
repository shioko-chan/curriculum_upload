App({
  // 当小程序初始化完成时，会触发 onLaunch（全局只触发一次）。
  onLaunch: function(options) {
    // Do something initial when launch.
  },
  // 当小程序启动，或从后台进入前台显示，会触发 onShow。
  onShow: function(options) {
    // Do something when show.
  },
  // 当小程序从前台进入后台，会触发 onHide。
  onHide: function() {
    // Do something when hide.
  },
  // 当小程序发生脚本错误，或者 API 调用失败时，会触发 onError 并带上错误信息。
  onError: function(msg) {
    console.log(msg)
  },
  globalData: 'I am global data'
})