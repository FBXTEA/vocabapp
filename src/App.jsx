import { useState } from 'react'
import ReaderView from './components/ReaderView'
import WordListView from './components/WordListView'
import FlashcardsView from './components/FlashcardsView'
import HomeView from './components/HomeView'

const TABS = [
  { id: 'home', label: 'Accueil', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )},
  { id: 'words', label: 'Mes mots', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  )},
  { id: 'flashcards', label: 'Flashcards', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75 6.429 9.75m11.142 0l4.179 2.25-9.75 5.25-9.75-5.25 4.179-2.25" />
    </svg>
  )},
]

export default function App() {
  const [tab, setTab] = useState('home')
  const [readerText, setReaderText] = useState(null)
  const [readerTitle, setReaderTitle] = useState('')

  function openReader(title, text) {
    setReaderTitle(title)
    setReaderText(text)
  }

  function closeReader() {
    setReaderText(null)
    setReaderTitle('')
  }

  if (readerText) {
    return <ReaderView title={readerTitle} text={readerText} onBack={closeReader} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900 text-slate-100 flex flex-col">
      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {tab === 'home' && <HomeView onOpenReader={openReader} />}
        {tab === 'words' && <WordListView />}
        {tab === 'flashcards' && <FlashcardsView />}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/5 flex justify-around py-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 px-5 py-1.5 rounded-2xl transition-all duration-200 ${
              tab === t.id
                ? 'text-indigo-400 bg-indigo-500/10'
                : 'text-slate-500 active:text-slate-300 active:bg-white/5'
            }`}
          >
            {t.icon}
            <span className="text-[10px] font-semibold tracking-wide">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
