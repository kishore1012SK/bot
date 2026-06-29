import React, { useState, useEffect, useRef } from 'react'
import { api, Document } from '../services/api'
import { Upload, Trash2, Search, Tag, FolderOpen, FileText, Loader2, X, CheckCircle } from 'lucide-react'

const FILE_ICONS: Record<string, string> = {
  pdf: '📄', docx: '📝', doc: '📝', xlsx: '📊', xls: '📊',
  txt: '📃', md: '📋', markdown: '📋',
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [category, setCategory] = useState('General')
  const [tags, setTags] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadDocs() }, [])

  const loadDocs = async () => {
    setLoading(true)
    try { setDocs(await api.knowledge.list()) } catch { }
    setLoading(false)
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true); setError(''); setSuccess('')
    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('category', category)
      fd.append('tags_json', JSON.stringify(tags.split(',').map(t => t.trim()).filter(Boolean)))
      try {
        await api.knowledge.upload(fd)
        setSuccess(`"${file.name}" indexed successfully!`)
        setTimeout(() => setSuccess(''), 3000)
      } catch (err: any) {
        setError(err.message)
      }
    }
    setUploading(false)
    loadDocs()
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return
    try { await api.knowledge.delete(id); setDocs(prev => prev.filter(d => d.id !== id)) }
    catch (err: any) { setError(err.message) }
  }

  const handleSearch = async () => {
    if (!searchQ.trim()) return
    try { setSearchResults(await api.knowledge.search(searchQ)) }
    catch (err: any) { setError(err.message) }
  }

  const categoryCounts = docs.reduce<Record<string, number>>((acc, d) => {
    acc[d.category] = (acc[d.category] || 0) + 1; return acc
  }, {})

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Knowledge Base</h1>
        <p className="text-gray-400 text-sm mt-1">Upload documents to power RAG-enhanced AI responses.</p>
      </div>

      {/* Notifications */}
      {error && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex justify-between">{error}<button onClick={() => setError('')}><X className="w-4 h-4" /></button></div>}
      {success && <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload zone */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><Upload className="w-4 h-4 text-brand-400" />Upload Document</h2>

          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files) }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${dragOver ? 'border-brand-500 bg-brand-500/10' : 'border-white/[0.10] hover:border-brand-500/40'}`}
          >
            <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Drag & drop or click to browse</p>
            <p className="text-xs text-gray-600 mt-1">PDF, DOCX, XLSX, TXT, MD</p>
          </div>
          <input ref={fileRef} type="file" multiple accept=".pdf,.docx,.doc,.xlsx,.xls,.txt,.md,.markdown,.csv" className="hidden" onChange={e => handleUpload(e.target.files)} />

          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Category</label>
              <input className="input-field py-2 text-sm" value={category} onChange={e => setCategory(e.target.value)} placeholder="General" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Tags (comma separated)</label>
              <input className="input-field py-2 text-sm" value={tags} onChange={e => setTags(e.target.value)} placeholder="hr, policy, q1-2024" />
            </div>
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-brand-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading and indexing…
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><FolderOpen className="w-4 h-4 text-amber-400" />Categories</h2>
          {Object.entries(categoryCounts).length === 0
            ? <p className="text-gray-500 text-sm">No documents yet.</p>
            : <div className="space-y-2">
                {Object.entries(categoryCounts).map(([cat, cnt]) => (
                  <div key={cat} className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-700/50">
                    <span className="text-sm text-gray-300">{cat}</span>
                    <span className="badge bg-brand-500/20 text-brand-300 border border-brand-500/20">{cnt}</span>
                  </div>
                ))}
              </div>
          }
        </div>

        {/* Semantic search */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><Search className="w-4 h-4 text-purple-400" />Search Knowledge</h2>
          <div className="flex gap-2">
            <input className="input-field py-2 text-sm flex-1" placeholder="Search indexed content…" value={searchQ} onChange={e => setSearchQ(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
            <button onClick={handleSearch} className="brand-button px-3">Go</button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {searchResults.map(r => (
              <div key={r.chunk_id} className="p-3 rounded-xl bg-surface-700/60 border border-white/[0.06]">
                <p className="text-xs text-brand-400 font-medium mb-1">{r.document_name}</p>
                <p className="text-xs text-gray-300 line-clamp-3">{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Document list */}
      <div className="glass-card p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-brand-400" />Indexed Documents ({docs.length})</h2>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-start gap-3 p-4 rounded-xl bg-surface-700/50 border border-white/[0.06] hover:border-white/[0.10] transition-all group">
                <span className="text-2xl mt-0.5">{FILE_ICONS[doc.file_type] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{doc.name}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="badge bg-surface-600 text-gray-400 border border-white/[0.06]">{doc.category}</span>
                    <span className="text-xs text-gray-600">v{doc.version}</span>
                    {(doc.tags || []).slice(0, 2).map(t => (
                      <span key={t} className="badge bg-purple-500/15 text-purple-400 border border-purple-500/20">
                        <Tag className="w-2.5 h-2.5 inline mr-0.5" />{t}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => handleDelete(doc.id, doc.name)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
