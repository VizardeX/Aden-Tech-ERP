import { useState } from 'react'
import AccountsScreen from '../accounts/AccountsScreen'
import CurrenciesScreen from '../currencies/CurrenciesScreen'
import ExchangeRatesScreen from '../exchange-rates/ExchangeRatesScreen'
import LedgerPeriodsScreen from '../ledger-periods/LedgerPeriodsScreen'
import './MainScreen.css'

type MainScreenProps = {
  loggedInEmail: string
  onLogout: () => void
}

function MainScreen({ loggedInEmail, onLogout }: MainScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<'chartOfAccounts' | 'currencies' | 'exchangeRates' | 'ledgerPeriods'>('chartOfAccounts')
  const handleNavigationChange = (navigation: string) => {
    if (navigation === 'chartOfAccounts' || navigation === 'currencies' || navigation === 'exchangeRates' || navigation === 'ledgerPeriods') {
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

  if (currentScreen === 'exchangeRates') {
    return (
      <ExchangeRatesScreen
        userName={loggedInEmail}
        onLogout={onLogout}
        onNavigationChange={handleNavigationChange}
      />
    )
  }

  if (currentScreen === 'ledgerPeriods') {
    return (
      <LedgerPeriodsScreen
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
