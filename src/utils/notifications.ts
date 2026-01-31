/**
 * Notification utilities for Pete's Board
 */

// Request notification permission on app load
export const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

// Play notification sound
export const playNotificationSound = () => {
  // Create a simple beep sound using Web Audio API
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.value = 800 // Frequency in Hz
  oscillator.type = 'sine'
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.5)
}

// Flash the screen
export const flashScreen = () => {
  const flash = document.createElement('div')
  flash.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(99, 102, 241, 0.3);
    z-index: 9999;
    pointer-events: none;
    animation: flash 0.5s ease-out;
  `
  
  // Add animation keyframes if not already present
  if (!document.getElementById('flash-animation-style')) {
    const style = document.createElement('style')
    style.id = 'flash-animation-style'
    style.textContent = `
      @keyframes flash {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
      }
    `
    document.head.appendChild(style)
  }
  
  document.body.appendChild(flash)
  setTimeout(() => flash.remove(), 500)
}

// Show browser notification
export const showNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: 'pete-notification',
      requireInteraction: false
    })
  }
}

// Combined notification (sound + flash + browser notification)
export const notifyUser = (title: string, message: string) => {
  playNotificationSound()
  flashScreen()
  showNotification(title, message)
}

// Check if message is from Pete (sub-agent completion)
export const isSubagentCompletion = (message: string): boolean => {
  return message.includes('✅') || 
         message.includes('complete') || 
         message.includes('done') ||
         message.includes('deployed') ||
         message.includes('finished')
}
