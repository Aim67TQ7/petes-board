import { useState, useEffect } from 'react'
import { Clock, RefreshCw, CheckCircle, XCircle, Pause, Play, Calendar, Timer } from 'lucide-react'
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

  // Update "now" every minute for relative time display
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
    if (ms < 3600000) return `${Math.round(ms / 60000)} min`
    if (ms < 86400000) return `${Math.round(ms / 3600000)} hr`
    return `${Math.round(ms / 86400000)} day`
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

  const formatRelative = (ms?: number) => {
    if (!ms) return ''
    const diff = ms - now
    const absDiff = Math.abs(diff)
    
    if (absDiff < 60000) return diff > 0 ? 'in <1 min' : '<1 min ago'
    if (absDiff < 3600000) {
      const mins = Math.round(absDiff / 60000)
      return diff > 0 ? `in ${mins} min` : `${mins} min ago`
    }
    if (absDiff < 86400000) {
      const hrs = Math.round(absDiff / 3600000)
      return diff > 0 ? `in ${hrs} hr` : `${hrs} hr ago`
    }
    const days = Math.round(absDiff / 86400000)
    return diff > 0 ? `in ${days} day${days > 1 ? 's' : ''}` : `${days} day${days > 1 ? 's' : ''} ago`
  }

  const getStatusIcon = (status?: string) => {
    if (status === 'ok') return <CheckCircle size={16} className="status-ok" />
    if (status === 'error') return <XCircle size={16} className="status-error" />
    return null
  }

  const formatCron = (expr?: string) => {
    if (!expr) return ''
    // Common cron translations
    if (expr === '0 9 * * *') return 'Daily at 9:00 AM UTC'
    if (expr === '0 10 * * *') return 'Daily at 10:00 AM UTC'
    return expr
  }

  if (loading) {
    return (
      <div className="cron-jobs">
        <div className="cron-header">
          <Clock size={24} />
          <h2>Cron Jobs</h2>
        </div>
        <div className="loading">Loading scheduled jobs...</div>
      </div>
    )
  }

  return (
    <div className="cron-jobs">
      <div className="cron-header">
        <Clock size={24} />
        <h2>Cron Jobs</h2>
        <button className="refresh-btn" onClick={loadJobs} title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {jobs.length === 0 ? (
        <div className="no-jobs">
          <p>No cron jobs configured.</p>
        </div>
      ) : (
        <div className="jobs-list">
          {jobs.map(job => (
            <div key={job.id} className={`job-card ${job.enabled ? '' : 'disabled'}`}>
              <div className="job-header">
                <div className="job-status">
                  {job.enabled ? <Play size={16} className="enabled" /> : <Pause size={16} className="paused" />}
                </div>
                <h3>{job.name}</h3>
                {job.state?.lastStatus && getStatusIcon(job.state.lastStatus)}
              </div>
              
              {job.description && <p className="job-desc">{job.description}</p>}
              
              <div className="job-schedule">
                <Calendar size={14} />
                <span>
                  {job.schedule.kind === 'every' && job.schedule.everyMs 
                    ? `Every ${formatInterval(job.schedule.everyMs)}`
                    : formatCron(job.schedule.expr) || job.schedule.kind}
                </span>
              </div>

              <div className="job-times">
                <div className="time-block next">
                  <div className="time-label">
                    <Timer size={14} />
                    Next Run
                  </div>
                  <div className="time-value">{formatTime(job.state?.nextRunAtMs)}</div>
                  <div className="time-relative">{formatRelative(job.state?.nextRunAtMs)}</div>
                </div>
                <div className="time-block last">
                  <div className="time-label">
                    <CheckCircle size={14} />
                    Last Run
                  </div>
                  <div className="time-value">{formatTime(job.state?.lastRunAtMs)}</div>
                  <div className="time-relative">{formatRelative(job.state?.lastRunAtMs)}</div>
                </div>
              </div>

              {job.state?.lastDurationMs !== undefined && (
                <div className="job-duration">
                  Completed in {job.state.lastDurationMs}ms
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="footer-note">
        {updatedAt && (
          <>Last synced: {new Date(updatedAt).toLocaleString()} · </>
        )}
        Schedules managed by Pete (Clawdbot)
      </p>
    </div>
  )
}
