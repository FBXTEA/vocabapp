import { useMemo } from 'react'
import { getStatsData } from '../utils/storage'

export default function StatsView() {
  const stats = useMemo(() => getStatsData(), [])

  return (
    <div className="px-5 pb-4">
      <div className="mb-6">
        <h2 className="text-3xl font-serif italic text-stone-800 dark:text-white">Statistiques</h2>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 rounded-2xl p-4 border border-amber-100 dark:border-amber-500/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🔥</span>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 uppercase tracking-wider">Streak</span>
          </div>
          <p className="text-4xl font-extrabold text-amber-700 dark:text-amber-400">{stats.streak}</p>
          <p className="text-xs text-amber-600/60 dark:text-amber-400/50 mt-0.5">jours d'affilée</p>
        </div>
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-500/10 dark:to-purple-500/10 rounded-2xl p-4 border border-violet-100 dark:border-violet-500/10">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📚</span>
            <span className="text-xs font-medium text-violet-700 dark:text-violet-300 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-4xl font-extrabold text-violet-700 dark:text-violet-400">{stats.totalWords}</p>
          <p className="text-xs text-violet-600/60 dark:text-violet-400/50 mt-0.5">mots sauvegardes</p>
        </div>
      </div>

      {/* Today */}
      <div className="bg-white dark:bg-white/[0.03] rounded-2xl p-4 border border-stone-200/60 dark:border-white/5 mb-4">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">Aujourd'hui</p>
        <div className="flex justify-around">
          <div className="text-center">
            <p className="text-2xl font-extrabold text-stone-800 dark:text-white">{stats.reviewsToday}</p>
            <p className="text-[11px] text-stone-400">revisions</p>
          </div>
          <div className="w-px bg-stone-100 dark:bg-white/5" />
          <div className="text-center">
            <p className="text-2xl font-extrabold text-emerald-500">{stats.successRate}%</p>
            <p className="text-[11px] text-stone-400">reussite</p>
          </div>
          <div className="w-px bg-stone-100 dark:bg-white/5" />
          <div className="text-center">
            <p className="text-2xl font-extrabold text-violet-500">+{stats.addedThisWeek}</p>
            <p className="text-[11px] text-stone-400">cette semaine</p>
          </div>
        </div>
      </div>

      {/* Mastery */}
      <div className="bg-white dark:bg-white/[0.03] rounded-2xl p-4 border border-stone-200/60 dark:border-white/5 mb-4">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">Progression</p>

        <div className="h-2.5 bg-stone-100 dark:bg-white/5 rounded-full overflow-hidden flex mb-5">
          {stats.mastered > 0 && <div className="bg-emerald-400 h-full" style={{ width: `${(stats.mastered / Math.max(stats.totalWords, 1)) * 100}%` }} />}
          {stats.learning > 0 && <div className="bg-amber-400 h-full" style={{ width: `${(stats.learning / Math.max(stats.totalWords, 1)) * 100}%` }} />}
          {stats.newWords > 0 && <div className="bg-stone-200 dark:bg-slate-600 h-full" style={{ width: `${(stats.newWords / Math.max(stats.totalWords, 1)) * 100}%` }} />}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { color: 'bg-emerald-400', label: 'Maitrises', count: stats.mastered },
            { color: 'bg-amber-400', label: 'En cours', count: stats.learning },
            { color: 'bg-stone-200 dark:bg-slate-600', label: 'Nouveaux', count: stats.newWords },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
              <div>
                <p className="text-sm font-bold text-stone-700 dark:text-slate-200">{item.count}</p>
                <p className="text-[10px] text-stone-400">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Due for review */}
      {stats.dueNow > 0 && (
        <div className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-500/10 dark:to-amber-500/10 rounded-2xl p-4 border border-rose-100 dark:border-rose-500/10 flex items-center gap-3 animate-fade-in">
          <span className="text-2xl">⏰</span>
          <div>
            <p className="font-semibold text-rose-700 dark:text-rose-300 text-sm">{stats.dueNow} mot{stats.dueNow > 1 ? 's' : ''} a reviser</p>
            <p className="text-xs text-rose-500/60 dark:text-rose-400/50">Va dans Flashcards !</p>
          </div>
        </div>
      )}
    </div>
  )
}
