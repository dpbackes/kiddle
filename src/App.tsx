import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { getRandomWord, VALID_GUESSES } from './words'

const MAX_GUESSES = 6
const WORD_LENGTH = 3

type Status = 'correct' | 'present' | 'absent' | 'empty'

function App() {
  const [solution, setSolution] = useState(getRandomWord())
  const [guesses, setGuesses] = useState<string[]>([])
  const [currentGuess, setCurrentGuess] = useState('')
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [shake, setShake] = useState(false)
  const [showNotAWord, setShowNotAWord] = useState(false)

  const handleChar = useCallback((char: string) => {
    if (gameOver || currentGuess.length >= WORD_LENGTH) return
    setCurrentGuess(prev => prev + char.toUpperCase())
  }, [gameOver, currentGuess.length])

  const handleDelete = useCallback(() => {
    if (gameOver) return
    setCurrentGuess(prev => prev.slice(0, -1))
  }, [gameOver])

  const handleEnter = useCallback(() => {
    if (gameOver) {
      resetGame()
      return
    }
    if (currentGuess.length !== WORD_LENGTH) {
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    if (!VALID_GUESSES.has(currentGuess)) {
      setShake(true)
      setShowNotAWord(true)
      setTimeout(() => {
        setShake(false)
        setShowNotAWord(false)
      }, 1000)
      return
    }

    const newGuesses = [...guesses, currentGuess]
    setGuesses(newGuesses)
    setCurrentGuess('')

    if (currentGuess === solution) {
      setGameOver(true)
      setWon(true)
    } else if (newGuesses.length >= MAX_GUESSES) {
      setGameOver(true)
    }
  }, [gameOver, currentGuess, solution, guesses])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') handleEnter()
      else if (e.key === 'Backspace') handleDelete()
      else if (/^[a-zA-Z]$/.test(e.key)) handleChar(e.key)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleChar, handleDelete, handleEnter])

  const resetGame = () => {
    setSolution(getRandomWord())
    setGuesses([])
    setCurrentGuess('')
    setGameOver(false)
    setWon(false)
  }

  const getRowStatuses = (guess: string): Status[] => {
    const statuses: Status[] = Array(WORD_LENGTH).fill('absent')
    const solutionChars = solution.split('')
    const guessChars = guess.split('')

    // First pass: find greens
    guessChars.forEach((char, i) => {
      if (char === solutionChars[i]) {
        statuses[i] = 'correct'
        solutionChars[i] = '' // Mark as used
      }
    })

    // Second pass: find yellows
    guessChars.forEach((char, i) => {
      if (statuses[i] !== 'correct' && solutionChars.includes(char)) {
        statuses[i] = 'present'
        solutionChars[solutionChars.indexOf(char)] = '' // Mark as used
      }
    })

    return statuses
  }

  const getKeyStatus = (key: string): Status => {
    let bestStatus: Status = 'empty'
    guesses.forEach(guess => {
      const statuses = getRowStatuses(guess)
      guess.split('').forEach((char, i) => {
        if (char === key) {
          const status = statuses[i]
          if (status === 'correct') bestStatus = 'correct'
          else if (status === 'present' && bestStatus !== 'correct') bestStatus = 'present'
          else if (status === 'absent' && bestStatus === 'empty') bestStatus = 'absent'
        }
      })
    })
    return bestStatus
  }

  return (
    <div className="game-container">
      <header>
        <h1>KidWorlde</h1>
        <div className="subtitle">Can you guess the 3-letter word?</div>
      </header>

      <div className="toast-container">
        {showNotAWord && <div className="toast">Not a word!</div>}
      </div>

      <div className={`grid ${shake ? 'shake' : ''}`}>
        {Array.from({ length: MAX_GUESSES }).map((_, i) => {
          const guess = guesses[i] || (i === guesses.length ? currentGuess : '')
          const isSubmitted = i < guesses.length
          const rowStatuses = isSubmitted ? getRowStatuses(guess) : Array(WORD_LENGTH).fill('empty')
          
          return (
            <div key={i} className="row">
              {Array.from({ length: WORD_LENGTH }).map((_, j) => {
                const char = guess[j] || ''
                const status = rowStatuses[j]
                return (
                  <div key={j} className={`cell ${status} ${char ? 'pop' : ''}`}>
                    {char}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {gameOver && (
        <div className="message-overlay">
          <div className="message-content">
            {won ? (
              <>
                <h2>🌟 GREAT JOB! 🌟</h2>
                <p>You guessed the word:</p>
                <div className="revealed-word">{solution}</div>
              </>
            ) : (
              <>
                <h2>Nice try!</h2>
                <p>The word was:</p>
                <div className="revealed-word">{solution}</div>
              </>
            )}
            <button className="play-again" onClick={resetGame}>Play Again</button>
          </div>
        </div>
      )}

      <div className="keyboard">
        {['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'].map((row, i) => (
          <div key={i} className="kb-row">
            {i === 2 && <button className="kb-key wide" onClick={handleEnter}>GO</button>}
            {row.split('').map(char => (
              <button
                key={char}
                className={`kb-key ${getKeyStatus(char)}`}
                onClick={() => handleChar(char)}
              >
                {char}
              </button>
            ))}
            {i === 2 && <button className="kb-key wide" onClick={handleDelete}>⌫</button>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
