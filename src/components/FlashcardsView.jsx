import { useState, useMemo, useRef } from 'react'
import { getWordsToReview, getSavedWords, reviewWord } from '../utils/storage'
import { useT } from '../utils/i18n'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function FlashcardsView() {
  const t = useT()
  const allWords = useMemo(() => getSavedWords(), [])
  const dueWords = useMemo(() => getWordsToReview(), [])
  const [mode, setMode] = useState('word-to-def')
  const [reviewMode, setReviewMode] = useState('due')
  const [cards, setCards] = useState(() => shuffle(dueWords.length > 0 ? dueWords : allWords))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionStats, setSessionStats] = useState({ total: 0, correct: 0 })
  const [swipeX, setSwipeX] = useState(0)
  const [swiping, setSwiping] = useState(false)
  const touchStart = useRef(null)

  function startSession(which) {
    setReviewMode(which)
    const source = which === 'due' ? dueWords : allWords
    setCards(shuffle(source))
    setIndex(0)
    setFlipped(false)
    setSessionStats({ total: 0, correct: 0 })
  }

  function handleQuality(quality) {
    const card = cards[index]
    reviewWord(card.word, quality)
    setSessionStats(s => ({ total: s.total + 1, correct: quality >= 1 ? s.correct + 1 : s.correct }))
    setFlipped(false)
    setSwipeX(0)
    setIndex(i => i + 1)
  }

  // Swipe handlers
  function onTouchStart(e) {
    if (!flipped) return
    touchStart.current = e.touches[0].clientX
    setSwiping(true)
  }

  function onTouchMove(e) {
    if (!flipped || !touchStart.current) return
    const diff = e.touches[0].clientX - touchStart.current
    setSwipeX(diff)
  }

  function onTouchEnd() {
    if (!flipped) return
    setSwiping(false)
    if (Math.abs(swipeX) > 80) {
      if (swipeX > 0) {
        handleQuality(2) // swipe right = Bien
      } else {
        handleQuality(0) // swipe left = Encore
      }
    }
    setSwipeX(0)
    touchStart.current = null
  }

  if (allWords.length === 0) {
    return (
      <div className="p-5 text-center pt-24 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-stone-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75" />
          </svg>
        </div>
        <p className="text-stone-500 font-medium">{t.noFlashcards}</p>
        <p className="text-stone-400 text-sm mt-1">{t.saveWordsFirst}</p>
      </div>
    )
  }

  if (index >= cards.length) {
    const pct = sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0
    return (
      <div className="p-5 text-center pt-16 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-2xl font-bold text-stone-800 dark:text-slate-100 mb-1">{t.wellDone}</p>
        <p className="text-stone-400 mb-6">{sessionStats.total} {sessionStats.total > 1 ? t.wordsPlural : t.words}</p>
        <div className="flex gap-3 justify-center mb-8">
          <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-stone-200 dark:border-white/10 text-center min-w-[80px]">
            <p className="text-2xl font-bold text-emerald-500">{pct}%</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Reussite</p>
          </div>
          <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-stone-200 dark:border-white/10 text-center min-w-[80px]">
            <p className="text-2xl font-bold text-indigo-500">{sessionStats.correct}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">Corrects</p>
          </div>
          <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-stone-200 dark:border-white/10 text-center min-w-[80px]">
            <p className="text-2xl font-bold text-amber-500">{sessionStats.total - sessionStats.correct}</p>
            <p className="text-[11px] text-stone-400 mt-0.5">A revoir</p>
          </div>
        </div>
        <button onClick={() => startSession(reviewMode)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 px-8 rounded-2xl transition-all shadow-sm active:scale-[0.98]">
          {t.restart}
        </button>
      </div>
    )
  }

  const card = cards[index]
  const front = mode === 'word-to-def' ? card.word
    : (card.translation || card.definition?.meanings?.[0]?.definitions?.[0]?.definition || '?')
  const back = mode === 'word-to-def'
    ? { translation: card.translation, synonyms: card.synonyms, definition: card.definition }
    : { word: card.word, definition: card.definition }
  const progress = ((index + 1) / cards.length) * 100

  // Swipe visual feedback
  const swipeStyle = swiping && flipped ? {
    transform: `translateX(${swipeX}px) rotate(${swipeX * 0.05}deg)`,
    transition: 'none',
  } : { transition: 'transform 0.3s' }

  const swipeColor = swipeX > 60 ? 'border-emerald-400' : swipeX < -60 ? 'border-red-400' : 'border-stone-200 dark:border-white/10'

  return (
    <div className="p-5 flex flex-col items-center pt-2">
      <h1 className="text-3xl font-extrabold text-stone-800 dark:text-white mb-3">{t.flashcards}</h1>

      {dueWords.length > 0 && (
        <div className="flex gap-2 mb-3">
          <button onClick={() => startSession('due')}
            className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${
              reviewMode === 'due' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                : 'bg-stone-100 dark:bg-white/5 text-stone-500'}`}>
            A reviser ({dueWords.length})
          </button>
          <button onClick={() => startSession('all')}
            className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${
              reviewMode === 'all' ? 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20'
                : 'bg-stone-100 dark:bg-white/5 text-stone-500'}`}>
            Tous ({allWords.length})
          </button>
        </div>
      )}

      <div className="flex bg-stone-100 dark:bg-white/5 rounded-2xl p-1 mb-4 border border-stone-200 dark:border-white/5">
        <button onClick={() => { setMode('word-to-def'); startSession(reviewMode) }}
          className={`text-sm px-4 py-1.5 rounded-xl font-semibold transition-all ${
            mode === 'word-to-def' ? 'bg-indigo-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>
          EN → FR
        </button>
        <button onClick={() => { setMode('def-to-word'); startSession(reviewMode) }}
          className={`text-sm px-4 py-1.5 rounded-xl font-semibold transition-all ${
            mode === 'def-to-word' ? 'bg-indigo-600 text-white shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>
          FR → EN
        </button>
      </div>

      <div className="w-full max-w-sm mb-4">
        <div className="flex justify-between text-xs text-stone-400 mb-1.5">
          <span>{index + 1} / {cards.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-stone-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Card with swipe */}
      <div className="w-full max-w-sm relative"
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>

        {/* Swipe indicators */}
        {swiping && flipped && Math.abs(swipeX) > 40 && (
          <div className="absolute inset-0 z-10 flex items-center justify-between px-4 pointer-events-none">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-opacity ${swipeX < -60 ? 'bg-red-500 opacity-100' : 'opacity-0'}`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-opacity ${swipeX > 60 ? 'bg-emerald-500 opacity-100' : 'opacity-0'}`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          </div>
        )}

        <button onClick={() => setFlipped(!flipped)}
          style={swipeStyle}
          className={`w-full min-h-[250px] bg-white dark:bg-white/[0.03] border-2 ${swipeColor} rounded-3xl p-7 flex flex-col items-center justify-center shadow-sm select-none`}>
          {!flipped ? (
            <div className="text-center animate-fade-in">
              <p className="text-3xl font-bold text-stone-800 dark:text-slate-100 mb-3">{front}</p>
              {card.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mb-2">
                  {card.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-white/5 text-stone-400">{tag}</span>
                  ))}
                </div>
              )}
              <p className="text-stone-400 text-sm">{t.tapToReveal}</p>
            </div>
          ) : (
            <div className="text-center w-full animate-fade-in">
              {mode === 'word-to-def' ? (
                <>
                  {back.translation && (
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">{back.translation}</p>
                  )}
                  {back.synonyms?.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center mb-4">
                      {back.synonyms.map((s, i) => (
                        <span key={i} className="text-xs text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-lg">{s}</span>
                      ))}
                    </div>
                  )}
                  {back.definition?.meanings?.[0]?.definitions?.[0] && (
                    <div className="text-left bg-stone-50 dark:bg-white/5 rounded-2xl p-4">
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {back.definition.meanings[0].partOfSpeech}
                      </span>
                      <p className="text-stone-600 dark:text-slate-300 mt-2 text-sm leading-relaxed">
                        {back.definition.meanings[0].definitions[0].definition}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">{back.word}</p>
                  {back.definition?.meanings?.[0]?.definitions?.[0] && (
                    <p className="text-stone-500 text-sm">{back.definition.meanings[0].definitions[0].definition}</p>
                  )}
                </>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Swipe hint */}
      {flipped && (
        <p className="text-[11px] text-stone-400 mt-2 mb-1">Swipe droite = bien, gauche = a revoir</p>
      )}

      {/* Quality buttons */}
      {flipped && (
        <div className="w-full max-w-sm mt-2 animate-fade-in">
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => handleQuality(0)}
              className="py-3 rounded-xl font-semibold text-sm bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-200 dark:border-red-500/20 active:scale-[0.96] transition-all">
              Encore
            </button>
            <button onClick={() => handleQuality(1)}
              className="py-3 rounded-xl font-semibold text-sm bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-500/20 active:scale-[0.96] transition-all">
              Difficile
            </button>
            <button onClick={() => handleQuality(2)}
              className="py-3 rounded-xl font-semibold text-sm bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20 active:scale-[0.96] transition-all">
              Bien
            </button>
            <button onClick={() => handleQuality(3)}
              className="py-3 rounded-xl font-semibold text-sm bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border border-indigo-200 dark:border-indigo-500/20 active:scale-[0.96] transition-all">
              Facile
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
