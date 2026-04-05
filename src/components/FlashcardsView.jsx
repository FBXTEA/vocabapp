import { useState, useMemo } from 'react'
import { getSavedWords } from '../utils/storage'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function FlashcardsView() {
  const allWords = useMemo(() => getSavedWords(), [])
  const [cards, setCards] = useState(() => shuffle(allWords))
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [mode, setMode] = useState('word-to-def')

  function restart() {
    setCards(shuffle(allWords))
    setIndex(0)
    setFlipped(false)
  }

  function next() {
    setFlipped(false)
    setIndex(i => i + 1)
  }

  if (allWords.length === 0) {
    return (
      <div className="p-5 text-center pt-24 animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75" />
          </svg>
        </div>
        <p className="text-slate-400 font-medium">Pas encore de flashcards</p>
        <p className="text-slate-600 text-sm mt-1">Sauvegarde des mots en lisant un texte</p>
      </div>
    )
  }

  if (index >= cards.length) {
    return (
      <div className="p-5 text-center pt-20 animate-fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-2xl font-bold text-slate-100 mb-1">Bien joue !</p>
        <p className="text-slate-400 mb-8">{cards.length} mot{cards.length > 1 ? 's' : ''} revise{cards.length > 1 ? 's' : ''}</p>
        <button
          onClick={restart}
          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
        >
          Recommencer
        </button>
      </div>
    )
  }

  const card = cards[index]
  const front = mode === 'word-to-def'
    ? card.word
    : (card.translation || card.definition?.meanings?.[0]?.definitions?.[0]?.definition || '?')
  const back = mode === 'word-to-def'
    ? { translation: card.translation, definition: card.definition }
    : { word: card.word, definition: card.definition }

  const progress = ((index + 1) / cards.length) * 100

  return (
    <div className="p-5 flex flex-col items-center pt-4">
      <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-5">
        Flashcards
      </h1>

      {/* Mode toggle */}
      <div className="flex bg-white/5 rounded-2xl p-1 mb-5 border border-white/5">
        <button
          onClick={() => { setMode('word-to-def'); restart() }}
          className={`text-sm px-4 py-1.5 rounded-xl font-semibold transition-all ${
            mode === 'word-to-def'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          EN → FR
        </button>
        <button
          onClick={() => { setMode('def-to-word'); restart() }}
          className={`text-sm px-4 py-1.5 rounded-xl font-semibold transition-all ${
            mode === 'def-to-word'
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          FR → EN
        </button>
      </div>

      {/* Progress */}
      <div className="w-full max-w-sm mb-5">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>{index + 1} / {cards.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card */}
      <button
        onClick={() => setFlipped(!flipped)}
        className="w-full max-w-sm min-h-[280px] bg-white/[0.03] border border-white/10 hover:border-white/15 rounded-3xl p-7 flex flex-col items-center justify-center transition-all active:scale-[0.97] shadow-2xl shadow-black/20"
      >
        {!flipped ? (
          <div className="text-center animate-fade-in">
            <p className="text-3xl font-bold text-slate-100 mb-3">{front}</p>
            <p className="text-slate-600 text-sm">Tap pour voir la reponse</p>
          </div>
        ) : (
          <div className="text-center w-full animate-fade-in">
            {mode === 'word-to-def' ? (
              <>
                {back.translation && (
                  <p className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-5">
                    {back.translation}
                  </p>
                )}
                {back.definition?.meanings?.[0]?.definitions?.[0] && (
                  <div className="text-left bg-white/5 rounded-2xl p-4">
                    <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {back.definition.meanings[0].partOfSpeech}
                    </span>
                    <p className="text-slate-300 mt-2 text-sm leading-relaxed">
                      {back.definition.meanings[0].definitions[0].definition}
                    </p>
                    {back.definition.meanings[0].definitions[0].example && (
                      <p className="text-slate-500 text-xs mt-2 italic border-l-2 border-slate-700 pl-3">
                        "{back.definition.meanings[0].definitions[0].example}"
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <p className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent mb-4">
                  {back.word}
                </p>
                {back.definition?.meanings?.[0]?.definitions?.[0] && (
                  <p className="text-slate-400 text-sm">
                    {back.definition.meanings[0].definitions[0].definition}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </button>

      {flipped && (
        <button
          onClick={next}
          className="mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3.5 px-10 rounded-2xl transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.98] animate-fade-in"
        >
          Suivant →
        </button>
      )}
    </div>
  )
}
