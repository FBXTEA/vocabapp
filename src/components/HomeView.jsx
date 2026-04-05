import { useState, useRef } from 'react'
import { parseFile } from '../utils/fileParser'
import { getSavedTexts, saveText, deleteText, renameText } from '../utils/storage'
import { useT } from '../utils/i18n'

export default function HomeView({ onOpenReader }) {
  const t = useT()
  const [texts, setTexts] = useState(() => getSavedTexts())
  const [showPaste, setShowPaste] = useState(false)
  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteContent, setPasteContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const fileRef = useRef()

  async function importFile(file) {
    if (!file) return
    setLoading(true)
    try {
      const content = await parseFile(file)
      saveText(file.name.replace(/\.[^.]+$/, ''), content)
      setTexts(getSavedTexts())
    } catch (err) { alert(`Erreur: ${err.message}`) }
    finally { setLoading(false) }
  }

  async function handleFile(e) { await importFile(e.target.files?.[0]); e.target.value = '' }
  function handleDragOver(e) { e.preventDefault(); setDragging(true) }
  function handleDragLeave(e) { e.preventDefault(); setDragging(false) }
  async function handleDrop(e) { e.preventDefault(); setDragging(false); await importFile(e.dataTransfer.files?.[0]) }
  function closePaste() { setShowPaste(false); setPasteTitle(''); setPasteContent('') }
  function handlePasteSubmit() {
    if (!pasteContent.trim()) return
    saveText(pasteTitle.trim() || 'Texte sans titre', pasteContent)
    setTexts(getSavedTexts()); closePaste()
  }
  function handleDelete(id) { deleteText(id); setTexts(getSavedTexts()) }
  function startRename(txt) { setEditingId(txt.id); setEditTitle(txt.title) }
  function submitRename(id) {
    if (editTitle.trim()) { renameText(id, editTitle.trim()); setTexts(getSavedTexts()) }
    setEditingId(null)
  }

  return (
    <div className="px-5 pb-4" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {/* Hero section */}
      <div className="mb-6">
        <h2 className="text-3xl font-serif italic text-stone-800 dark:text-white leading-tight">
          {t.myBooks}
        </h2>
        <p className="text-stone-400 text-sm mt-1">{t.importAndRead}</p>
      </div>

      {/* Drop overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 bg-violet-50/95 dark:bg-violet-950/95 flex items-center justify-center">
          <div className="text-center animate-float">
            <div className="w-20 h-20 rounded-3xl bg-white dark:bg-white/10 shadow-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-violet-700 dark:text-violet-300">{t.dropFileHere}</p>
            <p className="text-violet-400 text-sm mt-1">{t.dropFormats}</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => fileRef.current?.click()} disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-sm font-medium py-2.5 px-5 rounded-full transition-all disabled:opacity-50 flex items-center gap-2 shadow-md shadow-violet-500/20 active:scale-95">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
          {loading ? t.loading : t.import}
        </button>
        <button onClick={() => setShowPaste(!showPaste)}
          className="bg-white dark:bg-white/5 text-stone-600 dark:text-slate-300 text-sm font-medium py-2.5 px-5 rounded-full border border-stone-200 dark:border-white/10 transition-all active:scale-95 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          {t.paste}
        </button>
        <input ref={fileRef} type="file" accept=".txt,.pdf,.epub" onChange={handleFile} className="hidden" />
      </div>

      {/* Paste zone */}
      {showPaste && (
        <div className="mb-6 bg-white dark:bg-white/5 rounded-2xl p-4 border border-stone-200/80 dark:border-white/10 animate-fade-in relative shadow-sm">
          <button onClick={closePaste} className="absolute top-3 right-3 text-stone-300 hover:text-stone-500 p-1 rounded-lg transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <input type="text" placeholder={t.titleOptional} value={pasteTitle} onChange={e => setPasteTitle(e.target.value)}
            className="w-full bg-stone-50 dark:bg-white/5 text-stone-800 dark:text-slate-100 rounded-xl px-4 py-2.5 mb-3 border border-stone-200 dark:border-white/10 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 focus:outline-none transition-all placeholder:text-stone-300" />
          <textarea placeholder={t.pasteTextHere} value={pasteContent} onChange={e => setPasteContent(e.target.value)} rows={5}
            className="w-full bg-stone-50 dark:bg-white/5 text-stone-800 dark:text-slate-100 rounded-xl px-4 py-2.5 mb-3 border border-stone-200 dark:border-white/10 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/10 focus:outline-none resize-none transition-all placeholder:text-stone-300" />
          <button onClick={handlePasteSubmit} disabled={!pasteContent.trim()}
            className="w-full bg-violet-600 text-white font-medium py-2.5 rounded-xl disabled:opacity-30 transition-all active:scale-[0.98]">
            {t.add}
          </button>
        </div>
      )}

      {/* Library */}
      {texts.length === 0 ? (
        <div className="text-center py-20 animate-fade-in">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-500/10 dark:to-fuchsia-500/10 flex items-center justify-center mx-auto mb-5 shadow-sm">
            <svg className="w-10 h-10 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-stone-500 font-medium text-lg">{t.noText}</p>
          <p className="text-stone-400 text-sm mt-1">{t.importOrPaste}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {texts.map((txt, i) => (
            <div key={txt.id}
              className="group bg-white dark:bg-white/[0.03] rounded-2xl p-4 border border-stone-200/60 dark:border-white/5 hover:border-violet-200 dark:hover:border-violet-500/20 flex items-center gap-3.5 transition-all animate-fade-in hover:shadow-sm cursor-pointer"
              style={{ animationDelay: `${i * 50}ms` }}>
              {/* Book spine decoration */}
              <div className="w-1 h-12 rounded-full bg-gradient-to-b from-violet-400 to-fuchsia-400 shrink-0" />
              <div className="flex-1 min-w-0">
                {editingId === txt.id ? (
                  <form onSubmit={e => { e.preventDefault(); submitRename(txt.id) }}>
                    <input type="text" value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus
                      onBlur={() => submitRename(txt.id)}
                      onKeyDown={e => { if (e.key === 'Escape') setEditingId(null) }}
                      className="w-full bg-violet-50 dark:bg-white/5 text-stone-800 dark:text-slate-100 text-sm font-semibold rounded-lg px-2 py-1 border border-violet-300 dark:border-violet-500/30 focus:outline-none" />
                  </form>
                ) : (
                  <button onClick={() => onOpenReader(txt.title, txt.content)} className="text-left w-full">
                    <h3 className="font-semibold text-stone-700 dark:text-slate-200 truncate text-[15px]">{txt.title}</h3>
                    <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5 truncate leading-relaxed">{txt.content.slice(0, 80).trim()}</p>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-all">
                <button onClick={() => startRename(txt)}
                  className="text-stone-300 dark:text-slate-600 hover:text-violet-500 p-1.5 rounded-lg transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                </button>
                <button onClick={() => handleDelete(txt.id)}
                  className="text-stone-300 dark:text-slate-600 hover:text-rose-500 p-1.5 rounded-lg transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
