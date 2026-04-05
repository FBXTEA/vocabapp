const WORDS_KEY = 'vocabapp_words'
const TEXTS_KEY = 'vocabapp_texts'

export function getSavedWords() {
  const data = localStorage.getItem(WORDS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveWord(wordEntry) {
  const words = getSavedWords()
  const exists = words.find(w => w.word.toLowerCase() === wordEntry.word.toLowerCase())
  if (exists) return false
  words.unshift({ ...wordEntry, savedAt: Date.now() })
  localStorage.setItem(WORDS_KEY, JSON.stringify(words))
  return true
}

export function deleteWord(word) {
  const words = getSavedWords().filter(w => w.word.toLowerCase() !== word.toLowerCase())
  localStorage.setItem(WORDS_KEY, JSON.stringify(words))
}

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
