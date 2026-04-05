import { getSavedWords } from './storage'

export function generateShareLink() {
  const words = getSavedWords().map(w => ({
    w: w.word,
    t: w.translation || '',
    s: (w.synonyms || []).join('|'),
    g: (w.tags || []).join('|'),
  }))

  const json = JSON.stringify(words)
  const compressed = btoa(unescape(encodeURIComponent(json)))
  const url = `${window.location.origin}${window.location.pathname}?share=${compressed}`
  return url
}

export function parseShareLink() {
  const params = new URLSearchParams(window.location.search)
  const data = params.get('share')
  if (!data) return null

  try {
    const json = decodeURIComponent(escape(atob(data)))
    const words = JSON.parse(json)
    return words.map(w => ({
      word: w.w,
      translation: w.t || null,
      synonyms: w.s ? w.s.split('|') : [],
      tags: w.g ? w.g.split('|') : [],
    }))
  } catch {
    return null
  }
}
