import { Play, Pause, Square, SkipForward, Volume2, VolumeX } from 'lucide-react'
import './TTSControls.css'

interface Props {
  isPlaying: boolean
  isPaused: boolean
  isAutoPlay: boolean
  queueLength: number
  isSupported: boolean
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSkip: () => void
  onToggleAutoPlay: () => void
}

export default function TTSControls({
  isPlaying,
  isPaused,
  isAutoPlay,
  queueLength,
  isSupported,
  onPlay,
  onPause,
  onStop,
  onSkip,
  onToggleAutoPlay
}: Props) {
  if (!isSupported) {
    return null
  }

  return (
    <div className="tts-controls">
      <div className="tts-status">
        {isPlaying || isPaused ? (
          <span className="status-indicator playing">
            <Volume2 size={14} />
            {queueLength > 0 ? `Playing (${queueLength} queued)` : 'Playing'}
          </span>
        ) : (
          <span className="status-indicator idle">
            <VolumeX size={14} />
            {queueLength > 0 ? `${queueLength} queued` : 'Ready'}
          </span>
        )}
      </div>

      <div className="tts-buttons">
        {!isPlaying && !isPaused && (
          <button
            className="tts-btn play"
            onClick={onPlay}
            disabled={queueLength === 0}
            title="Play queue"
          >
            <Play size={16} />
          </button>
        )}

        {isPlaying && (
          <button
            className="tts-btn pause"
            onClick={onPause}
            title="Pause"
          >
            <Pause size={16} />
          </button>
        )}

        {isPaused && (
          <button
            className="tts-btn play"
            onClick={onPlay}
            title="Resume"
          >
            <Play size={16} />
          </button>
        )}

        {(isPlaying || isPaused || queueLength > 0) && (
          <>
            <button
              className="tts-btn stop"
              onClick={onStop}
              title="Stop and clear queue"
            >
              <Square size={16} />
            </button>
            
            {queueLength > 0 && (
              <button
                className="tts-btn skip"
                onClick={onSkip}
                title="Skip to next"
              >
                <SkipForward size={16} />
              </button>
            )}
          </>
        )}

        <button
          className={`tts-btn autoplay ${isAutoPlay ? 'active' : ''}`}
          onClick={onToggleAutoPlay}
          title={isAutoPlay ? 'Auto-play ON' : 'Auto-play OFF'}
        >
          <Volume2 size={16} />
          {isAutoPlay ? 'Auto' : 'Manual'}
        </button>
      </div>
    </div>
  )
}
