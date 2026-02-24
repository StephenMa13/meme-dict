<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMemes, addMeme as localAdd, deleteMeme as localDelete } from '../db.js' // ⭐️ 引入本地引擎

const router = useRouter()
const hotMemes = ref([])
const searchQuery = ref('')
const showModal = ref(false)

const newForm = ref({ term: '', pinyin: '', summary: '',category: '默认' })

// ⭐️ 改用本地方法加载数据
const loadData = () => {
  hotMemes.value = getMemes()
}

onMounted(() => loadData())

const filteredMemes = computed(() => {
  if (searchQuery.value === '') return hotMemes.value
  const keyword = searchQuery.value.toLowerCase()
  return hotMemes.value.filter(meme => meme.term.includes(keyword) || meme.pinyin.includes(keyword))
})

// ⭐️ 改用本地方法提交
const submitMeme = () => {
  if (!newForm.value.term || !newForm.value.summary) return alert('不能为空哦！')
  localAdd({ ...newForm.value }) // 保存到本地硬盘
  showModal.value = false
  newForm.value = { term: '', pinyin: '', summary: '' }
  loadData() // 刷新列表
}

// ⭐️ 改用本地方法删除
const deleteMeme = (id) => {
  if (!confirm('确定要删除吗？')) return
  localDelete(id)
  loadData()
}

const goToDetail = (id) => {
  router.push(`/meme/${id}`)
}
</script>

<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="logo">🔥 梗百科</div>
      <button class="add-btn" @click="showModal = true">➕ 贡献</button>
    </nav>

    <header class="hero">
      <h1 class="hero-title">全网热梗，一搜便知</h1>
      <div class="search-box">
        <input v-model="searchQuery" type="text" placeholder="试试搜汉字或拼音，比如：xyb" class="search-input" />
      </div>
    </header>

    <main class="hot-list">
      <h2 class="section-title">{{ searchQuery ? `🔍 搜索结果` : '🔥 今日热搜' }}</h2>
      
      <div class="card-grid">
        <div class="card" v-for="(meme, index) in filteredMemes" :key="meme.id" @click="goToDetail(meme.id)">
          <div class="card-left">
            <span class="rank" :class="'rank-' + (index + 1)" v-if="!searchQuery">{{ index + 1 }}</span>
            <div class="meme-info">
              <h3 class="meme-term">{{ meme.term }}</h3>
            </div>
          </div>
          
          <div class="card-right">
            <button class="action-btn like-btn" @click.stop="likeMeme(meme.id)">👍 {{ meme.view_count }}</button>
            <button class="action-btn delete-btn" @click.stop="deleteMeme(meme.id)">🗑️</button>
          </div>
        </div>
      </div>
    </main>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <h3>贡献新梗</h3>
        <input v-model="newForm.term" placeholder="名字" class="modal-input" />
        <input v-model="newForm.pinyin" placeholder="拼音缩写" class="modal-input" />
        <textarea v-model="newForm.summary" placeholder="解释一下..." class="modal-textarea"></textarea>
        <select v-model="newForm.category" class="modal-input">
          <option value="默认">选择分类...</option>
          <option value="萌系">萌系</option>
          <option value="科技">科技</option>
          <option value="二次元">二次元</option>
          <option value="方言">方言</option>
        </select>
        <div class="modal-actions">
          <button class="cancel-btn" @click="showModal = false">取消</button>
          <button class="submit-btn" @click="submitMeme">提交</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 原有的样式直接保留 */
.app-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #333; }
.navbar { max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; }
.logo { font-size: 20px; font-weight: 900; }
.add-btn { background-color: #FFD700; border: none; padding: 8px 16px; border-radius: 20px; font-weight: bold; cursor: pointer; }
.hero { padding: 40px 20px; background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%); text-align: center; }
.hero-title { font-size: 28px; font-weight: 800; margin-bottom: 24px; color: #000; }
.search-box { display: flex; background: #fff; border-radius: 30px; padding: 5px; box-shadow: 0 8px 20px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
.search-input { flex: 1; border: none; padding: 12px 20px; font-size: 16px; border-radius: 30px; outline: none; }
.hot-list { max-width: 1200px; margin: 0 auto; padding: 30px 20px; }
.section-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
.card-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
.card { background: #fff; border-radius: 12px; padding: 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 8px rgba(0,0,0,0.04); cursor: pointer; transition: 0.2s; }
.card:hover { transform: translateY(-3px); box-shadow: 0 8px 16px rgba(0,0,0,0.1); }
.card-left { display: flex; align-items: center; flex: 1; overflow: hidden; }
.meme-info { flex: 1; }
.meme-term { font-size: 18px; font-weight: bold; margin: 0 0 6px 0; }
.meme-summary { font-size: 14px; color: #666; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.rank { font-size: 18px; font-weight: 900; color: #ccc; width: 28px; margin-right: 12px; }
.rank-1 { color: #FF4500; font-size: 24px; }
.rank-2 { color: #FF8C00; font-size: 22px; }
.rank-3 { color: #FFA500; font-size: 20px; }
.card-right { display: flex; align-items: center; gap: 8px; margin-left: 15px; }
.action-btn { border: none; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; cursor: pointer; }
.like-btn { background-color: #fff0e0; color: #ff8c00; }
.delete-btn { background-color: #ffebee; color: #dc3545; padding: 6px 10px; }
@media (min-width: 768px) { .hero { padding: 60px 20px; } .hero-title { font-size: 36px; } .card-grid { grid-template-columns: repeat(2, 1fr); gap: 24px; } }
@media (min-width: 1024px) { .card-grid { grid-template-columns: repeat(3, 1fr); } }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.modal-content { background: #fff; padding: 24px; border-radius: 12px; width: 90%; max-width: 400px; }
.modal-input, .modal-textarea { width: 100%; box-sizing: border-box; border: 1px solid #ddd; border-radius: 8px; padding: 10px; margin-bottom: 12px; }
.modal-textarea { resize: vertical; min-height: 80px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; }
.cancel-btn { background: #f1f2f5; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; color: #666; font-weight: bold; }
.submit-btn { background: #000; color: #FFD700; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-weight: bold; }
</style>