<template>
  <div id="home">
    <div class="row">
      <div class="label">源文件夹：</div>
      <div class="value">
        <el-input @click="selectDir('source')" :title='sourceDir' v-model="sourceDir" readonly />
      </div>
    </div>
    <div class="row">
      <div class="label">释放文件夹：</div>
      <div class="value">
        <el-input @click="selectDir('target')" :title='targetDir' v-model="targetDir" readonly />
      </div>
    </div>
    <div class="row">
      <div class="label">图片类型：</div>
      <div class="value">
        <el-checkbox-group v-model="imageType">
          <el-checkbox v-for="type in imageTypes" :key="type" :label="type" />
        </el-checkbox-group>
      </div>
    </div>
    <div class="row">
      <div class="label">视频类型：</div>
      <div class="value">
        <el-checkbox-group v-model="videoType">
          <el-checkbox v-for="type in videoTypes" :key="type" :label="type" />
        </el-checkbox-group>
      </div>
    </div>
    <div class="row">
      <div class="label">处理模式：</div>
      <div class="value">
        <el-radio-group v-model="handleType">
          <el-radio-button v-for="type in handleTypes" :key="type" :label="type" />
        </el-radio-group>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <div class="label">文件夹结构：</div>
        <div class="value">
          <el-select v-model="dirStruct">
            <el-option v-for="item in dirStructs" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </div>
      </div>
      <div class="col">
        <div class="label">重复文件覆盖：</div>
        <div class="value">
          <el-checkbox v-model="isOverwrite" />
        </div>
      </div>
    </div>
    <div class="btns">
      <el-button :loading='isRuning' @click="run" type="primary">运行</el-button>
    </div>
    <div class="log-box">
      <el-scrollbar ref="scrollbar" class="log-card" always>
        <p v-for="log in logs" :key="log.message" :class="getLogColor(log)">{{log.message}}</p>
      </el-scrollbar>
    </div>
  </div>
</template>

<script>
import { toRaw } from '@vue/reactivity'

export default {
  name: 'home',
  data() {
    return {
      sourceDir: '',
      targetDir: '',
      imageType: ['.jpg', '.jpeg', '.png', '.arw'],
      videoType: ['.mp4', '.3gp'],
      handleType: 'move',
      dirStruct: 'YYYY-MM',
      isOverwrite: true,
      imageTypes: ['.jpg', '.jpeg', '.png', '.arw'],
      videoTypes: ['.mp4', '.3gp'],
      dirStructs: [
        {
          label: './YYYY-MM/..',
          value: 'YYYY-MM'
        },
        {
          label: './YYYY/MM/..',
          value: 'YYYY/MM'
        }
      ],
      handleTypes: ['move', 'copy'],
      logs: [],
      isRuning: false
    }
  },
  mounted() {
    window.api.listenLog((message) => {
      this.logs.push(message)
      console.log(message)
      setTimeout(() => {
        this.$refs.scrollbar.setScrollTop(this.$refs.scrollbar.wrapRef.scrollHeight)
      }, 300)
    })

    this.initCache()
  },
  methods: {
    initCache() {
      const sourceDir = localStorage.getItem('sourceDir')
      if (sourceDir) this.sourceDir = sourceDir
      const targetDir = localStorage.getItem('targetDir')
      if (targetDir) this.targetDir = targetDir
    },
    getLogColor(log) {
      return {
        success: log.state == 200,
        error: log.state == 500,
        info: log.state == 201
      }
    },
    run() {
      this.logs.length = 0
      this.isRuning = true
      window.api
        .start({
          sourceDir: this.sourceDir,
          targetDir: this.targetDir,
          handleType: this.handleType,
          dirStruct: this.dirStruct.split('/'),
          isOverwrite: this.isOverwrite,
          imageType: toRaw(this.imageType),
          videoType: toRaw(this.videoType)
        })
        .finally(() => {
          this.isRuning = false
        })

      if (this.sourceDir) {
        localStorage.setItem('sourceDir', this.sourceDir)
      }
      if (this.targetDir) {
        localStorage.setItem('targetDir', this.targetDir)
      }
    },
    selectDir(type) {
      window.api.selectDir().then((res) => {
        if (!res.canceled) {
          if (type == 'source') {
            this.sourceDir = res.filePaths[0]
          }
          if (type == 'target') {
            this.targetDir = res.filePaths[0]
          }
        }
      })
    }
  }
}
</script>

<style lang="scss">
html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}
#home {
  padding: 20px;
  display: flex;
  flex-direction: column;

  height: 100%;
  box-sizing: border-box;
  .row,
  .btns {
    display: flex;
    flex-direction: row;
    margin-bottom: 10px;
    align-items: center;
    flex-shrink: 0;

    .label {
      width: 120px;
      flex-shrink: 0;

      display: flex;
      align-items: center;
      justify-content: flex-end;

      font-size: 15px;
      color: #303133;
    }
    .value {
      flex-grow: 1;
    }
    .col {
      display: flex;
    }
  }
  .btns {
    justify-content: flex-end;
  }
  .log-box {
    border: 1px solid #f2f6fc;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.12), 0 0 6px rgba(0, 0, 0, 0.04);
    padding: 15px;
    box-sizing: border-box;
    background-color: #1e1e1e;
    border-radius: 10px;
    flex-grow: 1;
    height: 1px;

    .log-card {
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      p {
        margin: 0;
        margin-bottom: 1px;
        font-size: 12px;
        word-wrap: break-word;
        color: #ccc;
      }
      .success {
        color: #0dbc79;
      }
      .error {
        color: red;
      }
      .info {
        color: #ccc;
      }
    }
  }
}
</style>
