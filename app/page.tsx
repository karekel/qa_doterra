'use client';

import { ArrowUp } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';

export default function Home() {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Password protection state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [isPwLoading, setIsPwLoading] = useState(false);

  // Check sessionStorage on mount
  useEffect(() => {
    const authed = sessionStorage.getItem('qa_authed');
    if (authed === 'true') {
      setIsAuthenticated(true);
    }
    setIsCheckingAuth(false);
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || isPwLoading) return;

    setIsPwLoading(true);
    setPwError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.ok) {
        sessionStorage.setItem('qa_authed', 'true');
        setIsAuthenticated(true);
      } else {
        setPwError(data.error || 'パスワードが違います');
        setPassword('');
      }
    } catch {
      setPwError('エラーが発生しました。もう一度お試しください。');
    } finally {
      setIsPwLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) throw new Error(response.statusText);

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.content }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'エラーが発生しました。もう一度お試しください。' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Render content with source citations
  const renderContent = (content: string) => {
    const sourceRegex = /\[参照元: .+?\]/g;
    const sources = content.match(sourceRegex) || [];
    const mainText = content.replace(sourceRegex, '').trim();

    return (
      <div>
        <div className="leading-relaxed whitespace-pre-wrap">{mainText}</div>
        {sources.length > 0 && (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(180, 165, 210, 0.3)' }}>
            {sources.map((src, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-block',
                  fontSize: '11px',
                  color: '#888',
                  background: 'rgba(180, 165, 210, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '8px',
                  marginRight: '4px',
                  marginBottom: '4px',
                }}
              >
                {src.replace('[参照元: ', '').replace(']', '')}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Show nothing while checking auth
  if (isCheckingAuth) {
    return (
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden' }}>
        <div className="app-bg-img" />
      </div>
    );
  }

  // Password screen
  if (!isAuthenticated) {
    return (
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden' }}>
        {/* Background image */}
        <div className="app-bg-img" />

        {/* Login content */}
        <div className="login-outer animate-fadeIn">
          {/* Logo section: single circle behind, logo + BOT text in front */}
          <div className="logo-section">
            <div className="logo-circle" />
            <div className="logo-row">
              <Image
                src="/素材/eligofront_w.png"
                alt="ELIGO"
                width={500}
                height={140}
                priority
                style={{ width: 'min(340px, 52vw)', height: 'auto' }}
              />
              <span className="logo-bot-text">BOT</span>
            </div>
          </div>

          {/* Frosted glass card */}
          <div className="login-card-glass">
            <form
              onSubmit={handlePasswordSubmit}
              style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwError(''); }}
                placeholder="Password"
                className={`pw-input-pill${pwError ? ' pw-error' : ''}`}
                autoFocus
                disabled={isPwLoading}
              />
              {pwError && <p className="pw-error-msg">{pwError}</p>}
              <button
                type="submit"
                className="pw-btn-pill"
                disabled={!password.trim() || isPwLoading}
              >
                {isPwLoading ? 'Checking...' : 'Log in'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main chat UI (authenticated)
  const isWelcome = messages.length === 0;

  // ── Welcome screen ──────────────────────────────────────────────
  if (isWelcome) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <div className="app-background" />
        <div
          className="animate-fadeIn"
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '28px',
            padding: '0 16px 40px',
          }}
        >
          {/* Welcome text */}
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#3A3050',
              textAlign: 'center',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            ELIGO bot へようこそ！
            <br />
            今日は何をお手伝いしましょう？
          </h2>

          {/* Mascot */}
          <div
            className="animate-bounce-gentle"
            style={{ width: '220px', height: '280px', position: 'relative' }}
          >
            <Image
              src="/素材/kyara.png"
              alt="キャラクター"
              width={220}
              height={280}
              priority
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
            />
          </div>

          {/* Input directly below character */}
          <form
            onSubmit={handleSubmit}
            className="input-container"
            style={{ width: '100%', maxWidth: '448px' }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="なんでも聞いてください！"
              className="input-field"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="input-action-btn send-btn"
              disabled={!input.trim() || isLoading}
              aria-label="送信"
            >
              <ArrowUp size={22} strokeWidth={2.5} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Chat screen ──────────────────────────────────────────────────
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <div className="app-background" />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        {/* Messages */}
        <main
          className="chat-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 16px 0',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className="animate-fadeInUp"
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-end',
                  gap: '8px',
                  animationDelay: `${idx * 0.05}s`,
                }}
              >
                {msg.role === 'assistant' && (
                  <div style={{ width: '40px', height: '50px', flexShrink: 0, marginBottom: '4px' }}>
                    <Image src="/素材/kyara.png" alt="キャラクター" width={40} height={50} />
                  </div>
                )}
                <div className={msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}>
                  {msg.role === 'assistant' ? renderContent(msg.content) : (
                    <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              </div>
            ))}

            {/* Loading */}
            {isLoading && messages[messages.length - 1]?.role === 'user' && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ width: '40px', height: '50px', flexShrink: 0, marginBottom: '4px' }}>
                  <Image src="/素材/kyara.png" alt="キャラクター" width={40} height={50} className="animate-bounce" />
                </div>
                <div className="assistant-bubble">
                  <div className="loading-dots" style={{ padding: '4px 8px' }}>
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </main>

        {/* Input */}
        <footer style={{ padding: '12px 16px 24px', flexShrink: 0 }}>
          <form onSubmit={handleSubmit} className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="なんでも聞いてください！"
              className="input-field"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="input-action-btn send-btn"
              disabled={!input.trim() || isLoading}
              aria-label="送信"
            >
              <ArrowUp size={22} strokeWidth={2.5} />
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
