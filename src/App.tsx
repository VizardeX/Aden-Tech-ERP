import { useEffect, useState } from 'react'
import LoginScreen from './screens/login/LoginScreen'
import MainScreen from './screens/main/MainScreen'
import { clearAuthTokens, getAccessToken, getRefreshToken } from './services/authService'
import './App.css'

function App() {
  const [language, setLanguage] = useState<'en' | 'ar'>('en')
  const [currentScreen, setCurrentScreen] = useState<'login' | 'main'>(() => (
    getAccessToken() && getRefreshToken() ? 'main' : 'login'
  ))
  const [loggedInEmail, setLoggedInEmail] = useState('')

  useEffect(() => {
    if (currentScreen !== 'main') {
      return
    }

    let idleTimer: number
    const resetIdleTimer = () => {
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        clearAuthTokens()
        setCurrentScreen('login')
      }, 30 * 60 * 1000)
    }

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    activityEvents.forEach((eventName) => window.addEventListener(eventName, resetIdleTimer))
    resetIdleTimer()

    return () => {
      window.clearTimeout(idleTimer)
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, resetIdleTimer))
    }
  }, [currentScreen])

  const handleLogout = () => {
    clearAuthTokens()
    setCurrentScreen('login')
  }

  if (currentScreen === 'main') {
    return <MainScreen loggedInEmail={loggedInEmail} onLogout={handleLogout} />
  }

  return (
    <LoginScreen
      language={language}
      onSwitchLanguage={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      onLoginSuccess={(email: string) => {
        setLoggedInEmail(email)
        setCurrentScreen('main')
      }}
    />
  )
}

export default App
