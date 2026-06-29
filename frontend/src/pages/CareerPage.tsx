import React, { useState } from 'react'
import { api } from '../services/api'
import { TrendingUp, Loader2, CheckCircle, ChevronRight, BookOpen, Map, X } from 'lucide-react'

const SKILL_OPTIONS = ['Python','JavaScript','TypeScript','React','Node.js','Java','C++','SQL','Docker','Kubernetes','AWS','Machine Learning','Data Analysis','FastAPI','Spring Boot']

export default function CareerPage() {
  const [skills, setSkills] = useState<string[]>([])
  const [customSkill, setCustomSkill] = useState('')
  const [interests, setInterests] = useState('')
  const [experience, setExperience] = useState(1)
  const [workType, setWorkType] = useState('Hybrid')
  const [goals, setGoals] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const toggleSkill = (s: string) => setSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s])

  const addCustom = () => {
    if (customSkill.trim() && !skills.includes(customSkill.trim())) {
      setSkills(p => [...p, customSkill.trim()])
      setCustomSkill('')
    }
  }

  const handleSubmit = async () => {
    if (!skills.length || !goals.trim()) { setError('Please select skills and enter your goals.'); return }
    setLoading(true); setError(''); setResult(null)
    try {
      const data = await api.career.assess({
        skills, interests: interests.split(',').map(s=>s.trim()).filter(Boolean),
        experience_years: experience, preferred_work_type: workType, goals
      })
      setResult((data as any).results)
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><TrendingUp className="w-6 h-6 text-brand-400" />Career Guidance</h1>
        <p className="text-gray-400 text-sm mt-1">Get an AI-powered career assessment and personalized roadmap.</p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex justify-between">{error}<button onClick={()=>setError('')}><X className="w-4 h-4"/></button></div>}

      {!result ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills */}
          <div className="glass-card p-6 space-y-4 lg:col-span-2">
            <h2 className="font-semibold text-white">Your Skills</h2>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(s => (
                <button key={s} onClick={()=>toggleSkill(s)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${skills.includes(s) ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'bg-surface-700/50 border-white/[0.06] text-gray-400 hover:border-white/20'}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input className="input-field py-2 text-sm" placeholder="Add custom skill…" value={customSkill} onChange={e=>setCustomSkill(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addCustom()} />
              <button onClick={addCustom} className="glass-button px-4">Add</button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {skills.map(s=>(
                  <span key={s} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-brand-500/15 text-brand-300 text-xs border border-brand-500/20">
                    {s}<button onClick={()=>toggleSkill(s)}><X className="w-3 h-3"/></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-semibold text-white">Profile Details</h2>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Interests (comma separated)</label>
              <input className="input-field py-2 text-sm" placeholder="AI, Backend, DevOps…" value={interests} onChange={e=>setInterests(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Years of Experience: {experience}</label>
              <input type="range" min={0} max={20} value={experience} onChange={e=>setExperience(+e.target.value)} className="w-full accent-brand-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Preferred Work Type</label>
              <div className="flex gap-2">
                {['Remote','Hybrid','Onsite'].map(w=>(
                  <button key={w} onClick={()=>setWorkType(w)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${workType===w ? 'bg-brand-500/20 border-brand-500/40 text-brand-300' : 'bg-surface-700/50 border-white/[0.06] text-gray-400'}`}>
                    {w}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <h2 className="font-semibold text-white">Career Goals</h2>
            <textarea className="input-field py-2 text-sm resize-none h-32" placeholder="Describe your career aspirations, target role, timeline…" value={goals} onChange={e=>setGoals(e.target.value)} />
            <button onClick={handleSubmit} disabled={loading} className="brand-button w-full flex items-center justify-center gap-2">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin"/>Generating roadmap…</> : <><TrendingUp className="w-4 h-4"/>Generate Career Roadmap</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <button onClick={()=>setResult(null)} className="glass-button text-sm">← New Assessment</button>

          {/* Recommended roles */}
          <div className="glass-card p-6 space-y-3">
            <h2 className="font-semibold text-white flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400"/>Recommended Career Paths</h2>
            <div className="flex flex-wrap gap-3">
              {(result.recommended_roles||[]).map((r:string,i:number)=>(
                <div key={r} className={`px-4 py-3 rounded-xl border text-sm font-medium ${i===0?'bg-brand-500/20 border-brand-500/40 text-brand-300':'bg-surface-700/50 border-white/[0.08] text-gray-300'}`}>
                  {i===0 && <span className="text-xs text-brand-400 block mb-0.5">Best Match</span>}{r}
                </div>
              ))}
            </div>
          </div>

          {/* Skills gap */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-semibold text-white">Skills Gap Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-emerald-400 font-medium mb-2">Matched Skills</p>
                <div className="flex flex-wrap gap-1.5">{(result.skills_gap_analysis?.matched_skills||[]).map((s:string)=><span key={s} className="badge bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{s}</span>)}</div>
              </div>
              <div>
                <p className="text-xs text-red-400 font-medium mb-2">Missing Skills</p>
                <div className="flex flex-wrap gap-1.5">{(result.skills_gap_analysis?.missing_skills||[]).map((s:string)=><span key={s} className="badge bg-red-500/15 text-red-400 border border-red-500/20">{s}</span>)}</div>
              </div>
            </div>
          </div>

          {/* Roadmap */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-semibold text-white flex items-center gap-2"><Map className="w-4 h-4 text-purple-400"/>Learning Roadmap</h2>
            <div className="space-y-3">
              {(result.milestones_roadmap||[]).map((m:any,i:number)=>(
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-7 h-7 rounded-full bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 text-xs font-bold">{i+1}</div>
                    {i<(result.milestones_roadmap.length-1)&&<div className="w-px flex-1 bg-brand-500/20 mt-1"/>}
                  </div>
                  <div className="pb-4">
                    <p className="font-medium text-white text-sm">{m.phase}</p>
                    <p className="text-xs text-brand-400 mb-2">{m.duration}</p>
                    <ul className="space-y-1">{(m.actions||[]).map((a:string,j:number)=><li key={j} className="text-xs text-gray-300 flex items-start gap-1.5"><ChevronRight className="w-3 h-3 text-brand-400 mt-0.5 shrink-0"/>{a}</li>)}</ul>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Courses */}
          <div className="glass-card p-6 space-y-3">
            <h2 className="font-semibold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-amber-400"/>Recommended Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(result.course_recommendations||[]).map((c:any,i:number)=>(
                <div key={i} className="p-4 rounded-xl bg-surface-700/50 border border-white/[0.06] space-y-2">
                  <p className="font-medium text-white text-sm">{c.title}</p>
                  <p className="text-xs text-amber-400">{c.provider_type}</p>
                  <div className="flex flex-wrap gap-1">{(c.topics||[]).map((t:string)=><span key={t} className="text-xs text-gray-500 bg-surface-600 px-2 py-0.5 rounded">{t}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
