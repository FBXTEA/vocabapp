import { useState, useRef } from 'react'
import { parseFile } from '../utils/fileParser'
import { getSavedTexts, saveText, deleteText } from '../utils/storage'

export default function HomeView({ onOpenReader }) {
  const [texts, setTexts] = useState(() => getSavedTexts())
  const [showPaste, setShowPaste] = useState(false)
  const [pasteTitle, setPasteTitle] = useState('')
  const [pasteContent, setPasteContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef()

  async function importFile(file) {
    if (!file) return
    setLoading(true)
    try {
      const content = await parseFile(file)
      const title = file.name.replace(/\.[^.]+$/, '')
      saveText(title, content)
      setTexts(getSavedTexts())
    } catch (err) {
      alert(`Erreur: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  async function handleFile(e) {
    await importFile(e.target.files?.[0])
    e.target.value = ''
  }

  function handleDragOver(e) {
    e.preventDefault()
    setDragging(true)
  }

  function handleDragLeave(e) {
    e.preventDefault()
    setDragging(false)
  }

  async function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    await importFile(e.dataTransfer.files?.[0])
  }

  function handlePasteSubmit() {
    if (!pasteContent.trim()) return
    saveText(pasteTitle.trim() || 'Texte sans titre', pasteContent)
    setTexts(getSavedTexts())
    setPasteTitle('')
    setPasteContent('')
    setShowPaste(false)
  }

  function handleDelete(id) {
    deleteText(id)
    setTexts(getSavedTexts())
  }

  return (
    <div
      className="p-5"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="text-center mb-8 pt-2">
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
          VocabApp
        </h1>
        <p className="text-slate-500 text-sm mt-1">Enrichis ton vocabulaire en lisant</p>
      </div>

      {/* Drop overlay */}
      {dragging && (
        <div className="fixed inset-0 z-50 bg-indigo-950/90 flex items-center justify-center">
          <div className="border-2 border-dashed border-indigo-400/60 rounded-3xl p-16 text-center animate-pulse-soft">
            <svg className="w-12 h-12 text-indigo-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-lg font-semibold text-indigo-300">Lache ton fichier ici</p>
            <p className="text-slate-400 text-sm mt-1">PDF, EPUB ou TXT</p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3 mb-2">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:from-indigo-700 active:to-violet-700 text-white font-semibold py-3.5 px-4 rounded-2xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Chargement...
            </span>
          ) : (
            'Importer un fichier'
          )}
        </button>
        <button
          onClick={() => setShowPaste(!showPaste)}
          className="flex-1 bg-white/5 hover:bg-white/10 active:bg-white/[0.03] text-slate-200 font-semibold py-3.5 px-4 rounded-2xl border border-white/10 transition-all"
        >
          Coller un texte
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.pdf,.epub"
          onChange={handleFile}
          className="hidden"
        />
      </div>

      <p className="text-center text-slate-600 text-xs mb-6">
        Glisse-depose un fichier ou importe-le
      </p>

      {/* Paste zone */}
      {showPaste && (
        <div className="mb-6 bg-white/[0.03] rounded-2xl p-4 border border-white/10 animate-fade-in">
          <input
            type="text"
            placeholder="Titre (optionnel)"
            value={pasteTitle}
            onChange={e => setPasteTitle(e.target.value)}
            className="w-full bg-white/5 text-slate-100 rounded-xl px-4 py-2.5 mb-3 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none transition-all placeholder:text-slate-600"
          />
          <textarea
            placeholder="Colle ton texte anglais ici..."
            value={pasteContent}
            onChange={e => setPasteContent(e.target.value)}
            rows={5}
            className="w-full bg-white/5 text-slate-100 rounded-xl px-4 py-2.5 mb-3 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 focus:outline-none resize-none transition-all placeholder:text-slate-600"
          />
          <button
            onClick={handlePasteSubmit}
            disabled={!pasteContent.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-30 transition-all"
          >
            Ajouter
          </button>
        </div>
      )}

      {/* Text list */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Mes textes</h2>
        {texts.length > 0 && (
          <span className="text-xs text-slate-600 bg-white/5 px-2 py-0.5 rounded-full">{texts.length}</span>
        )}
      </div>

      {texts.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-slate-400 font-medium">Aucun texte</p>
          <p className="text-slate-600 text-sm mt-1">Importe un fichier ou colle un texte pour commencer</p>
        </div>
      ) : (
        <div className="space-y-2">
          {texts.map((t, i) => (
            <div
              key={t.id}
              className="group bg-white/[0.03] hover:bg-white/[0.06] rounded-2xl p-4 border border-white/5 hover:border-white/10 flex items-center gap-3 transition-all animate-fade-in"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <button
                onClick={() => onOpenReader(t.title, t.content)}
                className="flex-1 text-left min-w-0"
              >
                <h3 className="font-semibold text-slate-200 truncate">{t.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                  {t.content.slice(0, 100).trim()}
                </p>
              </button>
              <button
                onClick={() => handleDelete(t.id)}
                className="text-slate-700 hover:text-red-400 p-2 rounded-xl hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
