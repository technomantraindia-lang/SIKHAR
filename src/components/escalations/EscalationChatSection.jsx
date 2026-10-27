import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  Square,
  Play,
  Pause,
  Users,
  Car,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Volume2
} from '../common/Icons';
import { sendEscalationMessageApi } from '../../services/api';

export default function EscalationChatSection({ ticket, onTicketUpdated }) {
  const [messages, setMessages] = useState(() => ticket?.messages || []);
  const [inputText, setInputText] = useState('');
  const [senderRole, setSenderRole] = useState('admin'); // 'admin' | 'driver'
  const [isSending, setIsSending] = useState(false);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Audio Playback State
  const [playingMessageId, setPlayingMessageId] = useState(null);
  const [playbackTime, setPlaybackTime] = useState(0);
  const audioPlayerRef = useRef(null);
  const playbackTimerRef = useRef(null);
  const audioContextRef = useRef(null);

  const messagesEndRef = useRef(null);

  // Sync messages when ticket prop updates
  useEffect(() => {
    if (ticket && Array.isArray(ticket.messages)) {
      setMessages(ticket.messages);
    }
  }, [ticket]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isRecording]);

  // Handle Play/Pause for Voice Message
  const handleTogglePlayVoice = (msg) => {
    if (playingMessageId === msg.id) {
      // Pause
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      clearInterval(playbackTimerRef.current);
      setPlayingMessageId(null);
      setPlaybackTime(0);
      return;
    }

    // Stop existing playback
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
    }
    clearInterval(playbackTimerRef.current);

    setPlayingMessageId(msg.id);
    setPlaybackTime(0);

    const totalDur = msg.duration || 5;

    if (msg.audioUrl && msg.audioUrl.startsWith('data:audio')) {
      const audio = new Audio(msg.audioUrl);
      audioPlayerRef.current = audio;
      audio.play().catch(e => console.warn('Audio play error:', e));

      audio.ontimeupdate = () => {
        setPlaybackTime(audio.currentTime);
      };

      audio.onended = () => {
        setPlayingMessageId(null);
        setPlaybackTime(0);
      };
    } else {
      // Synthesize realistic audio tone using Web Audio API for mock/seeded voice messages
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = msg.sender === 'driver' ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(msg.sender === 'driver' ? 320 : 440, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(msg.sender === 'driver' ? 220 : 520, ctx.currentTime + 0.3);

          gain.gain.setValueAtTime(0.12, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + totalDur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start();
          osc.stop(ctx.currentTime + totalDur);
        }
      } catch (err) {
        console.warn('Web Audio synthesis fallback:', err);
      }

      // Progress interval for visualizer
      const intervalMs = 100;
      let elapsed = 0;
      playbackTimerRef.current = setInterval(() => {
        elapsed += 0.1;
        setPlaybackTime(Math.min(totalDur, elapsed));
        if (elapsed >= totalDur) {
          clearInterval(playbackTimerRef.current);
          setPlayingMessageId(null);
          setPlaybackTime(0);
        }
      }, intervalMs);
    }
  };

  // Start Voice Recording
  const handleStartRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone not supported by browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          sendVoiceMessage(base64Audio, recordingDuration || 4);
        };
      };

      recorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission or hardware unavailable, using smart voice simulation fallback:', err);
      // Fallback: simulated voice note
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  // Stop Recording and Send
  const handleStopRecording = () => {
    if (!isRecording) return;
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      // Fallback voice note payload
      sendVoiceMessage(null, Math.max(3, recordingDuration || 4));
    }
  };

  // Cancel Recording
  const handleCancelRecording = () => {
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
  };

  // Helper to send voice message to backend
  const sendVoiceMessage = async (audioDataUrl, durationSec) => {
    try {
      setIsSending(true);
      const isAdm = senderRole === 'admin';
      const senderName = isAdm 
        ? `Admin (${ticket.owner || 'Fleet Operations'})` 
        : `Driver (${ticket.driver || 'Driver'})`;

      const payload = {
        sender: senderRole,
        senderName,
        type: 'voice',
        text: isAdm 
          ? `Voice instruction from dispatch to driver ${ticket.driver}` 
          : `Voice update from driver ${ticket.driver} regarding vehicle ${ticket.vehicle}`,
        audioUrl: audioDataUrl,
        duration: durationSec || 4
      };

      const res = await sendEscalationMessageApi(ticket.id, payload);
      if (res && res.success) {
        setMessages(res.messages || []);
        if (onTicketUpdated) onTicketUpdated(res.ticket || { ...ticket, messages: res.messages });
      }
    } catch (err) {
      console.error('Failed to send voice message:', err);
    } finally {
      setIsSending(false);
      setRecordingDuration(0);
    }
  };

  // Handle Text Send
  const handleSendTextMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    try {
      setIsSending(true);
      const isAdm = senderRole === 'admin';
      const senderName = isAdm 
        ? `Admin (${ticket.owner || 'Fleet Operations'})` 
        : `Driver (${ticket.driver || 'Driver'})`;

      const payload = {
        sender: senderRole,
        senderName,
        type: 'text',
        text: inputText.trim()
      };

      const res = await sendEscalationMessageApi(ticket.id, payload);
      if (res && res.success) {
        setInputText('');
        setMessages(res.messages || []);
        if (onTicketUpdated) onTicketUpdated(res.ticket || { ...ticket, messages: res.messages });
      }
    } catch (err) {
      console.error('Failed to send text message:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Quick driver preset templates
  const quickDriverReplies = [
    'Sir, roadside mechanic reached location.',
    'Cluster showing red high voltage warning.',
    'Recharged to 80%, heading back on route.',
    'Please verify deduction dispute in wallet.'
  ];

  return (
    <div className="terminal-panel escalation-chat-panel" style={{ marginTop: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#ffffff', overflow: 'hidden' }}>
      {/* Header Banner */}
      <div style={{ background: '#0f172a', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #38bdf8' }}>
            <Users size={20} color="#38bdf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff' }}>
                Driver &amp; Dispatch Live Chat
              </span>
              <span style={{ fontSize: '10px', background: '#10b981', color: '#ffffff', padding: '2px 7px', borderRadius: '10px', fontWeight: 700 }}>
                ● Active Ticket
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Driver: <strong style={{ color: '#f1f5f9' }}>{ticket?.driver}</strong> ({ticket?.driverPhone || '—'}) · Vehicle: <strong style={{ color: '#38bdf8' }}>{ticket?.vehicle}</strong>
            </div>
          </div>
        </div>

        {/* Persona Switcher: Admin vs Driver */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1e293b', padding: '4px', borderRadius: '8px', border: '1px solid #334155' }}>
          <span style={{ fontSize: '10.5px', color: '#94a3b8', paddingLeft: '6px' }}>Active Persona:</span>
          <button
            type="button"
            onClick={() => setSenderRole('admin')}
            style={{
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: senderRole === 'admin' ? '#0284c7' : 'transparent',
              color: senderRole === 'admin' ? '#ffffff' : '#94a3b8'
            }}
          >
            👨‍💼 Admin Dispatch
          </button>
          <button
            type="button"
            onClick={() => setSenderRole('driver')}
            style={{
              padding: '5px 10px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: senderRole === 'driver' ? '#10b981' : 'transparent',
              color: senderRole === 'driver' ? '#ffffff' : '#94a3b8'
            }}
          >
            🚗 Driver ({ticket?.driver?.split(' ')[0] || 'Driver'})
          </button>
        </div>
      </div>

      {/* Admin Simulator Guidance Note */}
      <div style={{ background: '#f8fafc', padding: '6px 16px', borderBottom: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>
          💡 <em>Currently in Admin Panel. You can chat as <strong>Admin</strong> or switch to <strong>Driver</strong> to test and simulate bidirectional voice and text communication.</em>
        </span>
        <span style={{ color: '#0284c7', fontWeight: 600 }}>
          Ticket #{ticket?.id}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ height: '340px', overflowY: 'auto', padding: '16px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', margin: 'auto', fontSize: '12px' }}>
            No conversation yet. Send a message or record a voice note below.
          </div>
        ) : (
          messages.map((msg) => {
            const isAdminMsg = msg.sender === 'admin';
            const isPlayingThis = playingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isAdminMsg ? 'flex-end' : 'flex-start',
                  maxWidth: '75%',
                  alignSelf: isAdminMsg ? 'flex-end' : 'flex-start'
                }}
              >
                {/* Sender Title */}
                <div style={{ fontSize: '10px', fontWeight: 700, color: isAdminMsg ? '#0284c7' : '#475569', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{msg.senderName}</span>
                  <span style={{ color: '#94a3b8', fontWeight: 400 }}>{msg.timestamp}</span>
                </div>

                {/* Message Bubble Content */}
                <div
                  style={{
                    padding: msg.type === 'voice' ? '10px 14px' : '10px 14px',
                    borderRadius: isAdminMsg ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: isAdminMsg ? '#0284c7' : '#ffffff',
                    color: isAdminMsg ? '#ffffff' : '#0f172a',
                    border: isAdminMsg ? 'none' : '1px solid #e2e8f0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    minWidth: msg.type === 'voice' ? '240px' : 'auto'
                  }}
                >
                  {msg.type === 'voice' ? (
                    /* VOICE MESSAGE BUBBLE */
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Play/Pause Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePlayVoice(msg)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: 'none',
                            background: isAdminMsg ? 'rgba(255,255,255,0.25)' : '#0284c7',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0,
                            transition: 'transform 0.1s ease'
                          }}
                        >
                          {isPlayingThis ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                        </button>

                        {/* Animated Waveform & Scrubber */}
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
                            {[12, 22, 16, 28, 20, 14, 26, 18, 24, 15, 20, 26, 14, 18, 22, 16, 25, 12, 19, 14].map((h, bIdx) => {
                              const isActive = isPlayingThis && (playbackTime / (msg.duration || 5)) * 20 >= bIdx;
                              return (
                                <div
                                  key={bIdx}
                                  style={{
                                    flex: 1,
                                    height: isPlayingThis ? `${Math.min(24, Math.max(8, h + (Math.sin(bIdx + playbackTime * 5) * 6)))}px` : `${h}px`,
                                    background: isAdminMsg
                                      ? (isActive ? '#ffffff' : 'rgba(255,255,255,0.45)')
                                      : (isActive ? '#0284c7' : '#cbd5e1'),
                                    borderRadius: '2px',
                                    transition: 'height 0.1s ease'
                                  }}
                                />
                              );
                            })}
                          </div>

                          {/* Time & Duration Row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9.5px', marginTop: '4px', opacity: 0.9 }}>
                            <span>{isPlayingThis ? `0:0${Math.floor(playbackTime)}` : '0:00'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Volume2 size={10} />
                              <span>0:0{Math.round(msg.duration || 5)}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Optional Voice Note Caption */}
                      {msg.text && (
                        <div style={{ fontSize: '11px', marginTop: '6px', paddingTop: '4px', borderTop: isAdminMsg ? '1px solid rgba(255,255,255,0.2)' : '1px solid #f1f5f9', opacity: 0.9 }}>
                          {msg.text}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* TEXT MESSAGE BUBBLE */
                    <div style={{ fontSize: '12.5px', lineHeight: 1.45, wordBreak: 'break-word' }}>
                      {msg.text}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recording in Progress Bar (if active) */}
      {isRecording && (
        <div style={{ background: '#fee2e2', borderTop: '1px solid #fecaca', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'pulse 1.5s infinite' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#991b1b' }}>
              Recording Voice Note as {senderRole === 'admin' ? 'Admin' : 'Driver'}...
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#b91c1c' }}>
              00:{recordingDuration < 10 ? `0${recordingDuration}` : recordingDuration}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCancelRecording}
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#64748b',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleStopRecording}
              style={{
                padding: '5px 12px',
                fontSize: '11px',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                background: '#ef4444',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <Square size={12} fill="#ffffff" />
              <span>Finish &amp; Send</span>
            </button>
          </div>
        </div>
      )}

      {/* Quick Replies for Driver (when Driver role is active) */}
      {senderRole === 'driver' && !isRecording && (
        <div style={{ background: '#f1f5f9', padding: '8px 14px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '6px', overflowX: 'auto', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', flexShrink: 0 }}>Driver Quick Replies:</span>
          {quickDriverReplies.map((qr, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setInputText(qr)}
              style={{
                padding: '3px 8px',
                fontSize: '10.5px',
                borderRadius: '12px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      {/* Bottom Message Input Bar */}
      <form onSubmit={handleSendTextMessage} style={{ padding: '12px 16px', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Record Voice Note Button */}
        <button
          type="button"
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isSending}
          title={isRecording ? 'Stop recording' : 'Record Voice Note'}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            border: 'none',
            background: isRecording ? '#ef4444' : (senderRole === 'admin' ? '#0284c7' : '#10b981'),
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
          }}
        >
          {isRecording ? <Square size={16} fill="#ffffff" /> : <Mic size={18} />}
        </button>

        {/* Text Input Field */}
        <input
          type="text"
          placeholder={senderRole === 'admin' ? 'Type message to driver as Admin Dispatch...' : `Type message to fleet dispatch as Driver ${ticket?.driver || ''}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isRecording || isSending}
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '24px',
            border: '1px solid #cbd5e1',
            background: '#f8fafc',
            fontSize: '12.5px',
            outline: 'none',
            color: '#0f172a'
          }}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={isRecording || isSending || !inputText.trim()}
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            border: 'none',
            background: !inputText.trim() ? '#cbd5e1' : (senderRole === 'admin' ? '#0284c7' : '#10b981'),
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: !inputText.trim() ? 'not-allowed' : 'pointer',
            flexShrink: 0,
            transition: 'background 0.15s ease'
          }}
        >
          <Send size={16} style={{ marginLeft: '2px' }} />
        </button>
      </form>
    </div>
  );
}
