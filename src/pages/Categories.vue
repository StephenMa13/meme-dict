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
const dragStyle = ref({})        // 拖拽中的浮动样式
const isDragging = ref(false)

let longPressTimer = null
let touchStartX = 0
let touchStartY = 0
let dragOffsetX = 0
let dragOffsetY = 0
let dragElement = null

// ========== 下拉刷新 ==========
const isRefreshing = ref(false)
const pullDistance = ref(0)
let pullStartY = 0
let isPulling = false

const refreshBubbles = () => {
  localStorage.removeItem(STORAGE_KEY)
  initBubbles()
}

// ========== 初始化 ==========
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

// ========== 🌟 核心：Touch 拖拽（替代 HTML5 drag） ==========

const onTouchStart = (e, index) => {
  const touch = e.touches[0]
  touchStartX = touch.clientX
  touchStartY = touch.clientY

  // 长按 300ms 才进入拖拽模式，短按是点击
  longPressTimer = setTimeout(() => {
    isDragging.value = true
    draggingIndex.value = index

    // 记录手指相对于气泡中心的偏移
    const rect = e.currentTarget.getBoundingClientRect()
    dragOffsetX = touch.clientX - rect.left - rect.width / 2
    dragOffsetY = touch.clientY - rect.top - rect.height / 2
    dragElement = e.currentTarget

    // 震动反馈（如果设备支持）
    if (navigator.vibrate) navigator.vibrate(30)

    // 设置浮动位置
    dragStyle.value = {
      left: `${touch.clientX - rect.width / 2}px`,
      top: `${touch.clientY - rect.height / 2}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    }
  }, 300)
}

const onTouchMove = (e, index) => {
  const touch = e.touches[0]
  const dx = touch.clientX - touchStartX
  const dy = touch.clientY - touchStartY

  // 🌟 如果移动距离太小且还没进入拖拽，可能是下拉刷新
  if (!isDragging.value) {
    // 取消长按计时器（手指滑动了 = 不是长按）
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      clearTimeout(longPressTimer)
    }

    // 下拉刷新逻辑
    if (dy > 0 && window.scrollY === 0 && !isDragging.value) {
      isPulling = true
      pullDistance.value = Math.min(dy * 0.4, 70)
      e.preventDefault()
    }
    return
  }

  // ===== 正在拖拽 =====
  e.preventDefault() // 🌟 关键：阻止页面滚动

  const cat = bubbleCategories.value[draggingIndex.value]
  const size = cat ? cat.size : 100

  dragStyle.value = {
    ...dragStyle.value,
    left: `${touch.clientX - size / 2}px`,
    top: `${touch.clientY - size / 2}px`,
  }

  // 🌟 检测手指下面是哪个气泡 → 交换位置
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

  // 下拉刷新结束
  if (isPulling) {
    if (pullDistance.value >= 50) {
      isRefreshing.value = true
      setTimeout(() => {
        refreshBubbles()
        isRefreshing.value = false
        pullDistance.value = 0
      }, 600)
    } else {
      pullDistance.value = 0
    }
    isPulling = false
    return
  }

  // 拖拽结束
  if (isDragging.value) {
    isDragging.value = false
    draggingIndex.value = null
    dragStyle.value = {}
    saveLayout()
    return // 拖拽操作不触发点击
  }

  // 如果不是拖拽，就是点击 → 导航
  // (什么也不做，让 @click 处理)
}

// 🌟 根据坐标找到手指下方的气泡索引
const getIndexAtPoint = (x, y) => {
  const items = document.querySelectorAll('.bubble-item:not(.drag-clone)')
  for (let i = 0; i < items.length; i++) {
    const rect = items[i].getBoundingClientRect()
    // 用圆形碰撞检测而不是矩形
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const r = rect.width / 2
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2)
    if (dist < r) return i
  }
  return null
}

// ========== PC 端保留 drag 事件 ==========
const isMobile = ref(false)

onMounted(() => {
  isMobile.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  initBubbles()
})

// PC 拖拽
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
  if (isMobile.value) return
  if (draggingIndex.value === null || draggingIndex.value === index) return
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

// 导航
const goToCategory = (name) => {
  if (isDragging.value) return // 拖拽中不跳转
  router.push(`/category/${name}`)
}

const goToMeme = (id) => {
  if (isDragging.value) return
  router.push(`/meme/${id}`)
}
</script>

<template>
  <div class="categories-page">

    <!-- 下拉刷新指示器 -->
    <div class="refresh-bar" :style="{ height: pullDistance + 'px' }">
      <div class="bubbles-loader" v-if="isRefreshing">
        <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
      </div>
      <span v-else-if="pullDistance > 20" style="font-size: 20px;">🫧</span>
    </div>

    <!-- 气泡列表 -->
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
        @touchstart.passive="onTouchStart($event, index)"
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

    <!-- 🌟 拖拽时的浮动克隆体（手机端） -->
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
  padding: 40px 10px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
  touch-action: pan-y;
  padding-top: 20px;
  position: relative;
}

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
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  /* 🌟 关键：阻止手机端长按弹出菜单 */
  -webkit-touch-callout: none;
}

/* 手机端拖拽时原位置的占位 */
.is-ghost {
  opacity: 0.25;
  background: var(--bg-color) !important;
  border: 2px dashed var(--border-color);
  box-shadow: none;
  transform: scale(0.85) !important;
  animation: none !important;
}

/* PC 端拖拽占位 */
.is-pc-ghost {
  opacity: 0.3;
  background: var(--bg-color) !important;
  border: 1px dashed var(--border-color);
  box-shadow: none;
  transform: scale(0.9) !important;
  animation: none;
}

/* 🌟 手机端浮动的拖拽克隆体 */
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
  pointer-events: none; /* 🌟 不接收任何事件 */
  transform: scale(1.08);
  transition: left 0.05s, top 0.05s; /* 微微平滑跟手 */
  text-align: center;
  padding: 12px;
}

.bubble-list-move {
  transition: transform 0.5s cubic-bezier(0.2, 0, 0, 1);
}

.bubble-item:hover:not(.is-ghost):not(.is-pc-ghost) {
  z-index: 10;
  border-color: #FFD700;
  box-shadow: 0 15px 35px rgba(0,0,0,0.12);
  animation-play-state: paused;
  transform: scale(1.05) !important;
}

.bubble-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.cat-name {
  font-size: 1.1em;
  color: var(--text-main);
  font-weight: 800;
  margin-bottom: 2px;
}

.preview-cloud {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
}

.preview-tag {
  font-size: 0.65em;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
  background-color: var(--bg-color);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  transition: all 0.2s;
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-tag:hover {
  background-color: #FFD700 !important;
  color: #333 !important;
  transform: translateY(-2px);
}

:global(.bg-pink) .preview-tag { background-color: #FFE4E1 !important; color: #d87093; }
:global(.bg-green) .preview-tag { background-color: #C7EDCC !important; color: #556b2f; }
:global(html.dark-mode) .preview-tag { background-color: #333 !important; color: #aaa; border: none; }

@media (max-width: 768px) {
  .bubbles-wrapper { gap: 12px; }
  .bubble-item { animation-duration: 10s !important; }
}

.refresh-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  z-index: 1000;
  overflow: hidden;
  transition: height 0.2s;
}

.bubbles-loader { font-size: 24px; color: var(--text-main); }
.dot { animation: dot-blink 1s infinite; }
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-blink {
  0%, 100% { opacity: 0; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(-5px); }
}
</style>
