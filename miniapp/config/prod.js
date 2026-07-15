module.exports = {
  env: {
    NODE_ENV: '"production"'
  },
  defineConstants: {
  },
  mini: {
    miniCssExtractPluginOption: {
      ignoreOrder: true
    },
    cssLoaderOption: {},
    sassLoaderOption: {},
    webpackChain(chain) {
      // 禁用CSS压缩以避免微信小程序WXSS解析错误
      chain.optimization.minimize(false)
    }
  },
  h5: {
    publicPath: '/'
  }
}
