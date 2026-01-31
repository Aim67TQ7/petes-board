import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, Clock, DollarSign, RefreshCw, Zap, Target, Award } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './ROIDashboard.css'

interface TaskStats {
  total: number
  completed: number
  avgTimeToComplete: number // hours
}

interface TokenStats {
  totalTokens: number
  estimatedCost: number
}

interface TimeFrame {
  label: string
  key: 'day' | 'week' | 'month'
  days: number
}

const TIME_FRAMES: TimeFrame[] = [
  { label: 'Today', key: 'day', days: 1 },
  { label: 'This Week', key: 'week', days: 7 },
  { label: 'This Month', key: 'month', days: 30 }
]

// Assumptions for ROI calculations
const ASSUMPTIONS = {
  hourlyRate: 75, // $/hour - typical knowledge worker rate
  avgTaskTimeWithoutAI: 2, // hours per task without AI assistance
  avgTaskTimeWithAI: 0.5, // hours per task with AI
  tokensPerDollar: 1000000 / 15, // ~66,666 tokens per dollar (Claude Sonnet pricing rough average)
}

export default function ROIDashboard() {
  const [loading, setLoading] = useState(true)
  const [activeTimeFrame, setActiveTimeFrame] = useState<'day' | 'week' | 'month'>('week')
  const [taskStats, setTaskStats] = useState<Record<string, TaskStats>>({
    day: { total: 0, completed: 0, avgTimeToComplete: 0 },
    week: { total: 0, completed: 0, avgTimeToComplete: 0 },
    month: { total: 0, completed: 0, avgTimeToComplete: 0 }
  })
  const [tokenStats, setTokenStats] = useState<Record<string, TokenStats>>({
    day: { totalTokens: 0, estimatedCost: 0 },
    week: { totalTokens: 0, estimatedCost: 0 },
    month: { totalTokens: 0, estimatedCost: 0 }
  })

  const fetchData = async () => {
    setLoading(true)
    
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Fetch tasks for each timeframe
    const [tasksDay, tasksWeek, tasksMonth] = await Promise.all([
      supabase.from('tasks').select('*').gte('created_at', dayAgo.toISOString()),
      supabase.from('tasks').select('*').gte('created_at', weekAgo.toISOString()),
      supabase.from('tasks').select('*').gte('created_at', monthAgo.toISOString())
    ])
    
    // Fetch token usage for each timeframe
    const [tokensDay, tokensWeek, tokensMonth] = await Promise.all([
      supabase.from('token_usage').select('tokens_in, tokens_out').gte('created_at', dayAgo.toISOString()),
      supabase.from('token_usage').select('tokens_in, tokens_out').gte('created_at', weekAgo.toISOString()),
      supabase.from('token_usage').select('tokens_in, tokens_out').gte('created_at', monthAgo.toISOString())
    ])
    
    const calculateTaskStats = (data: any[] | null): TaskStats => {
      if (!data || data.length === 0) return { total: 0, completed: 0, avgTimeToComplete: 0 }
      
      const completed = data.filter(t => t.status === 'done' || t.status === 'archived')
      let totalHours = 0
      
      completed.forEach(task => {
        if (task.created_at && task.updated_at) {
          const created = new Date(task.created_at).getTime()
          const updated = new Date(task.updated_at).getTime()
          totalHours += (updated - created) / (1000 * 60 * 60)
        }
      })
      
      return {
        total: data.length,
        completed: completed.length,
        avgTimeToComplete: completed.length > 0 ? totalHours / completed.length : 0
      }
    }
    
    const calculateTokenStats = (data: any[] | null): TokenStats => {
      if (!data || data.length === 0) return { totalTokens: 0, estimatedCost: 0 }
      
      const totalTokens = data.reduce((sum, r) => sum + (r.tokens_in || 0) + (r.tokens_out || 0), 0)
      const estimatedCost = totalTokens / ASSUMPTIONS.tokensPerDollar
      
      return { totalTokens, estimatedCost }
    }
    
    setTaskStats({
      day: calculateTaskStats(tasksDay.data),
      week: calculateTaskStats(tasksWeek.data),
      month: calculateTaskStats(tasksMonth.data)
    })
    
    setTokenStats({
      day: calculateTokenStats(tokensDay.data),
      week: calculateTokenStats(tokensWeek.data),
      month: calculateTokenStats(tokensMonth.data)
    })
    
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const currentTaskStats = taskStats[activeTimeFrame]
  const currentTokenStats = tokenStats[activeTimeFrame]

  // Calculate ROI metrics
  const roiMetrics = useMemo(() => {
    const tasksCompleted = currentTaskStats.completed
    
    // Time saved = (time without AI - time with AI) * tasks completed
    const hoursWithoutAI = tasksCompleted * ASSUMPTIONS.avgTaskTimeWithoutAI
    const hoursWithAI = tasksCompleted * ASSUMPTIONS.avgTaskTimeWithAI
    const hoursSaved = hoursWithoutAI - hoursWithAI
    
    // Cost savings = hours saved * hourly rate
    const costSavedFromTime = hoursSaved * ASSUMPTIONS.hourlyRate
    
    // Net savings = time savings - AI costs
    const netSavings = costSavedFromTime - currentTokenStats.estimatedCost
    
    // ROI percentage = (net savings / AI cost) * 100
    const roiPercentage = currentTokenStats.estimatedCost > 0 
      ? ((costSavedFromTime - currentTokenStats.estimatedCost) / currentTokenStats.estimatedCost) * 100 
      : 0
    
    return {
      tasksCompleted,
      hoursSaved,
      costSavedFromTime,
      aiCost: currentTokenStats.estimatedCost,
      netSavings,
      roiPercentage,
      tokensUsed: currentTokenStats.totalTokens
    }
  }, [currentTaskStats, currentTokenStats])

  const formatNumber = (n: number, decimals = 0) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toFixed(decimals)
  }

  const formatCurrency = (n: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(n)
  }

  const formatHours = (h: number) => {
    if (h < 1) return `${Math.round(h * 60)}min`
    if (h >= 24) return `${(h / 24).toFixed(1)}d`
    return `${h.toFixed(1)}h`
  }

  if (loading) {
    return (
      <div className="roi-dashboard loading">
        <RefreshCw className="spin" size={32} />
        <p>Calculating ROI metrics...</p>
      </div>
    )
  }

  return (
    <div className="roi-dashboard">
      <header className="roi-header">
        <div className="header-title">
          <TrendingUp size={24} />
          <h1>ROI Dashboard</h1>
        </div>
        <div className="header-actions">
          <div className="timeframe-tabs">
            {TIME_FRAMES.map(tf => (
              <button
                key={tf.key}
                className={activeTimeFrame === tf.key ? 'active' : ''}
                onClick={() => setActiveTimeFrame(tf.key)}
              >
                {tf.label}
              </button>
            ))}
          </div>
          <button className="refresh-btn" onClick={fetchData}>
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card highlight">
          <div className="metric-icon">
            <Award size={28} />
          </div>
          <div className="metric-content">
            <span className="metric-label">ROI</span>
            <span className="metric-value positive">
              {roiMetrics.roiPercentage > 0 ? '+' : ''}{formatNumber(roiMetrics.roiPercentage)}%
            </span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <DollarSign size={28} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Net Savings</span>
            <span className={`metric-value ${roiMetrics.netSavings >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(roiMetrics.netSavings)}
            </span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <Clock size={28} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Time Saved</span>
            <span className="metric-value">{formatHours(roiMetrics.hoursSaved)}</span>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">
            <Target size={28} />
          </div>
          <div className="metric-content">
            <span className="metric-label">Tasks Completed</span>
            <span className="metric-value">{roiMetrics.tasksCompleted}</span>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="breakdown-section">
        <h2>Cost-Benefit Analysis</h2>
        <div className="breakdown-grid">
          <div className="breakdown-card savings">
            <h3>Time Value Savings</h3>
            <div className="breakdown-row">
              <span>Hours without AI:</span>
              <span>{formatHours(roiMetrics.tasksCompleted * ASSUMPTIONS.avgTaskTimeWithoutAI)}</span>
            </div>
            <div className="breakdown-row">
              <span>Hours with AI:</span>
              <span>{formatHours(roiMetrics.tasksCompleted * ASSUMPTIONS.avgTaskTimeWithAI)}</span>
            </div>
            <div className="breakdown-row highlight">
              <span>Hours Saved:</span>
              <span className="positive">{formatHours(roiMetrics.hoursSaved)}</span>
            </div>
            <div className="breakdown-row total">
              <span>Value @ ${ASSUMPTIONS.hourlyRate}/hr:</span>
              <span className="positive">{formatCurrency(roiMetrics.costSavedFromTime)}</span>
            </div>
          </div>
          
          <div className="breakdown-card costs">
            <h3>AI Operating Costs</h3>
            <div className="breakdown-row">
              <span>Tokens Used:</span>
              <span>{formatNumber(roiMetrics.tokensUsed)}</span>
            </div>
            <div className="breakdown-row">
              <span>Estimated API Cost:</span>
              <span className="negative">{formatCurrency(roiMetrics.aiCost)}</span>
            </div>
            <div className="breakdown-row info">
              <span>Cost per Task:</span>
              <span>{roiMetrics.tasksCompleted > 0 
                ? formatCurrency(roiMetrics.aiCost / roiMetrics.tasksCompleted)
                : '$0'
              }</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Chart (simple bar representation) */}
      <div className="chart-section">
        <h2>Savings vs Costs</h2>
        <div className="bar-chart">
          <div className="bar-container">
            <div className="bar-label">Time Value Saved</div>
            <div className="bar-track">
              <div 
                className="bar-fill positive" 
                style={{ width: `${Math.min(100, (roiMetrics.costSavedFromTime / Math.max(roiMetrics.costSavedFromTime, roiMetrics.aiCost, 1)) * 100)}%` }}
              >
                {formatCurrency(roiMetrics.costSavedFromTime)}
              </div>
            </div>
          </div>
          <div className="bar-container">
            <div className="bar-label">AI Costs</div>
            <div className="bar-track">
              <div 
                className="bar-fill negative" 
                style={{ width: `${Math.min(100, (roiMetrics.aiCost / Math.max(roiMetrics.costSavedFromTime, roiMetrics.aiCost, 1)) * 100)}%` }}
              >
                {formatCurrency(roiMetrics.aiCost)}
              </div>
            </div>
          </div>
          <div className="bar-container net">
            <div className="bar-label">Net Savings</div>
            <div className="bar-track">
              <div 
                className={`bar-fill ${roiMetrics.netSavings >= 0 ? 'positive' : 'negative'}`}
                style={{ width: `${Math.min(100, Math.abs(roiMetrics.netSavings) / Math.max(roiMetrics.costSavedFromTime, roiMetrics.aiCost, 1) * 100)}%` }}
              >
                {formatCurrency(roiMetrics.netSavings)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assumptions Note */}
      <div className="assumptions-note">
        <Zap size={16} />
        <p>
          <strong>Assumptions:</strong> Hourly rate ${ASSUMPTIONS.hourlyRate}/hr • 
          Avg task time without AI: {ASSUMPTIONS.avgTaskTimeWithoutAI}h • 
          Avg task time with AI: {ASSUMPTIONS.avgTaskTimeWithAI}h • 
          Token costs based on Claude Sonnet average pricing
        </p>
      </div>
    </div>
  )
}
