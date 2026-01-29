import { useEffect } from 'react'
import type { Task } from '../types'
import type { JSX } from 'react'
import { Inbox, Wrench, AlertTriangle, CheckCircle, Radio, Archive, Trash2, Plus } from 'lucide-react'
import './KanbanBoard.css'

interface Props {
  tasks: Task[]
  onStatusChange: (taskId: string, status: Task['status']) => void
  onTaskClick: (task: Task) => void
  onArchiveTask?: (taskId: string) => void
  onTrashTask?: (taskId: string) => void
  onCreateTask?: () => void
}

// Column definitions - blocked and paused share a column
type ColumnId = 'inbox' | 'in_progress' | 'blocked_paused' | 'done'
const columns: { id: ColumnId; label: string; icon: JSX.Element; statuses: Task['status'][] }[] = [
  { id: 'inbox', label: 'Inbox', icon: <Inbox size={18} />, statuses: ['inbox'] },
  { id: 'in_progress', label: 'In Progress', icon: <Wrench size={18} />, statuses: ['in_progress'] },
  { id: 'blocked_paused', label: 'Blocked / Paused', icon: <AlertTriangle size={18} />, statuses: ['blocked', 'paused'] },
  { id: 'done', label: 'Done', icon: <CheckCircle size={18} />, statuses: ['done'] },
]

export default function KanbanBoard({ tasks, onStatusChange, onTaskClick, onArchiveTask, onTrashTask, onCreateTask }: Props) {
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, columnId: ColumnId) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    // Map column to primary status
    const statusMap: Record<ColumnId, Task['status']> = {
      'inbox': 'inbox',
      'in_progress': 'in_progress',
      'blocked_paused': 'blocked', // Default to blocked when dropping
      'done': 'done'
    }
    onStatusChange(taskId, statusMap[columnId])
  }

  const handleArchiveClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    if (onArchiveTask) {
      onArchiveTask(taskId)
    }
  }

  const handleTrashClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    if (onTrashTask) {
      onTrashTask(taskId)
    }
  }

  // Filter out archived and trashed tasks
  const activeTasks = tasks.filter(t => t.status !== 'archived' && t.status !== 'trashed')

  // 12 hours ago timestamp
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000)

  // Auto-archive done tasks older than 12 hours on render
  useEffect(() => {
    const oldDoneTasks = activeTasks.filter(t => 
      t.status === 'done' && 
      new Date(t.updated_at) < twelveHoursAgo
    )
    oldDoneTasks.forEach(task => {
      if (onArchiveTask) {
        onArchiveTask(task.id)
      }
    })
  }, [tasks])

  const getTasksByStatuses = (statuses: Task['status'][]) => {
    let filtered = activeTasks.filter(t => statuses.includes(t.status))
    
    // For Done column: only show last 12 hours, sorted newest first
    if (statuses.includes('done')) {
      filtered = filtered
        .filter(t => new Date(t.updated_at) >= twelveHoursAgo)
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    }
    
    return filtered
  }

  return (
    <div className="kanban-board">
      <header className="board-header">
        <h1>Task Board</h1>
        {onCreateTask && (
          <button className="create-task-btn" onClick={onCreateTask}>
            <Plus size={18} />
            <span>New Task</span>
          </button>
        )}
      </header>
      
      <div className="columns">
        {columns.map(column => (
          <div 
            key={column.id}
            className="column"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="column-header">
              <div className="column-title">
                {column.icon}
                <span>{column.label}</span>
              </div>
              <span className="task-count">{getTasksByStatuses(column.statuses).length}</span>
            </div>
            
            <div className="task-list">
              {getTasksByStatuses(column.statuses).map(task => (
                <div
                  key={task.id}
                  className={`task-card ${task.priority === 'high' ? 'high-priority' : ''} ${task.priority === 'urgent' ? 'urgent-priority' : ''} ${task.status === 'blocked' ? 'status-blocked' : ''} ${task.status === 'paused' ? 'status-paused' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onTaskClick(task)}
                >
                  <div className="task-title">{task.title}</div>
                  {task.notes && <div className="task-notes">{task.notes}</div>}
                  <div className="task-meta">
                    {task.priority === 'high' && <span className="priority-badge">High</span>}
                    {task.priority === 'urgent' && <span className="priority-badge urgent">🚨 Urgent</span>}
                    {task.status === 'blocked' && <span className="status-badge blocked">Blocked</span>}
                    {task.status === 'paused' && <span className="status-badge paused">Paused</span>}
                    <span className="task-date">
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                    {column.id === 'done' && (
                      <div className="task-actions">
                        {onArchiveTask && (
                          <button 
                            className="archive-btn"
                            onClick={(e) => handleArchiveClick(e, task.id)}
                            title="Archive this task"
                          >
                            <Archive size={14} />
                          </button>
                        )}
                        {onTrashTask && (
                          <button 
                            className="trash-btn"
                            onClick={(e) => handleTrashClick(e, task.id)}
                            title="Trash this task"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  {task.updates && task.updates.length > 0 && (
                    <div className="task-update">
                      <Radio size={12} />
                      <span>{task.updates[task.updates.length - 1].text}</span>
                    </div>
                  )}
                </div>
              ))}
              {getTasksByStatuses(column.statuses).length === 0 && (
                <div className="empty-state">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
