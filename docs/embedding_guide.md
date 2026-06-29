# Developer Embedding & Integration Guide - Chatbot Widget

This guide explains how to plug the secure RAG-enabled chatbot widget into any existing company website.

---

## 1. Vanilla JavaScript Embedding (Single HTML Script Tag)

For traditional HTML websites (such as portals built with WordPress, PHP, or plain static HTML pages), you only need to copy and paste one script tag before the closing `</body>` tag of your site template.

### Basic Integration
Add this snippet to load the widget dynamically:

```html
<!-- Secure Embed Chatbot Widget -->
<script src="http://localhost:8000/static/widget.js"></script>
```

### Advanced Customization
You can override default settings (colors, titles, greetings) by declaring a configuration object `window.CompanyChatbotConfig` **before** loading the script tag:

```html
<script>
    window.CompanyChatbotConfig = {
        apiBase: 'http://localhost:8000/api/v1',
        title: 'Customer Help Desk',
        subtitle: 'Enterprise AI Assistant',
        themeColor: '#10b981', // Custom branding color (green)
        initialGreeting: 'Welcome to our Support Portal! Let me know if you need assistance with leave applications or billing codes.'
    };
</script>
<script src="http://localhost:8000/static/widget.js"></script>
```

---

## 2. React / TypeScript Integration

If the corporate website is a modern React SPA or Next.js app, you can import and mount the chatbot as a reusable React component.

### Usage Example
Save the `ChatWidget.tsx` component into your component folder (`src/components/ChatWidget.tsx`), then render it in your app entrypoint:

```tsx
import React from 'react';
import ChatWidget from './components/ChatWidget';

function App() {
  return (
    <div className="App">
      {/* Your existing company website layout */}
      <header>...</header>
      <main>...</main>
      
      {/* Chatbot Widget mounted globally */}
      <ChatWidget 
        apiUrl="http://localhost:8000/api/v1/widget/stream"
        title="Internal HR Portal"
        subtitle="On-Premises LLM Agent"
        themeColor="#8b5cf6" // Purple branding
        initialGreeting="Hello! I can help you search our secure employee policy handbook."
        defaultRAG={true}
      />
    </div>
  );
}

export default App;
```

---

## 3. Backend API Reference

The widget communicates with the FastAPI backend endpoint `/api/v1/widget/stream`.

- **Endpoint URL**: `POST /api/v1/widget/stream`
- **Content-Type**: `application/json`
- **Request Body Payload**:
  ```json
  {
    "message": "What is the policy for paternity leave?",
    "session_id": "optional-session-identifier-uuid",
    "rag_enabled": true
  }
  ```
- **Response Format**: `text/event-stream` (Server-Sent Events)
  - Returns tokens in real-time. Each data line follows this structure:
    `data: {"token": "next_word_token"}`
  - Completes with the following marker:
    `data: [DONE]`

---

## 4. Production Deployment & Security Notes

### CORS Configurations
To prevent unauthorized domains from embedding your chatbot, configure the Allowed CORS list inside the backend environment files (`BACKEND_CORS_ORIGINS`).
1. In your configuration, update the list to only trust your corporate domain:
   ```env
   BACKEND_CORS_ORIGINS=["https://my-company-portal.com", "https://intranet.company.local"]
   ```

### HTTPS Support
Ensure that when deploying to production, you serve both the FastAPI server and the `widget.js` script over secure HTTPS to satisfy browser origin constraints and protect user chat histories.
