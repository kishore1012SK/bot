import React, { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout, { PageKey } from './components/Layout'
import LoginPage from './pages/LoginPage'
import ChatPage from './pages/ChatPage'
import KnowledgePage from './pages/KnowledgePage'
import CareerPage from './pages/CareerPage'
import ResumePage from './pages/ResumePage'
import InterviewPage from './pages/InterviewPage'
import ProjectsPage from './pages/ProjectsPage'
import AdminPage from './pages/AdminPage'
import { Loader2 } from 'lucide-react'

function AppContent() {
  const { user, isLoading } = useAuth()
  const [activePage, setActivePage] = useState<PageKey>('chat')

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          <p className="text-gray-400 text-sm">Loading platform…</p>
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  const PAGE_MAP: Record<PageKey, React.ReactElement> = {
    chat:      <ChatPage />,
    knowledge: <KnowledgePage />,
    career:    <CareerPage />,
    resume:    <ResumePage />,
    interview: <InterviewPage />,
    projects:  <ProjectsPage />,
    admin:     <AdminPage />,
  }

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      <div className="animate-fade-in h-full">
        {PAGE_MAP[activePage]}
      </div>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
