import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Mic, Play, Pause, RefreshCw, Volume2, Calendar } from 'lucide-react'
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
  const [expanded, setExpanded] = useState<string | null>(null)
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
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
      <div className="voice-briefings">
        <div className="briefings-header">
          <Mic size={24} />
          <h2>Voice Briefings</h2>
        </div>
        <div className="loading">Loading briefings...</div>
      </div>
    )
  }

  return (
    <div className="voice-briefings">
      <div className="briefings-header">
        <Mic size={24} />
        <h2>Voice Briefings</h2>
        <button className="refresh-btn" onClick={loadBriefings} title="Refresh">
          <RefreshCw size={18} />
        </button>
      </div>

      <p className="briefings-intro">
        <Volume2 size={16} />
        Pete delivers daily audio briefings summarizing accomplishments and priorities.
      </p>

      {briefings.length === 0 ? (
        <div className="no-briefings">
          <p>No voice briefings yet.</p>
          <p className="hint">Morning briefings are generated around 3 AM CDT.</p>
        </div>
      ) : (
        <div className="briefings-list">
          {briefings.map(briefing => (
            <div key={briefing.id} className="briefing-card">
              <div className="briefing-header">
                <button 
                  className={`play-btn ${playing === briefing.id ? 'playing' : ''}`}
                  onClick={() => togglePlay(briefing)}
                >
                  {playing === briefing.id ? <Pause size={24} /> : <Play size={24} />}
                </button>
                <div className="briefing-info">
                  <h3>{briefing.title}</h3>
                  <div className="briefing-meta">
                    <span><Calendar size={14} /> {formatDate(briefing.created_at)}</span>
                    <span>{formatTime(briefing.created_at)}</span>
                    {briefing.duration_seconds && (
                      <span>{formatDuration(briefing.duration_seconds)}</span>
                    )}
                  </div>
                </div>
              </div>
              
              {briefing.transcript && (
                <div className="briefing-transcript">
                  <button 
                    className="transcript-toggle"
                    onClick={() => setExpanded(expanded === briefing.id ? null : briefing.id)}
                  >
                    {expanded === briefing.id ? 'Hide transcript' : 'Show transcript'}
                  </button>
                  {expanded === briefing.id && (
                    <p className="transcript-text">{briefing.transcript}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
