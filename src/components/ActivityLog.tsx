import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Activity, CheckCircle, Code, Search, FileText, MessageSquare, Zap, RefreshCw, Clock, TrendingUp } from 'lucide-react'
import './ActivityLog.css'

interface LogEntry {
  id: string
  action: string
  category: string
  details: any
  created_at: string
}

interface Stats {
  total: number
  today: number
  byCategory: Record<string, number>
}

const categoryIcons: Record<string, any> = {
  task: CheckCircle,
  code: Code,
  research: Search,
  file: FileText,
  message: MessageSquare,
  automation: Zap,
  general: Activity
}

const categoryColors: Record<string, string> = {
  task: '#22c55e',
  code: '#3b82f6',
  research: '#8b5cf6',
  file: '#f59e0b',
  message: '#ec4899',
  automation: '#06b6d4',
  general: '#6b7280'
}

export default function ActivityLog() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, byCategory: {} })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  const loadLogs = async () => {
    setLoading(true)
    
    let query = supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (filter !== 'all') {
      query = query.eq('category', filter)
    }

    const { data, error } = await query
    
    if (!error && data) {
      setLogs(data)
      
      // Calculate stats
      const today = new Date().toISOString().split('T')[0]
      const todayLogs = data.filter(l => l.created_at.startsWith(today))
      const byCategory: Record<string, number> = {}
      data.forEach(l => {
        byCategory[l.category] = (byCategory[l.category] || 0) + 1
      })
      
      setStats({
        total: data.length,
        today: todayLogs.length,
        byCategory
      })
    }
    setLoading(false)
  }

  useEffect(() => {
    loadLogs()
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('activity-logs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, (payload) => {
        setLogs(prev => [payload.new as LogEntry, ...prev].slice(0, 100))
        setStats(prev => ({
          ...prev,
          total: prev.total + 1,
          today: prev.today + 1,
          byCategory: {
            ...prev.byCategory,
            [(payload.new as LogEntry).category]: (prev.byCategory[(payload.new as LogEntry).category] || 0) + 1
          }
        }))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [filter])

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const categories = ['all', ...Object.keys(categoryIcons)]

  return (
    <div className="activity-log">
      <div className="activity-header">
        <Activity size={24} />
        <h2>Pete's Activity Log</h2>
        <button className="refresh-btn" onClick={loadLogs} title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <TrendingUp size={20} />
          <div>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Actions</span>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={20} />
          <div>
            <span className="stat-value">{stats.today}</span>
            <span className="stat-label">Today</span>
          </div>
        </div>
        {Object.entries(stats.byCategory).slice(0, 3).map(([cat, count]) => {
          const Icon = categoryIcons[cat] || Activity
          return (
            <div key={cat} className="stat-card mini">
              <Icon size={16} style={{ color: categoryColors[cat] }} />
              <span>{count} {cat}</span>
            </div>
          )
        })}
      </div>

      <div className="filter-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-tab ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
            style={filter === cat && cat !== 'all' ? { borderColor: categoryColors[cat] } : {}}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading activity...</div>
      ) : logs.length === 0 ? (
        <div className="no-logs">
          <p>No activity logged yet.</p>
          <p className="hint">Pete logs actions here as he works.</p>
        </div>
      ) : (
        <div className="logs-timeline">
          {logs.map(log => {
            const Icon = categoryIcons[log.category] || Activity
            const color = categoryColors[log.category] || '#6b7280'
            return (
              <div key={log.id} className="log-entry">
                <div className="log-icon" style={{ backgroundColor: `${color}20`, color }}>
                  <Icon size={16} />
                </div>
                <div className="log-content">
                  <p className="log-action">{log.action}</p>
                  {log.details && (
                    <p className="log-details">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                    </p>
                  )}
                  <span className="log-time">{formatTime(log.created_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
