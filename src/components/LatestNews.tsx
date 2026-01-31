import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Newspaper, Globe, TrendingUp, Bitcoin, Activity, RefreshCw } from 'lucide-react'
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

  return (
    <div className="latest-news">
      <div className="news-header">
        <Newspaper size={24} />
        <h2>Latest News</h2>
        <button className="refresh-btn" onClick={loadNews} title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>
      
      <p className="news-date">Updated: {formatDate(news.created_at)}</p>

      <div className="news-sections">
        {/* Weather & World News */}
        <div className="news-card world">
          <div className="card-header">
            <Globe size={20} />
            <h3>Weather & World News</h3>
          </div>
          <div className="card-content">
            <ReactMarkdown>{news.world_news || 'No world news available.'}</ReactMarkdown>
          </div>
        </div>

        {/* Spot Prices & Finance */}
        <div className="news-card financial">
          <div className="card-header">
            <TrendingUp size={20} />
            <h3>Markets & Finance</h3>
          </div>
          <div className="card-content">
            <ReactMarkdown>{news.financial_news || 'No financial news available.'}</ReactMarkdown>
          </div>
        </div>

        {/* Bitcoin */}
        <div className="news-card bitcoin">
          <div className="card-header">
            <Bitcoin size={20} />
            <h3>Bitcoin</h3>
          </div>
          <div className="card-content">
            <ReactMarkdown>{news.bitcoin_price || 'No Bitcoin update available.'}</ReactMarkdown>
          </div>
        </div>

        {/* Sports & Kansas */}
        <div className="news-card sports">
          <div className="card-header">
            <Activity size={20} />
            <h3>Sports & Kansas</h3>
          </div>
          <div className="card-content">
            <ReactMarkdown>{news.superbowl || 'No sports/local news available.'}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  )
}
