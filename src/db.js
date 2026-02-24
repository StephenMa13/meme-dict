// 引入我们的出厂词典
import defaultMemes from './data/memes.json'

const DB_KEY = 'my_offline_memes_v2' // 本地硬盘的文件夹名字

// 1. 获取所有梗
export const getMemes = () => {
  const localData = localStorage.getItem(DB_KEY)
  if (localData) {
    return JSON.parse(localData) // 如果本地有保存过，就用本地的
  } else {
    // 如果是第一次打开，就把出厂词典存进本地硬盘，并返回
    localStorage.setItem(DB_KEY, JSON.stringify(defaultMemes))
    return defaultMemes
  }
}

// 2. 保存数据到本地硬盘（内部使用）
const saveMemes = (memes) => {
  localStorage.setItem(DB_KEY, JSON.stringify(memes))
}

// 3. 根据 ID 查详情
export const getMemeById = (id) => {
  const memes = getMemes()
  return memes.find(m => m.id === parseInt(id))
}

// 4. 添加新梗
export const addMeme = (newMeme) => {
  const memes = getMemes()
  newMeme.id = memes.length > 0 ? Math.max(...memes.map(m => m.id)) + 1 : 1
  newMeme.isHot = false // 自己加的默认先不是最热
  memes.push(newMeme)
  saveMemes(memes)
}

// 5. 删除梗
export const deleteMeme = (id) => {
  let memes = getMemes()
  memes = memes.filter(m => m.id !== parseInt(id))
  saveMemes(memes)
}