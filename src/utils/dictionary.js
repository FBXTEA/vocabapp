export async function lookupWord(word) {
  const cleanWord = word.toLowerCase().replace(/[^a-zA-Z'-]/g, '')
  if (!cleanWord) return null

  const definition = await fetchDefinition(cleanWord)

  // Collect English synonyms from the dictionary
  const enSynonyms = []
  if (definition?.meanings) {
    for (const m of definition.meanings) {
      if (m.synonyms) enSynonyms.push(...m.synonyms)
    }
  }

  // Also extract short definition words as fallback alternatives
  const defAlternatives = []
  if (enSynonyms.length < 3 && definition?.meanings) {
    for (const m of definition.meanings) {
      for (const d of m.definitions) {
        // Extract key words from short definitions like "put at risk", "to endanger"
        const def = d.definition
        if (def && def.split(' ').length <= 6) {
          defAlternatives.push(def.replace(/^to\s+/i, ''))
        }
      }
    }
  }

  const translationData = await fetchTranslation(cleanWord, enSynonyms.slice(0, 4), defAlternatives.slice(0, 3))

  const autoTag = guessCategory(cleanWord, definition)

  return {
    word: cleanWord,
    definition,
    translation: translationData?.main || null,
    synonyms: translationData?.synonyms || [],
    audioUrl: definition?.audioUrl || null,
    autoTag,
  }
}

async function fetchDefinition(word) {
  try {
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
    if (!res.ok) return null
    const data = await res.json()
    const entry = data[0]
    const meanings = entry.meanings.map(m => ({
      partOfSpeech: m.partOfSpeech,
      synonyms: m.synonyms || [],
      definitions: m.definitions.slice(0, 3).map(d => ({
        definition: d.definition,
        example: d.example || null,
      })),
    }))
    const phonetic = entry.phonetics?.find(p => p.text)?.text || null
    const audioUrl = entry.phonetics?.find(p => p.audio && p.audio.length > 0)?.audio || null
    return { meanings, phonetic, audioUrl }
  } catch {
    return null
  }
}

async function translateViaLingva(text) {
  try {
    const res = await fetch(
      `https://lingva.ml/api/v1/en/fr/${encodeURIComponent(text)}`,
      { signal: AbortSignal.timeout(4000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    if (!data.translation) return []
    return data.translation
      .split(/[,;]/)
      .map(s => s.trim().toLowerCase())
      .filter(s => s.length > 1 && s.length < 40)
  } catch {
    return []
  }
}

async function fetchTranslation(word, enSynonyms, defAlternatives) {
  const allTranslations = new Set()

  // Build a batch query: the word + synonyms + short definition phrases
  const parts = [word]
  for (const s of enSynonyms) {
    if (s.toLowerCase() !== word) parts.push(s)
  }
  for (const d of defAlternatives) {
    parts.push(d)
  }

  // Translate everything in one call
  const results = await translateViaLingva(parts.join(', '))
  for (const r of results) {
    if (r !== word) allTranslations.add(r)
  }

  // Deduplicate similar translations (e.g. "mettre en danger" appearing twice)
  const unique = [...allTranslations]

  // Fallback: MyMemory if nothing came back
  if (unique.length === 0) {
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|fr`
      )
      if (res.ok) {
        const data = await res.json()
        const mainResult = data.responseData?.translatedText
        if (mainResult && mainResult.toLowerCase() !== word) {
          const parts = mainResult.split(/[,/;]/).map(s => s.trim().toLowerCase()).filter(s => s.length > 1 && s.length < 30)
          for (const p of parts) allTranslations.add(p)
        }
      }
    } catch {}
  }

  const all = [...allTranslations]
  if (all.length === 0) return null

  const main = all[0]
  const synonyms = all.slice(1).filter(s => s !== main).slice(0, 6)
  return { main, synonyms }
}

const CATEGORY_KEYWORDS = {
  'emotions': ['feel', 'emotion', 'mood', 'happy', 'sad', 'anger', 'joy', 'fear', 'love', 'hate', 'anxious', 'delight', 'sorrow', 'grief', 'pleasure', 'disgust', 'surprise', 'shame', 'pride', 'jealous', 'envy'],
  'nature': ['plant', 'animal', 'tree', 'flower', 'bird', 'fish', 'forest', 'ocean', 'river', 'mountain', 'sky', 'weather', 'rain', 'wind', 'sun', 'earth', 'leaf', 'rock', 'sea', 'garden'],
  'corps': ['body', 'hand', 'eye', 'head', 'heart', 'bone', 'skin', 'blood', 'muscle', 'organ', 'brain', 'leg', 'arm', 'face', 'mouth', 'tooth', 'finger', 'chest'],
  'nourriture': ['food', 'eat', 'drink', 'cook', 'meal', 'taste', 'flavor', 'dish', 'fruit', 'meat', 'bread', 'sugar', 'salt', 'spice', 'recipe', 'kitchen'],
  'travail': ['work', 'job', 'business', 'office', 'employ', 'company', 'manage', 'trade', 'profit', 'market', 'career', 'salary', 'industry', 'client', 'contract', 'negotiate'],
  'social': ['person', 'people', 'friend', 'family', 'group', 'community', 'society', 'relationship', 'neighbor', 'stranger', 'crowd', 'culture'],
  'mouvement': ['move', 'walk', 'run', 'jump', 'fly', 'swim', 'climb', 'fall', 'push', 'pull', 'throw', 'carry', 'drag', 'rush', 'crawl', 'slide'],
  'communication': ['say', 'speak', 'tell', 'talk', 'write', 'read', 'listen', 'word', 'language', 'voice', 'message', 'express', 'declare', 'argue', 'persuade', 'convince'],
  'temps': ['time', 'day', 'year', 'month', 'hour', 'moment', 'period', 'season', 'morning', 'evening', 'night', 'dawn', 'dusk', 'century', 'decade'],
  'quantite': ['amount', 'number', 'quantity', 'size', 'measure', 'count', 'total', 'volume', 'weight', 'length', 'distance', 'degree', 'level', 'rate'],
}

export function guessCategory(word, definition) {
  if (!definition?.meanings) return null

  // Collect all text to analyze
  const allText = []
  for (const m of definition.meanings) {
    for (const d of m.definitions) {
      if (d.definition) allText.push(d.definition.toLowerCase())
      if (d.example) allText.push(d.example.toLowerCase())
    }
  }
  const text = allText.join(' ')

  // Score each category
  let bestCategory = null
  let bestScore = 0

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0
    for (const kw of keywords) {
      if (text.includes(kw)) score++
      if (word.includes(kw)) score += 2
    }
    if (score > bestScore) {
      bestScore = score
      bestCategory = category
    }
  }

  if (bestScore >= 1) return bestCategory

  // Fallback: use part of speech as category
  const pos = definition.meanings[0]?.partOfSpeech
  if (pos) {
    const posMap = { verb: 'action', noun: 'nom', adjective: 'adjectif', adverb: 'adverbe' }
    return posMap[pos] || pos
  }

  return 'divers'
}
