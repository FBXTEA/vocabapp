const WORDS_KEY = 'vocabapp_words'
const TEXTS_KEY = 'vocabapp_texts'
const SETTINGS_KEY = 'vocabapp_settings'
const STATS_KEY = 'vocabapp_stats'

export function getSavedWords() {
  const data = localStorage.getItem(WORDS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveWord(wordEntry) {
  const words = getSavedWords()
  const exists = words.find(w => w.word.toLowerCase() === wordEntry.word.toLowerCase())
  if (exists) return false
  words.unshift({
    ...wordEntry,
    savedAt: Date.now(),
    tags: wordEntry.tags || [],
    // Spaced repetition fields (SM-2)
    interval: 0,       // days until next review
    easeFactor: 2.5,   // ease factor
    repetitions: 0,    // successful repetitions in a row
    nextReview: Date.now(), // when to review next
    lastReview: null,
  })
  localStorage.setItem(WORDS_KEY, JSON.stringify(words))
  return true
}

export function updateWord(word, updates) {
  const words = getSavedWords().map(w =>
    w.word.toLowerCase() === word.toLowerCase() ? { ...w, ...updates } : w
  )
  localStorage.setItem(WORDS_KEY, JSON.stringify(words))
}

export function deleteWord(word) {
  const words = getSavedWords().filter(w => w.word.toLowerCase() !== word.toLowerCase())
  localStorage.setItem(WORDS_KEY, JSON.stringify(words))
}

// Spaced repetition: SM-2 algorithm
export function reviewWord(word, quality) {
  // quality: 0 = again, 1 = hard, 2 = good, 3 = easy
  const words = getSavedWords()
  const w = words.find(w2 => w2.word.toLowerCase() === word.toLowerCase())
  if (!w) return

  let { interval, easeFactor, repetitions } = w
  // Ensure defaults for old words without SR fields
  if (interval == null) interval = 0
  if (easeFactor == null) easeFactor = 2.5
  if (repetitions == null) repetitions = 0

  if (quality < 1) {
    // Failed — reset
    repetitions = 0
    interval = 0
  } else {
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 3
    } else {
      interval = Math.round(interval * easeFactor)
    }
    repetitions += 1
  }

  // Update ease factor
  const qMap = [0, 2, 4, 5] // map quality 0-3 to SM-2 scale 0-5
  const q = qMap[quality]
  easeFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  if (easeFactor < 1.3) easeFactor = 1.3

  // Hard = reduce interval slightly
  if (quality === 1) interval = Math.max(1, Math.round(interval * 0.7))
  // Easy = boost interval
  if (quality === 3) interval = Math.round(interval * 1.3)

  const now = Date.now()
  const nextReview = now + interval * 24 * 60 * 60 * 1000

  updateWord(word, { interval, easeFactor, repetitions, nextReview, lastReview: now })

  // Record stat
  recordReview(quality >= 1)
}

export function getWordsToReview() {
  const now = Date.now()
  return getSavedWords().filter(w => {
    const next = w.nextReview || 0
    return next <= now
  })
}

// Stats
export function getStats() {
  const data = localStorage.getItem(STATS_KEY)
  return data ? JSON.parse(data) : { reviews: [], streak: 0, lastReviewDate: null }
}

function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

function recordReview(success) {
  const stats = getStats()
  const today = new Date().toISOString().slice(0, 10)

  stats.reviews.push({ date: today, success, timestamp: Date.now() })

  // Keep only last 90 days of reviews
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000
  stats.reviews = stats.reviews.filter(r => r.timestamp > cutoff)

  // Update streak
  if (stats.lastReviewDate === today) {
    // Already reviewed today, streak unchanged
  } else {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    if (stats.lastReviewDate === yesterday) {
      stats.streak = (stats.streak || 0) + 1
    } else if (stats.lastReviewDate !== today) {
      stats.streak = 1
    }
    stats.lastReviewDate = today
  }

  saveStats(stats)
}

export function getStatsData() {
  const stats = getStats()
  const words = getSavedWords()
  const now = Date.now()
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000

  const reviewsThisWeek = stats.reviews.filter(r => r.timestamp > weekAgo)
  const reviewsToday = stats.reviews.filter(r => r.date === today)
  const successCount = reviewsThisWeek.filter(r => r.success).length
  const totalReviews = reviewsThisWeek.length

  // Words by mastery level
  const mastered = words.filter(w => (w.repetitions || 0) >= 5).length
  const learning = words.filter(w => (w.repetitions || 0) > 0 && (w.repetitions || 0) < 5).length
  const newWords = words.filter(w => (w.repetitions || 0) === 0).length
  const dueNow = words.filter(w => (w.nextReview || 0) <= now).length

  // Words added this week
  const addedThisWeek = words.filter(w => w.savedAt > weekAgo).length

  return {
    totalWords: words.length,
    mastered,
    learning,
    newWords,
    dueNow,
    streak: stats.streak || 0,
    reviewsToday: reviewsToday.length,
    reviewsThisWeek: totalReviews,
    successRate: totalReviews > 0 ? Math.round((successCount / totalReviews) * 100) : 0,
    addedThisWeek,
  }
}

// Tags
export function getAllTags() {
  const words = getSavedWords()
  const tags = new Set()
  for (const w of words) {
    for (const t of (w.tags || [])) tags.add(t)
  }
  return [...tags].sort()
}

export function addTagToWord(word, tag) {
  const words = getSavedWords()
  const w = words.find(w2 => w2.word.toLowerCase() === word.toLowerCase())
  if (!w) return
  const tags = new Set(w.tags || [])
  tags.add(tag.toLowerCase().trim())
  updateWord(word, { tags: [...tags] })
}

export function removeTagFromWord(word, tag) {
  const words = getSavedWords()
  const w = words.find(w2 => w2.word.toLowerCase() === word.toLowerCase())
  if (!w) return
  const tags = (w.tags || []).filter(t => t !== tag)
  updateWord(word, { tags })
}

// Texts
export function getSavedTexts() {
  const data = localStorage.getItem(TEXTS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveText(title, content) {
  const texts = getSavedTexts()
  texts.unshift({ id: Date.now(), title, content, addedAt: Date.now() })
  localStorage.setItem(TEXTS_KEY, JSON.stringify(texts))
}

export function deleteText(id) {
  const texts = getSavedTexts().filter(t => t.id !== id)
  localStorage.setItem(TEXTS_KEY, JSON.stringify(texts))
}

export function renameText(id, newTitle) {
  const texts = getSavedTexts().map(t => t.id === id ? { ...t, title: newTitle } : t)
  localStorage.setItem(TEXTS_KEY, JSON.stringify(texts))
}

// Settings
export function getSettings() {
  const data = localStorage.getItem(SETTINGS_KEY)
  return data ? JSON.parse(data) : { darkMode: false }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}
