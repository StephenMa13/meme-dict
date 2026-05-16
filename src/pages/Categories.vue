<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getMemes } from '../db.js'
import { useRouter } from 'vue-router'
import { categoryConfig } from '../categories.js'

const router = useRouter()
const bubbleCategories = ref([])
const STORAGE_KEY = 'meme_bubble_layout_v1'

// 重置布局的函数
const resetLayout = () => {
  localStorage.removeItem(STORAGE_KEY)
  initBubbles()
  saveLayout()
  alert('气泡已恢复')
}

// 长按重置相关变量
let resetLongPressTimer = null
let isTouchingEmptyArea = false

const isTouchOnBubble = (e) => {
  const target = e.target.closest('.bubble-item')
  return target !== null
}

const handleTouchStart = (e) => {
  onPageTouchStart(e)
  if (isTouchOnBubble(e)) {
    if (resetLongPressTimer) clearTimeout(resetLongPressTimer)
    return
  }
  resetLongPressTimer = setTimeout(() => {
    resetLayout()
    resetLongPressTimer = null
  }, 5000)
}

const handleTouchEnd = (e) => {
  onPageTouchEnd(e)
  if (resetLongPressTimer) {
    clearTimeout(resetLongPressTimer)
    resetLongPressTimer = null
  }
}

// ========== 拖拽状态 ==========
const draggingIndex = ref(null)
const dragStyle = ref({})        
const isDragging = ref(false)
const isExplodeReady = ref(false)

// ---------- 爆炸粒子特效 ----------
const particles = ref([])
let particleTimer = null
let longPressTimer = null
let explodeTimer = null
let touchStartX = 0
let touchStartY = 0
let currentTouchX = 0
let currentTouchY = 0

// ========== 下拉刷新逻辑 ==========
const isRefreshing = ref(false)
const pullDistance = ref(0)
let pullStartY = -1
let isPulling = false

const allowedCategories = new Set(Object.keys(categoryConfig))

// ========== 初始化数据 ==========
const initBubbles = () => {
  // 🌟 修复语法错误
  const savedVersion = localStorage.getItem(STORAGE_KEY + '_version') 
  const cached = localStorage.getItem(STORAGE_KEY)
  
  if (cached) {
    const parsed = JSON.parse(cached)
    const filtered = parsed.filter(cat => allowedCategories.has(cat.name))
    
    // 🌟 数据自愈机制：如果发现缓存里的气泡数量比配置里的少（意味着有丢失），直接废弃缓存重新生成！
    if(filtered.length >= allowedCategories.size && filtered.length > 0){
      bubbleCategories.value = filtered
      return
    }
  }

  const memes = getMemes() || []
  const categoryMap = {}

  memes.forEach(meme => {
    let cats = meme.category || '其他'
    if (!Array.isArray(cats)) cats = [cats]
    cats.forEach(cat => {
      if(!allowedCategories.has(cat)) return
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, count: 0, allItems: [] }
      }
      categoryMap[cat].count += 1
      categoryMap[cat].allItems.push({ term: meme.term, id: meme.id })
    })
  })

  Object.keys(categoryConfig).forEach(catName => {
     if (!categoryMap[catName]) {
      categoryMap[catName] = { name: catName, count: 0, allItems: [] }
    }
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

const onPageTouchStart = (e) => {
  if (window.scrollY <= 0) {
    pullStartY = e.touches[0].clientY
  } else {
    pullStartY = -1
  }
}

const onPageTouchMove = (e) => {
  if (isDragging.value || pullStartY === -1) return
  const touchY = e.touches[0].clientY
  const dy = touchY - pullStartY

  if (dy > 0 && window.scrollY <= 0) {
    isPulling = true
    pullDistance.value = Math.min(dy * 0.4, 100)
    if (e.cancelable) e.preventDefault()
  }else{
    isPulling = false
  }
}

const onPageTouchEnd = () => {
  if (isPulling) {
    if (pullDistance.value >= 60) {
      isRefreshing.value = true
      pullDistance.value = 60 
      setTimeout(() => {
        refreshBubbleContents() 
        isRefreshing.value = false
        pullDistance.value = 0
      }, 800)
    } else {
      pullDistance.value = 0
    }
    isPulling = false
  }
  pullStartY = -1
}

// ---------- 🌟 全新模拟真实气泡爆炸 ----------
const createExplosion = (x, y, bubbleColor) => {
  const newParticles = []
  const particleCount = 20 // 减少数量，增加体积，更像气泡
  const baseColor = (bubbleColor && bubbleColor !== '#ffffff') ? bubbleColor : '#FF6600'
  
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 6 // 飞溅速度
    newParticles.push({
      id: Date.now() + i + Math.random(),
      x: x,
      y: y,
      size: 10 + Math.random() * 15, // 气泡大小
      color: baseColor,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      opacity: 1,
      life: 1
    })
  }
  particles.value = newParticles

  let startTime = null
  const animate = (now) => {
    if (!startTime) startTime = now
    const elapsed = now - startTime
    const duration = 800 // 动画持续0.8秒
    let updated = [...particles.value]
    let allDead = true
    
    updated = updated.map(p => {
      let life = 1 - elapsed / duration
      if (life <= 0) return null
      allDead = false
      return {
        ...p,
        x: p.x + p.vx * 6,   
        y: p.y + p.vy * 6 - 2, // 轻微向上漂浮
        size: p.size * 1.05,   // 气泡破裂前稍微变大
        opacity: life * 1.2,
        life: life
      }
    }).filter(p => p !== null)
    
    particles.value = updated
    if (!allDead && elapsed < duration) {
      requestAnimationFrame(animate)
    } else {
      particles.value = []
    }
  }
  requestAnimationFrame(animate)
}

// 🌟 爆炸逻辑重写：沉底而不消失
const triggerExplosion = (x, y, draggedIndex, bubbleColor) => {
  clearTimeout(explodeTimer)
  clearTimeout(longPressTimer)
  
  // 1. 抓取出当前爆炸的那个气泡
  const list = [...bubbleCategories.value]
  const explodedItem = list.splice(draggedIndex, 1)[0]
  
  // 2. 状态重置，防止生成幽灵气泡
  isDragging.value = false
  isExplodeReady.value = false
  draggingIndex.value = null
  dragStyle.value = {}

  if (navigator.vibrate) navigator.vibrate([200, 50, 100])
  createExplosion(x, y, bubbleColor)

  // 3. 将剩下的气泡打乱
  list.sort(() => 0.5 - Math.random())
  
  // 4. 把刚刚爆炸的气泡放到最后面（沉底）
  list.push(explodedItem)

  // 5. 更新并保存
  bubbleCategories.value = list
  saveLayout()
}

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

  explodeTimer = setTimeout(() => {
    if (isDragging.value) {
      isExplodeReady.value = true
      if (navigator.vibrate) navigator.vibrate([50, 50, 50])
    }
  }, 3000)
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
      clearTimeout(explodeTimer)
    }
    return
  }

  if (e.cancelable) e.preventDefault()

  // 🌟 修复错误：这里应该是判断手指向上移动距离(dy < -100)，而不是使用下拉刷新的变量 pullDistance！
  if (isExplodeReady.value && dy < -100) {
    const cat = bubbleCategories.value[draggingIndex.value]
    const bubbleColor = cat ? cat.color : '#FFD700'
    triggerExplosion(touch.clientX, touch.clientY, draggingIndex.value, bubbleColor)
    return
  }

  const cat = bubbleCategories.value[draggingIndex.value]
  const size = cat ? cat.size : 100

  dragStyle.value = {
    ...dragStyle.value,
    left: `${touch.clientX - size / 2}px`,
    top: `${touch.clientY - size / 2}px`,
  }

  const targetIndex = getIndexAtPoint(touch.clientX, touch.clientY)
  if (targetIndex !== null && targetIndex !== draggingIndex.value && !isExplodeReady.value) {
    const list = [...bubbleCategories.value]
    const item = list.splice(draggingIndex.value, 1)[0]
    list.splice(targetIndex, 0, item)
    draggingIndex.value = targetIndex
    bubbleCategories.value = list
  }
}

const onTouchEnd = (e, index) => {
  clearTimeout(longPressTimer)
  clearTimeout(explodeTimer)
  isExplodeReady.value = false

  if (isDragging.value) {
    isDragging.value = false
    draggingIndex.value = null
    dragStyle.value = {}
    if (!isExplodeReady.value) saveLayout()
  }
  isExplodeReady.value = false
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

const refreshBubbleContents = () => {
  const memes = getMemes() || []
  const categoryMap = {}

  memes.forEach(meme => {
    let cats = meme.category || '其他'
    if (!Array.isArray(cats)) cats = [cats]
    cats.forEach(cat => {
      if (!allowedCategories.has(cat)) return
      if (!categoryMap[cat]) categoryMap[cat] = []
      categoryMap[cat].push({ term: meme.term, id: meme.id })
    })
  })

  bubbleCategories.value = bubbleCategories.value
  .filter(cat => allowedCategories.has(cat.name))
  .map(cat => {
    const allItems = categoryMap[cat.name] || []
    const shuffledItems = [...allItems].sort(() => 0.5 - Math.random())
    let maxTerms = cat.size < 100 ? 2 : (cat.size < 130 ? 3 : 4)

    return {
      ...cat,
      previewItems: shuffledItems.slice(0, Math.max(2, maxTerms))
    }
  })
  saveLayout()
}
</script>

<template>
  <div class="categories-page"
        @touchstart="handleTouchStart"
        @touchmove="onPageTouchMove"
        @touchend="handleTouchEnd">
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
              :style="{ backgroundColor: cat.color + '30', borderColor: cat.color + '60', color: cat.color, filter: 'brightness(0.7)', fontWeight: '800' }"
              @click.stop="goToMeme(item.id)"
            >
              {{ item.term }}
            </span>
          </div>
        </div>
      </div>
    </transition-group>

    <div
      v-if="isDragging && draggingIndex !== null"
      class="drag-clone"
      :class="{ 'is-exploding': isExplodeReady }"
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
    
    <div v-for="part in particles" :key="part.id" class="explosion-particle"
         :style="{
           left: part.x + 'px',
           top: part.y + 'px',
           width: part.size + 'px',
           height: part.size + 'px',
           color: part.color, /* 传入边框颜色 */
           opacity: Math.min(part.opacity, 1),
           transform: 'translate(-50%, -50%)'
         }">
    </div>
  </div>
</template>

<style scoped>
/* 🌟 核心修复：彻底禁用系统选词和长按菜单 */
* {
  -webkit-tap-highlight-color: transparent;
}
.categories-page, .bubble-item, .drag-clone, .bubble-item * {
  user-select: none !important;
  -webkit-user-select: none !important;
  -webkit-touch-callout: none !important;
}

.categories-page {
  padding: 20px 10px 40px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-x: hidden;
  overflow-y: auto;
  position: relative;
  overscroll-behavior-y: contain; 
  padding-top: calc(16px + env(safe-area-inset-top));
}
.refresh-bar {
  position: fixed;
  top: 0; left: 0; right: 0;
  display: flex;
  align-items: flex-end; 
  justify-content: center;
  background: transparent;
  z-index: 1000;
  overflow: hidden;
  transition: height 0.2s cubic-bezier(0.2, 0, 0.2, 1);
}
.refresh-content {
  padding-bottom: 15px; 
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}
.refresh-icon { font-size: 26px; display: inline-block; }
.refresh-text { font-size: 12px; font-weight: 700; color: var(--text-secondary); }
.bubbles-loader { display: flex; flex-direction: column; align-items: center; }
.bubble-pop { font-size: 30px; animation: bubbleBounce 0.8s infinite ease-in-out; }
.loading-text { font-size: 11px; font-weight: bold; color: var(--text-main); margin-top: 50px;}
@keyframes bubbleBounce {
  0%, 100% { transform: scale(1) translateY(0); opacity: 0.8; }
  50% { transform: scale(1.3) translateY(-8px); opacity: 1; }
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
.bubble-inner { display: flex; flex-direction: column; align-items: center; gap: 4px; pointer-events: none; }
.cat-name { font-size: 1.1em; color: var(--text-main); font-weight: 800; pointer-events: none; }
.preview-cloud { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; pointer-events: auto; }
.preview-tag {
  font-size: 0.65em; 
  padding: 3px 8px; 
  border-radius: 10px;
  transition: all 0.2s;
  max-width: 80px; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
  border: 0.5px solid rgba(0,0,0,0.1); 
  font-weight: 600; 
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
@media (max-width: 768px) {
  .bubbles-wrapper { gap: 12px; }
  .bubble-item { animation-duration: 10s !important; }
}
.is-exploding {
  border-color: #ff4757 !important;
  box-shadow: 0 0 40px rgba(255, 71, 87, 0.6) !important;
  animation: explodeShake 0.3s infinite ease-in-out !important;
  filter: hue-rotate(-20deg) saturate(1.5);
}
@keyframes explodeShake {
  0% { transform: scale(1.1) rotate(0deg); }
  25% { transform: scale(1.15) rotate(-5deg); }
  50% { transform: scale(1.1) rotate(0deg); }
  75% { transform: scale(1.15) rotate(5deg); }
  100% { transform: scale(1.1) rotate(0deg); }
}
/* 🌟 全新的气泡破碎质感 CSS */
.explosion-particle {
  position: fixed;
  border-radius: 50%;
  pointer-events: none;
  z-index: 20000;
  will-change: transform, opacity, width, height;
  /* 制作气泡质感：半透明白底 + 当前分类颜色的边框 + 顶部的高光 */
  border: 2px solid currentColor;
  background: rgba(255, 255, 255, 0.4);
  box-shadow: inset 2px 2px 4px rgba(255, 255, 255, 0.8);
}
</style>