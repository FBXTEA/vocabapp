import { useState, useRef, useEffect } from 'react'
import { getSavedWords, deleteWord, saveWord, getAllTags } from '../utils/storage'
import { lookupWord } from '../utils/dictionary'
import WordPopup from './WordPopup'
import { useT } from '../utils/i18n'

export default function WordListView() {
  const t = useT()
  const [words, setWords] = useState(() => getSavedWords())
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newWord, setNewWord] = useState('')
  const [adding, setAdding] = useState(false)
  const inputRef = useRef(null)
  const allTags = getAllTags()

  useEffect(() => { if (showAdd && inputRef.current) inputRef.current.focus() }, [showAdd])

  function refresh() { setWords(getSavedWords()) }
  function handleDelete(word) { deleteWord(word); refresh(); setSelected(null) }

  async function handleAddWord(e) {
    e.preventDefault()
    const w = newWord.trim()
    if (!w || adding) return
    setAdding(true)
    const data = await lookupWord(w)
    if (data) {
      const saved = saveWord({ word: data.word, definition: data.definition, translation: data.translation, synonyms: data.synonyms })
      if (saved) { refresh(); setNewWord(''); setShowAdd(false) }
    } else {
      saveWord({ word: w.toLowerCase(), definition: null, translation: null })
      refresh(); setNewWord(''); setShowAdd(false)
    }
    setAdding(false)
  }

  function handleWordTap(w) {
    setSelected({
      word: w.word,
      data: { word: w.word, definition: w.definition, translation: w.translation, synonyms: w.synonyms || [], audioUrl: w.definition?.audioUrl || null, tags: w.tags || [] },
    })
  }

  let filtered = words.filter(w =>
    w.word.toLowerCase().includes(search.toLowerCase()) ||
    (w.translation && w.translation.toLowerCase().includes(search.toLowerCase()))
  )
  if (selectedTag) filtered = filtered.filter(w => (w.tags || []).includes(selectedTag))

  return (
    <div className="px-5 pb-4">
      <div className="mb-5">
        <h2 className="text-3xl font-serif italic text-stone-800 dark:text-white">{t.myWords}</h2>
        {words.length > 0 && (
          <p className="text-stone-400 text-sm mt-1">{words.length} {words.length > 1 ? t.wordsPlural : t.words}</p>
        )}
      </div>

      {/* Search + tags in one line */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar">
        <div className="relative shrink-0">
          <svg className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder={t.search} value={search} onChange={e => setSearch(e.target.value)}
            className="w-36 bg-white dark:bg-white/5 text-stone-800 dark:text-slate-100 text-sm rounded-full pl-8 pr-3 py-1.5 border border-stone-200 dark:border-white/10 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 focus:outline-none transition-all placeholder:text-stone-300" />
        </div>
        {allTags.length > 0 && (
          <>
            <div className="w-px h-5 bg-stone-200 dark:bg-white/10 shrink-0" />
            <button onClick={() => setSelectedTag(null)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all shrink-0 ${
                !selectedTag ? 'bg-violet-600 text-white' : 'bg-stone-100 dark:bg-white/5 text-stone-400'}`}>
              Tous
            </button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all shrink-0 ${
                  selectedTag === tag ? 'bg-violet-600 text-white' : 'bg-stone-100 dark:bg-white/5 text-stone-400'}`}>
                {tag}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Words cloud */}
      <div className="flex flex-wrap gap-1.5 stagger-grid">
        {/* Add button */}
        {!showAdd ? (
          <button onClick={() => setShowAdd(true)}
            className="border border-dashed border-stone-300 dark:border-white/15 hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/5 text-stone-400 hover:text-violet-600 rounded-full px-3.5 py-1.5 transition-all flex items-center gap-1.5 active:scale-95">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span className="text-sm font-medium">{t.addWord}</span>
          </button>
        ) : (
          <form onSubmit={handleAddWord} className="flex items-center gap-1 bg-white dark:bg-white/5 border border-violet-300 dark:border-violet-500/30 rounded-full pl-3 pr-1 py-0.5 animate-fade-in">
            <input ref={inputRef} type="text" placeholder={t.wordPlaceholder} value={newWord} onChange={e => setNewWord(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') { setShowAdd(false); setNewWord('') } }}
              className="w-20 bg-transparent text-stone-800 dark:text-slate-100 text-sm font-medium py-1 focus:outline-none placeholder:text-stone-300" />
            {adding ? <span className="w-4 h-4 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin shrink-0 mr-1" />
            : <>
              <button type="submit" disabled={!newWord.trim()} className="text-violet-500 disabled:opacity-30 p-1 transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              </button>
              <button type="button" onClick={() => { setShowAdd(false); setNewWord('') }} className="text-stone-400 p-1 transition-colors shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </>}
          </form>
        )}

        {filtered.map(w => (
          <button key={w.word} onClick={() => handleWordTap(w)}
            className="group bg-white dark:bg-white/[0.03] border border-stone-200/60 dark:border-white/5 hover:border-violet-300 dark:hover:border-violet-500/20 active:scale-[0.95] rounded-full px-3.5 py-1.5 transition-all animate-fade-in hover:shadow-sm">
            <span className="font-semibold text-stone-700 dark:text-slate-100 text-sm">{w.word.toLowerCase()}</span>
            {w.translation && <span className="text-violet-500 dark:text-violet-400 text-xs ml-1.5 opacity-70 group-hover:opacity-100 transition-opacity">{w.translation.toLowerCase()}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 && words.length > 0 && (
        <div className="text-center py-12"><p className="text-stone-400 text-sm">{t.noResult}</p></div>
      )}
      {words.length === 0 && (
        <div className="text-center py-16">
          <p className="text-2xl mb-2">✨</p>
          <p className="text-stone-400 text-sm">{t.addFirstWord}</p>
        </div>
      )}

      {selected && (
        <WordPopup word={selected.word} data={selected.data} loading={false} saved={true} alreadySaved={true}
          onSave={() => {}} onClose={() => setSelected(null)} onDelete={() => handleDelete(selected.word)} showDelete onUpdate={refresh} />
      )}
    </div>
  )
}
