import { useState, useRef } from 'react'
import { api } from '../services/api'
import { FileText, Upload, Loader2, Star, AlertCircle, CheckCircle, Lightbulb, X } from 'lucide-react'

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  const r = 42, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle cx="55" cy="55" r={r} fill="none" stroke="#1a1b24" strokeWidth="10" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
          strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s ease' }} />
        <text x="55" y="60" textAnchor="middle" fill={color} fontSize="22" fontWeight="700">{score}</text>
      </svg>
      <span className="text-sm font-medium" style={{ color }}>{score >= 75 ? 'Strong' : score >= 50 ? 'Average' : 'Needs Work'}</span>
    </div>
  )
}

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File | null) => {
    if (!f) return
    const ext = f.name.split('.').pop()?.toLowerCase()
    if (!['pdf','docx'].includes(ext||'')) { setError('Only PDF and DOCX files are supported.'); return }
    setFile(f); setError('')
  }

  const handleAnalyze = async () => {
    if (!file) return
    setLoading(true); setResult(null); setError('')
    const fd = new FormData(); fd.append('file', file)
    try { setResult(await api.resume.analyze(fd)) }
    catch (e: any) { setError(e.message) }
    setLoading(false)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FileText className="w-6 h-6 text-brand-400"/>Resume Analyzer</h1>
        <p className="text-gray-400 text-sm mt-1">Upload your resume for an AI-powered skills extraction and improvement score.</p>
      </div>

      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex justify-between">{error}<button onClick={()=>setError('')}><X className="w-4 h-4"/></button></div>}

      {!result ? (
        <div className="glass-card p-8 max-w-xl mx-auto space-y-6">
          <div
            onDragOver={e=>{e.preventDefault();setDragOver(true)}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0])}}
            onClick={()=>fileRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${dragOver?'border-brand-500 bg-brand-500/10':'border-white/[0.10] hover:border-brand-500/40'}`}
          >
            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3"/>
            <p className="text-gray-300 font-medium">Drop your resume here</p>
            <p className="text-sm text-gray-500 mt-1">PDF or DOCX — max 10 MB</p>
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.docx" className="hidden" onChange={e=>handleFile(e.target.files?.[0]||null)}/>

          {file && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-brand-500/10 border border-brand-500/20">
              <FileText className="w-5 h-5 text-brand-400 shrink-0"/>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size/1024).toFixed(1)} KB</p>
              </div>
              <button onClick={()=>setFile(null)}><X className="w-4 h-4 text-gray-500"/></button>
            </div>
          )}

          <button onClick={handleAnalyze} disabled={!file||loading} className="brand-button w-full flex items-center justify-center gap-2">
            {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Analyzing resume…</>:<><Star className="w-4 h-4"/>Analyze Resume</>}
          </button>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <button onClick={()=>setResult(null)} className="glass-button text-sm">← Analyze Another</button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score */}
            <div className="glass-card p-6 flex flex-col items-center justify-center gap-4">
              <h2 className="font-semibold text-white">Overall Score</h2>
              <ScoreRing score={result.score}/>
              <p className="text-xs text-gray-500 text-center">{result.resume_name}</p>
            </div>

            {/* Skills */}
            <div className="glass-card p-6 space-y-3 lg:col-span-2">
              <h2 className="font-semibold text-white flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400"/>Extracted Skills</h2>
              <div className="flex flex-wrap gap-2">
                {(result.skills||[]).map((s:string)=>(
                  <span key={s} className="px-3 py-1.5 rounded-xl text-sm bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{s}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(result.suggestions||{}).map(([key, items]:any)=>(
              <div key={key} className="glass-card p-5 space-y-3">
                <h3 className="font-medium text-white capitalize flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400"/>
                  {key.replace(/_/g,' ')}
                </h3>
                <ul className="space-y-2">
                  {(Array.isArray(items)?items:[]).map((item:string,i:number)=>(
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0"/>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
