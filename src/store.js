// src/store.js
import { ref, watch } from 'vue'

// 1. 从手机本地存储里读取以前的收藏（如果没有，就是空数组）
const savedFavorites = JSON.parse(localStorage.getItem('my_favorite_memes')) || []

// 2. 创建一个全局响应式的收藏 ID 列表
export const favoriteIds = ref(savedFavorites)

// 3. 施展魔法：只要 favoriteIds 发生变化，就自动静默保存到手机本地！
watch(favoriteIds, (newVal) => {
  localStorage.setItem('my_favorite_memes', JSON.stringify(newVal))
}, { deep: true })

// 4. 提供一个切换收藏状态的便捷函数
export function toggleFavorite(memeId) {
  const index = favoriteIds.value.indexOf(memeId)
  if (index === -1) {
    favoriteIds.value.push(memeId) // 没收藏过？加进去！
  } else {
    favoriteIds.value.splice(index, 1) // 收藏过了？移出来！
  }
}