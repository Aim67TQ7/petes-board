import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Mic, Play, Pause, RefreshCw, ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react'
import './VoiceBriefings.css'

interface Briefing {
  id: string
  title: string
  transcript: string
  audio_url: string
  duration_seconds: number
  created_at: string
}

export default function VoiceBriefings() {
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const loadBriefings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('voice_briefings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)
    
    if (!error && data) {
      setBriefings(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadBriefings()
    
    // Subscribe to real-time updates for voice briefings
    const channel = supabase
      .channel('voice-briefings-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'voice_briefings' }, (payload) => {
        setBriefings(prev => [payload.new as Briefing, ...prev].slice(0, 30))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'voice_briefings' }, (payload) => {
        setBriefings(prev => prev.map(b => b.id === payload.new.id ? payload.new as Briefing : b))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const togglePlay = (briefing: Briefing) => {
    if (playing === briefing.id) {
      audioRef.current?.pause()
      setPlaying(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(briefing.audio_url)
      audio.onended = () => setPlaying(null)
      audio.play()
      audioRef.current = audio
      setPlaying(briefing.id)
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="voice-briefings compact">
        <div className="briefings-header">
          <Mic size={20} />
          <h2>Voice Briefings</h2>
        </div>
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="voice-briefings compact">
      <div className="briefings-header">
        <Mic size={20} />
        <h2>Voice Briefings</h2>
        <span className="briefing-count">{briefings.length}</span>
        <button className="refresh-btn" onClick={loadBriefings} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {briefings.length === 0 ? (
        <div className="no-briefings">
          <p>No voice briefings yet.</p>
          <p className="hint">Morning briefings are generated around 3 AM CDT.</p>
        </div>
      ) : (
        <div className="briefings-list compact">
          {briefings.map(briefing => {
            const isExpanded = expandedId === briefing.id
            const isPlaying = playing === briefing.id
            
            return (
              <div key={briefing.id} className={`briefing-row ${isExpanded ? 'expanded' : ''}`}>
                {/* Collapsed row - always visible */}
                <div className="briefing-summary" onClick={() => toggleExpand(briefing.id)}>
                  <button 
                    className={`play-btn-compact ${isPlaying ? 'playing' : ''}`}
                    onClick={(e) => { e.stopPropagation(); togglePlay(briefing); }}
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <span className="briefing-title">{briefing.title}</span>
                  <span className="briefing-date-badge">{formatDate(briefing.created_at)}</span>
                  {briefing.duration_seconds && (
                    <span className="duration-badge">{formatDuration(briefing.duration_seconds)}</span>
                  )}
                  <span className="expand-icon">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="briefing-details">
                    <div className="detail-grid">
                      <div className="detail-item">
                        <span className="detail-label">Date & Time</span>
                        <div className="detail-value">
                          <Calendar size={14} />
                          <span>{formatDate(briefing.created_at)}</span>
                          <span className="time-badge">{formatTime(briefing.created_at)}</span>
                        </div>
                      </div>

                      {briefing.duration_seconds && (
                        <div className="detail-item">
                          <span className="detail-label">Duration</span>
                          <div className="detail-value">
                            <Clock size={14} />
                            <span>{formatDuration(briefing.duration_seconds)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {briefing.transcript && (
                      <div className="transcript-section">
                        <span className="detail-label">Transcript</span>
                        <p className="transcript-text">{briefing.transcript}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <p className="footer-note">Daily briefings generated at 3:00 AM CDT</p>
    </div>
  )
}
