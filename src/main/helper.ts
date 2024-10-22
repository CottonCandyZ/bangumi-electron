import { isWindows } from '@main/env'
import path from 'node:path'

// ref: follow:/main/helper

const iconMap = {
  prod: path.join(__dirname, '../../resources/icon.png'),
  dev: path.join(__dirname, '../../resources/icon-dev.png'),
}
const windowsIconMap = {
  prod: path.join(__dirname, '../../resources/icon-windows.png'),
  dev: path.join(__dirname, '../../resources/icon-dev.png'),
}
export const getIconPath = () => {
  const icon = isWindows ? windowsIconMap : iconMap
  return icon[process.env.NODE_ENV === 'development' ? 'dev' : 'prod']
}
