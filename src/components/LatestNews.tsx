import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Newspaper, Globe, TrendingUp, Bitcoin, Activity, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import './LatestNews.css'

interface NewsBrief {
  id: string
  world_news: string
  financial_news: string
  bitcoin_price: string
  superbowl: string
  created_at: string
}

export default function LatestNews() {
  const [news, setNews] = useState<NewsBrief | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedSection, setExpandedSection] = useState<string | null>('world')

  const loadNews = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('news_briefs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (!error && data) {
      setNews(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadNews()
  }, [])

  // Format date in CDT (America/Chicago)
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  // Removed - now using ReactMarkdown

  if (loading) {
    return (
      <div className="latest-news">
        <div className="news-header">
          <Newspaper size={24} />
          <h2>Latest News</h2>
        </div>
        <div className="loading">Loading news brief...</div>
      </div>
    )
  }

  if (!news) {
    return (
      <div className="latest-news">
        <div className="news-header">
          <Newspaper size={24} />
          <h2>Latest News</h2>
        </div>
        <div className="no-news">
          <p>No news briefs yet.</p>
          <p className="hint">Daily briefings are generated at 4:00 AM CDT.</p>
        </div>
      </div>
    )
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const sections = [
    { id: 'world', title: 'Weather & World', icon: Globe, content: news.world_news, color: '#3b82f6' },
    { id: 'financial', title: 'Markets & Finance', icon: TrendingUp, content: news.financial_news, color: '#10b981' },
    { id: 'bitcoin', title: 'Bitcoin', icon: Bitcoin, content: news.bitcoin_price, color: '#f59e0b' },
    { id: 'sports', title: 'Sports & Kansas', icon: Activity, content: news.superbowl, color: '#8b5cf6' }
  ]

  return (
    <div className="latest-news compact">
      <div className="news-header">
        <Newspaper size={20} />
        <h2>Latest News</h2>
        <button className="refresh-btn" onClick={loadNews} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>
      
      <p className="news-date">Updated: {formatDate(news.created_at)}</p>

      <div className="news-sections-compact">
        {sections.map(section => {
          const Icon = section.icon
          const isExpanded = expandedSection === section.id
          
          return (
            <div key={section.id} className={`news-row ${isExpanded ? 'expanded' : ''}`}>
              <div className="news-summary" onClick={() => toggleSection(section.id)}>
                <div className="news-icon" style={{ color: section.color }}>
                  <Icon size={16} />
                </div>
                <span className="news-title">{section.title}</span>
                <span className="expand-icon">
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              </div>
              
              {isExpanded && (
                <div className="news-content-expanded">
                  <ReactMarkdown>{section.content || `No ${section.title.toLowerCase()} available.`}</ReactMarkdown>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
