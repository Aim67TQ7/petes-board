import { useEffect, useState } from 'react'
import { Coins, TrendingUp, TrendingDown, RefreshCw, User, Bot } from 'lucide-react'
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

export default function TokenUsage() {
  const [records, setRecords] = useState<UsageRecord[]>([])
  const [summary, setSummary] = useState<UsageSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pete' | 'drew'>('all')

  useEffect(() => {
    fetchUsage()
  }, [])

  const fetchUsage = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('token_usage')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (!error && data) {
      setRecords(data)
      calculateSummary(data)
    }
    setLoading(false)
  }

  const calculateSummary = (data: UsageRecord[]) => {
    const grouped: Record<string, UsageSummary> = {}
    
    data.forEach(record => {
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

    setSummary(Object.values(grouped).sort((a, b) => 
      (b.total_in + b.total_out) - (a.total_in + a.total_out)
    ))
  }

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

  const filteredRecords = records.filter(r => {
    if (filter === 'all') return true
    const agent = r.agent || (r.model?.includes('drew') ? 'drew' : 'pete')
    return agent === filter
  })

  const filteredSummary = summary.filter(s => {
    if (filter === 'all') return true
    return s.agent === filter
  })

  const totalIn = filteredSummary.reduce((sum, s) => sum + s.total_in, 0)
  const totalOut = filteredSummary.reduce((sum, s) => sum + s.total_out, 0)

  if (loading) {
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
          <button className="refresh-btn" onClick={fetchUsage}>
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

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

      <div className="usage-summary">
        <h2>By Model</h2>
        <div className="summary-grid">
          {filteredSummary.map((s, i) => (
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
              {filteredRecords.map(record => {
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
