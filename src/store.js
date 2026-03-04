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
  const index = favoriteIds.value.indexOf(memeId)
  if (index === -1) {
    favoriteIds.value.push(memeId)
  } else {
    favoriteIds.value.splice(index, 1)
  }
}

// 💡 点赞功能：排除黑名单
export async function toggleLike(memeId) {
  const index = likedIds.value.indexOf(memeId)
  if (index === -1) {
    // 🛡️ 互斥：点赞时，如果已经在黑名单，则自动移除黑名单
    const bIndex = blacklistIds.value.indexOf(memeId)
    if (bIndex !== -1) blacklistIds.value.splice(bIndex, 1)
    
    likedIds.value.push(memeId)
  } else {
    likedIds.value.splice(index, 1)
  }

  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {}
}

// 💡 没意思/黑名单功能：排除已点赞或已收藏
export function toggleNotInterested(memeId) {
  const index = blacklistIds.value.indexOf(memeId)
  if (index === -1) {
    // 🛡️ 互斥：点不喜欢时，如果已经点赞，则自动移除点赞
    const lIndex = likedIds.value.indexOf(memeId)
    if (lIndex !== -1) likedIds.value.splice(lIndex, 1)
    
    // 🗑️ 注意：这里删除了 favoriteIds 的判断，允许与收藏共存
    blacklistIds.value.push(memeId) 
  } else {
    blacklistIds.value.splice(index, 1) 
  }
}