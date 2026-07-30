'use client';

import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { apiCall } from '@/lib/api';
import { createSocket } from '@/lib/socket';
import { ConsultationMessage } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function decodeUserId(token: string): string {
  try {
    return JSON.parse(atob(token.split('.')[1])).id || '';
  } catch {
    return '';
  }
}

// Image messages authenticated route se aate hain — <img src> directly auth header nahi bhej sakta,
// isliye fetch karke blob se object URL banate hain
function ChatImage({ consultationId, filename, token }: { consultationId: string; filename: string; token: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl = '';
    let cancelled = false;

    (async () => {
      const res = await fetch(`${API_URL}/consultations/${consultationId}/messages/image/${filename}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && !cancelled) {
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      }
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [consultationId, filename, token]);

  if (!src) return <div className="text-xs text-gray-400 italic">Loading image...</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="Shared photo" className="max-w-50 rounded mt-1" />;
}
type Escalation = {
  type: 'emergency' | 'nearby_care';
  ticketId: string;
  severity: string;
  reason: string;
  clinics?: { name: string; type?: string; distanceKm: number; directionsUrl: string }[];
};

export default function ConsultationChat({ consultationId, token,status,endTime }: { consultationId: string; token: string ; status?: string; endTime?: string }) {
  const [messages, setMessages] = useState<ConsultationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [escalation, setEscalation] = useState<Escalation | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const currentUserId = decodeUserId(token);
  const [autoCompleted, setAutoCompleted] = useState(false);
const [remaining, setRemaining] = useState<number | null>(null);
 const isCompleted = status === 'completed' || autoCompleted;
  useEffect(() => {
    let mounted = true;

    // Pehle history load karo
    apiCall<{ data: ConsultationMessage[] }>(`/consultations/${consultationId}/messages`, { token }).then((result) => {
      if (mounted && result.status === 200) setMessages(result.data.data || []);
    });

    // Phir live connection banao
    const socket = createSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join_consultation', consultationId, (response: { error?: string }) => {
        if (response?.error) console.error('Could not join chat room:', response.error);
        else setConnected(true);
      });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_message', (message: ConsultationMessage) => {
      if (message.consultation_id === consultationId) {
        setMessages((prev) => [...prev, message]);
      }
    });
    socket.on('consultation_completed', () => setAutoCompleted(true));

    socket.on('escalation_triggered', (data: Escalation) => {
  setEscalation(data);
});

    return () => {
      mounted = false;
      socket.disconnect();
    };
  }, [consultationId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  if (!endTime || isCompleted) { setRemaining(null); return; }
  const end = new Date(endTime).getTime();
  const tick = () => {
    const r = Math.max(0, Math.floor((end - Date.now()) / 1000));
    setRemaining(r);
    if (r === 0) setAutoCompleted(true);
  };
  tick();
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, [endTime, isCompleted]);

  const handleSend = () => {
    const text = newMessage.trim();
    if (!text || !socketRef.current) return;
    setEscalation(null); 
    socketRef.current.emit('send_message', { consultationId, text }, (response: { error?: string }) => {
      if (response?.error) alert(response.error);
    });
    setNewMessage('');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_URL}/consultations/${consultationId}/messages/image`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // Content-Type set MAT karo — browser khud multipart boundary set karega
        body: formData
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Image upload failed');
      }
      // Success pe kuch nahi karna — backend socket se 'new_message' emit kar dega, wahi list update kar dega
    } catch {
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-slate-50 flex flex-col h-[500px] w-full">
      {/* Escalation Banners */}
      {escalation && escalation.type === 'emergency' && (
        <div className="shrink-0 bg-red-50 border-b border-red-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-inner">
          <div className="text-sm text-red-700 leading-snug flex items-start gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <strong className="block text-red-900 font-bold mb-0.5">Urgent Medical Attention Recommended</strong>
              Please don&apos;t wait — call emergency services now if you&apos;re experiencing a serious symptom.
            </div>
          </div>
          <a
            href="tel:108"
            className="shrink-0 bg-red-600 text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-sm hover:bg-red-700 hover:shadow-md transition-all whitespace-nowrap"
          >
            📞 Call 108
          </a>
        </div>
      )}

      {escalation && escalation.type === 'nearby_care' && (
        <div className="shrink-0 bg-amber-50 border-b border-amber-200 px-4 py-3 shadow-inner">
          <div className="text-sm text-amber-900 mb-3 leading-snug flex items-start gap-3">
            <span className="text-2xl">🏥</span>
            <div>
              <strong className="block text-amber-950 font-bold mb-0.5">In-Person Checkup Recommended</strong>
              Based on your symptoms, we suggest visiting a clinic. Here are nearby options:
            </div>
          </div>
          {escalation.clinics && escalation.clinics.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar ml-9">
              {escalation.clinics.map((c, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 bg-white border border-amber-100 rounded-lg px-4 py-2.5 text-sm shadow-sm hover:border-amber-300 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 truncate">{c.name}</div>
                    <div className="text-amber-600 font-medium text-xs mt-0.5">{c.distanceKm} km away</div>
                  </div>
                  <a
                    href={c.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-md text-xs font-bold hover:bg-amber-200 transition-colors"
                  >
                    Directions →
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-amber-700 ml-9 italic">
              We couldn&apos;t find nearby options automatically — please consult an in-person doctor soon.
            </p>
          )}
        </div>
      )}

      {/* Status Bar */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs font-semibold text-slate-500 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            {connected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${connected ? 'bg-green-500' : 'bg-slate-300'}`}></span>
          </span>
          {connected ? 'Live Connection Active' : 'Connecting to Server...'}
        </div>
        
        {isCompleted ? (
          <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">Session Ended</span>
        ) : remaining !== null ? (
          <div className="flex items-center gap-1.5 bg-sky-50 text-sky-700 px-2 py-0.5 rounded">
            <span>⏱️</span>
            {String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}
          </div>
        ) : null}
      </div>

      {/* Messages Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 space-y-3 opacity-50">
            <span className="text-4xl">👋</span>
            <p className="text-sm font-medium">No messages yet. Start the conversation!</p>
          </div>
        )}
        
        {messages.map((m) => {
          const isMine = m.sender_id === currentUserId;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div 
                className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm relative group ${
                  isMine 
                    ? 'bg-sky-600 text-white rounded-br-sm' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                }`}
              >
                {m.message_type === 'image' ? (
                  <ChatImage consultationId={consultationId} filename={m.content.split('/').pop() || ''} token={token} />
                ) : (
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                )}
                <div 
                  className={`text-[10px] mt-1.5 font-medium flex items-center justify-end gap-1 ${
                    isMine ? 'text-sky-200' : 'text-slate-400'
                  }`}
                >
                  {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  {isMine && <span>✓✓</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      {isCompleted ? (
        <div className="shrink-0 bg-slate-100 border-t border-slate-200 p-4 text-center text-sm font-medium text-slate-500">
          This consultation has ended. The chat is now read-only.
        </div>
      ) : (
        <div className="shrink-0 bg-white border-t border-slate-200 p-3">
          <div className="flex items-end gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              id={`image-upload-${consultationId}`}
            />
            <label
              htmlFor={`image-upload-${consultationId}`}
              className={`cursor-pointer p-2.5 rounded-lg transition-colors flex items-center justify-center ${
                uploading ? 'bg-sky-100 text-sky-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200'
              }`}
              title="Attach image"
            >
              {uploading ? (
                <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              )}
            </label>
            
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message here..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2.5 px-2 text-sm text-slate-800 placeholder:text-slate-400 max-h-32"
              rows={1}
              style={{ minHeight: '44px' }}
            />
            
            <button
              onClick={handleSend}
              disabled={!newMessage.trim() || uploading}
              className="p-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:hover:bg-sky-600 transition-colors flex items-center justify-center shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
