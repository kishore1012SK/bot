// Enterprise AI Assistant Platform - Frontend Simulation Controller

// ── GLOBAL STATE ──
let activeTab = 'chat';
let activeAdminTab = 'overview';
let isSidebarCollapsed = false;
let ragEnabled = true;

// Mock database store
const STATE = {
    conversations: [
        { id: 1, title: "Company Travel Policies" },
        { id: 2, title: "Systems Scaling Issues" },
        { id: 3, title: "Q3 Project Planning" }
    ],
    activeChatId: 1,
    chats: {
        1: [
            { role: 'assistant', content: "Welcome back! I am currently reading from your corporate knowledge base index. How can I help you find information inside our travel documents?" }
        ],
        2: [
            { role: 'user', content: "Our database is getting connection pool timeout issues under heavy load." },
            { role: 'assistant', content: "Under heavy load, connection timeouts in PostgreSQL typically point to either:\n1. Leak of connections in the application layer.\n2. Insufficient max_connections values in pg_hba.conf.\n3. Slow transactions blocking connection yields.\n\n### Suggestions to fix:\n```python\n# Configure SQLAlchemy pool sizing\nengine = create_async_engine(\n    DATABASE_URL,\n    pool_size=20,\n    max_overflow=10,\n    pool_timeout=30\n)\n```" }
        ],
        3: [
            { role: 'assistant', content: "Hi Admin! Let's draft our milestone plans for the next features." }
        ]
    },
    documents: [
        { id: 1, name: "HR_Leave_Policy_2026.pdf", category: "HR Policies", version: 2, tags: ["leave", "hr"], date: "2026-06-15" },
        { id: 2, name: "Database_Scaling_Guide.md", category: "Engineering", version: 1, tags: ["postgres", "scaling"], date: "2026-06-20" },
        { id: 3, name: "Office_Travel_Guidelines.docx", category: "Travel", version: 1, tags: ["travel", "billing"], date: "2026-06-25" }
    ],
    interviewSession: {
        active: false,
        type: 'Technical',
        turn: 0,
        chatHistory: [],
        typeQuestions: {
            Technical: [
                "Welcome to the Technical Interview. Let's start with system design: How would you design a rate limiter for a high-traffic API?",
                "Interesting approach. How would you handle state synchronization if the rate limiter is deployed across a distributed cluster?",
                "That works. Let's switch to data structures. Explain the trade-offs of using a hash map vs a binary search tree in database indexing.",
                "Good. Now, explain how you would detect memory leaks in a Python FastAPI application under load.",
                "Final question: How do you handle database migration scripts safely on a live production table with millions of rows?"
            ],
            HR: [
                "Welcome. Please tell me about a time you had a major technical disagreement with a team lead. How was it resolved?",
                "How do you handle prioritization when you are tasked with three urgent deadlines at the same time?",
                "Describe a situation where a project you owned failed or was delayed. What did you learn?",
                "How do you stay up-to-date with emerging tools, and how do you introduce them to your team?",
                "Why do you want to join our enterprise AI engineering squad specifically?"
            ],
            Coding: [
                "Let's look at code logic. Write a function in Python that returns the longest palindromic substring in a given string.",
                "Excellent. What is the time and space complexity of your solution, and how can we optimize it?",
                "Now, implement a thread-safe Singleton pattern in your language of choice.",
                "How would you optimize a nested SQL query that takes several seconds to return results?",
                "Lastly, explain how you would resolve a deadlock scenario detected in database lock logs."
            ]
        }
    },
    careerSkills: ["Python", "SQL", "Docker", "JavaScript", "React"],
    projectSkills: ["Python", "SQL", "Docker"]
};

// ── TAB SWITCHER ──
function switchTab(tabId) {
    activeTab = tabId;
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(p => p.classList.add('hidden'));
    // Show selected
    document.getElementById(`page-${tabId}`).classList.remove('hidden');
    
    // Manage active sidebar state styling
    document.querySelectorAll('#sidebar nav button').forEach(b => {
        b.classList.remove('bg-brand-500/15', 'text-brand-400', 'border-brand-500/20');
        b.classList.add('text-gray-400', 'border-transparent');
    });
    
    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) {
        activeBtn.classList.remove('text-gray-400', 'border-transparent');
        activeBtn.classList.add('bg-brand-500/15', 'text-brand-400', 'border-brand-500/20');
    }

    // Tab specific initializers
    if (tabId === 'chat') {
        renderConversationsList();
        renderChatHistory();
    } else if (tabId === 'knowledge') {
        renderDocumentsTable();
        renderCategoriesSummary();
    } else if (tabId === 'career') {
        renderCareerSkillsPicker();
    } else if (tabId === 'projects') {
        renderProjectSkillsPicker();
    } else if (tabId === 'admin') {
        renderAdminOverview();
        renderAdminUsersTable();
    }
}

// ── COLLAPSE SIDEBAR ──
function toggleSidebar() {
    isSidebarCollapsed = !isSidebarCollapsed;
    const sidebar = document.getElementById('sidebar');
    const logoText = document.getElementById('logo-text');
    const collapseIcon = document.getElementById('collapse-icon');
    const labels = document.querySelectorAll('.nav-label');
    const userCard = document.getElementById('user-info-card');

    if (isSidebarCollapsed) {
        sidebar.className = "w-16 bg-surface-800 border-r border-white/[0.06] flex flex-col shrink-0 transition-all duration-300";
        logoText.classList.add('hidden');
        collapseIcon.className = "fa-solid fa-angles-right";
        labels.forEach(l => l.classList.add('hidden'));
        userCard.classList.add('hidden');
    } else {
        sidebar.className = "w-64 bg-surface-800 border-r border-white/[0.06] flex flex-col shrink-0 transition-all duration-300";
        logoText.classList.remove('hidden');
        collapseIcon.className = "fa-solid fa-angles-left";
        labels.forEach(l => l.classList.remove('hidden'));
        userCard.classList.remove('hidden');
    }
}

// ── AI CHAT ENGINE ──
function renderConversationsList() {
    const list = document.getElementById('chat-list');
    list.innerHTML = '';
    STATE.conversations.forEach(c => {
        const isActive = c.id === STATE.activeChatId;
        const item = document.createElement('div');
        item.className = `group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-brand-500/15 border border-brand-500/20 text-brand-300' : 'hover:bg-white/[0.04] text-gray-300'}`;
        item.onclick = () => selectConversation(c.id);
        
        item.innerHTML = `
            <span class="truncate text-xs font-medium flex-1">${c.title}</span>
            <button onclick="deleteChat(${c.id}, event)" class="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded transition-all">
                <i class="fa-solid fa-trash-can text-[10px]"></i>
            </button>
        `;
        list.appendChild(item);
    });
}

function selectConversation(id) {
    STATE.activeChatId = id;
    const current = STATE.conversations.find(c => c.id === id);
    if (current) {
        document.getElementById('current-chat-title').innerText = current.title;
    }
    renderConversationsList();
    renderChatHistory();
}

function startNewChat() {
    const nextId = STATE.conversations.length > 0 ? Math.max(...STATE.conversations.map(c=>c.id)) + 1 : 1;
    const newConv = { id: nextId, title: `Chat ${nextId}` };
    STATE.conversations.unshift(newConv);
    STATE.chats[nextId] = [
        { role: 'assistant', content: "Hello! This is a new chat instance. Tell me what information you are searching for or what code we should write." }
    ];
    selectConversation(nextId);
}

function deleteChat(id, event) {
    event.stopPropagation();
    STATE.conversations = STATE.conversations.filter(c => c.id !== id);
    delete STATE.chats[id];
    if (STATE.activeChatId === id) {
        STATE.activeChatId = STATE.conversations.length > 0 ? STATE.conversations[0].id : null;
    }
    renderConversationsList();
    renderChatHistory();
}

function renderChatHistory() {
    const history = document.getElementById('chat-history');
    history.innerHTML = '';
    
    if (!STATE.activeChatId) {
        history.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center py-20">
                <i class="fa-solid fa-message text-gray-700 text-5xl mb-4"></i>
                <p class="text-gray-400">No active conversations. Start one to begin.</p>
            </div>
        `;
        return;
    }

    const messages = STATE.chats[STATE.activeChatId] || [];
    messages.forEach(m => {
        const isUser = m.role === 'user';
        const bubble = document.createElement('div');
        bubble.className = `flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`;
        
        let markdownContent = m.content
            .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre class="code-block p-4 my-2 rounded-xl font-mono text-xs text-green-300 overflow-x-auto whitespace-pre">$2</pre>')
            .replace(/`([^`]+)`/g, '<code class="bg-surface-700 px-1 py-0.5 rounded text-green-300 font-mono text-xs">$1</code>')
            .replace(/\n/g, '<br/>');

        bubble.innerHTML = `
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-600 text-purple-400'}">
                <i class="fa-solid ${isUser ? 'fa-user' : 'fa-robot'} text-xs"></i>
            </div>
            <div class="max-w-[75%] flex flex-col ${isUser ? 'items-end' : 'items-start'}">
                <div class="px-4 py-3 rounded-2xl text-xs leading-relaxed ${isUser ? 'bg-brand-500/10 border border-brand-500/20 text-white rounded-tr-none' : 'bg-surface-700 border border-white/[0.06] text-gray-200 rounded-tl-none'}">
                    ${markdownContent}
                </div>
            </div>
        `;
        history.appendChild(bubble);
    });
    
    // Auto-scroll
    setTimeout(() => {
        history.scrollTop = history.scrollHeight;
    }, 50);
}

function handleChatSubmit(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !STATE.activeChatId) return;
    
    input.value = '';
    
    // Append User Message
    STATE.chats[STATE.activeChatId].push({ role: 'user', content: text });
    renderChatHistory();

    // Trigger typing simulator
    const history = document.getElementById('chat-history');
    const typingBubble = document.createElement('div');
    typingBubble.className = "flex gap-3 items-center text-gray-500 text-xs py-2";
    typingBubble.id = "typing-simulator";
    typingBubble.innerHTML = `
        <div class="w-8 h-8 rounded-lg bg-surface-600 flex items-center justify-center">
            <i class="fa-solid fa-robot"></i>
        </div>
        <div class="flex items-center gap-1">
            <span class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
            <span class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
        </div>
    `;
    history.appendChild(typingBubble);
    history.scrollTop = history.scrollHeight;

    // Simulate RAG reply based on question
    setTimeout(() => {
        const typ = document.getElementById('typing-simulator');
        if (typ) typ.remove();

        let response = "";
        const lowerQ = text.toLowerCase();
        
        if (lowerQ.includes('leave') || lowerQ.includes('holiday')) {
            response = "According to our **HR_Leave_Policy_2026.pdf**:\n- Employees are entitled to **20 paid leaves** per annum.\n- Leave requests exceeding 3 working days must be submitted through the portal at least **1 week** in advance.\n- Maternity leave covers 26 weeks, and paternity leave supports 2 weeks.";
        } else if (lowerQ.includes('postgres') || lowerQ.includes('database') || lowerQ.includes('scaling')) {
            response = "I searched **Database_Scaling_Guide.md**. It lists the following recommendations:\n- Set custom connection limits: `max_connections = 500`.\n- Utilize connection pooling at the service layer:\n```python\n# Postgres connection pool sizing configuration\nasync_pool = asyncpg.create_pool(\n    dsn=settings.DATABASE_URL,\n    min_size=10,\n    max_size=100\n)\n```";
        } else if (lowerQ.includes('travel') || lowerQ.includes('flight')) {
            response = "Found details in **Office_Travel_Guidelines.docx**:\n- Flight tickets must be booked via the Corporate Portal.\n- Economy class is standard for flights under 6 hours.\n- Daily meals allowance is capped at **$60/day**.";
        } else {
            response = "This is a local secure model response running internally on Ollama (Llama-3). Since RAG matches did not return specific details for your query, I am responding from my general pre-trained knowledge base parameters. Let me know if I should formulate code blocks or roadmap templates.";
        }

        STATE.chats[STATE.activeChatId].push({ role: 'assistant', content: response });
        renderChatHistory();
        
        // Update admin stats
        STATE.totalQuestions = (STATE.totalQuestions || 168) + 1;
        document.getElementById('adm-count-msg').innerText = STATE.totalQuestions;
    }, 1200);
}

function toggleRAG() {
    ragEnabled = !ragEnabled;
    const btn = document.getElementById('rag-toggle');
    if (ragEnabled) {
        btn.className = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 text-xs font-semibold transition-all";
        btn.innerHTML = `<i class="fa-solid fa-database"></i> RAG Active`;
    } else {
        btn.className = "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-surface-700 border-white/[0.08] text-gray-500 text-xs font-semibold transition-all";
        btn.innerHTML = `<i class="fa-solid fa-ban"></i> RAG Disabled`;
    }
}

function exportChat() {
    if (!STATE.activeChatId) return;
    const messages = STATE.chats[STATE.activeChatId] || [];
    const textData = messages.map(m => `[${m.role.toUpperCase()}]: ${m.content}`).join("\n\n");
    
    const blob = new Blob([textData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_export_${STATE.activeChatId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}

// ── KNOWLEDGE BASE MANAGER ──
function renderDocumentsTable() {
    const table = document.getElementById('kb-document-table');
    table.innerHTML = '';
    
    STATE.documents.forEach(d => {
        const tr = document.createElement('tr');
        tr.className = "border-b border-white/[0.04] hover:bg-white/[0.02]";
        
        const tagBadges = d.tags.map(t => `<span class="badge text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full mr-1"><i class="fa-solid fa-tag text-[8px] mr-1"></i>${t}</span>`).join('');
        
        let icon = "fa-file-pdf text-red-400";
        if (d.name.endsWith('.docx')) icon = "fa-file-word text-blue-400";
        if (d.name.endsWith('.xlsx')) icon = "fa-file-excel text-emerald-400";
        if (d.name.endsWith('.md')) icon = "fa-file-code text-purple-400";

        tr.innerHTML = `
            <td class="py-3 pr-4 flex items-center gap-2">
                <i class="fa-solid ${icon} text-sm"></i>
                <span class="font-medium text-white truncate max-w-[200px]">${d.name}</span>
            </td>
            <td class="py-3 px-4">${d.category}</td>
            <td class="py-3 px-4">v${d.version}</td>
            <td class="py-3 px-4 flex flex-wrap gap-1">${tagBadges}</td>
            <td class="py-3 px-4 text-gray-500">${d.date}</td>
            <td class="py-3 pl-4 text-right">
                <button onclick="deleteDocument(${d.id})" class="p-1 hover:bg-red-500/20 text-gray-500 hover:text-red-400 rounded transition-all">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        table.appendChild(tr);
    });
}

function renderCategoriesSummary() {
    const breakdown = document.getElementById('category-breakdown');
    breakdown.innerHTML = '';
    
    const cats = STATE.documents.reduce((acc, d) => {
        acc[d.category] = (acc[d.category] || 0) + 1;
        return acc;
    }, {});
    
    Object.entries(cats).forEach(([name, count]) => {
        const row = document.createElement('div');
        row.className = "flex items-center justify-between py-2 px-3 rounded-lg bg-surface-700/40 text-xs";
        row.innerHTML = `
            <span class="text-gray-300 font-medium">${name}</span>
            <span class="badge bg-brand-500/10 text-brand-400 border border-brand-500/20 px-2 py-0.5 rounded-full">${count} Files</span>
        `;
        breakdown.appendChild(row);
    });
    
    // Update admin stats
    document.getElementById('adm-count-docs').innerText = STATE.documents.length;
}

function mockUploadFile(files) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const category = document.getElementById('kb-category').value.trim() || 'General';
    const tagStr = document.getElementById('kb-tags').value.trim();
    const tags = tagStr ? tagStr.split(',').map(t=>t.trim()).filter(Boolean) : ["uploaded"];
    
    const dropzone = document.getElementById('dropzone');
    const oldContent = dropzone.innerHTML;
    
    dropzone.innerHTML = `
        <div class="flex flex-col items-center justify-center py-4">
            <i class="fa-solid fa-circle-notch fa-spin text-brand-500 text-2xl mb-2"></i>
            <p class="text-xs text-brand-400 font-semibold">Chunking and Vectorizing ${file.name}...</p>
        </div>
    `;
    
    setTimeout(() => {
        dropzone.innerHTML = oldContent;
        
        // Find existing doc versioning
        const match = STATE.documents.find(d => d.name === file.name);
        const version = match ? match.version + 1 : 1;
        
        if (match) {
            // Remove previous version
            STATE.documents = STATE.documents.filter(d => d.id !== match.id);
        }

        const nextId = STATE.documents.length > 0 ? Math.max(...STATE.documents.map(d=>d.id)) + 1 : 1;
        const newDoc = {
            id: nextId,
            name: file.name,
            category: category,
            version: version,
            tags: tags,
            date: new Date().toISOString().split('T')[0]
        };
        
        STATE.documents.unshift(newDoc);
        renderDocumentsTable();
        renderCategoriesSummary();
        alert(`Successfully indexed "${file.name}" (version ${version}) into PostgreSQL + pgvector!`);
    }, 1500);
}

function deleteDocument(id) {
    const doc = STATE.documents.find(d => d.id === id);
    if (!doc) return;
    if (confirm(`Are you sure you want to remove "${doc.name}" from vector database indexes?`)) {
        STATE.documents = STATE.documents.filter(d => d.id !== id);
        renderDocumentsTable();
        renderCategoriesSummary();
    }
}

function testSemanticSearch() {
    const query = document.getElementById('sandbox-search-input').value.trim();
    const resultsPanel = document.getElementById('sandbox-results');
    if (!query) return;
    
    resultsPanel.innerHTML = `
        <div class="flex justify-center py-4">
            <i class="fa-solid fa-spinner fa-spin text-brand-400"></i>
        </div>
    `;
    
    setTimeout(() => {
        resultsPanel.innerHTML = '';
        const match = STATE.documents.map(d => {
            let chunkText = "";
            let score = 0.85;
            if (d.name.includes("HR_Leave")) {
                chunkText = "Employees receive 20 paid leave days per calendar year. Request approval window: at least 1 week for extended vacations.";
            } else if (d.name.includes("Scaling")) {
                chunkText = "To avoid max connection exceptions, implement pooling. Sample: asyncpg.create_pool(min_size=10, max_size=100)";
            } else {
                chunkText = "Corporate guidelines state that expenses must be cleared by accounting within the active budget cycle.";
            }
            return { name: d.name, text: chunkText, score: (score - Math.random()*0.1).toFixed(4) };
        });

        match.forEach(r => {
            const card = document.createElement('div');
            card.className = "p-3 rounded-lg bg-surface-700/50 border border-white/[0.04] space-y-1.5";
            card.innerHTML = `
                <div class="flex items-center justify-between text-[10px]">
                    <span class="text-brand-400 font-semibold truncate w-36"><i class="fa-solid fa-file-shield mr-1"></i>${r.name}</span>
                    <span class="text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">cosine: ${r.score}</span>
                </div>
                <p class="text-[11px] text-gray-300 leading-relaxed">${r.text}</p>
            `;
            resultsPanel.appendChild(card);
        });
    }, 800);
}

// ── CAREER GUIDANCE HUB ──
const CAREER_SKILLS_LIST = ["Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C++", "SQL", "Docker", "Kubernetes", "AWS", "Machine Learning", "FastAPI"];

function renderCareerSkillsPicker() {
    const list = document.getElementById('skillsets-picker');
    list.innerHTML = '';
    CAREER_SKILLS_LIST.forEach(s => {
        const active = STATE.careerSkills.includes(s);
        const btn = document.createElement('button');
        btn.onclick = () => toggleCareerSkill(s);
        btn.className = `px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? 'bg-brand-500/20 border-brand-500/30 text-brand-300' : 'bg-surface-700/50 border-white/[0.08] text-gray-400'}`;
        btn.innerText = s;
        list.appendChild(btn);
    });
}

function toggleCareerSkill(skill) {
    if (STATE.careerSkills.includes(skill)) {
        STATE.careerSkills = STATE.careerSkills.filter(s => s !== skill);
    } else {
        STATE.careerSkills.push(skill);
    }
    renderCareerSkillsPicker();
}

function addCustomSkill() {
    const input = document.getElementById('custom-skill-input');
    const skill = input.value.trim();
    if (skill && !STATE.careerSkills.includes(skill)) {
        STATE.careerSkills.push(skill);
        input.value = '';
        renderCareerSkillsPicker();
    }
}

function triggerCareerAssess() {
    document.getElementById('career-form-view').classList.add('hidden');
    
    // Create loader spinner
    const results = document.getElementById('career-results-view');
    results.classList.remove('hidden');
    results.innerHTML = `
        <div class="flex flex-col items-center justify-center py-24 text-center">
            <i class="fa-solid fa-route fa-spin text-brand-500 text-4xl mb-4"></i>
            <h3 class="text-white font-semibold text-sm">LLM evaluating skills graph compatibility...</h3>
            <p class="text-gray-500 text-xs mt-1">Generating custom milestones and roadmap phases</p>
        </div>
    `;
    
    setTimeout(() => {
        results.innerHTML = `
            <button onclick="resetCareerAssessment()" class="py-1.5 px-3 bg-white/[0.06] hover:bg-white/[0.10] border border-white/[0.08] rounded-lg text-xs font-semibold text-white mb-6">
                <i class="fa-solid fa-arrow-left mr-1.5"></i> Start New Evaluation
            </button>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="glass-card p-5 rounded-xl space-y-3">
                    <h3 class="font-semibold text-white text-xs uppercase tracking-wider text-brand-400">Best Career Paths</h3>
                    <div class="space-y-2">
                        <div class="p-3 bg-brand-500/10 border border-brand-500/20 rounded-lg">
                            <span class="text-[9px] text-brand-400 font-bold block mb-1">BEST MATCH</span>
                            <span class="text-xs font-semibold text-white">Cloud Infrastructure Architect</span>
                        </div>
                        <div class="p-3 bg-surface-700/50 border border-white/[0.06] rounded-lg">
                            <span class="text-xs font-semibold text-gray-300">Senior Distributed Systems Engineer</span>
                        </div>
                    </div>
                </div>
                <div class="glass-card p-5 rounded-xl lg:col-span-2 space-y-3">
                    <h3 class="font-semibold text-white text-xs uppercase tracking-wider text-emerald-400">Skills Gap Analysis</h3>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <span class="text-[10px] text-gray-400 font-bold block mb-2">MATCHED SKILLS</span>
                            <div class="flex flex-wrap gap-1.5">
                                ${STATE.careerSkills.map(s=>`<span class="badge text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">${s}</span>`).join('')}
                            </div>
                        </div>
                        <div>
                            <span class="text-[10px] text-gray-400 font-bold block mb-2">MISSING SKILLS</span>
                            <div class="flex flex-wrap gap-1.5">
                                <span class="badge text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full">Kubernetes</span>
                                <span class="badge text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full">System Design</span>
                                <span class="badge text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full">gRPC & Protobuf</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="glass-card p-6 rounded-xl space-y-4">
                <h3 class="font-semibold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-map-location-dot text-purple-400"></i> Career Transformation Roadmap
                </h3>
                <div class="space-y-4 border-l border-white/[0.08] ml-4 pl-6 relative">
                    <div class="relative">
                        <div class="absolute -left-[31px] top-0 w-4.5 h-4.5 rounded-full bg-brand-500/20 border border-brand-500 flex items-center justify-center text-[10px] text-white font-bold">1</div>
                        <div>
                            <span class="text-xs font-semibold text-white block">Phase 1: Foundation Upskilling</span>
                            <span class="text-[10px] text-brand-400 block mb-1">Month 1-2</span>
                            <p class="text-[11px] text-gray-400 leading-relaxed">Focus on advanced distributed system design paradigms, concurrency, and rate-limiting patterns using local libraries.</p>
                        </div>
                    </div>
                    <div class="relative">
                        <div class="absolute -left-[31px] top-0 w-4.5 h-4.5 rounded-full bg-brand-500/20 border border-brand-500 flex items-center justify-center text-[10px] text-white font-bold">2</div>
                        <div>
                            <span class="text-xs font-semibold text-white block">Phase 2: Containers & Deployments</span>
                            <span class="text-[10px] text-brand-400 block mb-1">Month 3-4</span>
                            <p class="text-[11px] text-gray-400 leading-relaxed">Implement containerized scaling microservices. Deploy test nodes utilizing local Kubernetes/Minikube nodes.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="glass-card p-6 rounded-xl space-y-4">
                <h3 class="font-semibold text-white text-sm flex items-center gap-2">
                    <i class="fa-solid fa-graduation-cap text-amber-400"></i> Course Recommendations
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="p-4 rounded-xl bg-surface-700/50 border border-white/[0.06] space-y-1.5">
                        <span class="text-xs font-semibold text-white">Distributed Systems: Architecture & Principles</span>
                        <span class="text-[10px] text-amber-400 block font-medium">Internal Corporate Learning Portal</span>
                        <p class="text-[11px] text-gray-500">Covers consensus algorithms, consistent hashing, and data partitioning concepts.</p>
                    </div>
                    <div class="p-4 rounded-xl bg-surface-700/50 border border-white/[0.06] space-y-1.5">
                        <span class="text-xs font-semibold text-white">Production Kubernetes & Scaling Mechanics</span>
                        <span class="text-[10px] text-amber-400 block font-medium">Self-Guided Study Roadmap</span>
                        <p class="text-[11px] text-gray-500">Focuses on namespace definitions, network policies, and persistent storage configurations.</p>
                    </div>
                </div>
            </div>
        `;
    }, 1500);
}

function resetCareerAssessment() {
    document.getElementById('career-results-view').classList.add('hidden');
    document.getElementById('career-form-view').classList.remove('hidden');
}

// ── RESUME ANALYZER ──
let selectedResumeFile = null;

function loadSelectedResume(files) {
    if (!files || files.length === 0) return;
    selectedResumeFile = files[0];
    
    document.getElementById('resume-filename').innerText = selectedResumeFile.name;
    document.getElementById('resume-filesize').innerText = `${(selectedResumeFile.size/1024).toFixed(1)} KB`;
    document.getElementById('selected-resume-card').classList.remove('hidden');
}

function clearSelectedResume() {
    selectedResumeFile = null;
    document.getElementById('selected-resume-card').classList.add('hidden');
    document.getElementById('resume-file').value = '';
}

function triggerResumeAnalysis() {
    if (!selectedResumeFile) {
        alert("Please select a resume file first.");
        return;
    }
    
    const uploadView = document.getElementById('resume-upload-view');
    uploadView.innerHTML = `
        <div class="flex flex-col items-center justify-center py-20 text-center">
            <i class="fa-solid fa-spinner fa-spin text-brand-500 text-4xl mb-4"></i>
            <h3 class="text-white font-semibold text-sm">AI Grader extracting resume metrics...</h3>
            <p class="text-gray-500 text-xs mt-1">Evaluating format consistency, keyword checks, and skill groups</p>
        </div>
    `;
    
    setTimeout(() => {
        uploadView.className = "glass-card p-8 rounded-2xl max-w-xl mx-auto space-y-6 text-center";
        uploadView.innerHTML = `
            <div onclick="document.getElementById('resume-file').click()" class="border-2 border-dashed border-white/[0.08] hover:border-brand-500/50 rounded-xl p-10 cursor-pointer bg-white/[0.01] transition-all">
                <i class="fa-solid fa-file-pdf text-4xl text-gray-500 mb-3"></i>
                <p class="text-xs text-gray-300 font-semibold">Drop your resume file or browse</p>
                <p class="text-[10px] text-gray-600 mt-1">Supports PDF & DOCX formats (Max 5MB)</p>
                <input type="file" id="resume-file" class="hidden" onchange="loadSelectedResume(this.files)">
            </div>

            <div id="selected-resume-card" class="hidden p-3 rounded-lg bg-surface-700 border border-white/[0.06] flex items-center justify-between text-left">
                <div class="flex items-center gap-2.5">
                    <i class="fa-solid fa-file text-brand-400 text-sm"></i>
                    <div>
                        <p id="resume-filename" class="text-xs font-semibold text-white truncate w-48"></p>
                        <p id="resume-filesize" class="text-[10px] text-gray-500"></p>
                    </div>
                </div>
                <button onclick="clearSelectedResume()" class="text-gray-500 hover:text-red-400"><i class="fa-solid fa-xmark"></i></button>
            </div>

            <button onclick="triggerResumeAnalysis()" class="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold shadow-md">
                Analyze Resume Profile
            </button>
        `;
        
        document.getElementById('resume-upload-view').classList.add('hidden');
        document.getElementById('resume-results-view').classList.remove('hidden');
        
        // Load Score Dial Values
        const score = 84;
        const circ = 251.2; // 2 * pi * r (r=40)
        const offset = circ - (score / 100) * circ;
        
        document.getElementById('score-circle-progress').setAttribute('stroke-dashoffset', offset);
        document.getElementById('resume-score-value').innerText = `${score}%`;
        
        // Extracted Skills list mock
        const skills = ["Python", "SQL", "Docker", "FastAPI", "React", "Linux System Administration"];
        const skillsContainer = document.getElementById('resume-extracted-skills');
        skillsContainer.innerHTML = skills.map(s => `<span class="badge text-xs bg-brand-500/10 text-brand-300 border border-brand-500/20 px-3 py-1 rounded-xl">${s}</span>`).join('');

        // Render Suggestions Groups
        const suggestionsGrid = document.getElementById('resume-suggestions-grid');
        suggestionsGrid.innerHTML = `
            <div class="glass-card p-5 rounded-xl space-y-3">
                <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-circle-check"></i> Formatting Strengths
                </h4>
                <ul class="space-y-1.5 text-[11px] text-gray-300">
                    <li class="flex items-start gap-1.5"><i class="fa-solid fa-caret-right text-brand-400 mt-0.5 shrink-0"></i>Header sizing and margins are consistent and clear.</li>
                    <li class="flex items-start gap-1.5"><i class="fa-solid fa-caret-right text-brand-400 mt-0.5 shrink-0"></i>Includes distinct technical skills sections.</li>
                </ul>
            </div>
            <div class="glass-card p-5 rounded-xl space-y-3">
                <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <i class="fa-solid fa-triangle-exclamation"></i> Improvements Required
                </h4>
                <ul class="space-y-1.5 text-[11px] text-gray-300">
                    <li class="flex items-start gap-1.5"><i class="fa-solid fa-caret-right text-amber-400 mt-0.5 shrink-0"></i>Missing keywords: Kubernetes, CI/CD, AWS Cloud.</li>
                    <li class="flex items-start gap-1.5"><i class="fa-solid fa-caret-right text-amber-400 mt-0.5 shrink-0"></i>Add specific numeric parameters (e.g. % performance increase) to experience descriptions.</li>
                </ul>
            </div>
        `;
    }, 1500);
}

function resetResumeAnalyzer() {
    selectedResumeFile = null;
    document.getElementById('resume-results-view').classList.add('hidden');
    document.getElementById('resume-upload-view').classList.remove('hidden');
}

// ── INTERVIEW ASSISTANT ──
let interviewType = 'Technical';
let interviewTurn = 0;
let interviewTranscript = [];

function selectInterviewType(type) {
    interviewType = type;
    document.querySelectorAll('#interview-setup-view button').forEach(b => {
        b.className = "p-4 bg-white/[0.02] border-2 border-transparent text-gray-300 rounded-xl text-left hover:scale-[1.02] transition-all";
    });
    
    let activeBtnId = 'btn-int-tech';
    let activeBorderColor = 'border-brand-500/30 bg-brand-500/15 text-brand-300';
    if (type === 'HR') {
        activeBtnId = 'btn-int-hr';
        activeBorderColor = 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300';
    } else if (type === 'Coding') {
        activeBtnId = 'btn-int-coding';
        activeBorderColor = 'border-purple-500/30 bg-purple-500/15 text-purple-300';
    }
    
    document.getElementById(activeBtnId).className = `p-4 border-2 ${activeBorderColor} rounded-xl text-left hover:scale-[1.02] transition-all`;
}

function triggerStartInterview() {
    document.getElementById('interview-setup-view').classList.add('hidden');
    document.getElementById('interview-chat-view').classList.remove('hidden');
    
    document.getElementById('interview-type-header').innerText = `${interviewType.toUpperCase()} INTERVIEW`;
    
    interviewTurn = 0;
    const initialQuestion = STATE.interviewSession.typeQuestions[interviewType][0];
    interviewTranscript = [
        { role: 'assistant', content: initialQuestion }
    ];
    
    renderInterviewChatHistory();
    updateInterviewProgress();
}

function updateInterviewProgress() {
    // 5 questions, so turns range 0-4. Total turns in progress = (turn * 20)%
    const percent = Math.min(((interviewTurn + 1) / 5) * 100, 100);
    document.getElementById('interview-progress-bar').style.width = `${percent}%`;
}

function renderInterviewChatHistory() {
    const container = document.getElementById('interview-chat-history');
    container.innerHTML = '';
    
    interviewTranscript.forEach(t => {
        const isUser = t.role === 'user';
        const item = document.createElement('div');
        item.className = `flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`;
        item.innerHTML = `
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-600 text-purple-400'}">
                <i class="fa-solid ${isUser ? 'fa-user' : 'fa-robot'} text-xs"></i>
            </div>
            <div class="max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${isUser ? 'bg-brand-500/10 border border-brand-500/20 text-white rounded-tr-none' : 'bg-surface-700 border border-white/[0.06] text-gray-200 rounded-tl-none'}">
                ${t.content}
            </div>
        `;
        container.appendChild(item);
    });
    
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 50);
}

function submitInterviewAnswer() {
    const input = document.getElementById('interview-answer-input');
    const answer = input.value.trim();
    if (!answer) return;
    
    input.value = '';
    interviewTranscript.push({ role: 'user', content: answer });
    renderInterviewChatHistory();
    
    interviewTurn++;
    if (interviewTurn >= 5) {
        // Complete interview and generate report
        triggerCompleteInterview();
    } else {
        // Retrieve next question
        const container = document.getElementById('interview-chat-history');
        const typ = document.createElement('div');
        typ.className = "flex gap-2 items-center text-xs text-gray-500 py-1";
        typ.id = "interview-typing";
        typ.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-brand-400"></i> Interviewer is formulating follow-up question...`;
        container.appendChild(typ);
        container.scrollTop = container.scrollHeight;
        
        setTimeout(() => {
            const el = document.getElementById('interview-typing');
            if (el) el.remove();
            
            const nextQuestion = STATE.interviewSession.typeQuestions[interviewType][interviewTurn];
            interviewTranscript.push({ role: 'assistant', content: nextQuestion });
            renderInterviewChatHistory();
            updateInterviewProgress();
        }, 1000);
    }
}

function triggerCompleteInterview() {
    document.getElementById('interview-chat-view').classList.add('hidden');
    
    const reportView = document.getElementById('interview-report-view');
    reportView.classList.remove('hidden');
    
    document.getElementById('interview-final-score').innerHTML = `86<span class="text-sm text-gray-500 font-semibold">/100</span>`;
    document.getElementById('interview-report-summary').innerText = `You completed the ${interviewType} Assessment Session. Your responses showed an excellent grasp of theoretical paradigms and architectural requirements, though minor coding optimizations can be added.`;
    
    const strengths = ["Direct answers with clear structures", "Strong conceptual base in scaling databases", "Uses precise industry terms"];
    const improvements = ["Mention explicit system constraints", "Clarify fallback pathways for network partition scenarios"];
    
    document.getElementById('interview-report-strengths').innerHTML = strengths.map(s => `<li class="text-[11px] text-gray-300 flex items-start gap-1.5"><i class="fa-solid fa-circle-check text-emerald-400 mt-0.5"></i>${s}</li>`).join('');
    document.getElementById('interview-report-improvements').innerHTML = improvements.map(s => `<li class="text-[11px] text-gray-300 flex items-start gap-1.5"><i class="fa-solid fa-circle-exclamation text-amber-400 mt-0.5"></i>${s}</li>`).join('');
}

function resetInterview() {
    document.getElementById('interview-chat-view').classList.add('hidden');
    document.getElementById('interview-report-view').classList.add('hidden');
    document.getElementById('interview-setup-view').classList.remove('hidden');
}

// ── PROJECT RECOMMENDATION ──
function renderProjectSkillsPicker() {
    const container = document.getElementById('project-skills-list');
    container.innerHTML = '';
    
    CAREER_SKILLS_LIST.forEach(s => {
        const active = STATE.projectSkills.includes(s);
        const btn = document.createElement('button');
        btn.onclick = () => toggleProjectSkill(s);
        btn.className = `px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active ? 'bg-brand-500/20 border-brand-500/30 text-brand-300' : 'bg-surface-700/50 border-white/[0.08] text-gray-400'}`;
        btn.innerText = s;
        container.appendChild(btn);
    });
}

function toggleProjectSkill(skill) {
    if (STATE.projectSkills.includes(skill)) {
        STATE.projectSkills = STATE.projectSkills.filter(s => s !== skill);
    } else {
        STATE.projectSkills.push(skill);
    }
    renderProjectSkillsPicker();
}

let activeProjDiff = 'Intermediate';
function selectProjDiff(diff) {
    activeProjDiff = diff;
    document.querySelectorAll('#page-projects button[id^="btn-diff-"]').forEach(b => {
        b.className = "flex-1 py-1.5 border border-white/[0.08] hover:bg-white/[0.02] text-xs font-semibold text-gray-400 rounded-lg transition-all";
    });
    
    let btnId = 'btn-diff-int';
    if (diff === 'Beginner') btnId = 'btn-diff-beg';
    if (diff === 'Advanced') btnId = 'btn-diff-adv';
    
    document.getElementById(btnId).className = "flex-1 py-1.5 border border-brand-500/20 bg-brand-500/10 text-brand-300 text-xs font-semibold rounded-lg transition-all";
}

function triggerProjectRecommend() {
    const results = document.getElementById('project-results-view');
    results.innerHTML = `
        <div class="flex flex-col items-center justify-center py-10 text-center">
            <i class="fa-solid fa-spinner fa-spin text-brand-500 text-2xl mb-2"></i>
            <p class="text-xs text-gray-400">LLM matching technology stack frameworks...</p>
        </div>
    `;
    
    setTimeout(() => {
        results.innerHTML = '';
        const list = [
            {
                title: "Internal Vector Semantic Indexer",
                desc: "Develop a secure corporate document indexer with pgvector, complete with sliding chunking rules and visual search results match logs.",
                diff: activeProjDiff,
                hours: 45,
                stack: ["Python", "FastAPI", "pgvector", "Docker"],
                milestones: [
                    { step: "Phase 1: Database models configuration", desc: "Build declarative models mapping documents and vector chunks." },
                    { step: "Phase 2: Parser hooks implementation", desc: "Write parsing hooks matching word documents and spreadsheets." }
                ]
            }
        ];
        
        list.forEach(p => {
            const card = document.createElement('div');
            card.className = "glass-card p-5 rounded-xl space-y-3";
            card.innerHTML = `
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <h4 class="font-bold text-white text-sm">${p.title}</h4>
                        <p class="text-[11px] text-gray-400 mt-1">${p.desc}</p>
                    </div>
                    <div class="flex flex-col items-end gap-1.5 shrink-0 text-right">
                        <span class="badge text-[9px] bg-brand-500/10 text-brand-300 border border-brand-500/20 px-2 py-0.5 rounded">${p.diff}</span>
                        <span class="text-[10px] text-gray-600 font-medium"><i class="fa-solid fa-clock mr-1"></i>${p.hours} Hours</span>
                    </div>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-[10px] text-gray-500 font-bold uppercase mr-1">Stack:</span>
                    ${p.stack.map(s => `<span class="badge text-[9px] bg-surface-600 text-gray-300 px-2 py-0.5 rounded border border-white/[0.04]">${s}</span>`).join('')}
                </div>
                <div class="space-y-2.5 border-t border-white/[0.04] pt-3">
                    ${p.milestones.map((m, j) => `
                        <div class="flex gap-2 text-xs">
                            <span class="w-4.5 h-4.5 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 text-[10px] font-bold shrink-0 mt-0.5">${j+1}</span>
                            <div>
                                <span class="font-semibold text-white text-[11px] block">${m.step}</span>
                                <span class="text-[10px] text-gray-500 leading-relaxed">${m.desc}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            results.appendChild(card);
        });
    }, 1000);
}

// ── ADMIN PANEL & HEALTH DIAGNOSTICS ──
function switchAdminTab(subTab) {
    activeAdminTab = subTab;
    document.querySelectorAll('#page-admin button[id^="btn-adm-"]').forEach(b => {
        b.className = "px-4 py-1.5 text-gray-400 hover:text-white rounded-lg text-xs font-semibold transition-all";
    });
    
    document.getElementById(`btn-adm-${subTab}`).className = "px-4 py-1.5 bg-brand-500/10 text-brand-400 border border-brand-500/20 rounded-lg text-xs font-semibold transition-all";
    
    document.querySelectorAll('.admin-tab-content').forEach(p => p.classList.add('hidden'));
    document.getElementById(`admin-${subTab}`).classList.remove('hidden');
}

function renderAdminOverview() {
    const list = document.getElementById('admin-audit-logs');
    list.innerHTML = '';
    
    const logs = [
        { action: "USER_LOGIN_SUCCESS", user: "admin@company.private", date: "Just Now" },
        { action: "DOCUMENT_UPLOAD", user: "hr_manager@company.private", date: "15 min ago" },
        { action: "CAREER_ASSESSMENT", user: "employee_12@company.private", date: "1 hour ago" },
        { action: "VECTOR_DB_SEARCH", user: "system_agent", date: "2 hours ago" }
    ];
    
    logs.forEach(l => {
        const item = document.createElement('div');
        item.className = "flex items-center justify-between text-xs py-2 border-b border-white/[0.04] last:border-0";
        item.innerHTML = `
            <div class="flex items-center gap-2">
                <i class="fa-solid fa-shield-halved text-brand-400 text-[10px]"></i>
                <span class="font-medium text-gray-300">${l.action}</span>
                <span class="text-[10px] text-gray-600">(${l.user})</span>
            </div>
            <span class="text-[10px] text-gray-600">${l.date}</span>
        `;
        list.appendChild(item);
    });
}

const MOCK_USERS = [
    { id: 1, name: "Admin User", email: "admin@company.private", role: "Super Admin", active: true },
    { id: 2, name: "HR Manager", email: "hr@company.private", role: "HR", active: true },
    { id: 3, name: "John Doe", email: "john@company.private", role: "Employee", active: true },
    { id: 4, name: "Jane Smith", email: "jane@company.private", role: "Student", active: false }
];

function renderAdminUsersTable() {
    const table = document.getElementById('admin-user-table');
    table.innerHTML = '';
    
    MOCK_USERS.forEach(u => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-white/[0.02]";
        
        tr.innerHTML = `
            <td class="py-3 px-5">
                <p class="font-semibold text-white">${u.name}</p>
                <p class="text-[10px] text-gray-500">${u.email}</p>
            </td>
            <td class="py-3 px-4">
                <select onchange="alert('Role updated!')" class="bg-surface-700 border border-white/[0.08] text-gray-300 rounded px-2 py-0.5 text-xs outline-none">
                    <option ${u.role==='Super Admin'?'selected':''}>Super Admin</option>
                    <option ${u.role==='Admin'?'selected':''}>Admin</option>
                    <option ${u.role==='HR'?'selected':''}>HR</option>
                    <option ${u.role==='Employee'?'selected':''}>Employee</option>
                    <option ${u.role==='Student'?'selected':''}>Student</option>
                </select>
            </td>
            <td class="py-3 px-4">
                <button onclick="toggleMockUserStatus(${u.id})" class="flex items-center gap-1">
                    ${u.active ? `<i class="fa-solid fa-toggle-on text-emerald-400 text-base"></i><span class="text-[10px] text-emerald-400">Active</span>` : `<i class="fa-solid fa-toggle-off text-gray-600 text-base"></i><span class="text-[10px] text-gray-500">Inactive</span>`}
                </button>
            </td>
            <td class="py-3 px-5 text-right">
                <button onclick="alert('User accounts deletion requires Super Admin verification.')" class="p-1 hover:bg-red-500/20 text-gray-600 hover:text-red-400 rounded transition-all">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        `;
        table.appendChild(tr);
    });
}

function toggleMockUserStatus(id) {
    const user = MOCK_USERS.find(u => u.id === id);
    if (user) {
        user.active = !user.active;
        renderAdminUsersTable();
    }
}

// Simulated hardware telemetry loop
setInterval(() => {
    if (activeTab === 'admin' && activeAdminTab === 'diagnostics') {
        const cpu = Math.floor(20 + Math.random() * 15);
        const mem = Math.floor(60 + Math.random() * 5);
        
        document.getElementById('cpu-percent-lbl').innerText = `${cpu}%`;
        document.getElementById('cpu-bar-prog').style.width = `${cpu}%`;
        
        document.getElementById('mem-percent-lbl').innerText = `${mem}%`;
        document.getElementById('mem-bar-prog').style.width = `${mem}%`;
    }
}, 2000);

// ── INITIALIZER ──
window.onload = () => {
    switchTab('chat');
};
