const { defineConfig } = require('@vue/cli-service')
const path = require('path');
module.exports = defineConfig({
  transpileDependencies: ['src/components/zing-grid/ag-grid-community.auto.complete.esm.js'],
  lintOnSave: false,
  configureWebpack: {
    resolve: {
      alias: {
        '@components': path.resolve(__dirname, 'src')
      }
    }
  }
})
