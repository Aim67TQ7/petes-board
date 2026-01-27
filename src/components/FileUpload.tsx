import { useState, useCallback } from 'react'
import { Upload, FileText, Image, File, X, Send } from 'lucide-react'
import './FileUpload.css'

interface Props {
  onUpload: (message: string, files: File[]) => void
}

export default function FileUpload({ onUpload }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [message, setMessage] = useState('')
  const [isDragging, setIsDragging] = useState(false)

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
    setFiles(prev => [...prev, ...droppedFiles])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(prev => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (files.length === 0) return
    onUpload(message || 'Uploaded files for review', files)
    setFiles([])
    setMessage('')
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image size={24} />
    if (file.type.includes('pdf') || file.type.includes('document')) return <FileText size={24} />
    return <File size={24} />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="file-upload-panel">
      <header className="upload-header">
        <h1>Upload Files</h1>
        <p>Upload documents or images for Pete to analyze and process</p>
      </header>

      <div 
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${files.length > 0 ? 'has-files' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload size={48} />
        <h3>Drop files here</h3>
        <p>or click to browse</p>
        <input
          type="file"
          onChange={handleFileSelect}
          multiple
          className="file-input"
        />
      </div>

      {files.length > 0 && (
        <div className="files-list">
          <h4>Selected Files ({files.length})</h4>
          {files.map((file, index) => (
            <div key={index} className="file-item">
              <div className="file-icon">{getFileIcon(file)}</div>
              <div className="file-info">
                <div className="file-name">{file.name}</div>
                <div className="file-size">{formatFileSize(file.size)}</div>
              </div>
              <button className="remove-file" onClick={() => removeFile(index)}>
                <X size={18} />
              </button>
            </div>
          ))}

          <div className="upload-message">
            <label>Message for Pete (optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., 'Please analyze this document and summarize the key points'"
              rows={3}
            />
          </div>

          <button className="upload-btn" onClick={handleSubmit}>
            <Send size={18} />
            <span>Send to Pete</span>
          </button>
        </div>
      )}
    </div>
  )
}
