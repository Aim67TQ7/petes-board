import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { Task, Message } from './types'
import KanbanBoard from './components/KanbanBoard'
import ChatPanel from './components/ChatPanel'
import ChatArchive from './components/ChatArchive'
import FileUpload from './components/FileUpload'
import TaskModal from './components/TaskModal'
import PasscodeGate from './components/PasscodeGate'
import Downloads from './components/Downloads'
import LatestNews from './components/LatestNews'
import CronJobs from './components/CronJobs'
import ActivityLog from './components/ActivityLog'
import VoiceBriefings from './components/VoiceBriefings'
import TokenUsage from './components/TokenUsage'
import { Kanban, MessageSquare, Upload, Radio, FolderDown, Archive, Newspaper, Clock, Activity, Mic, BarChart3 } from 'lucide-react'
import './App.css'

type View = 'board' | 'chat' | 'files' | 'downloads' | 'archive' | 'news' | 'cron' | 'activity' | 'voice' | 'tokens'

function App() {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem('petes-board-auth') === 'true'
  })
  const [tasks, setTasks] = useState<Task[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeView, setActiveView] = useState<View>('board')
  const [isConnected, setIsConnected] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    if (!isUnlocked) return

    loadTasks()
    loadMessages()
    
    const tasksChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, handleTaskChange)
      .subscribe()

    const messagesChannel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, handleMessageChange)
      .subscribe()

    setIsConnected(true)

    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [isUnlocked])

  const loadTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (!error && data) {
      setTasks(data)
    }
  }

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (!error && data) {
      setMessages(data)
    }
  }

  const handleTaskChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setTasks(prev => [...prev, payload.new])
    } else if (payload.eventType === 'UPDATE') {
      setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
    } else if (payload.eventType === 'DELETE') {
      setTasks(prev => prev.filter(t => t.id !== payload.old.id))
    }
  }

  const handleMessageChange = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      setMessages(prev => [...prev, payload.new])
    }
  }

  const handleCreateTask = async (task: Partial<Task>) => {
    const { error } = await supabase.from('tasks').insert([{
      title: task.title,
      notes: task.notes || '',
      status: 'inbox',
      priority: task.priority || 'normal',
      updates: []
    }])
    if (!error) setShowTaskModal(false)
  }

  const handleUpdateTask = async (task: Partial<Task>) => {
    if (!editingTask) return
    const { error } = await supabase
      .from('tasks')
      .update({
        title: task.title,
        notes: task.notes,
        status: task.status,
        priority: task.priority
      })
      .eq('id', editingTask.id)
    if (!error) {
      setShowTaskModal(false)
      setEditingTask(null)
    }
  }

  const handleDeleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    setShowTaskModal(false)
    setEditingTask(null)
  }

  const handleStatusChange = async (taskId: string, newStatus: Task['status']) => {
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
  }

  const handleArchiveTask = async (taskId: string) => {
    await supabase.from('tasks').update({ status: 'archived' }).eq('id', taskId)
  }

  const handleTrashTask = async (taskId: string) => {
    await supabase.from('tasks').update({ status: 'trashed' }).eq('id', taskId)
  }

  const handleAddUpdate = async (taskId: string, updateText: string) => {
    // Get current task to append update
    const { data: currentTask } = await supabase
      .from('tasks')
      .select('updates')
      .eq('id', taskId)
      .single()
    
    const currentUpdates = currentTask?.updates || []
    const newUpdate = {
      text: updateText,
      time: new Date().toISOString()
    }
    
    await supabase
      .from('tasks')
      .update({ 
        updates: [...currentUpdates, newUpdate],
        status: 'inbox' // Bump back to inbox
      })
      .eq('id', taskId)
    
    // Refresh the editing task
    if (editingTask && editingTask.id === taskId) {
      setEditingTask({
        ...editingTask,
        updates: [...currentUpdates, newUpdate],
        status: 'inbox'
      })
    }
  }

  const handleSendMessage = async (content: string, attachments?: File[]): Promise<void> => {
    const uploadedAttachments = []
    
    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const fileName = `${Date.now()}-${safeName}`
        
        const { data, error } = await supabase.storage
          .from('uploads')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (error) {
          console.error('Upload error:', error)
          throw new Error(`Failed to upload ${file.name}: ${error.message}`)
        }
        
        if (data) {
          const { data: urlData } = supabase.storage
            .from('uploads')
            .getPublicUrl(fileName)
          
          uploadedAttachments.push({
            name: file.name,
            url: urlData.publicUrl,
            type: file.type || 'application/octet-stream',
            size: file.size
          })
        }
      }
    }

    const { error } = await supabase.from('messages').insert([{
      content,
      sender: 'user',
      attachments: uploadedAttachments.length > 0 ? uploadedAttachments : null
    }])
    
    if (error) {
      console.error('Message insert error:', error)
      throw new Error('Failed to send message')
    }
  }

  const openEditTask = (task: Task) => {
    setEditingTask(task)
    setShowTaskModal(true)
  }

  const openCreateTask = () => {
    setEditingTask(null)
    setShowTaskModal(true)
  }

  if (!isUnlocked) {
    return <PasscodeGate onUnlock={() => setIsUnlocked(true)} />
  }

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="logo">
          <button 
            className="refresh-icon" 
            onClick={() => window.location.reload()}
            title="Refresh page"
          >
            <Radio size={24} className={isConnected ? 'connected' : ''} />
          </button>
          <span>Pete's Board</span>
        </div>
        
        <div className="nav-items">
          <button 
            className={`nav-item ${activeView === 'board' ? 'active' : ''}`}
            onClick={() => setActiveView('board')}
          >
            <Kanban size={20} />
            <span>Board</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveView('chat')}
          >
            <MessageSquare size={20} />
            <span>Chat with Pete</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'archive' ? 'active' : ''}`}
            onClick={() => setActiveView('archive')}
          >
            <Archive size={20} />
            <span>Chat Archives</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'files' ? 'active' : ''}`}
            onClick={() => setActiveView('files')}
          >
            <Upload size={20} />
            <span>Files</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'downloads' ? 'active' : ''}`}
            onClick={() => setActiveView('downloads')}
          >
            <FolderDown size={20} />
            <span>Downloads</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'news' ? 'active' : ''}`}
            onClick={() => setActiveView('news')}
          >
            <Newspaper size={20} />
            <span>Latest News</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'cron' ? 'active' : ''}`}
            onClick={() => setActiveView('cron')}
          >
            <Clock size={20} />
            <span>Cron Jobs</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveView('activity')}
          >
            <Activity size={20} />
            <span>Activity Log</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'voice' ? 'active' : ''}`}
            onClick={() => setActiveView('voice')}
          >
            <Mic size={20} />
            <span>Voice Briefings</span>
          </button>
          <button 
            className={`nav-item ${activeView === 'tokens' ? 'active' : ''}`}
            onClick={() => setActiveView('tokens')}
          >
            <BarChart3 size={20} />
            <span>Token Usage</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <button className="btn-primary" onClick={() => setShowTaskModal(true)}>
            + New Task
          </button>
        </div>
      </nav>

      <main className="main-content">
        {activeView === 'board' && (
          <KanbanBoard 
            tasks={tasks} 
            onStatusChange={handleStatusChange}
            onTaskClick={openEditTask}
            onArchiveTask={handleArchiveTask}
            onTrashTask={handleTrashTask}
            onCreateTask={openCreateTask}
          />
        )}
        {activeView === 'chat' && (
          <ChatPanel 
            messages={messages} 
            onSendMessage={handleSendMessage}
          />
        )}
        {activeView === 'archive' && (
          <ChatArchive />
        )}
        {activeView === 'files' && (
          <FileUpload 
            onUpload={handleSendMessage} 
            onUploadComplete={() => setActiveView('board')}
          />
        )}
        {activeView === 'downloads' && (
          <Downloads />
        )}
        {activeView === 'news' && (
          <LatestNews />
        )}
        {activeView === 'cron' && (
          <CronJobs />
        )}
        {activeView === 'activity' && (
          <ActivityLog />
        )}
        {activeView === 'voice' && (
          <VoiceBriefings />
        )}
        {activeView === 'tokens' && (
          <TokenUsage />
        )}
      </main>

      {showTaskModal && (
        <TaskModal
          task={editingTask}
          onSave={editingTask ? handleUpdateTask : handleCreateTask}
          onDelete={editingTask ? () => handleDeleteTask(editingTask.id) : undefined}
          onClose={() => { setShowTaskModal(false); setEditingTask(null) }}
          onAddUpdate={editingTask ? handleAddUpdate : undefined}
        />
      )}
    </div>
  )
}

export default App
