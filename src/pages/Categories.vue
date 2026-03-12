<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getMemes } from '../db.js'
import { useRouter } from 'vue-router'
import { categoryConfig } from '../categories.js'

const router = useRouter()
const bubbleCategories = ref([])
const STORAGE_KEY = 'meme_bubble_layout_v1'

// ========== 拖拽状态 ==========
const draggingIndex = ref(null)
const dragStyle = ref({})        
const isDragging = ref(false)

let longPressTimer = null
let touchStartX = 0
let touchStartY = 0
let currentTouchX = 0
let currentTouchY = 0
let dragOffsetX = 0
let dragOffsetY = 0
let dragElement = null

// ========== 下拉刷新逻辑 ==========
const isRefreshing = ref(false)
const pullDistance = ref(0)
let pullStartY = 0
let isPulling = false

// ========== 初始化数据 ==========
const initBubbles = () => {
  const cached = localStorage.getItem(STORAGE_KEY)
  if (cached) {
    bubbleCategories.value = JSON.parse(cached)
    return
  }

  const memes = getMemes() || []
  const categoryMap = {}

  memes.forEach(meme => {
    let cats = meme.category || '其他'
    if (!Array.isArray(cats)) cats = [cats]
    cats.forEach(cat => {
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, count: 0, allItems: [] }
      }
      categoryMap[cat].count += 1
      categoryMap[cat].allItems.push({ term: meme.term, id: meme.id })
    })
  })

  const counts = Object.values(categoryMap).map(c => c.count)
  const maxCount = Math.max(...counts) || 1
  const minCount = Math.min(...counts) || 0
  const minSize = 85
  const maxSize = 170

  const newList = Object.values(categoryMap).map((item, index) => {
    let size = (minSize + maxSize) / 2
    if (maxCount !== minCount) {
      const ratio = (item.count - minCount) / (maxCount - minCount)
      size = minSize + Math.pow(ratio, 1.2) * (maxSize - minSize)
    }

    let maxTerms = size < 100 ? 2 : (size < 130 ? 3 : 4)
    const shuffledItems = [...item.allItems].sort(() => 0.5 - Math.random())
    const config = categoryConfig[item.name] || { icon: '✨', color: '#ffffff' }

    return {
      name: item.name,
      size,
      icon: config.icon,
      color: config.color,
      previewItems: shuffledItems.slice(0, Math.max(2, maxTerms)),
      delay: -(Math.random() * 5),
      duration: 5 + Math.random() * 5,
      ox: index % 2 === 0 ? 8 : -8,
      oy: index % 3 === 0 ? 10 : -10
    }
  }).sort(() => 0.5 - Math.random())

  bubbleCategories.value = newList
  saveLayout()
}

const saveLayout = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bubbleCategories.value))
}

// ========== Touch 拖拽与下拉刷新核心 ==========

const onTouchStart = (e, index) => {
  const touch = e.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY
  currentTouchX = touch.clientX
  currentTouchY = touch.clientY

  const targetElement = e.currentTarget
  const rect = targetElement.getBoundingClientRect()
  longPressTimer = setTimeout(() => {
    dragStyle.value = {
      left: `${currentTouchX - rect.width / 2}px`,
      top: `${currentTouchY - rect.height / 2}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    } 
    isDragging.value = true
    draggingIndex.value = index
    
    if (navigator.vibrate) navigator.vibrate(30)
  }, 300)
}

const onTouchMove = (e, index) => {
  const touch = e.touches[0]
  currentTouchX = touch.clientX
  currentTouchY = touch.clientY
  const dx = touch.clientX - touchStartX
  const dy = touch.clientY - touchStartY

  if (!isDragging.value) {
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      clearTimeout(longPressTimer)
    }

    // 下拉刷新检测
    if (dy > 0 && window.scrollY <= 0 && !isDragging.value) {
      isPulling = true
      // 阻尼系数 0.4，最大下拉高度 100
      pullDistance.value = Math.min(dy * 0.4, 100) 
      if (e.cancelable) e.preventDefault()
    }
    return
  }

  // 正在拖拽
  if (e.cancelable) e.preventDefault()
  const cat = bubbleCategories.value[draggingIndex.value]
  const size = cat ? cat.size : 100

  dragStyle.value = {
    ...dragStyle.value,
    left: `${touch.clientX - size / 2}px`,
    top: `${touch.clientY - size / 2}px`,
  }

  const targetIndex = getIndexAtPoint(touch.clientX, touch.clientY)
  if (targetIndex !== null && targetIndex !== draggingIndex.value) {
    const list = [...bubbleCategories.value]
    const item = list.splice(draggingIndex.value, 1)[0]
    list.splice(targetIndex, 0, item)
    draggingIndex.value = targetIndex
    bubbleCategories.value = list
  }
}

const onTouchEnd = (e, index) => {
  clearTimeout(longPressTimer)

  if (isPulling) {
    // 阈值设为 60，更明显
    if (pullDistance.value >= 60) {
      isRefreshing.value = true
      setTimeout(() => {
        refreshBubbleContents
        isRefreshing.value = false
        pullDistance.value = 0
      }, 800)
    } else {
      pullDistance.value = 0
    }
    isPulling = false
    return
  }

  if (isDragging.value) {
    isDragging.value = false
    draggingIndex.value = null
    dragStyle.value = {}
    saveLayout()
    return
  }
}

const getIndexAtPoint = (x, y) => {
  const items = document.querySelectorAll('.bubble-item:not(.drag-clone)')
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const r = rect.width / 2
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    if (dist < r) return i
  }
  return null
}

const isMobile = ref(false)
onMounted(() => {
  isMobile.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  initBubbles()
})

// PC 拖拽逻辑保持
const onDragStart = (e, index) => {
  if (isMobile.value) return
  draggingIndex.value = index
  e.dataTransfer.effectAllowed = 'move'
  const ghost = e.target.cloneNode(true)
  ghost.style.opacity = '0'
  document.body.appendChild(ghost)
  e.dataTransfer.setDragImage(ghost, 0, 0)
  setTimeout(() => document.body.removeChild(ghost), 0)
}

const onDragEnter = (index) => {
  if (isMobile.value || draggingIndex.value === null || draggingIndex.value === index) return
  const list = [...bubbleCategories.value]
  const item = list.splice(draggingIndex.value, 1)[0]
  list.splice(index, 0, item)
  draggingIndex.value = index
  bubbleCategories.value = list
}

const onDragEnd = () => {
  if (isMobile.value) return
  draggingIndex.value = null
  saveLayout()
}

const goToCategory = (name) => {
  if (isDragging.value) return
  router.push(`/category/${name}`)
}

const goToMeme = (id) => {
  if (isDragging.value) return
  router.push(`/meme/${id}`)
}

// 🌟 新增：只刷新气泡内的词条，不改变气泡位置和大小
const refreshBubbleContents = () => {
  // 1. 获取最新梗库数据
  const memes = getMemes() || []
  const categoryMap = {}

  // 2. 重新按分类整理词条
  memes.forEach(meme => {
    let cats = meme.category || '其他'
    if (!Array.isArray(cats)) cats = [cats]
    cats.forEach(cat => {
      if (!categoryMap[cat]) categoryMap[cat] = []
      categoryMap[cat].push({ term: meme.term, id: meme.id })
    })
  })

  // 3. 遍历当前屏幕上的气泡，只替换内部的 previewItems
  bubbleCategories.value = bubbleCategories.value.map(cat => {
    const allItems = categoryMap[cat.name] || []
    
    // 随机打乱该分类下的词条
    const shuffledItems = [...allItems].sort(() => 0.5 - Math.random())
    
    // 保持原来的词条数量显示逻辑 (根据气泡当前大小)
    let maxTerms = cat.size < 100 ? 2 : (cat.size < 130 ? 3 : 4)

    return {
      ...cat,
      // 截取全新的一批随机词条
      previewItems: shuffledItems.slice(0, Math.max(2, maxTerms))
    }
  })

  // 4. 将更新了词条的新状态保存到本地
  saveLayout()
}
</script>

<template>
  <div class="categories-page">

    <!-- 🌟 修改后的下拉刷新指示器 -->
    <div class="refresh-bar" :style="{ height: pullDistance + 'px' }">
      <div class="refresh-content" :style="{ opacity: Math.min(pullDistance / 70, 1) }">
        <div class="bubbles-loader" v-if="isRefreshing">
          <div class="bubble-pop">🫧</div>
          <div class="loading-text">正在捕捉新梗...</div>
        </div>
        <div v-else class="pull-indicator">
          <span class="refresh-icon" :style="{ transform: `rotate(${pullDistance * 3}deg)` }">🌀</span>
          <span class="refresh-text">{{ pullDistance > 60 ? '释放立即刷新' : '下拉发现更多' }}</span>
        </div>
      </div>
    </div>

    <!-- 气泡列表容器 -->
    <transition-group name="bubble-list" tag="div" class="bubbles-wrapper">
      <div
        v-for="(cat, index) in bubbleCategories"
        :key="cat.name"
        class="bubble-item"
        :class="{
          'is-ghost': draggingIndex === index && isDragging,
          'is-pc-ghost': draggingIndex === index && !isDragging
        }"
        :draggable="!isMobile"
        @dragstart="onDragStart($event, index)"
        @dragenter.prevent="onDragEnter(index)"
        @dragover.prevent
        @dragend="onDragEnd"
        @touchstart="onTouchStart($event, index)"
        @touchmove="onTouchMove($event, index)"
        @touchend="onTouchEnd($event, index)"
        @click="goToCategory(cat.name)"
        :style="{
          width: `${cat.size}px`,
          height: `${cat.size}px`,
          fontSize: `${Math.max(12, cat.size / 11)}px`,
          '--ox': `${cat.ox}px`,
          '--oy': `${cat.oy}px`,
          animationDelay: `${cat.delay}s`,
          animationDuration: `${cat.duration}s`
        }"
      >
        <div class="bubble-inner">
          <span class="cat-icon">{{ cat.icon }}</span>
          <strong class="cat-name">{{ cat.name }}</strong>
          <div class="preview-cloud">
            <span
              v-for="item in cat.previewItems"
              :key="item.id"
              class="preview-tag"
              @click.stop="goToMeme(item.id)"
            >
              {{ item.term }}
            </span>
          </div>
        </div>
      </div>
    </transition-group>

    <!-- 拖拽克隆体 (仅移动端) -->
    <div
      v-if="isDragging && draggingIndex !== null"
      class="drag-clone"
      :style="{
        ...dragStyle,
        fontSize: `${Math.max(12, bubbleCategories[draggingIndex]?.size / 11)}px`
      }"
    >
      <div class="bubble-inner">
        <span class="cat-icon">{{ bubbleCategories[draggingIndex]?.icon }}</span>
        <strong class="cat-name">{{ bubbleCategories[draggingIndex]?.name }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories-page {
  padding: 20px 10px 40px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
  position: relative;
  /* 禁止系统默认刷新动画以便我们自定义 */
  overscroll-behavior-y: contain; 
}

/* 🌟 下拉刷新样式：更明显、更靠下 */
.refresh-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  display: flex;
  align-items: flex-end; /* 关键：内容在底部 */
  justify-content: center;
  background: transparent;
  z-index: 1000;
  overflow: hidden;
  transition: height 0.2s cubic-bezier(0.2, 0, 0.2, 1);
}

.refresh-content {
  padding-bottom: 15px; /* 增加距离顶部的距离感 */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.refresh-icon { font-size: 26px; display: inline-block; }
.refresh-text { font-size: 12px; font-weight: 700; color: var(--text-secondary); }

.bubbles-loader { display: flex; flex-direction: column; align-items: center; }
.bubble-pop { font-size: 30px; animation: bubbleBounce 0.8s infinite ease-in-out; }
.loading-text { font-size: 11px; font-weight: bold; color: var(--text-main); }

@keyframes bubbleBounce {
  0%, 100% { transform: scale(1) translateY(0); opacity: 0.8; }
  50% { transform: scale(1.3) translateY(-8px); opacity: 1; }
}

/* 气泡列表样式保持 */
.bubbles-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 20px;
  max-width: 1100px;
  padding: 40px 20px;
}

@keyframes smoothFloat {
  0%, 100% { transform: translate(var(--ox), var(--oy)); }
  50% { transform: translate(calc(var(--ox) * -1), calc(var(--oy) * -1.2)); }
}

.bubble-item {
  border-radius: 50%;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  flex-shrink: 0;
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: smoothFloat infinite ease-in-out;
  overflow: hidden;
  text-align: center;
  padding: 12px;
  user-select: none;
  -webkit-touch-callout: none;
}

.is-ghost {
  opacity: 0.25;
  background: var(--bg-color) !important;
  border: 2px dashed var(--border-color);
  transform: scale(0.85) !important;
  animation: none !important;
}

.is-pc-ghost {
  opacity: 0.3;
  border: 1px dashed var(--border-color);
  animation: none;
}

.drag-clone {
  position: fixed;
  z-index: 9999;
  border-radius: 50%;
  background: var(--card-bg);
  border: 2px solid #FFD700;
  box-shadow: 0 20px 60px rgba(0,0,0,0.25);
  display: flex; 
  align-items: center; 
  justify-content: center;
  pointer-events: none;
  transform: scale(1.1);
  text-align: center;
  padding: 12px;
  transition: none;
  margin: 0 !important;
}

.bubble-list-move { transition: transform 0.5s cubic-bezier(0.2, 0, 0, 1); }

.bubble-inner { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.cat-name { font-size: 1.1em; color: var(--text-main); font-weight: 800; }
.preview-cloud { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }

.preview-tag {
  font-size: 0.65em; padding: 2px 8px; border-radius: 10px;
  background-color: var(--bg-color); border: 1px solid var(--border-color);
  color: var(--text-secondary); transition: all 0.2s;
  max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

@media (max-width: 768px) {
  .bubbles-wrapper { gap: 12px; }
  .bubble-item { animation-duration: 10s !important; }
}
</style>