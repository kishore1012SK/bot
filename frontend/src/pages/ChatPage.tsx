import React, { useState, useEffect, useRef, useCallback } from 'react'
import { api, Conversation, Message } from '../services/api'
import { useAuth } from '../context/AuthContext'
import {
  Send, Plus, Trash2, Download, Search, Bot, User,
  Copy, Check, ChevronDown, X, Loader2, Database
} from 'lucide-react'

// ── Simple Markdown renderer ──────────────────────────────────────────────
function renderMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) =>
      `<pre class="code-block my-3"><code class="language-${lang}">${code.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g, '<code class="bg-surface-700 px-1.5 py-0.5 rounded text-green-300 font-mono text-sm">$1</code>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="text-gray-200 italic">$1</em>')
    .replace(/^### (.*$)/gm, '<h3 class="text-base font-semibold text-white mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-lg font-semibold text-white mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-xl font-bold text-white mt-4 mb-2">$1</h1>')
    .replace(/^- (.*$)/gm, '<li class="ml-4 text-gray-300 list-disc">$1</li>')
    .replace(/\n/g, '<br/>')
}

// ── Typing indicator ──────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <span key={i} className="typing-dot" style={{ animationDelay: `${i * 0.16}s` }} />
      ))}
    </div>
  )
}

// ── Copy button ────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-gray-300 transition-colors"
      title="Copy message"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────
function ChatBubble({ msg }: { msg: Message & { streaming?: boolean } }) {
  const isUser = msg.sender === 'user'
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} group`}>
      {/* Avatar */}
      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${isUser ? 'bg-brand-500/30' : 'bg-surface-600'}`}>
        {isUser
          ? <User className="w-3.5 h-3.5 text-brand-300" />
          : <Bot className="w-3.5 h-3.5 text-purple-300" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-brand-600/30 border border-brand-500/30 text-gray-100 rounded-tr-sm'
            : 'bg-surface-700 border border-white/[0.06] text-gray-200 rounded-tl-sm'
        }`}>
          {(msg as any).streaming
            ? <TypingDots />
            : <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />}
        </div>

        <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-gray-600">
            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {!isUser && <CopyButton text={msg.content} />}
        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  const { token } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConv, setActiveConv] = useState<number | null>(null)
  const [messages, setMessages] = useState<(Message & { streaming?: boolean })[]>([])
  const [input, setInput] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [ragEnabled, setRagEnabled] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => { loadConversations() }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const loadConversations = async (q?: string) => {
    try { setConversations(await api.chat.list(q)) } catch { }
  }

  const openConversation = async (id: number) => {
    setActiveConv(id)
    try {
      const data = await api.chat.get(id)
      setMessages(data.messages)
    } catch { }
  }

  const newConversation = async () => {
    try {
      const conv = await api.chat.create('New Conversation')
      setConversations(prev => [conv, ...prev])
      setActiveConv(conv.id)
      setMessages([])
    } catch { }
  }

  const deleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    await api.chat.delete(id)
    setConversations(prev => prev.filter(c => c.id !== id))
    if (activeConv === id) { setActiveConv(null); setMessages([]) }
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeConv || sending) return
    const userText = input.trim()
    setInput('')
    setSending(true)
    setError('')

    const tempUser: Message & { streaming?: boolean } = {
      id: Date.now(), conversation_id: activeConv, sender: 'user', content: userText,
      timestamp: new Date().toISOString()
    }
    const tempAssistant: Message & { streaming?: boolean } = {
      id: Date.now() + 1, conversation_id: activeConv, sender: 'assistant', content: '',
      timestamp: new Date().toISOString(), streaming: true
    }

    setMessages(prev => [...prev, tempUser, tempAssistant])

    try {
      // Use SSE streaming endpoint
      const res = await fetch(api.chat.streamUrl(activeConv), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: userText })
      })

      if (!res.ok) throw new Error('Stream request failed')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const raw = line.slice(6)
            if (raw === '[DONE]') break
            try {
              const parsed = JSON.parse(raw)
              if (parsed.token) {
                fullText += parsed.token
                setMessages(prev => prev.map(m =>
                  m.id === tempAssistant.id ? { ...m, content: fullText, streaming: false } : m
                ))
              }
            } catch { }
          }
        }
      }
    } catch (err: any) {
      setError(err.message)
      setMessages(prev => prev.filter(m => m.id !== tempAssistant.id))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="flex h-full">
      {/* ── Conversation list ── */}
      <div className="w-72 shrink-0 flex flex-col border-r border-white/[0.06] bg-surface-800/50">
        <div className="p-4 border-b border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Conversations</h2>
            <button id="new-chat-btn" onClick={newConversation} className="glass-button p-2" title="New chat">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              className="input-field pl-9 py-2 text-sm"
              placeholder="Search chats…"
              value={searchQ}
              onChange={e => { setSearchQ(e.target.value); loadConversations(e.target.value) }}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-2 space-y-0.5 px-2">
          {conversations.map(conv => (
            <div
              key={conv.id}
              onClick={() => openConversation(conv.id)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                activeConv === conv.id ? 'bg-brand-500/15 border border-brand-500/20' : 'hover:bg-white/[0.04]'
              }`}
            >
              <span className="flex-1 text-sm text-gray-300 truncate">{conv.title}</span>
              <button
                onClick={e => deleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-xs text-gray-600 text-center py-8">No conversations yet.<br />Click + to start.</p>
          )}
        </div>
      </div>

      {/* ── Chat window ── */}
      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/[0.06] bg-surface-800/30">
              <div className="flex items-center gap-3">
                <Bot className="w-5 h-5 text-brand-400" />
                <span className="font-semibold text-white">AI Assistant</span>
              </div>
              <div className="flex items-center gap-3">
                {/* RAG toggle */}
                <button
                  onClick={() => setRagEnabled(!ragEnabled)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    ragEnabled
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-surface-700 border-white/[0.08] text-gray-500'
                  }`}
                  title="Toggle Knowledge Base context"
                >
                  <Database className="w-3.5 h-3.5" />
                  {ragEnabled ? 'RAG On' : 'RAG Off'}
                </button>
                {/* Export */}
                <a
                  href={api.chat.export(activeConv, 'json')}
                  download
                  className="glass-button px-3 py-1.5 text-xs flex items-center gap-1.5"
                  target="_blank" rel="noreferrer"
                >
                  <Download className="w-3.5 h-3.5" /> Export
                </a>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                    <Bot className="w-8 h-8 text-brand-400" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Start a conversation</p>
                    <p className="text-gray-500 text-sm mt-1">Ask anything — your data stays private.</p>
                  </div>
                </div>
              )}
              {messages.map(msg => <ChatBubble key={msg.id} msg={msg} />)}
              <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
              <div className="mx-6 mb-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center justify-between">
                {error}
                <button onClick={() => setError('')}><X className="w-4 h-4" /></button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-white/[0.06]">
              <div className="flex items-end gap-3 glass-card p-3">
                <textarea
                  ref={inputRef}
                  id="chat-input"
                  rows={1}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
                  className="flex-1 bg-transparent outline-none text-gray-100 placeholder-gray-600 text-sm resize-none max-h-32"
                  style={{ minHeight: 24 }}
                />
                <button
                  id="send-btn"
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="brand-button p-2.5 rounded-xl"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-3xl bg-brand-500/10 flex items-center justify-center mx-auto">
                <Bot className="w-10 h-10 text-brand-400/60" />
              </div>
              <p className="text-gray-400">Select a conversation or</p>
              <button onClick={newConversation} className="brand-button">Start New Chat</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
