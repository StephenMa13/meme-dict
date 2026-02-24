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