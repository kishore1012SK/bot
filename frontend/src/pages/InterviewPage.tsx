import { useState } from 'react'
import { api } from '../services/api'
import { Mic, Play, Send, CheckCircle, AlertCircle, Loader2, X, Bot, User } from 'lucide-react'

type InterviewType = 'Technical' | 'HR' | 'Coding'

const TYPE_CONFIG = {
  Technical: { color: 'text-brand-400', bg: 'bg-brand-500/15', border: 'border-brand-500/30', desc: 'Algorithms, system design, and architecture questions.' },
  HR: { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', desc: 'Behavioral, situational, and culture-fit questions.' },
  Coding: { color: 'text-purple-400', bg: 'bg-purple-500/15', border: 'border-purple-500/30', desc: 'Live coding problems with step-by-step analysis.' },
}

export default function InterviewPage() {
  const [type, setType] = useState<InterviewType>('Technical')
  const [session, setSession] = useState<any>(null)
  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const startInterview = async () => {
    setLoading(true); setError('')
    try { setSession(await api.interview.start(type)) }
    catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  const submitAnswer = async () => {
    if (!answer.trim() || !session) return
    setSubmitting(true); setError('')
    const myAnswer = answer; setAnswer('')
    try { setSession(await api.interview.answer(session.id, myAnswer)) }
    catch (e: any) { setError(e.message) }
    setSubmitting(false)
  }

  const reset = () => { setSession(null); setAnswer(''); setError('') }

  if (!session) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Mic className="w-6 h-6 text-brand-400"/>Interview Assistant</h1>
          <p className="text-gray-400 text-sm mt-1">Practice with an AI interviewer. Get real feedback and scores.</p>
        </div>
        {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(TYPE_CONFIG) as InterviewType[]).map(t => {
            const cfg = TYPE_CONFIG[t]
            return (
              <button key={t} onClick={()=>setType(t)}
                className={`glass-card p-5 text-left space-y-2 border-2 transition-all hover:scale-[1.02] ${type===t?`${cfg.border} ${cfg.bg}`:'border-transparent'}`}>
                <span className={`font-semibold ${cfg.color}`}>{t}</span>
                <p className="text-xs text-gray-400">{cfg.desc}</p>
              </button>
            )
          })}
        </div>
        <button onClick={startInterview} disabled={loading} className="brand-button flex items-center gap-2">
          {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Starting…</>:<><Play className="w-4 h-4"/>Start {type} Interview</>}
        </button>
      </div>
    )
  }

  if (session.is_completed) {
    const fb = session.feedback || {}
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
        <div className="glass-card p-6 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-emerald-400"/>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Interview Complete!</h2>
            <p className="text-gray-400 text-sm mt-1">{session.type} Interview — Final Report</p>
          </div>
          <div className="inline-block">
            <div className="text-5xl font-black text-brand-400">{session.score}<span className="text-xl text-gray-500">/100</span></div>
          </div>
        </div>
        <div className="glass-card p-6 space-y-4">
          <p className="text-gray-300 text-sm">{fb.general_summary}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-emerald-400 font-medium mb-2">Strengths</p>
              <ul className="space-y-1">{(fb.strengths||[]).map((s:string,i:number)=><li key={i} className="text-xs text-gray-300 flex items-start gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0"/>{s}</li>)}</ul>
            </div>
            <div>
              <p className="text-xs text-amber-400 font-medium mb-2">Areas to Improve</p>
              <ul className="space-y-1">{(fb.improvements||[]).map((s:string,i:number)=><li key={i} className="text-xs text-gray-300 flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0"/>{s}</li>)}</ul>
            </div>
          </div>
        </div>
        <button onClick={reset} className="brand-button">Start New Interview</button>
      </div>
    )
  }

  const history = session.chat_history || []
  const progress = Math.round((history.length / 10) * 100)

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-white flex items-center gap-2"><Mic className="w-5 h-5 text-brand-400"/>{session.type} Interview</h1>
          <p className="text-xs text-gray-500 mt-0.5">Question {Math.ceil(history.length/2)} of 5</p>
        </div>
        <button onClick={reset} className="glass-button text-sm flex items-center gap-1.5"><X className="w-3.5 h-3.5"/>End</button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-surface-700 overflow-hidden">
        <div className="h-full bg-brand-gradient rounded-full transition-all duration-500" style={{width:`${progress}%`}}/>
      </div>

      {/* Chat history */}
      <div className="glass-card p-4 space-y-4 max-h-96 overflow-y-auto">
        {history.map((m:any,i:number)=>(
          <div key={i} className={`flex gap-3 ${m.role==='user'?'flex-row-reverse':''}`}>
            <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${m.role==='user'?'bg-brand-500/30':'bg-surface-600'}`}>
              {m.role==='user'?<User className="w-3.5 h-3.5 text-brand-300"/>:<Bot className="w-3.5 h-3.5 text-purple-300"/>}
            </div>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${m.role==='user'?'bg-brand-600/30 border border-brand-500/30 text-gray-100 rounded-tr-sm':'bg-surface-700 border border-white/[0.06] text-gray-200 rounded-tl-sm'}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

      {/* Answer input */}
      <div className="glass-card p-3 flex items-end gap-3">
        <textarea rows={3} value={answer} onChange={e=>setAnswer(e.target.value)}
          placeholder="Type your answer…"
          className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-600 text-sm resize-none"/>
        <button onClick={submitAnswer} disabled={!answer.trim()||submitting} className="brand-button p-2.5 rounded-xl shrink-0">
          {submitting?<Loader2 className="w-4 h-4 animate-spin"/>:<Send className="w-4 h-4"/>}
        </button>
      </div>
    </div>
  )
}
