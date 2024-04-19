import config from './config'
import { h } from 'vue'
import { ElMessage } from 'element-plus'

// 统一导入el-icon图标
import * as ElIconModules from '@element-plus/icons-vue'
import svgIcon from '@/components/svgIcon/svgIcon.vue'

export function successTips(type,msg) {
  return ElMessage({message:msg||'操作完成',type:type||'success'})
}


const createIconComponent = (name) => ({
  name: 'SvgIcon',
  render() {
    return h(svgIcon, {
      name: name,
    })
  },
})

const registerIcons = async(app) => {
  const iconModules = import.meta.glob('@/assets/icons/**/*.svg')
  for (const path in iconModules) {
    const iconName = path.split('/').pop().replace(/\.svg$/, '')
    // 如果iconName带空格则不加入到图标库中并且提示名称不合法
    console.log(iconName)
    if (iconName.indexOf(' ') !== -1) {
      console.error(`icon ${iconName}.svg includes whitespace`)
      continue
    }
    const iconComponent = createIconComponent(iconName)
    config.logs.push({
      'key': iconName,
      'label': iconName,
    })
    app.component(iconName, iconComponent)
  }
}

export const register = (app) => {
  // 统一注册el-icon图标
  for (const iconName in ElIconModules) {
    app.component(iconName, ElIconModules[iconName])
  }
  app.component('SvgIcon', svgIcon)
  registerIcons(app)
  app.config.globalProperties.$GIN_VUE_ADMIN = config
}
