<script setup>
import { ref, computed, onMounted } from 'vue'
import { getMemes } from '../db.js' 
import { useRouter } from 'vue-router'
import { categoryConfig } from '../categories.js'

const router = useRouter()
const allMemes = ref([])
const dragItemIndex = ref(null) // 记录拖拽的对象

onMounted(() => {
  allMemes.value = getMemes() || []
})

// 1. 核心数据计算
const bubbleCategories = ref([])

onMounted(() => {
  const memes = getMemes() || []
  const categoryMap = {}

  memes.forEach(meme => {
    let cats = meme.category || '其他'
    if (!Array.isArray(cats)) cats = [cats]
    cats.forEach(cat => {
      if (!categoryMap[cat]) {
        categoryMap[cat] = { name: cat, totalViews: 0, count: 0, allTerms: [] }
      }
      categoryMap[cat].count += 1
      categoryMap[cat].allTerms.push(meme.term) 
    })
  })

  const counts = Object.values(categoryMap).map(c => c.count)
  const maxCount = Math.max(...counts) || 1
  const minCount = Math.min(...counts) || 0

  // 🌟 尺寸增加 1/5 (原 60~134 -> 现 72~160)
  const minSize = 75 
  const maxSize = 165 

  bubbleCategories.value = Object.values(categoryMap).map((item, index) => {
    let size = (minSize + maxSize) / 2
    if (maxCount !== minCount) {
      const ratio = (item.count - minCount) / (maxCount - minCount)
      size = minSize + Math.pow(ratio, 1.2) * (maxSize - minSize)
    }

    let maxTerms = size < 90 ? 1 : (size < 125 ? 2 : 3)
    const shuffledTerms = [...item.allTerms].sort(() => 0.5 - Math.random())
    const config = categoryConfig[item.name] || { icon: '✨', color: '#ffffff' }

    return {
      ...item,
      size: size,
      icon: config.icon,
      color: config.color,
      previewTerms: shuffledTerms.slice(0, maxTerms),
      // 为每个气泡生成唯一的随机动画参数，解决瞬移并让浮动更圆滑
      delay: -(Math.random() * 5), 
      duration: 4 + Math.random() * 4,
      ox: index % 2 === 0 ? 10 : -10, // 初始 X 偏移
      oy: index % 3 === 0 ? 12 : -12 // 初始 Y 偏移
    }
  }).sort(() => 0.5 - Math.random())
})

// 2. 拖拽逻辑：让气泡“自然向另一边排列”
const onDragStart = (index) => {
  dragItemIndex.value = index
}

const onDragEnter = (index) => {
  if (dragItemIndex.value === null || dragItemIndex.value === index) return
  // 交换数组位置，transition-group 会自动处理平滑移动
  const list = [...bubbleCategories.value]
  const dragItem = list[dragItemIndex.value]
  list.splice(dragItemIndex.value, 1)
  list.splice(index, 0, dragItem)
  dragItemIndex.value = index
  bubbleCategories.value = list
}

const onDragEnd = () => {
  dragItemIndex.value = null
}

const goToCategory = (name) => {
  router.push(`/category/${name}`)
}
</script>

<template>
  <div class="categories-page">
    <!-- 使用 transition-group 实现拖拽时的自然滑动排列 -->
    <transition-group name="bubble-list" tag="div" class="bubbles-wrapper">
      <div 
        v-for="(cat, index) in bubbleCategories" 
        :key="cat.name" 
        class="bubble-item"
        :draggable="true"
        @dragstart="onDragStart(index)"
        @dragenter.prevent="onDragEnter(index)"
        @dragover.prevent
        @dragend="onDragEnd"
        @click="goToCategory(cat.name)" 
        :style="{
          width: `${cat.size}px`,
          height: `${cat.size}px`,
          fontSize: `${Math.max(12, cat.size / 10.5)}px`,
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
            <!-- 🌟 词条背景色逻辑：白色则透明，否则同步分类色 -->
            <span v-for="term in cat.previewTerms" 
                  :key="term" 
                  class="preview-tag">       
              {{ term }}
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
}

.bubbles-wrapper {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 25px; /* 间距增大，配合更大的气泡 */
  max-width: 1200px;
  padding: 40px 20px;
  perspective: 1000px;
}

/* 🌟 核心动画：将初始偏移融入浮动，消除瞬移 */
@keyframes smoothFloat {
  0% { transform: translate(var(--ox), var(--oy)); }
  50% { transform: translate(calc(var(--ox) * -1), calc(var(--oy) * -1.2)); }
  100% { transform: translate(var(--ox), var(--oy)); }
}

.bubble-item {
  border-radius: 50%;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  box-shadow: 0 12px 30px rgba(0,0,0,0.07), inset -4px -4px 12px rgba(0,0,0,0.02);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
  flex-shrink: 0; 
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  animation: smoothFloat infinite ease-in-out;
  overflow: hidden;
  text-align: center;
  padding: 10px;
  user-select: none;
  -webkit-user-drag: element;
  /* 1. 去掉点击时的灰色高亮框 (iOS & Android Chrome) */
  -webkit-tap-highlight-color: transparent; 

  /* 2. 禁止弹出系统默认菜单（如复制、查看图像），长按时就不出方框了 */
  -webkit-touch-callout: none; 

  /* 3. 禁止用户选中气泡内的文字 */
  user-select: none;
  -webkit-user-select: none;

  /* 4. 去掉可能的焦点轮廓线 */
  outline: none;
}

.bubble-item:active { cursor: grabbing; }

/* 🌟 当数组顺序改变时，未被拖动的元素会平滑滑动 */
.bubble-list-move {
  transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
}

.bubble-item:hover {
  z-index: 100;
  border-color: #FFD700;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  animation-play-state: paused; /* 悬停时停止浮动，方便点击 */
}

.bubble-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
}

.cat-icon { font-size: 1.3em; }
.cat-name { 
  font-size: 1.1em; 
  color: var(--text-main); 
  font-weight: 800; 
  white-space: nowrap;
}

.preview-cloud {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 3px;
}

.preview-tag {
  font-size: 0.65em;
  padding: 2px 6px;
  border-radius: 8px;
  white-space: nowrap;
  max-width: 85px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  background-color: #f8f9fa; 
  /* color: var(--text-secondary);  */
  border: 1px solid rgba(0,0,0,0.03); 
  transition: background-color 0.3s ease; 
}
/* 当首页选择了“粉色”时 */
:global(.bg-pink) .preview-tag {
  background-color: #FFE4E1 !important; /* 与你首页设置的粉色完全一致 */
  color: #d87093; /* 稍微深一点的粉色文字，保证清晰 */
  border: 1px solid rgba(0,0,0,0.03);
}

/* 当首页选择了“绿色”时 */
:global(.bg-green) .preview-tag {
  background-color: #C7EDCC !important; /* 与你首页设置的绿色完全一致 */
  color: #556b2f; /* 稍微深一点的绿色文字 */
  border: 1px solid rgba(0,0,0,0.03);
}

/* 🌟 夜间模式：设为灰色 */
:global(html.dark-mode) .preview-tag {
  background-color: #333333 !important; /* 深灰色 */
  color: #aaaaaa !important;
  border: none !important;
}

/* 适配移动端 */
@media (max-width: 768px) {
  .bubbles-wrapper { gap: 15px; padding: 20px 10px; }
  .bubble-item { animation-duration: 8s !important; } /* 手机上慢一点更优雅 */
}
</style>
