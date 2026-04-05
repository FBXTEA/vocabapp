import { useState, useCallback, useMemo, useEffect } from 'react'
import { lookupWord } from '../utils/dictionary'
import { saveWord, getSavedWords, getSettings, saveSettings } from '../utils/storage'
import WordPopup from './WordPopup'
import { useT } from '../utils/i18n'

function extractSentence(text, wordIndex) {
  const words = text.split(/(\s+)/)
  let charPos = 0
  for (let i = 0; i < wordIndex && i < words.length; i++) {
    charPos += words[i].length
  }
  const before = text.slice(Math.max(0, charPos - 300), charPos)
  const after = text.slice(charPos, charPos + 300)
  const sentenceStart = before.search(/[^.!?]*$/)
  const sentenceEndMatch = after.match(/[.!?]/)
  const sentenceEnd = sentenceEndMatch ? sentenceEndMatch.index + 1 : after.length
  return (before.slice(sentenceStart) + after.slice(0, sentenceEnd)).trim() || null
}

function splitIntoParagraphs(text) {
  return text.split(/\n\s*\n|\n/).filter(p => p.trim().length > 0)
}

const FONT_SIZES = [14, 16, 17, 19, 21, 24]

export default function ReaderView({ title, text, onBack }) {
  const t = useT()
  const [popup, setPopup] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fontSize, setFontSize] = useState(() => getSettings().readerFontSize || 17)
  const [showControls, setShowControls] = useState(false)

  // Saved words set for highlighting
  const savedWordsSet = useMemo(() => {
    const set = new Set()
    for (const w of getSavedWords()) set.add(w.word.toLowerCase())
    return set
  }, [popup]) // re-compute when popup changes (word might have been saved)

  // Save/restore reading position
  const positionKey = `vocabapp_pos_${title}`
  useEffect(() => {
    const saved = localStorage.getItem(positionKey)
    if (saved) {
      setTimeout(() => window.scrollTo(0, parseInt(saved)), 100)
    }
    const handleScroll = () => localStorage.setItem(positionKey, String(window.scrollY))
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [positionKey])

  // Save font size
  function changeFontSize(size) {
    setFontSize(size)
    saveSettings({ ...getSettings(), readerFontSize: size })
  }

  const paragraphs = useMemo(() => splitIntoParagraphs(text), [text])

  let globalWordIndex = 0

  const handleWordClick = useCallback(async (word, globalIdx) => {
    const cleanWord = word.replace(/[^a-zA-Z'-]/g, '')
    if (!cleanWord || cleanWord.length < 2) return

    setLoading(true)
    setPopup({ word: cleanWord, data: null })

    const sentence = extractSentence(text, globalIdx)
    const data = await lookupWord(cleanWord, sentence)
    setPopup({ word: cleanWord, data, sentence })
    setLoading(false)
  }, [text])

  function handleSave() {
    if (!popup?.data) return
    const tags = popup.data.autoTag ? [popup.data.autoTag] : []
    const saved = saveWord({
      word: popup.data.word,
      definition: popup.data.definition,
      translation: popup.data.translation,
      synonyms: popup.data.synonyms || [],
      tags,
    })
    if (saved) {
      if (navigator.vibrate) navigator.vibrate(30)
      setPopup(prev => ({ ...prev, saved: true }))
    } else {
      setPopup(prev => ({ ...prev, alreadySaved: true }))
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-stone-200 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="text-stone-500 hover:text-stone-800 font-medium flex items-center gap-1 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t.back}
        </button>
        <h1 className="text-sm font-medium truncate flex-1 text-stone-400 text-center italic">{title}</h1>
        <button onClick={() => setShowControls(!showControls)}
          className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
        </button>
      </header>

      {/* Reading controls */}
      {showControls && (
        <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-center gap-3 animate-fade-in">
          <span className="text-xs text-stone-400">Aa</span>
          <div className="flex bg-stone-100 rounded-xl p-0.5">
            {FONT_SIZES.map(size => (
              <button key={size} onClick={() => changeFontSize(size)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  fontSize === size ? 'bg-indigo-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-700'
                }`}>
                {size}
              </button>
            ))}
          </div>
          <span className="text-sm text-stone-400">Aa</span>
        </div>
      )}

      {/* Book page */}
      <div className="flex-1 flex justify-center">
        <article className="w-full max-w-2xl px-6 sm:px-12 py-10 sm:py-14">
          <div className="text-center mb-12 pb-8 border-b border-stone-300/50">
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold text-stone-800 leading-tight">
              {title}
            </h2>
          </div>

          <div className="font-serif text-stone-800 tracking-[0.01em]" style={{ fontSize: `${fontSize}px`, lineHeight: fontSize < 17 ? '1.8' : '1.9' }}>
            {paragraphs.map((para, pIdx) => {
              const words = para.split(/(\s+)/)
              const paraStartIdx = globalWordIndex
              const renderedWords = words.map((segment, i) => {
                if (/^\s+$/.test(segment)) {
                  return <span key={i}> </span>
                }
                const currentGlobalIdx = paraStartIdx + i
                const cleanWord = segment.replace(/[^a-zA-Z'-]/g, '').toLowerCase()
                const isSaved = cleanWord.length > 1 && savedWordsSet.has(cleanWord)
                return (
                  <span
                    key={i}
                    onClick={() => handleWordClick(segment, currentGlobalIdx)}
                    className={`cursor-pointer rounded-sm transition-colors duration-100 ${
                      isSaved
                        ? 'bg-indigo-100/70 text-indigo-900 hover:bg-indigo-200/70'
                        : 'hover:bg-amber-200/60 active:bg-amber-300/60'
                    }`}
                  >
                    {segment}
                  </span>
                )
              })
              globalWordIndex += words.length
              return (
                <p key={pIdx} className={`mb-6 ${pIdx > 0 ? 'indent-8' : ''} text-justify hyphens-auto`}>
                  {renderedWords}
                </p>
              )
            })}
          </div>

          <div className="text-center mt-16 mb-8">
            <div className="flex items-center justify-center gap-4 text-stone-300">
              <span className="h-px w-12 bg-stone-300" />
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
              </svg>
              <span className="h-px w-12 bg-stone-300" />
            </div>
          </div>
        </article>
      </div>

      {popup && (
        <WordPopup
          word={popup.word}
          data={popup.data}
          sentence={popup.sentence}
          loading={loading}
          saved={popup.saved}
          alreadySaved={popup.alreadySaved}
          onSave={handleSave}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  )
}
