import { useState, useRef, useEffect } from 'react'
import type { Message } from '../types'
import { Send, Paperclip, Radio, User, FileText, Image, X, FileSpreadsheet, Loader } from 'lucide-react'
import './ChatPanel.css'

// Accepted file types
const ACCEPT_STRING = '.pdf,.jpg,.jpeg,.png,.gif,.webp,.csv,.xls,.xlsx,.doc,.docx,.txt,application/pdf,image/*,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

interface Props {
  messages: Message[]
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>
}

export default function ChatPanel({ messages, onSendMessage }: Props) {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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

  return (
    <div className="chat-panel">
      <header className="chat-header">
        <h1>Chat with Pete</h1>
        <p>Ask questions, give instructions, or upload files for analysis</p>
      </header>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <Radio size={48} />
            <h3>No messages yet</h3>
            <p>Send a message or upload a file to get started</p>
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className={`message ${message.sender}`}>
              <div className="message-avatar">
                {message.sender === 'pete' ? <Radio size={20} /> : <User size={20} />}
              </div>
              <div className="message-content">
                <div className="message-header">
                  <span className="sender-name">
                    {message.sender === 'pete' ? 'Pete' : 'You'}
                  </span>
                  <span className="message-time">{formatTime(message.created_at)}</span>
                </div>
                <div className="message-text">{message.content}</div>
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
          ))
        )}
        <div ref={messagesEndRef} />
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
