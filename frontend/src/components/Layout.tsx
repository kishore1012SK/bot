import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Brain, MessageSquare, BookOpen, TrendingUp, FileText,
  Mic, FolderGit2, LayoutDashboard, LogOut, ChevronLeft,
  ChevronRight, User, Zap
} from 'lucide-react'

export type PageKey = 'chat' | 'knowledge' | 'career' | 'resume' | 'interview' | 'projects' | 'admin'

interface Props {
  activePage: PageKey
  setActivePage: (p: PageKey) => void
  children: React.ReactNode
}

const NAV_ITEMS: { key: PageKey; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
  { key: 'chat',      label: 'AI Chat',            icon: MessageSquare },
  { key: 'knowledge', label: 'Knowledge Base',      icon: BookOpen },
  { key: 'career',    label: 'Career Guidance',     icon: TrendingUp },
  { key: 'resume',    label: 'Resume Analyzer',     icon: FileText },
  { key: 'interview', label: 'Interview Assistant', icon: Mic },
  { key: 'projects',  label: 'Project Ideas',       icon: FolderGit2 },
  { key: 'admin',     label: 'Admin Dashboard',     icon: LayoutDashboard, adminOnly: true },
]

export default function Layout({ activePage, setActivePage, children }: Props) {
  const { user, logout, isAdmin } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const roleColor: Record<string, string> = {
    'Super Admin': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'Admin': 'bg-brand-500/20 text-brand-300 border-brand-500/30',
    'HR': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'Employee': 'bg-gray-500/20 text-gray-300 border-gray-500/30',
    'Student': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className={`flex flex-col bg-surface-800 border-r border-white/[0.06] transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-white/[0.06]">
          <div className="shrink-0 w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-glow">
            <Brain className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-white text-sm leading-tight">
              Enterprise<br /><span className="text-brand-400">AI Platform</span>
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {NAV_ITEMS.filter(item => !item.adminOnly || isAdmin).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              id={`nav-${key}`}
              onClick={() => setActivePage(key)}
              className={`sidebar-item w-full ${activePage === key ? 'active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{label}</span>}
            </button>
          ))}
        </nav>

        {/* User panel */}
        <div className="border-t border-white/[0.06] p-3 space-y-2">
          {!collapsed && user && (
            <div className="glass-card p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-brand-500/30 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-brand-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <span className={`badge border ${roleColor[user.role] || roleColor['Employee']}`}>
                {user.role}
              </span>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="glass-button flex-1 flex items-center justify-center"
              title="Toggle sidebar"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={logout}
              className="glass-button flex items-center justify-center gap-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              {!collapsed && <span className="text-sm text-red-400">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
