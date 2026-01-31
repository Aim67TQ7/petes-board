import { useState, useCallback, useEffect, useRef } from 'react'
import { Upload, FileText, Image, File, X, Send, FileSpreadsheet, AlertCircle, CheckCircle, Loader, Mic, MicOff, Inbox, Sparkles, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './ParkingLot.css'

// Accepted file types
const ACCEPTED_TYPES = {
  'application/pdf': 'PDF',
  'image/jpeg': 'Image',
  'image/jpg': 'Image',
  'image/png': 'Image',
  'image/gif': 'Image',
  'image/webp': 'Image',
  'text/csv': 'CSV',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'text/plain': 'Text',
}

const ACCEPT_STRING = Object.keys(ACCEPTED_TYPES).join(',') + ',.csv,.xlsx,.xls,.doc,.docx'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

interface FileWithStatus extends File {
  status?: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

interface ExtractedTask {
  id: string
  title: string
  notes: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  pushed: boolean
}

interface Props {
  onUpload: (message: string, files: File[]) => Promise<void>
  onUploadComplete?: () => void
}

export default function ParkingLot({ onUpload, onUploadComplete }: Props) {
  const [files, setFiles] = useState<FileWithStatus[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  // Dictation state
  const [ramblingText, setRamblingText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [extractedTasks, setExtractedTasks] = useState<ExtractedTask[]>([])
  const [isExtracting, setIsExtracting] = useState(false)
  const recognitionRef = useRef<any>(null)

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      
      recognitionRef.current.onresult = (event: any) => {
        let transcript = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript
        }
        if (event.results[event.results.length - 1].isFinal) {
          setRamblingText(prev => prev + ' ' + transcript)
        }
      }
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error)
        setIsListening(false)
      }
      
      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition not supported in this browser')
      return
    }
    
    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  // Extract tasks from rambling text using simple pattern matching
  const extractTasksFromText = async () => {
    if (!ramblingText.trim()) return
    
    setIsExtracting(true)
    
    // Simple task extraction - look for action items, todos, need to, should, must, etc.
    const tasks: ExtractedTask[] = []
    const seenTitles = new Set<string>()
    
    // Split into sentences for analysis
    const sentences = ramblingText.split(/[.!?]+/).filter(s => s.trim())
    
    sentences.forEach((sentence, idx) => {
      const trimmed = sentence.trim()
      if (trimmed.length < 10 || trimmed.length > 200) return
      
      // Check if it sounds like a task
      const taskIndicators = ['need', 'should', 'must', 'todo', 'task', 'remember', 'don\'t forget', 'have to', 'review', 'update', 'check', 'create', 'send', 'call', 'email', 'fix', 'finish', 'complete', 'schedule', 'prepare', 'write', 'build', 'follow up', 'contact', 'research']
      
      const lowerSentence = trimmed.toLowerCase()
      const isTask = taskIndicators.some(indicator => lowerSentence.includes(indicator))
      
      if (isTask && !seenTitles.has(trimmed.toLowerCase())) {
        seenTitles.add(trimmed.toLowerCase())
        
        // Determine priority based on keywords
        let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal'
        if (lowerSentence.includes('urgent') || lowerSentence.includes('asap') || lowerSentence.includes('immediately')) {
          priority = 'urgent'
        } else if (lowerSentence.includes('important') || lowerSentence.includes('critical')) {
          priority = 'high'
        } else if (lowerSentence.includes('eventually') || lowerSentence.includes('when possible') || lowerSentence.includes('low priority')) {
          priority = 'low'
        }
        
        tasks.push({
          id: `task-${Date.now()}-${idx}`,
          title: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
          notes: '',
          priority,
          pushed: false
        })
      }
    })
    
    // If no tasks extracted, treat the whole text as one potential task
    if (tasks.length === 0 && ramblingText.trim().length > 0) {
      const firstLine = ramblingText.trim().split('\n')[0].substring(0, 100)
      tasks.push({
        id: `task-${Date.now()}-0`,
        title: firstLine + (firstLine.length >= 100 ? '...' : ''),
        notes: ramblingText.trim(),
        priority: 'normal',
        pushed: false
      })
    }
    
    setExtractedTasks(prev => [...prev, ...tasks])
    setIsExtracting(false)
  }

  const pushToInbox = async (task: ExtractedTask) => {
    const { error } = await supabase.from('tasks').insert([{
      title: task.title,
      notes: task.notes,
      status: 'inbox',
      priority: task.priority,
      updates: []
    }])
    
    if (!error) {
      setExtractedTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, pushed: true } : t
      ))
    }
  }

  const removeExtractedTask = (taskId: string) => {
    setExtractedTasks(prev => prev.filter(t => t.id !== taskId))
  }

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const imageFiles: File[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            const timestamp = Date.now()
            const ext = file.type.split('/')[1] || 'png'
            const namedFile = new (window.File as any)([file], `screenshot-${timestamp}.${ext}`, { type: file.type }) as File
            imageFiles.push(namedFile)
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault()
        addFiles(imageFiles)
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large (max 50MB)' }
    }

    const ext = file.name.split('.').pop()?.toLowerCase()
    const validExts = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'csv', 'xls', 'xlsx', 'doc', 'docx', 'txt']
    
    if (ext && validExts.includes(ext)) {
      return { valid: true }
    }

    if (ACCEPTED_TYPES[file.type as keyof typeof ACCEPTED_TYPES]) {
      return { valid: true }
    }

    return { valid: false, error: 'Unsupported file type' }
  }

  const addFiles = (newFiles: File[]) => {
    const validatedFiles = newFiles.map(file => {
      const validation = validateFile(file)
      const fileWithStatus = file as FileWithStatus
      if (!validation.valid) {
        fileWithStatus.status = 'error'
        fileWithStatus.error = validation.error
      } else {
        fileWithStatus.status = 'pending'
      }
      return fileWithStatus
    })
    setFiles(prev => [...prev, ...validatedFiles])
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
    }
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUploadFiles = async () => {
    const validFiles = files.filter(f => f.status === 'pending')
    if (validFiles.length === 0) return
    
    setIsUploading(true)
    
    setFiles(prev => prev.map(f => 
      f.status === 'pending' ? { ...f, status: 'uploading' as const } : f
    ))

    try {
      await onUpload('Uploaded files from Parking Lot', validFiles)
      
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' ? { ...f, status: 'success' as const } : f
      ))
      
      setTimeout(() => {
        setFiles([])
        if (onUploadComplete) {
          onUploadComplete()
        }
      }, 1500)
    } catch (err) {
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' ? { ...f, status: 'error' as const, error: 'Upload failed' } : f
      ))
    } finally {
      setIsUploading(false)
    }
  }

  const getFileIcon = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (file.type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return <Image size={24} />
    }
    if (['csv', 'xls', 'xlsx'].includes(ext || '') || file.type.includes('spreadsheet') || file.type.includes('excel')) {
      return <FileSpreadsheet size={24} />
    }
    if (file.type.includes('pdf') || file.type.includes('document') || ext === 'pdf' || ext === 'doc' || ext === 'docx') {
      return <FileText size={24} />
    }
    return <File size={24} />
  }

  const getStatusIcon = (file: FileWithStatus) => {
    switch (file.status) {
      case 'uploading':
        return <Loader size={18} className="spin" />
      case 'success':
        return <CheckCircle size={18} className="success" />
      case 'error':
        return <AlertCircle size={18} className="error" />
      default:
        return null
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const validCount = files.filter(f => f.status === 'pending').length
  const unpushedTasks = extractedTasks.filter(t => !t.pushed)

  return (
    <div className="parking-lot">
      <header className="parking-header">
        <h1>🅿️ Parking Lot</h1>
        <p>Dump your thoughts, ideas, and files here. Extract actionable tasks when ready.</p>
      </header>

      <div className="parking-split">
        {/* Left: Dictation/Text Input */}
        <div className="dictation-panel">
          <div className="panel-header">
            <h2>Brain Dump</h2>
            <button 
              className={`mic-btn ${isListening ? 'active' : ''}`}
              onClick={toggleListening}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
          </div>
          
          <textarea
            className="rambling-input"
            value={ramblingText}
            onChange={(e) => setRamblingText(e.target.value)}
            placeholder="Type or speak your thoughts, ideas, todos, ramblings... anything! Then extract actionable tasks."
            rows={10}
          />
          
          <div className="dictation-actions">
            <button 
              className="extract-btn"
              onClick={extractTasksFromText}
              disabled={!ramblingText.trim() || isExtracting}
            >
              {isExtracting ? (
                <>
                  <Loader size={16} className="spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Extract Tasks
                </>
              )}
            </button>
            <button 
              className="clear-btn"
              onClick={() => setRamblingText('')}
              disabled={!ramblingText.trim()}
            >
              Clear
            </button>
          </div>

          {/* File Upload Section */}
          <div className="file-section">
            <h3>Attach Files</h3>
            <div 
              className={`mini-drop-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload size={24} />
              <span>Drop files or click to browse</span>
              <input
                type="file"
                onChange={handleFileSelect}
                multiple
                accept={ACCEPT_STRING}
                className="file-input"
              />
            </div>
            
            {files.length > 0 && (
              <div className="files-mini-list">
                {files.map((file, index) => (
                  <div key={index} className={`file-mini-item ${file.status}`}>
                    {getFileIcon(file)}
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{formatFileSize(file.size)}</span>
                    {getStatusIcon(file)}
                    {file.status !== 'uploading' && file.status !== 'success' && (
                      <button className="remove-file" onClick={() => removeFile(index)}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  className="upload-files-btn"
                  onClick={handleUploadFiles}
                  disabled={validCount === 0 || isUploading}
                >
                  {isUploading ? (
                    <>
                      <Loader size={16} className="spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Upload {validCount} file{validCount !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Extracted Tasks */}
        <div className="tasks-panel">
          <div className="panel-header">
            <h2>Extracted Tasks</h2>
            <span className="task-count">{unpushedTasks.length} pending</span>
          </div>
          
          {extractedTasks.length === 0 ? (
            <div className="empty-tasks">
              <Inbox size={48} />
              <p>No tasks extracted yet</p>
              <span>Type or speak your thoughts, then click "Extract Tasks"</span>
            </div>
          ) : (
            <div className="task-cards">
              {extractedTasks.map(task => (
                <div key={task.id} className={`task-card ${task.pushed ? 'pushed' : ''} priority-${task.priority}`}>
                  <div className="task-card-header">
                    <span className={`priority-badge ${task.priority}`}>
                      {task.priority === 'urgent' ? '🚨' : task.priority === 'high' ? '⚡' : task.priority === 'low' ? '📋' : '📌'} {task.priority}
                    </span>
                    {!task.pushed && (
                      <button 
                        className="remove-task-btn"
                        onClick={() => removeExtractedTask(task.id)}
                        title="Remove task"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <h4>{task.title}</h4>
                  {task.notes && <p className="task-notes">{task.notes}</p>}
                  
                  {task.pushed ? (
                    <div className="pushed-badge">
                      <CheckCircle size={16} />
                      Pushed to Inbox
                    </div>
                  ) : (
                    <button 
                      className="push-btn"
                      onClick={() => pushToInbox(task)}
                    >
                      <Inbox size={16} />
                      Push to Inbox
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
