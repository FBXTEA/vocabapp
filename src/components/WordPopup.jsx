import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useT } from '../utils/i18n'
import { addTagToWord, removeTagFromWord, getAllTags } from '../utils/storage'

export default function WordPopup({ word, data, loading, saved, alreadySaved, onSave, onClose, onDelete, showDelete, onUpdate }) {
  const t = useT()
  const audioRef = useRef(null)
  const [showTagInput, setShowTagInput] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState(data?.tags || [])
  const existingTags = getAllTags()

  function playAudio() {
    if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play() }
  }

  function handleAddTag(tag) {
    const clean = tag.toLowerCase().trim()
    if (!clean || tags.includes(clean)) return
    addTagToWord(word, clean)
    setTags([...tags, clean])
    setTagInput('')
    setShowTagInput(false)
    onUpdate?.()
  }

  function handleRemoveTag(tag) {
    removeTagFromWord(word, tag)
    setTags(tags.filter(t2 => t2 !== tag))
    onUpdate?.()
  }

  const suggestedTags = existingTags.filter(t2 => !tags.includes(t2) && t2.includes(tagInput.toLowerCase()))

  return createPortal(
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 dark:bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-[#FAFAF8] dark:bg-[#1a1a22] w-full max-w-lg mx-auto rounded-t-[28px] shadow-2xl border-t border-stone-200/50 dark:border-white/10">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-stone-300 dark:bg-white/15 rounded-full" />
          </div>

          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-[70vh] px-5 pb-8 no-scrollbar">
            {/* Header */}
            <div className="flex items-start justify-between mb-5 pt-2">
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">{word}</h2>
                  {data?.definition?.phonetic && (
                    <p className="text-stone-400 dark:text-slate-500 text-sm mt-0.5 font-mono">{data.definition.phonetic}</p>
                  )}
                </div>
                {data?.audioUrl && (
                  <>
                    <audio ref={audioRef} src={data.audioUrl} preload="auto" />
                    <button onClick={playAudio}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-violet-600 hover:bg-violet-500 active:scale-95 transition-all shadow-sm"
                      title={t.pronounce}>
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                      </svg>
                    </button>
                  </>
                )}
              </div>
              <button onClick={onClose} className="text-stone-400 hover:text-stone-600 dark:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-stone-100 dark:hover:bg-white/5 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-10">
                <div className="w-8 h-8 border-2 border-violet-200 dark:border-violet-500/30 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin" />
              </div>
            )}

            {!loading && data && (
              <>
                {data.translation && (
                  <div className="bg-violet-50 dark:bg-violet-500/10 rounded-2xl p-4 mb-4 border border-violet-100 dark:border-violet-500/10">
                    <p className="text-[10px] text-violet-500 dark:text-violet-300 font-semibold mb-1.5 uppercase tracking-wider">{t.translation}</p>
                    <p className="text-xl font-semibold text-stone-800 dark:text-slate-100">{data.translation?.toLowerCase()}</p>
                    {data.synonyms?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {data.synonyms.map((s, i) => (
                          <span key={i} className="text-xs text-violet-600 dark:text-violet-300 bg-violet-100/60 dark:bg-violet-500/10 px-2 py-0.5 rounded-lg">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {data.definition?.meanings?.map((m, i) => (
                  <div key={i} className="mb-4">
                    <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-300 bg-violet-50 dark:bg-violet-500/15 px-2 py-1 rounded-lg uppercase tracking-wider">
                      {m.partOfSpeech}
                    </span>
                    {m.definitions.map((d, j) => (
                      <div key={j} className="mt-2.5 ml-0.5">
                        <p className="text-stone-700 dark:text-slate-200 text-[15px] leading-relaxed">{d.definition}</p>
                        {d.example && (
                          <p className="text-stone-400 dark:text-slate-500 text-sm mt-1.5 italic border-l-2 border-stone-200 dark:border-slate-700 pl-3">"{d.example}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {!data.definition && !data.translation && (
                  <p className="text-stone-400 py-6 text-center">{t.noDefinition}</p>
                )}

                {/* Tags */}
                {showDelete && (
                  <div className="mb-4 pt-2 border-t border-stone-100 dark:border-white/5">
                    <p className="text-[10px] text-stone-400 font-semibold mb-2 uppercase tracking-wider">Tags</p>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {tags.map(tag => (
                        <span key={tag} className="text-xs bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-slate-300 px-2 py-1 rounded-lg flex items-center gap-1">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="text-stone-400 hover:text-red-500 transition-colors">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                      {!showTagInput ? (
                        <button onClick={() => setShowTagInput(true)}
                          className="text-xs text-violet-500 px-2 py-1 rounded-lg border border-dashed border-stone-300 dark:border-white/10 hover:border-violet-300 transition-all">
                          + tag
                        </button>
                      ) : (
                        <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter' && tagInput.trim()) handleAddTag(tagInput)
                            if (e.key === 'Escape') { setShowTagInput(false); setTagInput('') }
                          }}
                          placeholder="tag..."
                          className="w-20 text-xs bg-stone-50 dark:bg-white/5 text-stone-800 dark:text-slate-100 rounded-lg px-2 py-1 border border-violet-300 dark:border-violet-500/30 focus:outline-none" />
                      )}
                    </div>
                    {showTagInput && suggestedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {suggestedTags.slice(0, 5).map(tag => (
                          <button key={tag} onClick={() => handleAddTag(tag)}
                            className="text-[11px] text-violet-500 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md transition-colors">
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {showDelete ? (
                  <button onClick={onDelete}
                    className="w-full mt-2 py-3.5 rounded-2xl font-semibold transition-all bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-200 dark:border-red-500/20 active:scale-[0.98] flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    {t.deleteWord}
                  </button>
                ) : (
                  <button onClick={onSave} disabled={saved || alreadySaved}
                    className={`w-full mt-3 py-3.5 rounded-2xl font-semibold transition-all ${
                      saved ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : alreadySaved ? 'bg-stone-50 dark:bg-white/5 text-stone-400 dark:text-slate-500 border border-stone-200 dark:border-white/5'
                      : 'bg-violet-600 hover:bg-violet-500 text-white shadow-sm active:scale-[0.98]'
                    }`}>
                    {saved ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {t.saved}
                      </span>
                    ) : alreadySaved ? t.alreadyInList : t.saveWord}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
