import { useState } from 'react'
import LoginScreen from './screens/login/LoginScreen'
import MainScreen from './screens/main/MainScreen'
import './App.css'

function App() {
  const [language, setLanguage] = useState<'en' | 'ar'>('en')
  const [currentScreen, setCurrentScreen] = useState<'login' | 'main'>('login')
  const [loggedInEmail, setLoggedInEmail] = useState('')

  if (currentScreen === 'main') {
    return <MainScreen loggedInEmail={loggedInEmail} onLogout={() => setCurrentScreen('login')} />
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
