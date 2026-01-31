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
} as const

const ACCEPT_STRING = Object.keys(ACCEPTED_TYPES).join(',') + ',.csv,.xlsx,.xls,.doc,.docx'
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

type FileStatus = 'pending' | 'uploading' | 'success' | 'error'

interface FileWithStatus {
  file: File
  status: FileStatus
  error?: string
  id: string
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

  const addFiles = useCallback((newFiles: File[]) => {
    const validatedFiles: FileWithStatus[] = newFiles.map(file => {
      const validation = validateFile(file)
      return {
        file,
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        status: validation.valid ? 'pending' : 'error',
        error: validation.error
      }
    })
    setFiles(prev => [...prev, ...validatedFiles])
  }, [])

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      const imageFiles: File[] = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const pastedFile = item.getAsFile()
          if (pastedFile) {
            imageFiles.push(pastedFile)
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
  }, [addFiles])

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
  }, [addFiles])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files))
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
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
      const filesToUpload = validFiles.map(f => f.file)
      await onUpload(message || 'Uploaded files for review', filesToUpload)
      
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

  const getStatusIcon = (fileWithStatus: FileWithStatus) => {
    switch (fileWithStatus.status) {
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
          {files.map((fileWithStatus) => (
            <div key={fileWithStatus.id} className={`file-item ${fileWithStatus.status}`}>
              <div className="file-icon">{getFileIcon(fileWithStatus.file)}</div>
              <div className="file-info">
                <div className="file-name">{fileWithStatus.file.name}</div>
                <div className="file-meta">
                  <span className="file-size">{formatFileSize(fileWithStatus.file.size)}</span>
                  {fileWithStatus.error && <span className="file-error">{fileWithStatus.error}</span>}
                </div>
              </div>
              <div className="file-status">
                {getStatusIcon(fileWithStatus)}
              </div>
              {fileWithStatus.status !== 'uploading' && fileWithStatus.status !== 'success' && (
                <button className="remove-file" onClick={() => removeFile(fileWithStatus.id)}>
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
