import { useState } from 'react'
import { getSavedWords, deleteWord } from '../utils/storage'

export default function WordListView() {
  const [words, setWords] = useState(() => getSavedWords())
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState(null)

  function handleDelete(word) {
    deleteWord(word)
    setWords(getSavedWords())
    if (expanded === word) setExpanded(null)
  }

  const filtered = words.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    (w.translation && w.translation.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-5">
      <div className="text-center mb-5 pt-2">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          Mes mots
        </h1>
        {words.length > 0 && (
          <p className="text-slate-500 text-sm mt-1">{words.length} mot{words.length > 1 ? 's' : ''} sauvegarde{words.length > 1 ? 's' : ''}</p>
        )}
      </div>

      {words.length > 0 && (
        <div className="relative mb-4">
          <svg className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/5 text-slate-100 rounded-2xl pl-10 pr-4 py-3 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-600"
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
            </svg>
          </div>
          <p className="text-slate-400 font-medium">
            {words.length === 0 ? 'Aucun mot sauvegarde' : 'Aucun resultat'}
          </p>
          {words.length === 0 && (
            <p className="text-slate-600 text-sm mt-1">Lis un texte et clique sur les mots inconnus</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 stagger-grid">
          {filtered.map(w => {
            const isExpanded = expanded === w.word
            return (
              <button
                key={w.word}
                onClick={() => setExpanded(isExpanded ? null : w.word)}
                className={`text-left rounded-2xl p-3 border transition-all animate-fade-in ${
                  isExpanded
                    ? 'col-span-2 bg-indigo-500/10 border-indigo-500/20'
                    : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06] hover:border-white/10 active:scale-[0.98]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-100 text-sm truncate">{w.word}</p>
                    {w.translation && (
                      <p className="text-indigo-400 text-xs mt-0.5 truncate">{w.translation}</p>
                    )}
                  </div>
                  {isExpanded && (
                    <span
                      onClick={e => { e.stopPropagation(); handleDelete(w.word) }}
                      className="text-slate-600 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </span>
                  )}
                </div>

                {isExpanded && w.definition?.meanings?.[0] && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    {w.definition.meanings.slice(0, 2).map((m, i) => (
                      <div key={i} className={i > 0 ? 'mt-2' : ''}>
                        <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                          {m.partOfSpeech}
                        </span>
                        {m.definitions.slice(0, 1).map((d, j) => (
                          <div key={j} className="mt-1.5">
                            <p className="text-slate-300 text-xs leading-relaxed">{d.definition}</p>
                            {d.example && (
                              <p className="text-slate-500 text-xs mt-1 italic">"{d.example}"</p>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
