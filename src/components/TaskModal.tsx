import { useState, useEffect } from 'react'
import type { Task } from '../types'
import { X } from 'lucide-react'
import './TaskModal.css'

interface Props {
  task: Task | null
  onSave: (task: Partial<Task>) => void
  onDelete?: () => void
  onClose: () => void
}

export default function TaskModal({ task, onSave, onDelete, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('normal')
  const [status, setStatus] = useState<Task['status']>('inbox')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setNotes(task.notes || '')
      setPriority(task.priority)
      setStatus(task.status)
    } else {
      setTitle('')
      setNotes('')
      setPriority('normal')
      setStatus('inbox')
    }
  }, [task])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (task) {
      onSave({ ...task, title, notes, priority, status })
    } else {
      onSave({ title, notes, priority })
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

          {task && task.updates && task.updates.length > 0 && (
            <div className="task-updates">
              <h4>Updates from Pete</h4>
              {task.updates.map((update, i) => (
                <div key={i} className="update-item">
                  <p>{update.text}</p>
                  <span className="update-time">
                    {new Date(update.time).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="modal-footer">
            {task && onDelete && (
              <button type="button" className="btn-danger" onClick={onDelete}>
                Delete
              </button>
            )}
            <div className="footer-right">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
