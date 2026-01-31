import { useEffect, useState } from 'react'
import { FileText, Download, ExternalLink, FileSpreadsheet, BarChart3, Image, File, ChevronDown, ChevronUp, RefreshCw, Calendar } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './Downloads.css'

const SUPABASE_URL = 'https://ezlmmegowggujpcnzoda.supabase.co'

export default function Downloads() {
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    fetchFiles()
    
    // Poll every 30 seconds for new uploads
    const interval = setInterval(() => {
      fetchFiles()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      // Fetch from uploads bucket (where Pete puts files)
      // First get root level items
      const { data: rootData, error: rootError } = await supabase.storage
        .from('uploads')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        })

      if (rootError) throw rootError
      
      // Separate folders and files
      const folders = (rootData || []).filter((f) => !f.metadata || !f.metadata.size)
      const rootFiles = (rootData || []).filter((f) => f.metadata && f.metadata.size > 0)
      
      // Fetch files from each subfolder
      const subfolderFiles: any[] = []
      for (const folder of folders) {
        const { data: subData } = await supabase.storage
          .from('uploads')
          .list(folder.name, {
            limit: 50,
            sortBy: { column: 'created_at', order: 'desc' }
          })
        
        if (subData) {
          // Add folder prefix to file names for proper URL generation
          const filesWithPath = subData
            .filter((f) => f.metadata && f.metadata.size > 0)
            .map((f) => ({ ...f, name: `${folder.name}/${f.name}`, folder: folder.name }))
          subfolderFiles.push(...filesWithPath)
        }
      }
      
      // Combine and sort by date
      const allFiles = [...rootFiles, ...subfolderFiles]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setFiles(allFiles)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getUrl = (filename: string) => 
    `${SUPABASE_URL}/storage/v1/object/public/uploads/${filename}`

  const getIcon = (filename: string, mimetype?: string) => {
    const ext = filename.split('.').pop()?.toLowerCase()
    const mime = mimetype || ''
    
    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '')) {
      return <Image size={32} />
    }
    if (['pdf'].includes(ext || '')) {
      return <FileText size={32} />
    }
    if (['csv', 'xlsx', 'xls'].includes(ext || '')) {
      return <FileSpreadsheet size={32} />
    }
    if (['md', 'txt', 'doc', 'docx'].includes(ext || '')) {
      return <BarChart3 size={32} />
    }
    return <File size={32} />
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getDisplayName = (filename: string) => {
    // Remove timestamp prefix if present (e.g., "1769617013023-filename.ext")
    const cleaned = filename.replace(/^\d{13}-/, '')
    // Replace dashes/underscores with spaces and capitalize
    return cleaned
      .replace(/[-_]/g, ' ')
      .replace(/\.[^.]+$/, '') // Remove extension
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const toggleExpand = (fileId: string) => {
    setExpandedId(expandedId === fileId ? null : fileId)
  }

  if (loading) {
    return (
      <div className="downloads-page compact">
        <div className="downloads-header">
          <Download size={20} />
          <h2>Downloads</h2>
        </div>
        <div className="loading">Loading files...</div>
      </div>
    )
  }

  return (
    <div className="downloads-page compact">
      <div className="downloads-header">
        <Download size={20} />
        <h2>Downloads</h2>
        <span className="file-count">{files.length}</span>
        <button className="refresh-btn" onClick={fetchFiles} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {files.length === 0 ? (
        <div className="no-files">No files available yet.</div>
      ) : (
        <div className="downloads-list compact">
          {files.map((file) => {
            const fileId = file.id || file.name
            const isExpanded = expandedId === fileId
            
            return (
              <div key={fileId} className={`download-row ${isExpanded ? 'expanded' : ''}`}>
                <div className="download-summary" onClick={() => toggleExpand(fileId)}>
                  <div className="download-icon">
                    {getIcon(file.name, file.metadata?.mimetype)}
                  </div>
                  <span className="download-name">{getDisplayName(file.name)}</span>
                  <span className="download-size-badge">{formatSize(file.metadata?.size || 0)}</span>
                  <span className="expand-icon">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>
                
                {isExpanded && (
                  <div className="download-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Filename</span>
                        <div className="detail-value">
                          <File size={14} />
                          <span>{file.name}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Uploaded</span>
                        <div className="detail-value">
                          <Calendar size={14} />
                          <span>{formatDate(file.created_at)}</span>
                        </div>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Size</span>
                        <div className="detail-value">
                          <FileText size={14} />
                          <span>{formatSize(file.metadata?.size || 0)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="download-actions">
                      <a 
                        href={getUrl(file.name)} 
                        download={file.name}
                        className="download-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download size={14} />
                        Download
                      </a>
                      <a 
                        href={getUrl(file.name)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="view-btn"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink size={14} />
                        View
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="footer-note">
        Files uploaded to Pete's Board storage · Click to expand details
      </p>
    </div>
  )
}
