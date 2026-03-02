import { ref, watch } from 'vue'

// --- 1. 状态初始化 (保持你原有的 Key 名) ---
export const favoriteIds = ref(JSON.parse(localStorage.getItem('my_favorite_memes') || '[]'))
export const blacklistIds = ref(JSON.parse(localStorage.getItem('meme_blacklist') || '[]'))
export const likedIds = ref(JSON.parse(localStorage.getItem('likedIds') || '[]'))
export const randomMemes = ref([])

// --- 2. 自动持久化监听 ---
watch(favoriteIds, (newVal) => {
  localStorage.setItem('my_favorite_memes', JSON.stringify(newVal))
}, { deep: true })

watch(blacklistIds, (newVal) => {
  localStorage.setItem('meme_blacklist', JSON.stringify(newVal))
}, { deep: true })

watch(likedIds, (newVal) => {
  localStorage.setItem('likedIds', JSON.stringify(newVal))
}, { deep: true })

// --- 3. 核心功能函数 (带双向互斥逻辑) ---

// 💡 收藏功能：排除黑名单
export function toggleFavorite(memeId) {
  // 🛡️ 拦截：如果已经在黑名单，禁止收藏
  if (blacklistIds.value.includes(memeId)) return 

  const index = favoriteIds.value.indexOf(memeId)
  if (index === -1) {
    favoriteIds.value.push(memeId)
  } else {
    favoriteIds.value.splice(index, 1)
  }
}

// 💡 点赞功能：排除黑名单
export function toggleLike(memeId) {
  // 🛡️ 拦截：如果已经在黑名单，禁止点赞
  if (blacklistIds.value.includes(memeId)) return

  const index = likedIds.value.indexOf(memeId)
  if (index === -1) {
    likedIds.value.push(memeId)
  } else {
    likedIds.value.splice(index, 1)
  }
}

// 💡 没意思/黑名单功能：排除已点赞或已收藏
export function toggleNotInterested(memeId) {
  // 🛡️ 拦截：如果已经点赞过或收藏过，禁止点“没意思”
  if (likedIds.value.includes(memeId) || favoriteIds.value.includes(memeId)) return

  const index = blacklistIds.value.indexOf(memeId)
  if (index === -1) {
    blacklistIds.value.push(memeId) 
  } else {
    blacklistIds.value.splice(index, 1) 
  }
}