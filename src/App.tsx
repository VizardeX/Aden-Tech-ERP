import { useState } from 'react'
import LoginScreen from './screens/login/LoginScreen'
import './App.css'

function App() {
  const [language, setLanguage] = useState<'en' | 'ar'>('en')

  return (
    <LoginScreen
      language={language}
      onSwitchLanguage={() => setLanguage(language === 'en' ? 'ar' : 'en')}
    />
  )
}

export default App
