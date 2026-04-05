import { useState, useCallback } from 'react'
import { lookupWord } from '../utils/dictionary'
import { saveWord } from '../utils/storage'
import WordPopup from './WordPopup'

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

export default function ReaderView({ title, text, onBack }) {
  const [popup, setPopup] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleWordClick = useCallback(async (word, wordIndex) => {
    const cleanWord = word.replace(/[^a-zA-Z'-]/g, '')
    if (!cleanWord || cleanWord.length < 2) return

    setLoading(true)
    setPopup({ word: cleanWord, data: null })

    const sentence = extractSentence(text, wordIndex)
    const data = await lookupWord(cleanWord, sentence)
    setPopup({ word: cleanWord, data, sentence })
    setLoading(false)
  }, [text])

  function handleSave() {
    if (!popup?.data) return
    const saved = saveWord({
      word: popup.data.word,
      definition: popup.data.definition,
      translation: popup.data.translation,
    })
    if (saved) {
      setPopup(prev => ({ ...prev, saved: true }))
    } else {
      setPopup(prev => ({ ...prev, alreadySaved: true }))
    }
  }

  const words = text.split(/(\s+)/)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 flex flex-col">
      <header className="sticky top-0 glass border-b border-white/5 px-4 py-3 flex items-center gap-3 z-10">
        <button onClick={onBack} className="text-indigo-400 font-semibold flex items-center gap-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Retour
        </button>
        <h1 className="text-base font-semibold truncate flex-1 text-slate-300">{title}</h1>
      </header>

      <div className="flex-1 px-5 py-6 pb-8 leading-[1.9] text-[17px] text-slate-300">
        {words.map((segment, i) => {
          if (/^\s+$/.test(segment)) {
            return segment.includes('\n') ? <br key={i} /> : <span key={i}> </span>
          }
          return (
            <span
              key={i}
              onClick={() => handleWordClick(segment, i)}
              className="cursor-pointer hover:text-indigo-300 active:bg-indigo-500/20 rounded-md px-0.5 transition-colors"
            >
              {segment}
            </span>
          )
        })}
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
