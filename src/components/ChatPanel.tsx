import { useState, useRef, useEffect } from 'react'
import type { Message } from '../types'
import { Send, Paperclip, Radio, User, FileText, Image, X, FileSpreadsheet, Loader, Volume2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { useTTS } from '../hooks/useTTS'
import TTSControls from './TTSControls'
import './ChatPanel.css'

// Accepted file types
const ACCEPT_STRING = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.csv,.xls,.xlsx,.doc,.docx,.txt,application/pdf,image/*,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

interface Props {
  messages: Message[]
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>
}

const DRAFT_STORAGE_KEY = 'petes-board-chat-draft'

export default function ChatPanel({ messages, onSendMessage }: Props) {
  // Filter to only show messages from last 24 hours, newest first
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentMessages = messages
    .filter(m => new Date(m.created_at) >= twentyFourHoursAgo)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const [input, setInput] = useState(() => {
    // Load draft from localStorage on mount
    return localStorage.getItem(DRAFT_STORAGE_KEY) || ''
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const messagesTopRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize TTS with auto-play enabled by default
  const tts = useTTS({ autoPlay: true })

  // Auto-add new Pete messages to TTS queue
  useEffect(() => {
    const latestPeteMessage = recentMessages.find(m => m.sender === 'pete')
    if (latestPeteMessage && tts.isAutoPlay) {
      // Only speak if not already in queue or playing
      const alreadyQueued = tts.queue.some(q => q.id === latestPeteMessage.id)
      const isCurrentlyPlaying = tts.currentMessageId === latestPeteMessage.id
      
      if (!alreadyQueued && !isCurrentlyPlaying) {
        tts.speak({
          id: latestPeteMessage.id,
          text: latestPeteMessage.content,
          sender: latestPeteMessage.sender
        })
      }
    }
  }, [recentMessages, tts.isAutoPlay])

  // No auto-scroll needed - newest messages are at top where user lands

  // Persist draft to localStorage
  useEffect(() => {
    if (input.trim()) {
      localStorage.setItem(DRAFT_STORAGE_KEY, input)
    } else {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
  }, [input])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachments.length === 0) || isSending) return
    
    setIsSending(true)
    try {
      await onSendMessage(input, attachments.length > 0 ? attachments : undefined)
      setInput('')
      setAttachments([])
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)])
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getFileIcon = (type: string, name?: string) => {
    const ext = name?.split('.').pop()?.toLowerCase()
    if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image size={16} />
    }
    if (['csv', 'xls', 'xlsx'].includes(ext || '') || type.includes('spreadsheet') || type.includes('excel')) {
      return <FileSpreadsheet size={16} />
    }
    return <FileText size={16} />
  }

  // Manually add message to TTS queue
  const handleSpeakMessage = (messageId: string, text: string, sender: string) => {
    tts.speak({ id: messageId, text, sender })
  }

  return (
    <div className="chat-panel">
      <header className="page-header chat-header">
        <div>
          <h1>Chat with Pete</h1>
          <p>Ask questions, give instructions, or upload files for analysis</p>
        </div>
      </header>

      {tts.isSupported && (
        <TTSControls
          isPlaying={tts.isPlaying}
          isPaused={tts.isPaused}
          isAutoPlay={tts.isAutoPlay}
          queueLength={tts.queue.length}
          isSupported={tts.isSupported}
          onPlay={tts.play}
          onPause={tts.pause}
          onStop={tts.stop}
          onSkip={tts.skip}
          onToggleAutoPlay={tts.toggleAutoPlay}
        />
      )}

      <div className="messages-container">
        {recentMessages.length === 0 ? (
          <div className="empty-chat">
            <Radio size={48} />
            <h3>No recent messages</h3>
            <p>Messages older than 24 hours are in the Archive</p>
          </div>
        ) : (
          recentMessages.map(message => {
            const isCurrentlyPlaying = tts.currentMessageId === message.id
            return (
              <div key={message.id} className={`message ${message.sender} ${isCurrentlyPlaying ? 'tts-playing' : ''}`}>
                <div className="message-avatar">
                  {message.sender === 'pete' ? <Radio size={20} /> : <User size={20} />}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="sender-name">
                      {message.sender === 'pete' ? 'Pete' : 'You'}
                    </span>
                    <span className="message-time">{formatTime(message.created_at)}</span>
                    {tts.isSupported && message.sender === 'pete' && (
                      <button
                        className="tts-speak-btn"
                        onClick={() => handleSpeakMessage(message.id, message.content, message.sender)}
                        title="Add to TTS queue"
                      >
                        <Volume2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="message-text">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="message-attachments">
                      {message.attachments.map((att, i) => (
                        <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="attachment">
                          {getFileIcon(att.type, att.name)}
                          <span>{att.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesTopRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        {attachments.length > 0 && (
          <div className="attachments-preview">
            {attachments.map((file, i) => (
              <div key={i} className="attachment-preview">
                {getFileIcon(file.type, file.name)}
                <span>{file.name}</span>
                <button type="button" onClick={() => removeAttachment(i)} disabled={isSending}>
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="input-row">
          <button 
            type="button" 
            className="attach-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            title="Attach files (PDF, images, CSV, Excel, Word)"
          >
            <Paperclip size={20} />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            multiple
            accept={ACCEPT_STRING}
            hidden
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
            disabled={isSending}
          />
          <button 
            type="submit" 
            className="send-btn" 
            disabled={(!input.trim() && attachments.length === 0) || isSending}
          >
            {isSending ? <Loader size={20} className="spin" /> : <Send size={20} />}
          </button>
        </div>
      </form>
    </div>
  )
}
