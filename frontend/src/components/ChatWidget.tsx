import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, X, Bot, User } from 'lucide-react';

interface ChatWidgetProps {
  apiUrl?: string;
  title?: string;
  subtitle?: string;
  themeColor?: string;
  initialGreeting?: string;
  defaultRAG?: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
}

export default function ChatWidget({
  apiUrl = 'http://localhost:8000/api/v1/widget/stream',
  title = 'Company Assistant',
  subtitle = 'Secure Private AI',
  themeColor = '#2b5aff',
  initialGreeting = 'Hello! I am your private company AI assistant. How can I help you find information inside our documents today?',
  defaultRAG = true
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [ragEnabled] = useState(defaultRAG);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const feedRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting
  useEffect(() => {
    setMessages([
      {
        id: 'initial',
        sender: 'bot',
        content: initialGreeting,
        timestamp: new Date().toISOString()
      }
    ]);
  }, [initialGreeting]);

  // Auto scroll
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userText = input.trim();
    setInput('');
    setIsGenerating(true);
    setError('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: userText,
      timestamp: new Date().toISOString()
    };

    const tempBotId = `bot-${Date.now()}`;
    const botMsgPlaceholder: ChatMessage = {
      id: tempBotId,
      sender: 'bot',
      content: '',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg, botMsgPlaceholder]);

    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userText,
          rag_enabled: ragEnabled
        })
      });

      if (!res.ok) throw new Error('Failed to stream response');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No readable response stream');

      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value);
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep partial line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const raw = trimmed.slice(6).trim();
            if (raw === '[DONE]') break;
            try {
              const parsed = JSON.parse(raw);
              if (parsed.token) {
                accumulated += parsed.token;
                setMessages(prev =>
                  prev.map(m => (m.id === tempBotId ? { ...m, content: accumulated } : m))
                );
              }
            } catch (err) {
              // Parse error on incomplete chunk JSON
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error connecting to AI backend.');
      setMessages(prev => prev.filter(m => m.id !== tempBotId));
    } finally {
      setIsGenerating(false);
    }
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="bg-white/10 px-1 rounded font-mono text-xs text-green-300">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[999999] flex flex-col items-end font-sans">
      {/* ── Chat Panel ── */}
      <div
        className={`w-[360px] h-[500px] max-h-[calc(100vh-100px)] bg-[#111218] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="p-4 bg-slate-900/80 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
              style={{ background: `linear-gradient(135deg, ${themeColor} 0%, #8b5cf6 100%)` }}
            >
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white leading-none">{title}</h4>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {subtitle}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Feed */}
        <div
          ref={feedRef}
          className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-gradient-to-tr from-brand-500/[0.01] to-[#111218]"
        >
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2 max-w-[80%] ${isUser ? 'self-end flex-row-reverse' : 'self-start'}`}
              >
                <div
                  className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center text-xs ${
                    isUser ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800 text-purple-400'
                  }`}
                >
                  {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                </div>
                <div
                  className={`px-3 py-2 rounded-xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-brand-500/10 border border-brand-500/20 text-white rounded-tr-none'
                      : 'bg-slate-800/80 border border-white/[0.05] text-slate-200 rounded-tl-none'
                  }`}
                >
                  {msg.content === '' && isGenerating ? (
                    <div className="flex gap-1 py-1">
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  ) : (
                    <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-4 mb-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px]">
            {error}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-white/[0.06] flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 bg-slate-800 border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-brand-500/50"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: themeColor }}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* ── Trigger Bubble Button ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 outline-none"
        style={{
          background: `linear-gradient(135deg, ${themeColor} 0%, #8b5cf6 100%)`,
          boxShadow: `0 4px 20px ${themeColor}66`
        }}
      >
        {isOpen ? <X className="w-6 h-6 transition-transform rotate-90" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
