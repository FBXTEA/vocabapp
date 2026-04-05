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

  return {
    word: cleanWord,
    definition,
    translation: translationData?.main || null,
    synonyms: translationData?.synonyms || [],
    audioUrl: definition?.audioUrl || null,
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
