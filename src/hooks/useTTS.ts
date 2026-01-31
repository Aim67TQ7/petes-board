import { useState, useEffect, useRef, useCallback } from 'react'

export interface TTSMessage {
  id: string
  text: string
  sender: string
}

interface UseTTSOptions {
  autoPlay?: boolean
  rate?: number
  pitch?: number
  volume?: number
}

export function useTTS(options: UseTTSOptions = {}) {
  const {
    autoPlay = false,
    rate = 1,
    pitch = 1,
    volume = 1
  } = options

  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null)
  const [queue, setQueue] = useState<TTSMessage[]>([])
  const [isAutoPlay, setIsAutoPlay] = useState(autoPlay)
  const [isSupported, setIsSupported] = useState(false)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const queueRef = useRef<TTSMessage[]>([])
  const isPlayingRef = useRef(false)

  // Check if browser supports Speech Synthesis
  useEffect(() => {
    setIsSupported('speechSynthesis' in window)
  }, [])

  // Update refs when state changes
  useEffect(() => {
    queueRef.current = queue
  }, [queue])

  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  // Play next message in queue
  const playNext = useCallback(() => {
    if (queueRef.current.length === 0) {
      setIsPlaying(false)
      setCurrentMessageId(null)
      return
    }

    const nextMessage = queueRef.current[0]
    setQueue(prev => prev.slice(1))
    setCurrentMessageId(nextMessage.id)
    setIsPlaying(true)
    setIsPaused(false)

    const utterance = new SpeechSynthesisUtterance(nextMessage.text)
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    utterance.onend = () => {
      if (isPlayingRef.current) {
        playNext()
      }
    }

    utterance.onerror = (event) => {
      console.error('TTS Error:', event)
      setIsPlaying(false)
      setCurrentMessageId(null)
      setQueue([])
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [rate, pitch, volume])

  // Add message to queue
  const speak = useCallback((message: TTSMessage) => {
    setQueue(prev => [...prev, message])
    
    if (isAutoPlay && !isPlayingRef.current) {
      // Use setTimeout to ensure queue state is updated
      setTimeout(() => playNext(), 0)
    }
  }, [isAutoPlay, playNext])

  // Add multiple messages to queue
  const speakAll = useCallback((messages: TTSMessage[]) => {
    setQueue(prev => [...prev, ...messages])
    
    if (isAutoPlay && !isPlayingRef.current) {
      setTimeout(() => playNext(), 0)
    }
  }, [isAutoPlay, playNext])

  // Start/resume playback
  const play = useCallback(() => {
    if (isPaused) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      setIsPlaying(true)
    } else if (!isPlaying) {
      playNext()
    }
  }, [isPaused, isPlaying, playNext])

  // Pause playback
  const pause = useCallback(() => {
    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause()
      setIsPaused(true)
      setIsPlaying(false)
    }
  }, [isPlaying, isPaused])

  // Stop playback and clear queue
  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentMessageId(null)
    setQueue([])
  }, [])

  // Skip current message
  const skip = useCallback(() => {
    if (isPlaying) {
      window.speechSynthesis.cancel()
      playNext()
    }
  }, [isPlaying, playNext])

  // Clear queue but keep playing current
  const clearQueue = useCallback(() => {
    setQueue([])
  }, [])

  // Toggle auto-play
  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlay(prev => !prev)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  return {
    isSupported,
    isPlaying,
    isPaused,
    currentMessageId,
    queue,
    isAutoPlay,
    speak,
    speakAll,
    play,
    pause,
    stop,
    skip,
    clearQueue,
    toggleAutoPlay
  }
}
