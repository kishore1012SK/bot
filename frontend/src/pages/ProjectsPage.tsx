import React, { useState } from 'react'
import { api } from '../services/api'
import { FolderGit2, Sparkles, Clock, Layers, ChevronRight, Loader2, X } from 'lucide-react'

const DIFFICULTY_CONFIG = {
  Beginner:     { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
  Intermediate: { color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/30' },
  Advanced:     { color: 'text-red-400',      bg: 'bg-red-500/15',     border: 'border-red-500/30' },
}
const SKILL_OPTIONS = ['Python','JavaScript','TypeScript','React','Node.js','Java','C++','SQL','Docker','FastAPI','Machine Learning','Data Analysis']

export default function ProjectsPage() {
  const [skills, setSkills] = useState<string[]>([])
  const [difficulty, setDifficulty] = useState('Intermediate')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const toggleSkill = (s: string) => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const handleRecommend = async () => {
    if (!skills.length) { setError('Select at least one skill.'); return }
    setLoading(true); setError(''); setResult(null)
    try { setResult(await api.projects.recommend(skills, difficulty)) }
    catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const projects = result?.recommended_projects?.projects || []

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FolderGit2 className="w-6 h-6 text-brand-400"/>Project Ideas</h1>
        <p className="text-gray-400 text-sm mt-1">Get AI-generated project recommendations matched to your skill profile.</p>
      </div>
      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex justify-between">{error}<button onClick={()=>setError('')}><X className="w-4 h-4"/></button></div>}

      <div className="glass-card p-6 space-y-5">
        <div>
          <p className="text-sm font-medium text-gray-300 mb-2">Select Your Skills</p>
          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map(s=>(
              <button key={s} onClick={()=>toggleSkill(s)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${skills.includes(s)?'bg-brand-500/20 border-brand-500/40 text-brand-300':'bg-surface-700/50 border-white/[0.06] text-gray-400 hover:border-white/20'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-300 mb-2">Difficulty Level</p>
          <div className="flex gap-3">
            {(['Beginner','Intermediate','Advanced'] as const).map(d=>{
              const cfg = DIFFICULTY_CONFIG[d]
              return (
                <button key={d} onClick={()=>setDifficulty(d)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${difficulty===d?`${cfg.bg} ${cfg.border} ${cfg.color}`:'bg-surface-700/50 border-white/[0.06] text-gray-400'}`}>
                  {d}
                </button>
              )
            })}
          </div>
        </div>

        <button onClick={handleRecommend} disabled={loading||!skills.length} className="brand-button flex items-center gap-2">
          {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Generating ideas…</>:<><Sparkles className="w-4 h-4"/>Recommend Projects</>}
        </button>
      </div>

      {projects.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          {projects.map((proj:any, i:number)=>(
            <div key={i} className="glass-card p-6 space-y-4 hover:border-brand-500/20 border border-transparent transition-all">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-white text-lg">{proj.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{proj.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className={`badge border ${DIFFICULTY_CONFIG[proj.difficulty_rating as keyof typeof DIFFICULTY_CONFIG]?.bg||'bg-surface-600'} ${DIFFICULTY_CONFIG[proj.difficulty_rating as keyof typeof DIFFICULTY_CONFIG]?.border||'border-white/10'} ${DIFFICULTY_CONFIG[proj.difficulty_rating as keyof typeof DIFFICULTY_CONFIG]?.color||'text-gray-400'}`}>
                    {proj.difficulty_rating}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3"/>{proj.estimated_hours}h
                  </div>
                </div>
              </div>

              {/* Tech stack */}
              <div className="flex items-center gap-2 flex-wrap">
                <Layers className="w-3.5 h-3.5 text-gray-500 shrink-0"/>
                {(proj.stack||[]).map((tech:string)=>(
                  <span key={tech} className="text-xs px-2.5 py-1 rounded-lg bg-surface-600 text-gray-300 border border-white/[0.06]">{tech}</span>
                ))}
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                {(proj.milestones||[]).map((m:any,j:number)=>(
                  <div key={j} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-xs font-bold shrink-0 mt-0.5">{j+1}</span>
                    <div>
                      <span className="text-sm font-medium text-white">{m.step}</span>
                      <p className="text-xs text-gray-400 mt-0.5">{m.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
