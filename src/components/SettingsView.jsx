import { useState, useRef } from 'react'
import { getSettings, saveSettings, getSavedWords, getSavedTexts } from '../utils/storage'
import { useT, LANGUAGES } from '../utils/i18n'

export default function SettingsView({ dark, setDark, lang, setLang }) {
  const t = useT()
  const [profile, setProfile] = useState(() => {
    const s = getSettings()
    return { firstName: s.firstName || '', lastName: s.lastName || '', username: s.username || '', email: s.email || '' }
  })
  const [profileSaved, setProfileSaved] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const importRef = useRef()

  function toggleDark() {
    const newDark = !dark
    setDark(newDark)
    saveSettings({ ...getSettings(), darkMode: newDark })
  }

  function updateProfile(field, value) {
    setProfile(p => ({ ...p, [field]: value }))
    setProfileSaved(false)
  }

  function saveProfile() {
    saveSettings({ ...getSettings(), ...profile })
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  function handleExport() {
    const data = {
      words: getSavedWords(),
      texts: getSavedTexts(),
      settings: getSettings(),
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vocabapp-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 2000)
  }

  function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result)
        if (data.words) localStorage.setItem('vocabapp_words', JSON.stringify(data.words))
        if (data.texts) localStorage.setItem('vocabapp_texts', JSON.stringify(data.texts))
        if (data.settings) {
          const current = getSettings()
          saveSettings({ ...current, ...data.settings })
        }
        setImportDone(true)
        setTimeout(() => { setImportDone(false); window.location.reload() }, 1500)
      } catch {
        alert('Fichier invalide')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleExportCSV() {
    const words = getSavedWords()
    const header = 'mot,traduction,synonymes,tags\n'
    const rows = words.map(w => {
      const syns = (w.synonyms || []).join(' | ')
      const tags = (w.tags || []).join(' | ')
      return `"${w.word}","${w.translation || ''}","${syns}","${tags}"`
    }).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vocabapp-mots-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const inputClass = "w-full bg-stone-50 dark:bg-white/5 text-stone-800 dark:text-slate-100 text-sm rounded-xl px-3 py-2.5 border border-stone-200 dark:border-white/10 focus:border-violet-400 focus:ring-2 focus:ring-violet-400/20 focus:outline-none transition-all placeholder:text-stone-400"

  return (
    <div className="p-5">
      <div className="text-center mb-8 pt-2">
        <h1 className="text-3xl font-extrabold text-stone-800 dark:text-white">{t.settings}</h1>
      </div>

      <div className="space-y-3">
        {/* Profile */}
        <div className="bg-white dark:bg-white/5 rounded-2xl border border-stone-200 dark:border-white/10 overflow-hidden">
          <button onClick={() => setProfileOpen(!profileOpen)}
            className="w-full p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-semibold text-stone-800 dark:text-slate-100">{t.profile}</p>
                {!profileOpen && profile.firstName && (
                  <p className="text-xs text-stone-400">{profile.firstName} {profile.lastName}</p>
                )}
              </div>
            </div>
            <svg className={`w-5 h-5 text-stone-400 transition-transform ${profileOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          {profileOpen && (
            <div className="px-4 pb-4 space-y-2.5 animate-fade-in">
              <div className="flex gap-2">
                <input type="text" placeholder={t.firstName} value={profile.firstName} onChange={e => updateProfile('firstName', e.target.value)} className={inputClass} />
                <input type="text" placeholder={t.lastName} value={profile.lastName} onChange={e => updateProfile('lastName', e.target.value)} className={inputClass} />
              </div>
              <input type="text" placeholder={t.username} value={profile.username} onChange={e => updateProfile('username', e.target.value)} className={inputClass} />
              <input type="email" placeholder={t.email} value={profile.email} onChange={e => updateProfile('email', e.target.value)} className={inputClass} />
              <button onClick={saveProfile}
                className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                  profileSaved ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-violet-600 hover:bg-violet-500 text-white'}`}>
                {profileSaved ? t.profileSaved : t.save}
              </button>
            </div>
          )}
        </div>

        {/* Export / Import */}
        <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-stone-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </div>
            <p className="font-semibold text-stone-800 dark:text-slate-100">Exporter / Importer</p>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button onClick={handleExport}
              className={`py-2.5 rounded-xl font-medium text-sm transition-all ${
                exportDone ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-slate-300 hover:bg-stone-200'}`}>
              {exportDone ? 'Exporte !' : 'Exporter JSON'}
            </button>
            <button onClick={handleExportCSV}
              className="py-2.5 rounded-xl font-medium text-sm bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-slate-300 hover:bg-stone-200 transition-all">
              Exporter CSV
            </button>
          </div>
          <button onClick={() => importRef.current?.click()}
            className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
              importDone ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-indigo-50 dark:bg-violet-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'}`}>
            {importDone ? 'Importe ! Rechargement...' : 'Importer un fichier JSON'}
          </button>
          <input ref={importRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <p className="text-[11px] text-stone-400 mt-2 text-center">L'export JSON contient tous tes mots, textes et reglages</p>
        </div>

        {/* Dark mode */}
        <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-stone-200 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/10 flex items-center justify-center">
              {dark ? (
                <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-semibold text-stone-800 dark:text-slate-100">{t.darkTheme}</p>
              <p className="text-sm text-stone-500 dark:text-slate-400">{dark ? t.enabled : t.disabled}</p>
            </div>
          </div>
          <button onClick={toggleDark}
            className={`w-12 h-7 rounded-full transition-colors relative ${dark ? 'bg-violet-500' : 'bg-stone-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${dark ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Language - coming soon */}
        <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-stone-200 dark:border-white/10 opacity-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-stone-800 dark:text-slate-100">{t.language}</p>
                <p className="text-sm text-stone-500 dark:text-slate-400">{t.comingSoon}</p>
              </div>
            </div>
            <span className="text-xs font-medium text-violet-500 bg-indigo-50 dark:bg-violet-500/10 px-2 py-1 rounded-lg">Soon</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(l => (
              <span key={l.code}
                className={`text-sm px-3 py-1.5 rounded-xl font-medium flex items-center gap-1.5 ${
                  l.code === 'fr' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-stone-100 dark:bg-white/5 text-stone-600 dark:text-slate-300'}`}>
                <span>{l.flag}</span>
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Share - coming soon */}
        <div className="bg-white dark:bg-white/5 rounded-2xl p-4 border border-stone-200 dark:border-white/10 flex items-center justify-between opacity-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-white/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-stone-800 dark:text-slate-100">{t.shareWords}</p>
              <p className="text-sm text-stone-500 dark:text-slate-400">{t.comingSoon}</p>
            </div>
          </div>
          <span className="text-xs font-medium text-violet-500 bg-indigo-50 dark:bg-violet-500/10 px-2 py-1 rounded-lg">Soon</span>
        </div>
      </div>
    </div>
  )
}
