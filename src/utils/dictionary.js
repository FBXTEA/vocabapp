export async function lookupWord(word) {
  const cleanWord = word.toLowerCase().replace(/[^a-zA-Z'-]/g, '')
  if (!cleanWord) return null

  const [definition, translation] = await Promise.all([
    fetchDefinition(cleanWord),
    fetchTranslation(cleanWord),
  ])

  return {
    word: cleanWord,
    definition,
    translation,
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

async function fetchTranslation(word) {
  try {
    const res = await fetch(
      `https://lingva.ml/api/v1/en/fr/${encodeURIComponent(word)}`,
      { signal: AbortSignal.timeout(3000) }
    )
    if (res.ok) {
      const data = await res.json()
      if (data.translation && data.translation.toLowerCase() !== word.toLowerCase()) {
        return data.translation
      }
    }
  } catch {}

  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|fr`
    )
    if (!res.ok) return null
    const data = await res.json()
    const result = data.responseData?.translatedText
    if (result && result.toLowerCase() !== word.toLowerCase()) {
      return result
    }
    return null
  } catch {
    return null
  }
}
