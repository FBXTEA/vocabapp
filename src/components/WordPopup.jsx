import { useRef } from 'react'

export default function WordPopup({ word, data, loading, saved, alreadySaved, onSave, onClose }) {
  const audioRef = useRef(null)

  function playAudio() {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70" />
      <div
        className="relative bg-slate-900 w-full max-w-lg rounded-t-3xl p-5 pb-8 max-h-[75vh] overflow-y-auto border-t border-white/10 animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-5" />

        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                {word}
              </h2>
              {data?.definition?.phonetic && (
                <p className="text-slate-500 text-sm mt-0.5 font-mono">{data.definition.phonetic}</p>
              )}
            </div>
            {data?.audioUrl && (
              <>
                <audio ref={audioRef} src={data.audioUrl} preload="auto" />
                <button
                  onClick={playAudio}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 active:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                  title="Prononcer"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                  </svg>
                </button>
              </>
            )}
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-300 p-1.5 rounded-xl hover:bg-white/5 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
          </div>
        )}

        {!loading && data && (
          <>
            {data.translation && (
              <div className="bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-2xl p-4 mb-4 border border-indigo-500/10">
                <p className="text-[10px] text-indigo-300 font-semibold mb-1.5 uppercase tracking-wider">Traduction</p>
                <p className="text-xl font-semibold text-slate-100">{data.translation}</p>
              </div>
            )}

            {data.definition?.meanings?.map((m, i) => (
              <div key={i} className="mb-4">
                <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 px-2 py-1 rounded-lg uppercase tracking-wider">
                  {m.partOfSpeech}
                </span>
                {m.definitions.map((d, j) => (
                  <div key={j} className="mt-2.5 ml-0.5">
                    <p className="text-slate-200 text-[15px] leading-relaxed">{d.definition}</p>
                    {d.example && (
                      <p className="text-slate-500 text-sm mt-1.5 italic border-l-2 border-slate-700 pl-3">
                        "{d.example}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {!data.definition && !data.translation && (
              <p className="text-slate-500 py-6 text-center">Aucune definition trouvee pour ce mot.</p>
            )}

            <button
              onClick={onSave}
              disabled={saved || alreadySaved}
              className={`w-full mt-3 py-3.5 rounded-2xl font-semibold transition-all ${
                saved
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  : alreadySaved
                  ? 'bg-white/5 text-slate-500 border border-white/5'
                  : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/20 active:scale-[0.98]'
              }`}
            >
              {saved ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Sauvegarde
                </span>
              ) : alreadySaved ? 'Deja dans ta liste' : 'Sauvegarder ce mot'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
