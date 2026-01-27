import type { Task } from '../types'
import type { JSX } from 'react'
import { Inbox, Wrench, AlertTriangle, CheckCircle, Radio, Archive } from 'lucide-react'
import './KanbanBoard.css'

interface Props {
  tasks: Task[]
  onStatusChange: (taskId: string, status: Task['status']) => void
  onTaskClick: (task: Task) => void
  onArchiveTask?: (taskId: string) => void
}

const columns: { id: Task['status']; label: string; icon: JSX.Element }[] = [
  { id: 'inbox', label: 'Inbox', icon: <Inbox size={18} /> },
  { id: 'in_progress', label: 'In Progress', icon: <Wrench size={18} /> },
  { id: 'blocked', label: 'Blocked', icon: <AlertTriangle size={18} /> },
  { id: 'done', label: 'Done', icon: <CheckCircle size={18} /> },
]

export default function KanbanBoard({ tasks, onStatusChange, onTaskClick, onArchiveTask }: Props) {
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent, status: Task['status']) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    onStatusChange(taskId, status)
  }

  const handleArchiveClick = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()
    if (onArchiveTask) {
      onArchiveTask(taskId)
    }
  }

  // Filter out archived tasks
  const activeTasks = tasks.filter(t => t.status !== 'archived')

  const getTasksByStatus = (status: Task['status']) => 
    activeTasks.filter(t => t.status === status)

  return (
    <div className="kanban-board">
      <header className="board-header">
        <h1>Task Board</h1>
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
              <span className="task-count">{getTasksByStatus(column.id).length}</span>
            </div>
            
            <div className="task-list">
              {getTasksByStatus(column.id).map(task => (
                <div
                  key={task.id}
                  className={`task-card ${task.priority === 'high' ? 'high-priority' : ''} ${task.priority === 'urgent' ? 'urgent-priority' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => onTaskClick(task)}
                >
                  <div className="task-title">{task.title}</div>
                  {task.notes && <div className="task-notes">{task.notes}</div>}
                  <div className="task-meta">
                    {task.priority === 'high' && <span className="priority-badge">High</span>}
                    {task.priority === 'urgent' && <span className="priority-badge urgent">🚨 Urgent</span>}
                    <span className="task-date">
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                    {column.id === 'done' && onArchiveTask && (
                      <button 
                        className="archive-btn"
                        onClick={(e) => handleArchiveClick(e, task.id)}
                        title="Archive this task"
                      >
                        <Archive size={14} />
                      </button>
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
              {getTasksByStatus(column.id).length === 0 && (
                <div className="empty-state">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
