import { useState, useEffect, useRef } from 'react'
import type { Task } from '../types'
import { X, MessageSquare, RefreshCw, Paperclip, FileText, Image, Trash2, Upload } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './TaskModal.css'

interface TaskAttachment {
  name: string
  url: string
  type: string
  size: number
}

interface Props {
  task: Task | null
  onSave: (task: Partial<Task>) => Promise<{ success: boolean; error?: string }>
  onDelete?: () => void
  onClose: () => void
  onAddUpdate?: (taskId: string, updateText: string) => void
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB for task attachments

export default function TaskModal({ task, onSave, onDelete, onClose, onAddUpdate }: Props) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('normal')
  const [status, setStatus] = useState<Task['status']>('inbox')
  const [replyText, setReplyText] = useState('')
  const [attachments, setAttachments] = useState<TaskAttachment[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setNotes(task.notes || '')
      setPriority(task.priority)
      setStatus(task.status)
      // Load attachments from task if they exist
      setAttachments((task as any).attachments || [])
    } else {
      setTitle('')
      setNotes('')
      setPriority('normal')
      setStatus('inbox')
      setAttachments([])
    }
    // Reset error state when task changes
    setSaveError(null)
    setIsSaving(false)
  }, [task])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    
    setIsUploading(true)
    const uploadedAttachments: TaskAttachment[] = []
    
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_SIZE) {
        alert(`${file.name} is too large (max 10MB)`)
        continue
      }
      
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const fileName = `task-attachments/${Date.now()}-${safeName}`
      
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        console.error('Upload error:', error)
        continue
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
    
    setAttachments(prev => [...prev, ...uploadedAttachments])
    setIsUploading(false)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image size={16} />
    return <FileText size={16} />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setSaveError('Task title is required')
      return
    }

    if (isSaving) return // Prevent double submission

    setIsSaving(true)
    setSaveError(null)

    try {
      const taskData: Partial<Task> & { attachments?: TaskAttachment[] } = {
        title: title.trim(),
        notes: notes.trim(),
        priority,
        attachments: attachments.length > 0 ? attachments : undefined
      }

      let result
      if (task) {
        result = await onSave({ ...task, ...taskData, status })
      } else {
        result = await onSave(taskData)
      }

      if (!result.success) {
        setSaveError(result.error || 'Failed to save task')
        setIsSaving(false)
      }
      // If successful, modal will be closed by parent component
    } catch (err) {
      console.error('Error submitting task:', err)
      setSaveError('An unexpected error occurred while saving')
      setIsSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{task ? 'Edit Task' : 'New Task'}</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Task Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details, context, or links..."
              rows={4}
            />
          </div>

          {/* Attachments Section */}
          <div className="form-group attachments-section">
            <label>
              <Paperclip size={14} />
              Attachments
            </label>
            
            <div className="attachment-list">
              {attachments.map((attachment, idx) => (
                <div key={idx} className="attachment-item">
                  {getFileIcon(attachment.type)}
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="attachment-name">
                    {attachment.name}
                  </a>
                  <span className="attachment-size">{formatFileSize(attachment.size)}</span>
                  <button 
                    type="button" 
                    className="remove-attachment"
                    onClick={() => removeAttachment(idx)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="attachment-upload">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                multiple
                className="file-input-hidden"
                id="task-file-input"
              />
              <label htmlFor="task-file-input" className={`upload-btn-inline ${isUploading ? 'uploading' : ''}`}>
                {isUploading ? (
                  <>
                    <RefreshCw size={14} className="spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Add Files
                  </>
                )}
              </label>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Task['priority'])}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">🚨 Urgent</option>
              </select>
            </div>

            {task && (
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Task['status'])}
                >
                  <option value="inbox">Inbox</option>
                  <option value="in_progress">In Progress</option>
                  <option value="blocked">Blocked</option>
                  <option value="done">Done</option>
                </select>
              </div>
            )}
          </div>

          {task && (
            <div className="task-updates">
              <h4>
                <MessageSquare size={16} />
                Updates & Replies
              </h4>
              {task.updates && task.updates.length > 0 ? (
                task.updates.map((update, i) => (
                  <div key={i} className="update-item">
                    <p>{update.text}</p>
                    <span className="update-time">
                      {new Date(update.time).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="no-updates">No updates yet</p>
              )}
              
              {onAddUpdate && (
                <div className="reply-section">
                  <div className="reply-input-row">
                    <input
                      type="text"
                      placeholder="Add a reply or note..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && replyText.trim()) {
                          onAddUpdate(task.id, replyText.trim())
                          setReplyText('')
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn-reply"
                      onClick={() => {
                        if (replyText.trim()) {
                          onAddUpdate(task.id, replyText.trim())
                          setReplyText('')
                        }
                      }}
                      disabled={!replyText.trim()}
                    >
                      Reply
                    </button>
                  </div>
                  <button 
                    type="button" 
                    className="btn-bump"
                    onClick={() => {
                      const timestamp = new Date().toLocaleString()
                      onAddUpdate(task.id, `Bumped at ${timestamp}`)
                    }}
                  >
                    <RefreshCw size={14} />
                    Bump to Top
                  </button>
                </div>
              )}
            </div>
          )}

          {saveError && (
            <div className="error-message" style={{
              padding: '12px',
              marginTop: '16px',
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              color: '#c33',
              fontSize: '14px'
            }}>
              ⚠️ {saveError}
            </div>
          )}

          <div className="modal-footer">
            {task && onDelete && (
              <button 
                type="button" 
                className="btn-danger" 
                onClick={onDelete}
                disabled={isSaving}
              >
                Delete
              </button>
            )}
            <div className="footer-right">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={isSaving || !title.trim()}
              >
                {isSaving ? (
                  <>
                    <RefreshCw size={14} className="spin" style={{ marginRight: '6px' }} />
                    {task ? 'Saving...' : 'Creating...'}
                  </>
                ) : (
                  task ? 'Save Changes' : 'Create Task'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
