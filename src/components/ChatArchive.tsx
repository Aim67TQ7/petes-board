import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Message } from '../types'
import { Archive, Calendar, Radio, User, ChevronDown, ChevronRight } from 'lucide-react'
import './ChatArchive.css'

interface DayArchive {
  date: string
  dateLabel: string
  yrmoda: string
  messages: Message[]
}

export default function ChatArchive() {
  const [archives, setArchives] = useState<DayArchive[]>([])
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArchives()
  }, [])

  const loadArchives = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (!error && data) {
      // Group messages by date
      const grouped: Record<string, Message[]> = {}
      
      data.forEach(msg => {
        const date = new Date(msg.created_at)
        const dateKey = date.toISOString().split('T')[0]
        
        if (!grouped[dateKey]) {
          grouped[dateKey] = []
        }
        grouped[dateKey].push(msg)
      })
      
      // Convert to array and format
      const archiveList: DayArchive[] = Object.entries(grouped).map(([dateKey, messages]) => {
        const date = new Date(dateKey)
        const yy = String(date.getFullYear()).slice(-2)
        const mm = String(date.getMonth() + 1).padStart(2, '0')
        const dd = String(date.getDate()).padStart(2, '0')
        
        return {
          date: dateKey,
          dateLabel: date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          yrmoda: `${yy}${mm}${dd}`,
          messages: messages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        }
      })
      
      setArchives(archiveList)
    }
    setLoading(false)
  }

  const toggleDay = (date: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
      } else {
        next.add(date)
      }
      return next
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (loading) {
    return (
      <div className="chat-archive loading">
        <Archive size={48} className="spin" />
        <p>Loading archives...</p>
      </div>
    )
  }

  return (
    <div className="chat-archive">
      <header className="archive-header">
        <h1><Archive size={24} /> Chat Archives</h1>
        <p>Conversation history organized by date (YRMODA format)</p>
      </header>

      <div className="archive-list">
        {archives.length === 0 ? (
          <div className="empty-archive">
            <Calendar size={48} />
            <p>No chat history yet</p>
          </div>
        ) : (
          archives.map(day => (
            <div key={day.date} className="archive-day">
              <button 
                className="day-header"
                onClick={() => toggleDay(day.date)}
              >
                <div className="day-info">
                  {expandedDays.has(day.date) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  <span className="yrmoda-code">{day.yrmoda}</span>
                  <span className="day-label">{day.dateLabel}</span>
                </div>
                <span className="message-count">{day.messages.length} messages</span>
              </button>
              
              {expandedDays.has(day.date) && (
                <div className="day-messages">
                  {day.messages.map(msg => (
                    <div key={msg.id} className={`archive-message ${msg.sender}`}>
                      <div className="msg-avatar">
                        {msg.sender === 'pete' ? <Radio size={16} /> : <User size={16} />}
                      </div>
                      <div className="msg-content">
                        <div className="msg-header">
                          <span className="msg-sender">{msg.sender === 'pete' ? 'Pete' : 'You'}</span>
                          <span className="msg-time">{formatTime(msg.created_at)}</span>
                        </div>
                        <div className="msg-text">{msg.content}</div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="msg-attachments">
                            {msg.attachments.map((att, i) => (
                              <a key={i} href={att.url} target="_blank" rel="noopener noreferrer">
                                📎 {att.name}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
