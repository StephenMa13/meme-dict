<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { getMemes } from '../db.js'
import { useRouter } from 'vue-router'
import { categoryConfig } from '../categories.js'

const router = useRouter()
const bubbleCategories = ref([])
const STORAGE_KEY = 'meme_bubble_layout_v4'

// ========== 工具函数 ==========
const getRandomPastelColor = () => `hsla(${Math.floor(Math.random() * 360)}, 75%, 85%, 1)`
const getLimitBySize = (size) => size < 130 ? 2 : (size < 170 ? 3 : 4)

// ========== 状态 ==========
const draggingIndex = ref(null)
const dragStyle = ref({ display: 'none' }) // 初始隐藏，防止闪烁
const isDragging = ref(false)
let isClickPrevented = false

let longPressTimer = null
let lastTouchX = 0
let lastTouchY = 0

// ========== 刷新逻辑 (保持范围不变) ==========
const refreshBubbles = () => {
  const memes = getMemes() || []
  bubbleCategories.value = bubbleCategories.value.map(cat => {
    const filtered = memes.filter(m => {
      let c = m.category || '其他'
      return Array.isArray(c) ? c.includes(cat.name) : c === cat.name
    })
    const limit = getLimitBySize(cat.size)
    return {
      ...cat,
      previewItems: filtered.sort(() => 0.5 - Math.random()).slice(0, Math.max(2, limit)).map(m => ({
        ...m, color: getRandomPastelColor()
      }))
    }
  })
  saveLayout()
}

// ========== 初始化 (适配尺寸) ==========
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
      if (!categoryMap[cat]) categoryMap[cat] = { name: cat, count: 0, allItems: [] }
      categoryMap[cat].count += 1
      categoryMap[cat].allItems.push(meme)
    })
  })

  const isSmall = window.innerWidth < 768
  const minS = isSmall ? 95 : 125
  const maxS = isSmall ? 155 : 215

  const counts = Object.values(categoryMap).map(c => c.count)
  const maxCount = Math.max(...counts) || 1
  const minCount = Math.min(...counts) || 0

  bubbleCategories.value = Object.values(categoryMap).map((item, index) => {
    const ratio = maxCount === minCount ? 0.5 : (item.count - minCount) / (maxCount - minCount)
    const size = minS + Math.pow(ratio, 1.2) * (maxS - minS)
    const config = categoryConfig[item.name] || { icon: '✨' }

    return {
      name: item.name,
      size,
      icon: config.icon,
      previewItems: item.allItems.sort(() => 0.5 - Math.random()).slice(0, Math.max(2, getLimitBySize(size))).map(m => ({
        ...m, color: getRandomPastelColor()
      })),
      ox: (index % 2 === 0 ? 5 : -5),
      oy: (index % 3 === 0 ? 7 : -7),
      delay: -(Math.random() * 5),
      duration: 5 + Math.random() * 5
    }
  }).sort(() => 0.5 - Math.random())
  saveLayout()
}

const saveLayout = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(bubbleCategories.value))

// ========== 精准跳转 ==========
const goToCategory = (name) => { if (!isClickPrevented) router.push(`/category/${name}`) }
const goToMeme = (id) => { if (!isClickPrevented) router.push(`/meme/${id}`) }

// ========== 手势逻辑 (彻底解决瞬移和消失) ==========
const onTouchStart = (e, index) => {
  const touch = e.touches[0]
  lastTouchX = touch.clientX
  lastTouchY = touch.clientY
  isClickPrevented = false
  isPulling = false

  // 1. 预先计算位置，即便还没开始拖拽
  const cat = bubbleCategories.value[index]
  const size = cat.size
  const initialStyle = {
    position: 'fixed',
    left: '0', top: '0',
    width: `${size}px`, height: `${size}px`,
    transform: `translate3d(${lastTouchX - size / 2}px, ${lastTouchY - size / 2}px, 0) scale(1.05)`,
    zIndex: 9999,
    display: 'none', // 先隐藏
    transition: 'none' // 强制禁用动画
  }
  dragStyle.value = initialStyle

  longPressTimer = setTimeout(() => {
    isDragging.value = true
    isClickPrevented = true
    draggingIndex.value = index
    // 2. 显示克隆体，此时坐标已对齐，不会闪烁
    dragStyle.value.display = 'flex'
    if (navigator.vibrate) navigator.vibrate(35)
  }, 300) // 缩短长按判定时间，响应更快
}

const onTouchMove = (e) => {
  const touch = e.touches[0]
  const dx = touch.clientX - lastTouchX
  const dy = touch.clientY - lastTouchY

  // 情况 A：正在拖拽气泡中
  if (isDragging.value) {
    if (e.cancelable) e.preventDefault() // 只有拖拽时才阻止滚动
    const size = bubbleCategories.value[draggingIndex.value].size
    dragStyle.value.transform = `translate3d(${touch.clientX - size / 2}px, ${touch.clientY - size / 2}px, 0) scale(1.05)`
    
    // 碰撞检测逻辑... (保持之前的不变)
    const targetIndex = getIndexAtPoint(touch.clientX, touch.clientY)
    if (targetIndex !== null && targetIndex !== draggingIndex.value) {
      const list = [...bubbleCategories.value]
      const [moved] = list.splice(draggingIndex.value, 1)
      list.splice(targetIndex, 0, moved)
      bubbleCategories.value = list
      draggingIndex.value = targetIndex
    }
    return 
  }

  // 情况 B：尚未触发拖拽，判断是滚动还是下拉刷新
  // 如果移动距离超过 10px，认为用户是在滚动页面，取消长按定时器
  if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
    clearTimeout(longPressTimer)
  }

  // 下拉刷新逻辑：仅在页面顶部 + 向下拉 + 没在拖拽时触发
  if (window.scrollY <= 0 && dy > 0 && !isDragging.value) {
    isPulling = true
    pullDistance.value = Math.min(dy * 0.5, 80) // 阻尼系数
    // 在下拉过程中，为了防止浏览器默认刷新冲突，可以阻止默认行为
    if (pullDistance.value > 10 && e.cancelable) e.preventDefault()
  }
}

const getIndexAtPoint = (x, y) => {
  const els = document.querySelectorAll('.bubble-item:not(.drag-clone)')
  for (let i = 0; i < els.length; i++) {
    const r = els[i].getBoundingClientRect()
    const dist = Math.sqrt((x - (r.left + r.width/2))**2 + (y - (r.top + r.height/2))**2)
    if (dist < r.width / 2.2) return i // 稍微缩小判定圈，更精准
  }
  return null
}

const onTouchEnd = () => {
  clearTimeout(longPressTimer)
  if (isDragging.value) {
    isDragging.value = false
    draggingIndex.value = null
    saveLayout()
    setTimeout(() => { isClickPrevented = false }, 100)
  }
}

onMounted(initBubbles)
</script>

<template>
  <div class="categories-page">
    <!-- 气泡容器 -->
    <transition-group name="bubble-list" tag="div" class="bubbles-wrapper">
      <div
        v-for="(cat, index) in bubbleCategories"
        :key="cat.name"
        class="bubble-item"
        :class="{ 'is-ghost': draggingIndex === index && isDragging }"
        @touchstart="onTouchStart($event, index)"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @click="goToCategory(cat.name)"
        :style="{
          width: `${cat.size}px`, height: `${cat.size}px`,
          '--ox': `${cat.ox}px`, '--oy': `${cat.oy}px`,
          animationDelay: `${cat.delay}s`, animationDuration: `${cat.duration}s`
        }"
      >
        <div class="bubble-floating-box">
          <div class="bubble-inner">
            <span class="cat-icon">{{ cat.icon }}</span>
            <strong class="cat-name">{{ cat.name }}</strong>
            <div class="preview-cloud">
              <span
                v-for="item in cat.previewItems"
                :key="item.id"
                class="preview-tag"
                @click.stop="goToMeme(item.id)"
                :style="{ '--tag-bg': item.color }"
              >
                {{ item.term }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </transition-group>

    <!-- 拖拽克隆体 -->
    <div v-if="isDragging" class="drag-clone" :style="dragStyle">
      <div class="bubble-inner">
        <span class="cat-icon">{{ bubbleCategories[draggingIndex]?.icon }}</span>
        <strong class="cat-name">{{ bubbleCategories[draggingIndex]?.name }}</strong>
      </div>
    </div>
  </div>
</template>

<style scoped>
.categories-page {
  min-height: 101vh;
  /* 💡 彻底禁用系统长按菜单和默认行为 */
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  overflow-x: hidden;
}

.bubbles-wrapper {
  display: flex; flex-wrap: wrap; justify-content: center;
  gap: 12px; padding: 20px 8px;
  /* 💡 优化滚动性能 */
  will-change: transform;
}

.bubble-item {
  position: relative;
  /* 💡 告诉浏览器不要处理默认手势，全部交给 JS */
  touch-action: pan-y;
}

.bubble-floating-box {
  width: 100%; height: 100%;
  animation: smoothFloat infinite ease-in-out;
  animation-delay: inherit; animation-duration: inherit;
}

@keyframes smoothFloat {
  0%, 100% { transform: translate(var(--ox), var(--oy)); }
  50% { transform: translate(calc(var(--ox) * -1), calc(var(--oy) * -1.2)); }
}

.bubble-inner {
  width: 100%; height: 100%; border-radius: 50%;
  background: var(--card-bg); border: 1px solid var(--border-color);
  box-shadow: 0 8px 24px rgba(0,0,0,0.06);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 12px; text-align: center;
  pointer-events: none; /* 让事件穿透到父级处理拖拽 */
}

/* 💡 词条标签允许点击，但不允许系统长按 */
.preview-tag {
  pointer-events: auto; /* 恢复点击 */
  font-size: 10px; padding: 2px 8px; border-radius: 10px;
  background-color: var(--tag-bg); color: #333;
  border: 1px solid rgba(0,0,0,0.05);
  max-width: 65px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

:global(html.dark-mode) .preview-tag {
  background-color: #3a3a3a !important; color: #eee !important;
}

.cat-name { font-weight: 900; color: var(--text-main); font-size: 1.1em; }

/* 拖拽状态样式 */
.is-ghost { opacity: 0.1; }

.drag-clone {
  pointer-events: none;
  will-change: transform;
  display: flex; align-items: center; justify-content: center;
}
.drag-clone .bubble-inner {
  border: 2px solid #FFD700;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  background: var(--card-bg);
  opacity: 1;
}

/* 列表排序动画 */
.bubble-list-move { transition: transform 0.4s cubic-bezier(0.2, 0, 0.2, 1); }

@keyframes bubblePop {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
</style>
