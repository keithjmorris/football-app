'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [name, setName] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('wchat_name');
    if (saved) { setName(saved); setNameSet(true); }
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(q, snapshot => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function saveName(e) {
    e.preventDefault();
    if (!name.trim()) return;
    localStorage.setItem('wchat_name', name.trim());
    setNameSet(true);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    await addDoc(collection(db, 'messages'), {
      text: newMessage.trim(),
      name,
      createdAt: serverTimestamp(),
    });
    setNewMessage('');
  }

  if (!nameSet) {
    return (
      <main>
        <header className="site-header">
          <div className="header-inner">
            <span className="trophy">💬</span>
            <div>
              <h1 className="site-title">Family Chat</h1>
              <p className="site-subtitle">World Cup 2026</p>
            </div>
          </div>
        </header>
        <div className="content" style={{ maxWidth: 400, paddingTop: '3rem' }}>
          <p style={{ marginBottom: '1rem', fontWeight: 600 }}>What's your name?</p>
          <form onSubmit={saveName} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="chat-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name…"
              autoFocus
            />
            <button className="send-btn" type="submit">Go</button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="site-header">
        <div className="header-inner">
          <span className="trophy">💬</span>
          <div>
            <h1 className="site-title">Family Chat</h1>
            <p className="site-subtitle">Chatting as {name}</p>
          </div>
        </div>
      </header>

      <div className="chat-layout">
        <div className="messages-list">
          {messages.length === 0 && (
            <p className="state-msg">No messages yet — say hello! 👋</p>
          )}
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`message ${msg.name === name ? 'own' : ''}`}
            >
              <div className="msg-name">{msg.name}</div>
              <div className="msg-text">{msg.text}</div>
              <div className="msg-time">
                {msg.createdAt?.toDate?.()?.toLocaleTimeString('en-GB', {
                  hour: '2-digit', minute: '2-digit'
                })}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={sendMessage} className="chat-input-row">
          <input
            className="chat-input"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message…"
          />
          <button className="send-btn" type="submit">Send</button>
        </form>
      </div>
    </main>
  );
}