import { useState } from 'react'
import { Radio, Lock } from 'lucide-react'
import './PasscodeGate.css'

interface Props {
  onUnlock: () => void
}

const PASSCODE = '5454'

export default function PasscodeGate({ onUnlock }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  const handleDigit = (digit: string) => {
    if (code.length >= 4) return
    
    const newCode = code + digit
    setCode(newCode)
    setError(false)
    
    if (newCode.length === 4) {
      if (newCode === PASSCODE) {
        localStorage.setItem('petes-board-auth', 'true')
        onUnlock()
      } else {
        setError(true)
        setShake(true)
        setTimeout(() => {
          setCode('')
          setShake(false)
        }, 500)
      }
    }
  }

  const handleBackspace = () => {
    setCode(code.slice(0, -1))
    setError(false)
  }

  return (
    <div className="passcode-gate">
      <div className="passcode-container">
        <div className="passcode-header">
          <Radio size={48} className="logo-icon" />
          <h1>Pete's Board</h1>
        </div>

        <div className={`passcode-dots ${shake ? 'shake' : ''}`}>
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`dot ${i < code.length ? 'filled' : ''} ${error ? 'error' : ''}`} 
            />
          ))}
        </div>

        {error && <p className="error-text">Incorrect passcode</p>}

        <div className="keypad">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, i) => (
            <button
              key={i}
              className={`key ${key === '' ? 'empty' : ''} ${key === '⌫' ? 'backspace' : ''}`}
              onClick={() => key === '⌫' ? handleBackspace() : key && handleDigit(key)}
              disabled={key === ''}
            >
              {key}
            </button>
          ))}
        </div>

        <p className="hint"><Lock size={14} /> Enter passcode to continue</p>
      </div>
    </div>
  )
}
