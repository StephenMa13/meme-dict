import { ref, watch } from 'vue'

// --- 原有的收藏功能 ---
const savedFavorites = JSON.parse(localStorage.getItem('my_favorite_memes')) || []
export const favoriteIds = ref(savedFavorites)
watch(favoriteIds, (newVal) => {
  localStorage.setItem('my_favorite_memes', JSON.stringify(newVal))
}, { deep: true })

export function toggleFavorite(memeId) {
  const index = favoriteIds.value.indexOf(memeId)
  if (index === -1) {
    favoriteIds.value.push(memeId)
  } else {
    favoriteIds.value.splice(index, 1)
  }
}

export const randomMemes = ref([])

// 👇 --- 整合后的“黑名单”全局功能 ---
// 统一使用 'meme_blacklist' 这个 Key，和咱们之前的逻辑保持一致
export const blacklistIds = ref(JSON.parse(localStorage.getItem('meme_blacklist') || '[]'))

// 只要黑名单有变化，自动存入本地！
watch(blacklistIds, (newVal) => {
  localStorage.setItem('meme_blacklist', JSON.stringify(newVal))
}, { deep: true })

// 💡 改造成 Toggle（开关）函数，完美适配咱们之前设计的“撤销隐藏”功能
export function toggleNotInterested(memeId) {
  const index = blacklistIds.value.indexOf(memeId)
  if (index === -1) {
    blacklistIds.value.push(memeId) // 拉黑
  } else {
    blacklistIds.value.splice(index, 1) // 撤销拉黑
  }
}

// 👇 1. 新增：读取本地存的点赞记录（如果没有就默认为空数组）
export const likedIds = ref(JSON.parse(localStorage.getItem('likedIds') || '[]'))

// 👇 2. 新增：只要点赞列表发生变化，就自动存入浏览器本地硬盘！
watch(likedIds, (newVal) => {
  localStorage.setItem('likedIds', JSON.stringify(newVal))
}, { deep: true })

// 👇 3. 新增：切换点赞状态的函数
export function toggleLike(memeId) {
  const index = likedIds.value.indexOf(memeId)
  if (index === -1) {
    likedIds.value.push(memeId) // 没赞过就加入
  } else {
    likedIds.value.splice(index, 1) // 赞过就取消
  }
}