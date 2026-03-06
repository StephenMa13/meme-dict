// 引入我们的出厂词典
import defaultMemes from './data/memes.json'

const DB_KEY = 'my_offline_memes_v3' // 本地硬盘的文件夹名字

// 1. 获取所有梗
export const getMemes = () => {
  const localData = localStorage.getItem(DB_KEY)
  const localMemes = localData ? JSON.parse(localData) : []
  const hasNewDefault = defaultMemes.some(
    dm => !localMemes.find(lm => lm.id === dm.id)
  )

  if (hasNewDefault) {
    // 找出所有本地没有的新梗
    const newItems = defaultMemes.filter(
      dm => !localMemes.find(lm => lm.id === dm.id)
    )
    // 合并并保存
    const updatedMemes = [...localMemes, ...newItems]
    saveMemes(updatedMemes)
    return updatedMemes
  }

  return localMemes.length > 0 ? localMemes : defaultMemes
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

