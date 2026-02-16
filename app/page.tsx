'use client';

import { Plus, ArrowUp, Lock } from 'lucide-react';
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
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <div className="app-background" />
      </div>
    );
  }

  // Password screen
  if (!isAuthenticated) {
    return (
      <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
        <div className="app-background" />
        <div className="pw-screen animate-fadeIn">
          <div className="pw-card">
            {/* Mascot on password screen */}
            <div
              className="animate-bounce-gentle"
              style={{
                width: '140px',
                height: '180px',
                position: 'relative',
              }}
            >
              <Image
                src="/character.png"
                alt="エリちゃん"
                width={140}
                height={180}
                priority
                style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
              />
            </div>

            <h1 className="pw-title">ELIGO bot</h1>
            <p className="pw-subtitle">
              <Lock size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} />
              パスワードを入力してください
            </p>

            <form onSubmit={handlePasswordSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPwError(''); }}
                placeholder="••••••••"
                className={`pw-input ${pwError ? 'pw-error' : ''}`}
                autoFocus
                disabled={isPwLoading}
              />
              {pwError && <p className="pw-error-msg">{pwError}</p>}
              <button
                type="submit"
                className="pw-btn"
                disabled={!password.trim() || isPwLoading}
              >
                {isPwLoading ? '確認中...' : 'ログイン'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Main chat UI (authenticated)
  const isWelcome = messages.length === 0;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden' }}>
      {/* Background gradient */}
      <div className="app-background" />

      {/* Content container */}
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
        {/* Header with pop-art logo */}
        <header
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px 20px',
            flexShrink: 0,
          }}
        >
          <h1 className="header-logo">
            ELIGOチームQAチャット
          </h1>
        </header>

        {/* Main content area */}
        <main
          className="chat-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0 16px 16px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Welcome Screen */}
          {isWelcome && (
            <div
              className="animate-fadeIn"
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                paddingBottom: '20px',
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

              {/* Mascot character */}
              <div
                className="animate-bounce-gentle"
                style={{
                  width: '220px',
                  height: '280px',
                  position: 'relative',
                  marginTop: '8px',
                }}
              >
                <Image
                  src="/character.png"
                  alt="エリちゃん"
                  width={220}
                  height={280}
                  priority
                  style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}
                />
              </div>
            </div>
          )}

          {/* Chat Messages */}
          {!isWelcome && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
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
                  {/* Bot avatar */}
                  {msg.role === 'assistant' && (
                    <div
                      style={{
                        width: '40px',
                        height: '50px',
                        flexShrink: 0,
                        marginBottom: '4px',
                      }}
                    >
                      <Image src="/character.png" alt="エリちゃん" width={40} height={50} />
                    </div>
                  )}

                  <div className={msg.role === 'user' ? 'user-bubble' : 'assistant-bubble'}>
                    {msg.role === 'assistant' ? renderContent(msg.content) : (
                      <div className="leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                    )}
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-start',
                    alignItems: 'flex-end',
                    gap: '8px',
                  }}
                >
                  <div style={{ width: '40px', height: '50px', flexShrink: 0, marginBottom: '4px' }}>
                    <Image
                      src="/character.png"
                      alt="エリちゃん"
                      width={40}
                      height={50}
                      className="animate-bounce"
                    />
                  </div>
                  <div className="assistant-bubble">
                    <div className="loading-dots" style={{ padding: '4px 8px' }}>
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input Area */}
        <footer style={{ padding: '12px 16px 24px', flexShrink: 0 }}>
          <form onSubmit={handleSubmit} className="input-container">
            <button
              type="button"
              className="input-action-btn plus-btn"
              aria-label="追加"
            >
              <Plus size={22} strokeWidth={2.5} />
            </button>

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
