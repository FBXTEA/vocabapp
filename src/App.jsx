import { useState, useEffect } from 'react'
import ReaderView from './components/ReaderView'
import WordListView from './components/WordListView'
import FlashcardsView from './components/FlashcardsView'
import HomeView from './components/HomeView'
import SettingsView from './components/SettingsView'
import { getSettings, getWordsToReview, saveWord, migrateAutoTags } from './utils/storage'
import { I18nContext, getTranslations } from './utils/i18n'
import { parseShareLink } from './utils/share'

export default function App() {
  const [tab, setTab] = useState('home')
  const [showSettings, setShowSettings] = useState(false)
  const [readerText, setReaderText] = useState(null)
  const [readerTitle, setReaderTitle] = useState('')
  const [dark, setDark] = useState(() => getSettings().darkMode)
  const [lang, setLang] = useState(() => getSettings().lang || 'fr')
  const t = getTranslations(lang)
  const settings = getSettings()
  const initials = [settings.firstName, settings.lastName]
    .filter(Boolean).map(n => n[0]?.toUpperCase()).join('')
  const dueCount = getWordsToReview().length

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  // Migrate: auto-tag existing words without tags
  useEffect(() => { migrateAutoTags() }, [])

  // Handle shared word lists via URL
  useEffect(() => {
    const shared = parseShareLink()
    if (shared && shared.length > 0) {
      const count = shared.reduce((n, w) => {
        return saveWord({ word: w.word, translation: w.translation, synonyms: w.synonyms, tags: w.tags, definition: null }) ? n + 1 : n
      }, 0)
      if (count > 0) {
        alert(`${count} mot${count > 1 ? 's' : ''} importe${count > 1 ? 's' : ''} !`)
        setTab('words')
      }
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  function openReader(title, text) { setReaderTitle(title); setReaderText(text) }
  function closeReader() { setReaderText(null); setReaderTitle('') }

  const tabs = [
    { id: 'home', label: t.myBooks, icon: (active) => (
      <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    )},
    { id: 'words', label: t.myWords, icon: (active) => (
      <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    )},
    { id: 'flashcards', label: t.flashcards, icon: (active) => (
      <svg className="w-[22px] h-[22px]" fill={active ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25-9.75 5.25-9.75-5.25 4.179-2.25" />
      </svg>
    )},
  ]

  if (readerText) {
    return (
      <I18nContext.Provider value={t}>
        <ReaderView title={readerTitle} text={readerText} onBack={closeReader} />
      </I18nContext.Provider>
    )
  }

  if (showSettings) {
    return (
      <I18nContext.Provider value={t}>
        <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0c0c0f] text-stone-800 dark:text-slate-100 transition-colors grain">
          <header className="sticky top-0 z-10 bg-[#FAFAF8]/80 dark:bg-[#0c0c0f]/80 backdrop-blur-xl px-5 py-4 flex items-center gap-3">
            <button onClick={() => setShowSettings(false)} className="text-violet-600 dark:text-violet-400 font-semibold flex items-center gap-1 text-sm">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Retour
            </button>
          </header>
          <SettingsView dark={dark} setDark={setDark} lang={lang} setLang={setLang} />
        </div>
      </I18nContext.Provider>
    )
  }

  return (
    <I18nContext.Provider value={t}>
      <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0c0c0f] text-stone-800 dark:text-slate-100 flex flex-col transition-colors grain">
        {/* Top bar */}
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <h1 className="text-xl font-serif italic text-stone-800 dark:text-white">Vocab</h1>
          <button onClick={() => setShowSettings(true)} className="group">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-violet-500/20 group-active:scale-90 transition-transform">
              {initials || (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              )}
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
          <div className="page-enter">
            {tab === 'home' && <HomeView onOpenReader={openReader} />}
            {tab === 'words' && <WordListView />}
            {tab === 'flashcards' && <FlashcardsView />}

          </div>
        </div>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
          <div className="bg-white/90 dark:bg-[#1a1a22]/90 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/30 border border-stone-200/50 dark:border-white/5 flex justify-around py-2 px-1">
            {tabs.map(tb => (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-300 ${
                  tab === tb.id
                    ? 'text-violet-600 dark:text-violet-400'
                    : 'text-stone-400 dark:text-slate-500 active:text-stone-600'
                }`}>
                <div className="relative">
                  {tb.icon(tab === tb.id)}
                  {tb.badge && (
                    <span className="absolute -top-1.5 -right-2.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {tb.badge > 9 ? '9+' : tb.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold tracking-wide transition-all ${tab === tb.id ? 'opacity-100' : 'opacity-60'}`}>{tb.label}</span>
                {tab === tb.id && <div className="absolute -bottom-0.5 w-5 h-0.5 bg-violet-500 rounded-full" />}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </I18nContext.Provider>
  )
}
