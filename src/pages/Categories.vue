<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { getMemes } from '../db.js' 
import { useRouter } from 'vue-router'
import { categoryConfig } from '../categories.js'

const router = useRouter()
const bubbleCategories = ref([])
const draggingIndex = ref(null) // 正在拖拽的索引

const STORAGE_KEY = 'meme_bubble_layout_v1'

const isRefreshing = ref(false)
const pullDistance = ref(0)
let startY = 0

// 🌟 核心：手动触发刷新的方法
const refreshBubbles = () => {
  localStorage.removeItem(STORAGE_KEY) // 清除位置记忆
  initBubbles() // 重新调用初始化的随机逻辑
}

const handleTouchStart = (e) => {
  if (window.scrollY === 0) startY = e.touches[0].pageY
}

const handleTouchMove = (e) => {
  const currentY = e.touches[0].pageY
  if (currentY > startY && window.scrollY === 0) {
    pullDistance.value = Math.min((currentY - startY) * 0.4, 70)
  }
}

const handleTouchEnd = async () => {
  if (pullDistance.value >= 50) {
    isRefreshing.value = true
    pullDistance.value = 40
    
    // 刷新逻辑
    await new Promise(resolve => setTimeout(resolve, 600))
    refreshBubbles()
    
    isRefreshing.value = false
  }
  pullDistance.value = 0
}

// 1. 初始化数据：优先从本地读取，没有则生成
const initBubbles = () => {
  const cached = localStorage.getItem(STORAGE_KEY)
  if (cached) {
    bubbleCategories.value = JSON.parse(cached)
    return
  }

  const memes = getMemes() || []
  const categoryMap = {}

  // 整理分类数据，同时存储词条的 {term, id}
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
  const minSize = 85; const maxSize = 170 

  const newList = Object.values(categoryMap).map((item, index) => {
    let size = (minSize + maxSize) / 2
    if (maxCount !== minCount) {
      const ratio = (item.count - minCount) / (maxCount - minCount)
      size = minSize + Math.pow(ratio, 1.2) * (maxSize - minSize)
    }

    // 🌟 核心要求：至少显示 2 个词条
    let maxTerms = size < 100 ? 2 : (size < 130 ? 3 : 4)
    const shuffledItems = [...item.allItems].sort(() => 0.5 - Math.random())
    const config = categoryConfig[item.name] || { icon: '✨', color: '#ffffff' }

    return {
      name: item.name,
      size,
      icon: config.icon,
      color: config.color,
      // 存储对象以便跳转
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

// 2. 拖拽逻辑增强
const onDragStart = (e, index) => {
  draggingIndex.value = index
  e.dataTransfer.effectAllowed = 'move'
  
  // 🌟 解决“方形背景”：自定义拖拽预览图为空，或者稍微延迟修改样式
  const ghost = e.target.cloneNode(true)
  ghost.style.opacity = "0" // 让原生的拖拽跟随图变透明
  document.body.appendChild(ghost)
  e.dataTransfer.setDragImage(ghost, 0, 0)
  setTimeout(() => document.body.removeChild(ghost), 0)
}

const onDragEnter = (index) => {
  if (draggingIndex.value === null || draggingIndex.value === index) return
  
  // 交换位置
  const list = [...bubbleCategories.value]
  const targetItem = list.splice(draggingIndex.value, 1)[0]
  list.splice(index, 0, targetItem)
  
  draggingIndex.value = index
  bubbleCategories.value = list
}

const onDragEnd = () => {
  draggingIndex.value = null
  saveLayout() // 松手后持久化位置
}

// 3. 导航逻辑
const goToCategory = (name) => {
  router.push(`/category/${name}`)
}

const goToMeme = (id) => {
  router.push(`/meme/${id}`)
}

onMounted(initBubbles)
</script>

<template>
  <div class="categories-page"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"  
    @touchend="handleTouchEnd"  >
    
    <div class="refresh-bar" :style="{ height: pullDistance + 'px' }">
      <div class="bubbles-loader" v-if="isRefreshing">
         <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
      </div>
      <span v-else-if="pullDistance > 20" style="font-size: 20px;">🫧</span>
    </div>
    <transition-group name="bubble-list" tag="div" class="bubbles-wrapper">
      <div 
        v-for="(cat, index) in bubbleCategories" 
        :key="cat.name" 
        class="bubble-item"
        :class="{ 'is-ghost': draggingIndex === index }"
        :draggable="true"
        @dragstart="onDragStart($event, index)"
        @dragenter.prevent="onDragEnter(index)"
        @dragover.prevent
        @dragend="onDragEnd"
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
            <!-- 🌟 点击词条停止冒泡，直接去词条页 -->
            <span v-for="item in cat.previewItems" 
                  :key="item.id" 
                  class="preview-tag"
                  @click.stop="goToMeme(item.id)">       
              {{ item.term }}
            </span>
          </div>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.categories-page {
  padding: 40px 10px;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  overflow-x: hidden;
  touch-action: pan-y;
  padding-top: 20px;
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

/* 🌟 核心动画 */
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
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); /* 增加弹性动画 */
  animation: smoothFloat infinite ease-in-out;
  overflow: hidden;
  text-align: center;
  padding: 12px;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* 🌟 解决方形背景：让正在拖动的原件变成“浅色阴影”占位符 */
.is-ghost {
  opacity: 0.3;
  background: var(--bg-color) !important;
  border: 1px dashed var(--border-color);
  box-shadow: none;
  transform: scale(0.9) !important;
  animation: none; /* 占位符不飘动 */
}

/* 🌟 拖拽时的平滑滑动顺序动画 */
.bubble-list-move {
  transition: transform 0.5s cubic-bezier(0.2, 0, 0, 1);
}

.bubble-item:hover:not(.is-ghost) {
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

/* 词条标签样式 */
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

/* 主题颜色适配（同步首页逻辑） */
:global(.bg-pink) .preview-tag { background-color: #FFE4E1 !important; color: #d87093; }
:global(.bg-green) .preview-tag { background-color: #C7EDCC !important; color: #556b2f; }
:global(html.dark-mode) .preview-tag { background-color: #333 !important; color: #aaa; border: none; }

@media (max-width: 768px) {
  .bubbles-wrapper { gap: 12px; }
  .bubble-item { animation-duration: 10s !important; }
}

.refresh-bar {
  position: fixed; /* 固定在顶部 */
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
