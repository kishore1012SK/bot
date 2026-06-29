(function() {
    // ── CONFIGURATION & INSTANCE CONTROL ──
    const CONFIG = {
        apiBase: 'http://localhost:8000/api/v1',
        title: 'Company Assistant',
        subtitle: 'Secure Private AI',
        themeColor: '#2b5aff',
        textColor: '#ffffff',
        avatarBg: 'linear-gradient(135deg, #2b5aff 0%, #8b5cf6 100%)',
        initialGreeting: 'Hello! I am your private company AI assistant. How can I help you find information inside our documents today?'
    };

    // Ensure we don't double-initialize
    if (window.CompanyChatbotInitialized) return;
    window.CompanyChatbotInitialized = true;

    // ── STYLES INJECTION ──
    const css = `
        .cc-widget-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 999999;
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
        }

        /* Floating Bubble Trigger Button */
        .cc-trigger-btn {
            width: 60px;
            height: 60px;
            border-radius: 30px;
            background: ${CONFIG.avatarBg};
            box-shadow: 0 4px 20px rgba(43, 90, 255, 0.4);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            outline: none;
        }

        .cc-trigger-btn:hover {
            transform: scale(1.08) translateY(-2px);
            box-shadow: 0 6px 24px rgba(43, 90, 255, 0.5);
        }

        .cc-trigger-btn:active {
            transform: scale(0.95);
        }

        .cc-trigger-btn svg {
            width: 24px;
            height: 24px;
            fill: none;
            stroke: #ffffff;
            stroke-width: 2;
            stroke-linecap: round;
            stroke-linejoin: round;
            transition: transform 0.3s ease;
        }

        .cc-widget-open .cc-trigger-btn svg {
            transform: rotate(90deg);
        }

        /* Chat Panel Container */
        .cc-chat-panel {
            width: 360px;
            height: 500px;
            max-height: calc(100vh - 100px);
            background: #111218;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            display: flex;
            flex-direction: column;
            margin-bottom: 16px;
            overflow: hidden;
            opacity: 0;
            transform: translateY(20px) scale(0.95);
            pointer-events: none;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            transform-origin: bottom right;
        }

        .cc-widget-open .cc-chat-panel {
            opacity: 1;
            transform: translateY(0) scale(1);
            pointer-events: auto;
        }

        /* Header block */
        .cc-header {
            padding: 16px;
            background: rgba(26, 27, 36, 0.8);
            border-b: 1px solid rgba(255, 255, 255, 0.08);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .cc-header-info {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .cc-header-avatar {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: ${CONFIG.avatarBg};
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .cc-header-avatar svg {
            width: 16px;
            height: 16px;
            stroke: #ffffff;
            stroke-width: 2;
        }

        .cc-header-title {
            font-size: 14px;
            font-weight: 700;
            color: #ffffff;
            line-height: 1.2;
        }

        .cc-header-status {
            font-size: 10px;
            color: #10b981;
            display: flex;
            align-items: center;
            gap: 4px;
            margin-top: 2px;
        }

        .cc-header-status-dot {
            width: 6px;
            height: 6px;
            border-radius: 3px;
            background-color: #10b981;
            display: inline-block;
        }

        .cc-close-btn {
            background: transparent;
            border: none;
            cursor: pointer;
            padding: 4px;
            color: #5b5d6a;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: color 0.2s ease;
        }

        .cc-close-btn:hover {
            color: #ffffff;
        }

        /* Message feed list */
        .cc-messages-feed {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: radial-gradient(circle at top right, rgba(43, 90, 255, 0.03) 0%, #111218 80%);
        }

        .cc-msg-bubble {
            max-width: 80%;
            padding: 10px 14px;
            font-size: 12px;
            line-height: 1.5;
            border-radius: 12px;
        }

        .cc-msg-user {
            background: rgba(43, 90, 255, 0.15);
            border: 1px solid rgba(43, 90, 255, 0.3);
            color: #ffffff;
            align-self: flex-end;
            border-top-right-radius: 2px;
        }

        .cc-msg-bot {
            background: #1a1b24;
            border: 1px solid rgba(255, 255, 255, 0.05);
            color: #e2e8f0;
            align-self: flex-start;
            border-top-left-radius: 2px;
        }

        /* Typing Dots */
        .cc-typing-dots {
            display: flex;
            align-items: center;
            gap: 3px;
            padding: 4px 0;
        }

        .cc-typing-dot {
            width: 4px;
            height: 4px;
            background: #a0aec0;
            border-radius: 2px;
            animation: ccBounce 1.4s infinite ease-in-out both;
        }

        .cc-typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .cc-typing-dot:nth-child(2) { animation-delay: -0.16s; }

        @keyframes ccBounce {
            0%, 80%, 100% { transform: scale(0); }
            40% { transform: scale(1.0); }
        }

        /* Input control bar */
        .cc-input-bar {
            padding: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(26, 27, 36, 0.5);
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .cc-input-field {
            flex: 1;
            background: #1a1b24;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 8px;
            padding: 8px 12px;
            color: #ffffff;
            font-size: 12px;
            outline: none;
            transition: border-color 0.2s ease;
        }

        .cc-input-field:focus {
            border-color: ${CONFIG.themeColor};
        }

        .cc-send-btn {
            background: ${CONFIG.themeColor};
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            transition: background 0.2s ease;
        }

        .cc-send-btn:hover {
            opacity: 0.9;
        }

        .cc-send-btn svg {
            width: 14px;
            height: 14px;
            fill: none;
            stroke: currentColor;
            stroke-width: 2.5;
        }

        /* Responsive scaling */
        @media (max-width: 400px) {
            .cc-chat-panel {
                width: calc(100vw - 32px);
                right: 16px;
            }
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    // ── DOM INJECTION ──
    const container = document.createElement('div');
    container.className = 'cc-widget-container';
    container.id = 'company-chatbot-widget';

    container.innerHTML = `
        <div class="cc-chat-panel" id="cc-chat-panel">
            <div class="cc-header">
                <div class="cc-header-info">
                    <div class="cc-header-avatar">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10a9.96 9.96 0 0 0 6.643-2.505l4.357 1.365-1.365-4.357A9.96 9.96 0 0 0 22 12a10 10 0 0 0-10-10z"></path></svg>
                    </div>
                    <div>
                        <div class="cc-header-title">${CONFIG.title}</div>
                        <div class="cc-header-status">
                            <span class="cc-header-status-dot"></span>
                            <span>${CONFIG.subtitle}</span>
                        </div>
                    </div>
                </div>
                <button class="cc-close-btn" id="cc-close-btn" aria-label="Close Chat">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            
            <div class="cc-messages-feed" id="cc-messages-feed">
                <!-- Loaded dynamically -->
            </div>
            
            <div class="cc-input-bar">
                <input type="text" class="cc-input-field" id="cc-input-field" placeholder="Ask a question..." autocomplete="off">
                <button class="cc-send-btn" id="cc-send-btn" aria-label="Send message">
                    <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                </button>
            </div>
        </div>
        
        <button class="cc-trigger-btn" id="cc-trigger-btn" aria-label="Open Chat">
            <svg viewBox="0 0 24 24" id="cc-icon-chat"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <svg viewBox="0 0 24 24" id="cc-icon-close" style="display:none;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
    `;

    document.body.appendChild(container);

    // ── STATE & EVENT LISTENERS ──
    let isOpen = false;
    let isGenerating = false;

    const triggerBtn = document.getElementById('cc-trigger-btn');
    const closeBtn = document.getElementById('cc-close-btn');
    const inputField = document.getElementById('cc-input-field');
    const sendBtn = document.getElementById('cc-send-btn');
    const feed = document.getElementById('cc-messages-feed');
    const iconChat = document.getElementById('cc-icon-chat');
    const iconClose = document.getElementById('cc-icon-close');

    // Load initial greeting
    appendMessage('bot', CONFIG.initialGreeting);

    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            container.classList.add('cc-widget-open');
            iconChat.style.display = 'none';
            iconClose.style.display = 'block';
            setTimeout(() => inputField.focus(), 150);
        } else {
            container.classList.remove('cc-widget-open');
            iconChat.style.display = 'block';
            iconClose.style.display = 'none';
        }
    }

    triggerBtn.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // Enter key submits
    inputField.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitMessage();
        }
    });

    sendBtn.addEventListener('click', submitMessage);

    // ── HELPER FUNCTIONS ──
    function appendMessage(sender, text) {
        const bubble = document.createElement('div');
        bubble.className = `cc-msg-bubble cc-msg-${sender}`;
        
        // Clean basic markdown tags in the widget
        bubble.innerHTML = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code style="font-family:monospace; background:rgba(255,255,255,0.06); padding:2px 4px; rounded:4px;">$1</code>')
            .replace(/\n/g, '<br>');
            
        feed.appendChild(bubble);
        feed.scrollTop = feed.scrollHeight;
        return bubble;
    }

    function appendTypingIndicator() {
        const bubble = document.createElement('div');
        bubble.className = 'cc-msg-bubble cc-msg-bot';
        bubble.id = 'cc-typing-bubble';
        bubble.innerHTML = `
            <div class="cc-typing-dots">
                <span class="cc-typing-dot"></span>
                <span class="cc-typing-dot"></span>
                <span class="cc-typing-dot"></span>
            </div>
        `;
        feed.appendChild(bubble);
        feed.scrollTop = feed.scrollHeight;
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById('cc-typing-bubble');
        if (indicator) indicator.remove();
    }

    async function submitMessage() {
        const text = inputField.value.trim();
        if (!text || isGenerating) return;

        inputField.value = '';
        appendMessage('user', text);
        
        isGenerating = true;
        appendTypingIndicator();

        try {
            const res = await fetch(`${CONFIG.apiBase}/widget/stream`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: text,
                    rag_enabled: true
                })
            });

            if (!res.ok) throw new Error('API request failed');

            removeTypingIndicator();
            const botBubble = appendMessage('bot', '');
            
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';
            let sseBuffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                sseBuffer += decoder.decode(value);
                const lines = sseBuffer.split('\n');
                sseBuffer = lines.pop(); // Keep partial lines

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data: ')) {
                        const rawData = trimmed.slice(6).trim();
                        if (rawData === '[DONE]') break;
                        try {
                            const parsed = JSON.parse(rawData);
                            if (parsed.token) {
                                accumulatedText += parsed.token;
                                // Injected HTML formatter update
                                botBubble.innerHTML = accumulatedText
                                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                    .replace(/`([^`]+)`/g, '<code style="font-family:monospace; background:rgba(255,255,255,0.06); padding:2px 4px; rounded:4px;">$1</code>')
                                    .replace(/\n/g, '<br>');
                                feed.scrollTop = feed.scrollHeight;
                            }
                        } catch (e) {
                            // JSON parsing issues for partial buffers
                        }
                    }
                }
            }

        } catch (err) {
            console.error('Chatbot error:', err);
            removeTypingIndicator();
            appendMessage('bot', 'Sorry, I am having trouble connecting to the local AI engine. Please ensure your backend container is running.');
        } finally {
            isGenerating = false;
        }
    }
})();
