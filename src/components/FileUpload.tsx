import { useState, useCallback, useEffect } from 'react'
import { Upload, FileText, Image, File, X, Send, FileSpreadsheet, AlertCircle, CheckCircle, Loader } from 'lucide-react'
import './FileUpload.css'

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

interface Props {
  onUpload: (message: string, files: File[]) => Promise<void>
  onUploadComplete?: () => void
}

export default function FileUpload({ onUpload, onUploadComplete }: Props) {
  const [files, setFiles] = useState<FileWithStatus[]>([])
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

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
            imageFiles.push(file)
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
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File too large (max 50MB)' }
    }

    // Check file type by extension for flexibility
    const ext = file.name.split('.').pop()?.toLowerCase()
    const validExts = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'csv', 'xls', 'xlsx', 'doc', 'docx', 'txt']
    
    if (ext && validExts.includes(ext)) {
      return { valid: true }
    }

    // Check MIME type
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
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    const validFiles = files.filter(f => f.status === 'pending')
    if (validFiles.length === 0) return
    
    setIsUploading(true)
    
    // Mark files as uploading
    setFiles(prev => prev.map(f => 
      f.status === 'pending' ? { ...f, status: 'uploading' as const } : f
    ))

    try {
      await onUpload(message || 'Uploaded files for review', validFiles)
      
      // Mark as success
      setFiles(prev => prev.map(f => 
        f.status === 'uploading' ? { ...f, status: 'success' as const } : f
      ))
      
      // Clear after short delay and navigate back to board
      setTimeout(() => {
        setFiles([])
        setMessage('')
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

  return (
    <div className="file-upload-panel">
      <header className="upload-header">
        <h1>Upload Files</h1>
        <p>Upload documents, images, or spreadsheets for Pete to analyze</p>
        <div className="supported-types">
          Supported: PDF, Images (JPG, PNG, GIF, WebP), CSV, Excel, Word
        </div>
      </header>

      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${files.length > 0 ? 'has-files' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload size={48} />
        <h3>Drop files here</h3>
        <p>or click to browse • Ctrl+V to paste screenshots</p>
        <input
          type="file"
          onChange={handleFileSelect}
          multiple
          accept={ACCEPT_STRING}
          className="file-input"
        />
      </div>

      {files.length > 0 && (
        <div className="files-list">
          <h4>Selected Files ({files.length})</h4>
          {files.map((file, index) => (
            <div key={index} className={`file-item ${file.status}`}>
              <div className="file-icon">{getFileIcon(file)}</div>
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-meta">
                  <span className="file-size">{formatFileSize(file.size)}</span>
                  {file.error && <span className="file-error">{file.error}</span>}
                </div>
              </div>
              <div className="file-status">
                {getStatusIcon(file)}
              </div>
              {file.status !== 'uploading' && file.status !== 'success' && (
                <button className="remove-file" onClick={() => removeFile(index)}>
                  <X size={18} />
                </button>
              )}
            </div>
          ))}

          <div className="upload-message">
            <label>Message for Pete (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., 'Please analyze this CSV and calculate the totals by category'"
              rows={3}
              disabled={isUploading}
            />
          </div>

          <button 
            className="upload-btn" 
            onClick={handleSubmit}
            disabled={validCount === 0 || isUploading}
          >
            {isUploading ? (
              <>
                <Loader size={18} className="spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Send size={18} />
                <span>Send {validCount} file{validCount !== 1 ? 's' : ''} to Pete</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
