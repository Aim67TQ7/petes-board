import { useState, useEffect } from 'react'
import { Clock, RefreshCw, CheckCircle, XCircle, Pause, Play, Calendar, Timer, ChevronDown, ChevronUp, Edit2, Save, X, History } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './CronJobs.css'

interface CronJob {
  id: string
  name: string
  description?: string
  enabled: boolean
  schedule: {
    kind: string
    everyMs?: number
    expr?: string
  }
  state?: {
    nextRunAtMs?: number
    lastRunAtMs?: number
    lastStatus?: string
    lastDurationMs?: number
  }
}

interface CronData {
  jobs: CronJob[]
  updated_at?: string
}

export default function CronJobs() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [now, setNow] = useState(Date.now())
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editSchedule, setEditSchedule] = useState<string>('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  const loadJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('https://ezlmmegowggujpcnzoda.supabase.co/storage/v1/object/public/uploads/cron-jobs.json?' + Date.now())
      if (response.ok) {
        const data: CronData = await response.json()
        setJobs(data.jobs || [])
        setUpdatedAt(data.updated_at || null)
      } else {
        setError('Could not load cron jobs')
      }
    } catch (e) {
      setError('Failed to fetch cron jobs')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadJobs()
  }, [])

  const formatInterval = (ms: number) => {
    if (ms < 60000) return `${ms / 1000}s`
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`
    if (ms < 86400000) return `${Math.round(ms / 3600000)}h`
    return `${Math.round(ms / 86400000)}d`
  }

  const formatScheduleShort = (job: CronJob) => {
    if (job.schedule.kind === 'every' && job.schedule.everyMs) {
      return `⏱ ${formatInterval(job.schedule.everyMs)}`
    }
    if (job.schedule.expr) {
      // Parse common cron expressions
      const expr = job.schedule.expr
      if (expr.match(/^\d+ \* \* \* \*$/)) return `⏱ hourly`
      if (expr.match(/^0 \d+ \* \* \*$/)) return `📅 daily`
      return `📅 cron`
    }
    return job.schedule.kind
  }

  const formatTime = (ms?: number) => {
    if (!ms) return '—'
    return new Date(ms).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatRelativeShort = (ms?: number) => {
    if (!ms) return ''
    const diff = ms - now
    const absDiff = Math.abs(diff)
    
    if (absDiff < 60000) return diff > 0 ? '<1m' : 'now'
    if (absDiff < 3600000) {
      const mins = Math.round(absDiff / 60000)
      return diff > 0 ? `${mins}m` : `${mins}m ago`
    }
    if (absDiff < 86400000) {
      const hrs = Math.round(absDiff / 3600000)
      return diff > 0 ? `${hrs}h` : `${hrs}h ago`
    }
    const days = Math.round(absDiff / 86400000)
    return diff > 0 ? `${days}d` : `${days}d ago`
  }

  const getStatusIcon = (status?: string) => {
    if (status === 'ok') return <CheckCircle size={14} className="status-ok" />
    if (status === 'error') return <XCircle size={14} className="status-error" />
    return null
  }

  const formatCron = (expr?: string) => {
    if (!expr) return ''
    // Common cron translations
    const parts = expr.split(' ')
    if (parts.length === 5) {
      const [min, hour, dom, mon, dow] = parts
      if (dom === '*' && mon === '*' && dow === '*') {
        if (hour === '*') return `Every hour at :${min.padStart(2, '0')}`
        return `Daily at ${hour}:${min.padStart(2, '0')} UTC`
      }
    }
    return expr
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
    setEditingId(null)
  }

  const startEdit = (job: CronJob) => {
    setEditingId(job.id)
    if (job.schedule.kind === 'every' && job.schedule.everyMs) {
      setEditSchedule(`every ${formatInterval(job.schedule.everyMs)}`)
    } else if (job.schedule.expr) {
      setEditSchedule(job.schedule.expr)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditSchedule('')
  }

  const saveSchedule = async (job: CronJob) => {
    setSaving(true)
    // Note: This would need backend support to actually update the cron job
    // For now, we'll show a message that manual update is needed
    alert(`Schedule change requested: "${editSchedule}"\n\nTo update, ask Pete to modify the cron job "${job.name}" in Clawdbot.`)
    setSaving(false)
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="cron-jobs">
        <div className="cron-header">
          <Clock size={20} />
          <h2>Cron Jobs</h2>
        </div>
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="cron-jobs compact">
      <div className="cron-header">
        <Clock size={20} />
        <h2>Cron Jobs</h2>
        <span className="job-count">{jobs.length}</span>
        <button className="refresh-btn" onClick={loadJobs} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {jobs.length === 0 ? (
        <div className="no-jobs">No cron jobs configured.</div>
      ) : (
        <div className="jobs-list compact">
          {jobs.map(job => {
            const isExpanded = expandedId === job.id
            const isEditing = editingId === job.id
            
            return (
              <div key={job.id} className={`job-row ${job.enabled ? '' : 'disabled'} ${isExpanded ? 'expanded' : ''}`}>
                {/* Collapsed row - always visible */}
                <div className="job-summary" onClick={() => toggleExpand(job.id)}>
                  <div className="job-status-icon">
                    {job.enabled ? <Play size={12} className="enabled" /> : <Pause size={12} className="paused" />}
                  </div>
                  <span className="job-name">{job.name}</span>
                  <span className="job-schedule-badge">{formatScheduleShort(job)}</span>
                  <span className="job-next">
                    {job.state?.lastStatus && getStatusIcon(job.state.lastStatus)}
                    <span className="next-time">{formatRelativeShort(job.state?.nextRunAtMs)}</span>
                  </span>
                  <span className="expand-icon">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="job-details">
                    {job.description && <p className="job-desc">{job.description}</p>}
                    
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Schedule</span>
                        {isEditing ? (
                          <div className="edit-schedule">
                            <input 
                              type="text" 
                              value={editSchedule} 
                              onChange={(e) => setEditSchedule(e.target.value)}
                              placeholder="e.g., every 10m or 0 9 * * *"
                            />
                            <button onClick={() => saveSchedule(job)} disabled={saving} className="save-btn">
                              <Save size={14} />
                            </button>
                            <button onClick={cancelEdit} className="cancel-btn">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="detail-value with-edit">
                            <Calendar size={14} />
                            <span>
                              {job.schedule.kind === 'every' && job.schedule.everyMs 
                                ? `Every ${formatInterval(job.schedule.everyMs)}`
                                : formatCron(job.schedule.expr) || job.schedule.kind}
                            </span>
                            <button className="edit-btn" onClick={(e) => { e.stopPropagation(); startEdit(job); }}>
                              <Edit2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Next Run</span>
                        <div className="detail-value">
                          <Timer size={14} />
                          <span>{formatTime(job.state?.nextRunAtMs)}</span>
                          <span className="relative-badge next">{formatRelativeShort(job.state?.nextRunAtMs)}</span>
                        </div>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Last Run</span>
                        <div className="detail-value">
                          {job.state?.lastStatus && getStatusIcon(job.state.lastStatus)}
                          <span>{formatTime(job.state?.lastRunAtMs)}</span>
                          {job.state?.lastDurationMs !== undefined && (
                            <span className="duration-badge">{job.state.lastDurationMs}ms</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="job-actions">
                      <a 
                        href={`#/cron-history/${job.id}`} 
                        className="history-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <History size={14} />
                        View History
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
        {updatedAt && <>Synced: {new Date(updatedAt).toLocaleTimeString()} · </>}
        Managed by Pete
      </p>
    </div>
  )
}
