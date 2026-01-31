import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Message, Task } from '../types'
import { Archive, Calendar, Radio, User, ChevronDown, ChevronRight, CheckCircle } from 'lucide-react'
import './ChatArchive.css'

interface ArchiveItem {
  type: 'messages' | 'task'
  date: string
  dateLabel: string
  yrmoda: string
  messages?: Message[]
  task?: Task
}

export default function ChatArchive() {
  const [items, setItems] = useState<ArchiveItem[]>([])
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArchives()
    
    // Subscribe to task changes for real-time archive updates
    const tasksChannel = supabase
      .channel('archive-tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadArchives()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
    }
  }, [])

  const loadArchives = async () => {
    // Load both messages and archived tasks
    const [messagesRes, tasksRes] = await Promise.all([
      supabase.from('messages').select('*').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*').eq('status', 'archived').order('updated_at', { ascending: false })
    ])
    
    const messages = messagesRes.data || []
    const archivedTasks = tasksRes.data || []
    
    // Group messages by date
    const messagesByDate: Record<string, Message[]> = {}
    messages.forEach(msg => {
      const date = new Date(msg.created_at)
      const dateKey = date.toISOString().split('T')[0]
      if (!messagesByDate[dateKey]) {
        messagesByDate[dateKey] = []
      }
      messagesByDate[dateKey].push(msg)
    })
    
    // Create combined timeline
    const archiveItems: ArchiveItem[] = []
    
    // Get all unique dates from both messages and tasks
    const allDates = new Set<string>()
    Object.keys(messagesByDate).forEach(d => allDates.add(d))
    archivedTasks.forEach(task => {
      const dateKey = new Date(task.updated_at).toISOString().split('T')[0]
      allDates.add(dateKey)
    })
    
    // Sort dates descending (newest first)
    const sortedDates = Array.from(allDates).sort((a, b) => b.localeCompare(a))
    
    sortedDates.forEach(dateKey => {
      const date = new Date(dateKey)
      const yy = String(date.getFullYear()).slice(-2)
      const mm = String(date.getMonth() + 1).padStart(2, '0')
      const dd = String(date.getDate()).padStart(2, '0')
      const dateInfo = {
        date: dateKey,
        dateLabel: date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        yrmoda: `${yy}${mm}${dd}`
      }
      
      // Add messages for this date if unknown
      if (messagesByDate[dateKey]) {
        archiveItems.push({
          type: 'messages',
          ...dateInfo,
          messages: messagesByDate[dateKey].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
        })
      }
      
      // Add archived tasks for this date
      const tasksForDate = archivedTasks.filter(task => {
        const taskDate = new Date(task.updated_at).toISOString().split('T')[0]
        return taskDate === dateKey
      })
      
      tasksForDate.forEach(task => {
        archiveItems.push({
          type: 'task',
          ...dateInfo,
          task
        })
      })
    })
    
    setItems(archiveItems)
    setLoading(false)
  }

  const toggleDay = (key: string) => {
    setExpandedDays(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
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
        <h1><Archive size={24} /> Archives</h1>
        <p>Conversation history and completed tasks organized by date</p>
      </header>

      <div className="archive-list">
        {items.length === 0 ? (
          <div className="empty-archive">
            <Calendar size={48} />
            <p>No archives yet</p>
          </div>
        ) : (
          items.map((item) => {
            if (item.type === 'messages') {
              const key = `messages-${item.date}`
              return (
                <div key={key} className="archive-day">
                  <button 
                    className="day-header"
                    onClick={() => toggleDay(key)}
                  >
                    <div className="day-info">
                      {expandedDays.has(key) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      <span className="yrmoda-code">{item.yrmoda}</span>
                      <span className="day-label">{item.dateLabel}</span>
                    </div>
                    <span className="message-count">{item.messages?.length || 0} messages</span>
                  </button>
                  
                  {expandedDays.has(key) && item.messages && (
                    <div className="day-messages">
                      {item.messages.map(msg => (
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
              )
            } else if (item.type === 'task' && item.task) {
              const key = `task-${item.task.id}`
              return (
                <div key={key} className="archive-task">
                  <div className="task-header">
                    <CheckCircle size={18} className="task-done-icon" />
                    <div className="task-info">
                      <span className="task-title">{item.task.title}</span>
                      <span className="task-date">
                        Completed {item.dateLabel}
                      </span>
                    </div>
                    {item.task.priority !== 'normal' && (
                      <span className={`priority-badge ${item.task.priority}`}>
                        {item.task.priority}
                      </span>
                    )}
                  </div>
                  {item.task.notes && (
                    <div className="task-notes">{item.task.notes}</div>
                  )}
                  {item.task.updates && item.task.updates.length > 0 && (
                    <div className="task-updates">
                      <div className="updates-label">Updates:</div>
                      {item.task.updates.map((update, i) => (
                        <div key={i} className="task-update">
                          <Radio size={12} />
                          <span className="update-text">{update.text}</span>
                          <span className="update-time">
                            {new Date(update.time).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }
            return null
          })
        )}
      </div>
    </div>
  )
}
