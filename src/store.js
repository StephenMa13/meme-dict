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

// 👇 --- 新增的“不感兴趣”功能 ---
const savedNotInterested = JSON.parse(localStorage.getItem('my_not_interested_memes')) || []
export const notInterestedIds = ref(savedNotInterested)

watch(notInterestedIds, (newVal) => {
  localStorage.setItem('my_not_interested_memes', JSON.stringify(newVal))
}, { deep: true })

export function markNotInterested(memeId) {
  if (!notInterestedIds.value.includes(memeId)) {
    notInterestedIds.value.push(memeId)
  }
}

export function removeNotInterested(memeId) {
  const index = notInterestedIds.value.indexOf(memeId)
  if (index !== -1) {
    notInterestedIds.value.splice(index, 1) // 删掉它，它就会重新在首页出现了！
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