import { useState, useEffect } from 'react'
import { api, UserAdmin, AnalyticsData } from '../services/api'
import { Users, FileText, MessageSquare, Activity, Shield, Trash2, ToggleLeft, ToggleRight, Loader2, Database, Cpu, HardDrive } from 'lucide-react'

const ROLE_COLORS: Record<string,string> = {
  'Super Admin': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Admin': 'bg-brand-500/20 text-brand-300 border-brand-500/30',
  'HR': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Employee': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  'Student': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
}

function StatCard({ icon: Icon, label, value, color }: any) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5"/>
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-400">{label}</p>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [users, setUsers] = useState<UserAdmin[]>([])
  const [health, setHealth] = useState<any>(null)
  const [tab, setTab] = useState<'overview'|'users'|'health'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [a, u, h] = await Promise.all([api.admin.analytics(), api.admin.users(), api.health.check()])
        setAnalytics(a); setUsers(u); setHealth(h)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const toggleStatus = async (u: UserAdmin) => {
    try {
      await api.admin.toggleStatus(u.id, !u.is_active)
      setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, is_active: !u.is_active} : usr))
    } catch {}
  }

  const changeRole = async (u: UserAdmin, role: string) => {
    try {
      await api.admin.updateRole(u.id, role)
      setUsers(prev => prev.map(usr => usr.id === u.id ? {...usr, role} : usr))
    } catch {}
  }

  const deleteUser = async (id: number) => {
    if (!confirm('Delete this user permanently?')) return
    try { await api.admin.deleteUser(id); setUsers(prev => prev.filter(u => u.id !== id)) } catch {}
  }

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-brand-400"/></div>

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Shield className="w-6 h-6 text-brand-400"/>Admin Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Platform administration, analytics, and system monitoring.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-800 rounded-xl border border-white/[0.06] w-fit">
        {(['overview','users','health'] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${tab===t?'bg-brand-500/20 text-brand-300 border border-brand-500/30':'text-gray-400 hover:text-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && analytics && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Users" value={analytics.total_users} color="bg-brand-500/20 text-brand-400"/>
            <StatCard icon={FileText} label="Documents Indexed" value={analytics.total_documents} color="bg-emerald-500/20 text-emerald-400"/>
            <StatCard icon={MessageSquare} label="Questions Asked" value={analytics.total_questions_asked} color="bg-purple-500/20 text-purple-400"/>
            <StatCard icon={Activity} label="Roles Active" value={Object.keys(analytics.role_breakdown).length} color="bg-amber-500/20 text-amber-400"/>
          </div>

          {/* Role breakdown */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="font-semibold text-white">Users by Role</h2>
            <div className="space-y-2">
              {Object.entries(analytics.role_breakdown).map(([role, cnt]) => (
                <div key={role} className="flex items-center gap-3">
                  <span className={`badge border w-28 text-center ${ROLE_COLORS[role]||ROLE_COLORS['Employee']}`}>{role}</span>
                  <div className="flex-1 h-2 bg-surface-700 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-gradient rounded-full transition-all" style={{width:`${(cnt/analytics.total_users)*100}%`}}/>
                  </div>
                  <span className="text-sm text-gray-400 w-6 text-right">{cnt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent activity */}
          <div className="glass-card p-6 space-y-3">
            <h2 className="font-semibold text-white">Recent Activity</h2>
            <div className="space-y-2">
              {analytics.latest_activities.map((log:any) => (
                <div key={log.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                  <Activity className="w-3.5 h-3.5 text-brand-400 shrink-0"/>
                  <span className="text-sm text-gray-300 flex-1">{log.action.replace(/_/g,' ')}</span>
                  <span className="text-xs text-gray-600">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="glass-card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['User','Role','Status','Actions'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-medium text-gray-400 uppercase tracking-wider">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {users.map(u=>(
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <p className="text-sm font-medium text-white">{u.full_name}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select value={u.role} onChange={e=>changeRole(u,e.target.value)}
                        className="bg-surface-700 border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-gray-300 outline-none focus:border-brand-500/40">
                        {['Super Admin','Admin','HR','Employee','Student'].map(r=><option key={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={()=>toggleStatus(u)} className="flex items-center gap-1.5">
                        {u.is_active
                          ? <><ToggleRight className="w-5 h-5 text-emerald-400"/><span className="text-xs text-emerald-400">Active</span></>
                          : <><ToggleLeft className="w-5 h-5 text-gray-600"/><span className="text-xs text-gray-500">Inactive</span></>}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={()=>deleteUser(u.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all">
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'health' && health && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Database', value: health.database, icon: Database },
              { label: 'Vector Store', value: health.vector_store, icon: Database },
              { label: 'Active LLM', value: health.active_llm, icon: Cpu },
              { label: 'Overall Status', value: health.status, icon: Activity },
            ].map(({label,value,icon:Icon})=>(
              <div key={label} className="glass-card p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${value.includes('healthy')||value==='healthy'?'bg-emerald-500/20 text-emerald-400':'bg-red-500/20 text-red-400'}`}>
                  <Icon className="w-5 h-5"/>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300">{label}</p>
                  <p className={`text-xs mt-0.5 ${value.includes('healthy')||value==='healthy'?'text-emerald-400':'text-red-400'}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="glass-card p-5 space-y-3">
            <h2 className="font-semibold text-white flex items-center gap-2"><HardDrive className="w-4 h-4 text-brand-400"/>System Resources</h2>
            {[
              { label: 'CPU Usage', value: health.system_stats.cpu_usage_percent, unit: '%' },
              { label: 'Memory Used', value: health.system_stats.memory_usage_percent, unit: '%' },
            ].map(({label,value,unit})=>(
              <div key={label} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400"><span>{label}</span><span>{value}{unit}</span></div>
                <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${value>80?'bg-red-500':value>60?'bg-amber-500':'bg-brand-gradient'}`} style={{width:`${value}%`}}/>
                </div>
              </div>
            ))}
            <p className="text-xs text-gray-500">GPU: {health.system_stats.gpu_status}</p>
            <p className="text-xs text-gray-500">Free disk: {health.system_stats.disk_free_gb} GB</p>
          </div>
        </div>
      )}
    </div>
  )
}
