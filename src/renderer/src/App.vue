<template>
  <div id="title_box">
    <img src="/icon.png" alt="" srcset="">
    <span>
      {{ packageInfo.displayName }} V{{ packageInfo.version }}
      <span style="font-size: 12px;color: #666;">by Sunrise</span>
    </span>
  </div>
  <div id="main_box">
    <div id="action_box">
      <span>将为您自动整理照片和视频文件到按日期分类的文件夹中</span>
      <div class="btn" @click="describeDialog = true">
        <el-icon><i-ep-InfoFilled /></el-icon>
        使用说明
      </div>
    </div>
    <div id="home">
      <div class="row">
        <div class="label">源文件夹</div>
        <div class="value">
          <el-input size="large" placeholder="请选择源文件夹路径" :title='sourceDir' v-model="sourceDir" readonly />
          <el-button size="large" type="primary" @click="selectDir('source')">
            <el-icon size="large" class="el-icon--left">
              <i-ep-FolderOpened />
            </el-icon>
            浏览
          </el-button>
        </div>
      </div>
      <div class="row">
        <div class="label">释放文件夹</div>
        <div class="value">
          <el-input size="large" placeholder="请选择输出文件夹路径" :title='targetDir' v-model="targetDir" readonly />
          <el-button size="large" type="primary" @click="selectDir('target')">
            <el-icon size="large" class="el-icon--left">
              <i-ep-FolderOpened />
            </el-icon>
            浏览
          </el-button>
        </div>
      </div>
      <div class="row">
        <div class="label">图片类型</div>
        <div class="value">
          <el-checkbox-group size="large" v-model="imageType">
            <el-checkbox v-for="type in imageTypes" :key="type" :label="type" />
          </el-checkbox-group>
        </div>
      </div>
      <div class="row">
        <div class="label">视频类型</div>
        <div class="value">
          <el-checkbox-group size="large" v-model="videoType">
            <el-checkbox v-for="type in videoTypes" :key="type" :label="type" />
          </el-checkbox-group>
        </div>
      </div>
      <div class="row">
        <div class="label">处理模式</div>
        <div class="value">
          <el-radio-group size="large" v-model="handleType">
            <el-radio-button v-for="type in handleTypes" :key="type.key" :label="type.key">{{ type.label
            }}</el-radio-button>
          </el-radio-group>
        </div>
      </div>
      <div class="row">
        <div class="label">文件夹结构</div>
        <div class="value">
          <el-select size="large" v-model="dirStruct" style="flex-grow: 1;">
            <el-option v-for="item in dirStructs" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <div class="file-option">
            <div class="option-item"><el-checkbox size="large" v-model="isOverwrite" />重复文件覆盖</div>
          </div>
        </div>
      </div>
      <div class="btns">
        <el-button size="large" :loading='isRuning' @click="run" type="primary">运行</el-button>
      </div>
    </div>
    <div id="progress-box">
      <div class="progress-info">
        <span>执行进度：{{ progressInfo.handle }}/{{ progressInfo.total }}</span>
        <el-button link type="primary" @click="progressDetailsDrawer = true">
          <el-icon class="el-icon--left">
            <i-ep-View />
          </el-icon>
          执行明细
        </el-button>
      </div>
      <el-progress :striped="progressFlow" :striped-flow="progressFlow" :duration="20" :percentage="percentage"
        :show-text="false" />
    </div>
  </div>
  <el-drawer class="log-drawer" v-model="progressDetailsDrawer" direction="btt" :modal="false" :with-header="false">
    <div id="log-box">
      <div class="close-btn">
        <el-icon @click="progressDetailsDrawer = false">
          <i-ep-Close size="large" />
        </el-icon>
      </div>
      <el-scrollbar ref="scrollbar" class="log-card" always>
        <p v-for="log in logs" :key="log.message" :class="getLogColor(log)">{{ log.message }}</p>
      </el-scrollbar>
    </div>
  </el-drawer>
  <el-dialog v-model="describeDialog" width="70%" title="使用说明" :modal="false" :align-center="true">
    <Instructions></Instructions>
  </el-dialog>
</template>

<script>
import { toRaw } from '@vue/reactivity'
import "element-plus/theme-chalk/el-message-box.css";
import { ElMessageBox } from 'element-plus'
import Instructions from "./Instructions.vue"

export default {
  name: 'home',
  components: { Instructions },
  data() {
    return {
      sourceDir: '',
      targetDir: '',
      imageType: ['.jpg', '.jpeg', '.png', '.arw'],
      videoType: ['.mp4', '.3gp', ".mov"],
      handleType: 'copy',
      dirStruct: 'YYYY-MM',
      isOverwrite: true,
      imageTypes: ['.jpg', '.jpeg', '.png', '.arw'],
      videoTypes: ['.mp4', '.3gp', ".mov"],
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
      handleTypes: [{ key: "move", label: "移动" }, { key: "copy", label: "复制" }],
      logs: [],
      isRuning: false,
      packageInfo: window.api.packageInfo,
      progressDetailsDrawer: false,
      describeDialog: false,
      progressInfo: {
        total: 0,
        handle: 0
      }
    }
  },
  computed: {
    percentage: function () {
      if (!this.progressInfo.total) return 0
      return this.progressInfo.handle / this.progressInfo.total * 100
    },
    progressFlow: function () {
      return this.progressInfo.handle != this.progressInfo.total
    }
  },
  mounted() {
    window.api.listenLog((message) => {
      this.logs.push(message)
      console.log(message)
      setTimeout(() => {
        if (!this.$refs.scrollbar) return
        this.$refs.scrollbar.setScrollTop(this.$refs.scrollbar.wrapRef.scrollHeight)
      }, 300)
    })

    window.api.listenProgress((message) => {
      this.progressInfo = message
    })

    this.initCache()

    ElMessageBox.confirm(
      '<span style="color:red;">重要提醒：数据无价，建议在整理照片前先进行完整备份，以防数据丢失或误操作。</span>',
      '提醒',
      {
        confirmButtonText: '我已知晓',
        showCancelButton: false,
        autofocus: false,
        dangerouslyUseHTMLString: true,
        modalClass: "modal-color",
        closeOnClickModal: false,
        closeOnPressEscape: false,
        showClose: false
      }
    )
  },
  methods: {
    showProgressDetails() {
      this.progressDetailsDrawer = true
    },
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
:root {
  --el-color-primary: #3B82F6;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
}

#app {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
}

#title_box {
  display: flex;
  align-items: center;
  height: 60px;
  flex-shrink: 0;
  margin: 0 24px;

  font-size: 1.25rem;
  font-weight: 500;
  -webkit-app-region: drag;

  &>img {
    width: 32px;
    margin-right: 0.5rem;
  }
}

#main_box {
  flex-grow: 1;
  height: 1px;
  overflow: auto;
  padding: 0px 24px;

  #action_box {
    padding: 12px 0px;
    padding-bottom: 0;
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #4b5563;
    font-size: 0.875rem;

    .btn {
      display: flex;
      align-items: center;
      cursor: pointer;

      i {
        margin: 0 2px;
      }
    }
  }

  #home {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;

    .row {
      display: flex;
      flex-direction: column;
      margin-top: 24px;

      .label {
        color: #374151;
        font-weight: 500;
        font-size: 0.875rem;
        margin-bottom: 8px;
      }

      .value {
        display: flex;

        &>button {
          margin-left: 6px;
        }

        .el-checkbox {
          height: auto;
        }

        .file-option {
          margin-left: 24px;
          display: flex;
          flex-direction: column;
          justify-content: center;

          .option-item {
            display: flex;
            align-items: center;

            .el-checkbox {
              margin-right: 6px;
            }
          }
        }
      }

      .col {
        display: flex;
      }
    }

    .btns {
      margin-top: 24px;
      justify-content: flex-end;

      &>button {
        width: 100%;
      }
    }


  }

  #progress-box {
    margin-top: 6px;
    color: #4b5563;
    font-size: 0.875rem;

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
  }

}

#log-box {
  display: flex;
  height: 100%;
  flex-direction: column;

  .log-card {
    border: 1px solid #e5e7eb;
    padding: 16px;
    box-sizing: border-box;
    background-color: #f9fafb;
    border-radius: 12px;

    flex-grow: 1;
    overflow-y: auto;
    overflow-x: hidden;

    p {
      margin: 0;
      margin-bottom: 8px;
      font-size: 12px;
      word-wrap: break-word;
      color: #4b5563;
      font-family: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
      font-feature-settings: normal;
      font-variation-settings: normal;
      -webkit-tap-highlight-color: transparent;
    }

    .success {
      color: #16a34a;
    }

    .error {
      color: red;
    }

    .info {
      color: #4b5563;
    }
  }
}

.log-drawer {
  height: 84vh !important;

  .close-btn {
    text-align: right;
    margin-bottom: 12px;
    cursor: pointer;
  }
}

.modal-color {
  background-color: transparent;
}
</style>
