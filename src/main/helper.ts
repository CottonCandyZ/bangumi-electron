import path from 'node:path'

// ref: follow:/main/helper

const iconMap = {
  prod: path.join(__dirname, '../../resources/icon.png'),
  dev: path.join(__dirname, '../../resources/icon-dev.png'),
}
export const getIconPath = () => iconMap[process.env.NODE_ENV === 'development' ? 'dev' : 'prod']
