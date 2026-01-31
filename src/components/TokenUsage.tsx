import { useEffect, useState, useMemo } from 'react'
import { Coins, TrendingUp, TrendingDown, RefreshCw, User, Bot, Clock, Calendar, BarChart3 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './TokenUsage.css'

interface UsageRecord {
  id: string
  provider: string
  model: string
  tokens_in: number
  tokens_out: number
  session_id: string | null
  task_type: string | null
  agent: string | null
  created_at: string
}

interface UsageSummary {
  provider: string
  model: string
  total_in: number
  total_out: number
  count: number
  agent: string
}

interface TimeAggregation {
  period: string
  total_in: number
  total_out: number
  count: number
}

type AgentFilter = 'all' | 'pete' | 'drew'
type TimeView = 'hour' | 'day' | 'month'

export default function TokenUsage() {
  const [records, setRecords] = useState<UsageRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<AgentFilter>('all')
  const [timeView, setTimeView] = useState<TimeView>('day')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    fetchUsage()
    
    // Auto-refresh every 30 seconds when enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchUsage()
      }, 30000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const fetchUsage = async () => {
    setLoading(true)
    
    // Fetch more records for time-based analysis
    const { data, error } = await supabase
      .from('token_usage')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)

    if (!error && data) {
      setRecords(data)
      setLastRefresh(new Date())
    }
    setLoading(false)
  }

  // Filter records by agent
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (filter === 'all') return true
      const agent = r.agent || (r.model?.includes('drew') ? 'drew' : 'pete')
      return agent === filter
    })
  }, [records, filter])

  // Calculate summary by model
  const summary = useMemo(() => {
    const grouped: Record<string, UsageSummary> = {}
    
    filteredRecords.forEach(record => {
      const agent = record.agent || (record.model?.includes('drew') ? 'drew' : 'pete')
      const key = `${record.provider}-${record.model}-${agent}`
      
      if (!grouped[key]) {
        grouped[key] = {
          provider: record.provider,
          model: record.model,
          total_in: 0,
          total_out: 0,
          count: 0,
          agent
        }
      }
      grouped[key].total_in += record.tokens_in || 0
      grouped[key].total_out += record.tokens_out || 0
      grouped[key].count++
    })

    return Object.values(grouped).sort((a, b) => 
      (b.total_in + b.total_out) - (a.total_in + a.total_out)
    )
  }, [filteredRecords])

  // Calculate time-based aggregation
  const timeAggregation = useMemo(() => {
    const grouped: Record<string, TimeAggregation> = {}
    
    filteredRecords.forEach(record => {
      const date = new Date(record.created_at)
      let periodKey: string
      
      switch (timeView) {
        case 'hour':
          periodKey = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${date.getHours()}:00`
          break
        case 'day':
          periodKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })
          break
        case 'month':
          periodKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          break
      }
      
      if (!grouped[periodKey]) {
        grouped[periodKey] = {
          period: periodKey,
          total_in: 0,
          total_out: 0,
          count: 0
        }
      }
      grouped[periodKey].total_in += record.tokens_in || 0
      grouped[periodKey].total_out += record.tokens_out || 0
      grouped[periodKey].count++
    })

    // Sort by date (most recent first for display, but we need to parse dates)
    return Object.values(grouped).slice(0, 24) // Limit to recent periods
  }, [filteredRecords, timeView])

  // Calculate max for bar chart scaling
  const maxTokens = useMemo(() => {
    if (timeAggregation.length === 0) return 1
    return Math.max(...timeAggregation.map(t => t.total_in + t.total_out))
  }, [timeAggregation])

  const totalIn = summary.reduce((sum, s) => sum + s.total_in, 0)
  const totalOut = summary.reduce((sum, s) => sum + s.total_out, 0)

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Chicago'
    })
  }

  if (loading && records.length === 0) {
    return (
      <div className="token-usage loading">
        <RefreshCw className="spin" size={32} />
        <p>Loading usage data...</p>
      </div>
    )
  }

  return (
    <div className="token-usage">
      <header className="usage-header">
        <div className="header-title">
          <Coins size={24} />
          <h1>Token Usage</h1>
        </div>
        <div className="header-actions">
          <div className="filter-tabs">
            <button 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={filter === 'pete' ? 'active' : ''} 
              onClick={() => setFilter('pete')}
            >
              <User size={14} /> Pete
            </button>
            <button 
              className={filter === 'drew' ? 'active' : ''} 
              onClick={() => setFilter('drew')}
            >
              <Bot size={14} /> Drew
            </button>
          </div>
          <div className="refresh-controls">
            <button 
              className={`auto-refresh-btn ${autoRefresh ? 'active' : ''}`}
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </button>
            <button className="refresh-btn" onClick={fetchUsage} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>
      </header>

      <div className="last-refresh">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>

      <div className="usage-totals">
        <div className="total-card">
          <TrendingDown size={20} className="input" />
          <div>
            <span className="label">Total Input</span>
            <span className="value">{formatNumber(totalIn)}</span>
          </div>
        </div>
        <div className="total-card">
          <TrendingUp size={20} className="output" />
          <div>
            <span className="label">Total Output</span>
            <span className="value">{formatNumber(totalOut)}</span>
          </div>
        </div>
        <div className="total-card">
          <Coins size={20} />
          <div>
            <span className="label">Total Tokens</span>
            <span className="value">{formatNumber(totalIn + totalOut)}</span>
          </div>
        </div>
      </div>

      {/* Time-Based View */}
      <div className="time-usage">
        <div className="time-header">
          <h2><BarChart3 size={18} /> Usage Over Time</h2>
          <div className="time-tabs">
            <button 
              className={timeView === 'hour' ? 'active' : ''} 
              onClick={() => setTimeView('hour')}
            >
              <Clock size={14} /> Hour
            </button>
            <button 
              className={timeView === 'day' ? 'active' : ''} 
              onClick={() => setTimeView('day')}
            >
              <Calendar size={14} /> Day
            </button>
            <button 
              className={timeView === 'month' ? 'active' : ''} 
              onClick={() => setTimeView('month')}
            >
              <Calendar size={14} /> Month
            </button>
          </div>
        </div>
        
        {timeAggregation.length === 0 ? (
          <div className="no-data">No data for the selected period</div>
        ) : (
          <div className="time-chart">
            {timeAggregation.map((period, idx) => {
              const total = period.total_in + period.total_out
              const widthPercent = (total / maxTokens) * 100
              const inPercent = total > 0 ? (period.total_in / total) * 100 : 50
              
              return (
                <div key={idx} className="time-bar-row">
                  <div className="time-label">{period.period}</div>
                  <div className="time-bar-container">
                    <div className="time-bar" style={{ width: `${Math.max(5, widthPercent)}%` }}>
                      <div className="time-bar-in" style={{ width: `${inPercent}%` }} />
                      <div className="time-bar-out" style={{ width: `${100 - inPercent}%` }} />
                    </div>
                    <span className="time-bar-value">{formatNumber(total)}</span>
                  </div>
                  <div className="time-count">{period.count} calls</div>
                </div>
              )
            })}
          </div>
        )}
        
        <div className="time-legend">
          <span className="legend-item"><span className="legend-dot input"></span> Input</span>
          <span className="legend-item"><span className="legend-dot output"></span> Output</span>
        </div>
      </div>

      <div className="usage-summary">
        <h2>By Model</h2>
        <div className="summary-grid">
          {summary.map((s, i) => (
            <div key={i} className={`summary-card ${s.agent}`}>
              <div className="model-info">
                <span className="provider">{s.provider}</span>
                <span className="model">{s.model}</span>
                <span className={`agent-badge ${s.agent}`}>
                  {s.agent === 'drew' ? <Bot size={12} /> : <User size={12} />}
                  {s.agent}
                </span>
              </div>
              <div className="model-stats">
                <div className="stat">
                  <span className="stat-label">In</span>
                  <span className="stat-value">{formatNumber(s.total_in)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Out</span>
                  <span className="stat-value">{formatNumber(s.total_out)}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Calls</span>
                  <span className="stat-value">{s.count}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="usage-history">
        <h2>Recent Activity</h2>
        <div className="history-scroll">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Agent</th>
                <th>Model</th>
                <th>Type</th>
                <th>Input</th>
                <th>Output</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.slice(0, 50).map(record => {
                const agent = record.agent || (record.model?.includes('drew') ? 'drew' : 'pete')
                return (
                  <tr key={record.id} className={agent}>
                    <td>{formatDate(record.created_at)}</td>
                    <td>
                      <span className={`agent-badge ${agent}`}>
                        {agent === 'drew' ? <Bot size={12} /> : <User size={12} />}
                        {agent}
                      </span>
                    </td>
                    <td>{record.model}</td>
                    <td>{record.task_type || '-'}</td>
                    <td className="num">{formatNumber(record.tokens_in)}</td>
                    <td className="num">{formatNumber(record.tokens_out)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
