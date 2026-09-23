import { useState } from 'react'
import AccountsScreen from '../accounts/AccountsScreen'
import CurrenciesScreen from '../currencies/CurrenciesScreen'
import './MainScreen.css'

type MainScreenProps = {
  loggedInEmail: string
  onLogout: () => void
}

function MainScreen({ loggedInEmail, onLogout }: MainScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<'chartOfAccounts' | 'currencies'>('chartOfAccounts')
  const handleNavigationChange = (navigation: string) => {
    if (navigation === 'chartOfAccounts' || navigation === 'currencies') {
      setCurrentScreen(navigation)
    }
  }

  if (currentScreen === 'currencies') {
    return (
      <CurrenciesScreen
        userName={loggedInEmail}
        onLogout={onLogout}
        onNavigationChange={handleNavigationChange}
      />
    )
  }

  return (
    <AccountsScreen
      userName={loggedInEmail}
      onLogout={onLogout}
      onNavigationChange={handleNavigationChange}
    />
  )
}

export default MainScreen
