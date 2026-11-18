import { useState } from 'react'
import AccountsScreen from '../accounts/AccountsScreen'
import CurrenciesScreen from '../currencies/CurrenciesScreen'
import ExchangeRatesScreen from '../exchange-rates/ExchangeRatesScreen'
import LedgerPeriodsScreen from '../ledger-periods/LedgerPeriodsScreen'
import TenantDataScreen from '../tenant-data/TenantDataScreen'
import AccountManagement from '../Account-Management/AccountManagement'
import TaxCategories from '../Tax-Category/TaxCategories'
import TaxReports from '../Tax-Reports/TaxReports'
import  HsCode from '../HsCode/HsCode'
import './MainScreen.css'

type MainScreenProps = {
  loggedInEmail: string
  onLogout: () => void
}

function MainScreen({ loggedInEmail, onLogout }: MainScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<'chartOfAccounts' | 'currencies' | 'exchangeRates' | 'ledgerPeriods' | 'tenantData' | 'AccountManagement' | 'TaxCategories' | 'TaxReports' | 'HSCodes'>('chartOfAccounts')
  const handleNavigationChange = (navigation: string) => {
    if (navigation === 'chartOfAccounts' || navigation === 'currencies' || navigation === 'exchangeRates' || navigation === 'ledgerPeriods' || navigation === 'tenantData' || navigation === 'AccountManagement' || navigation === 'TaxCategories'|| navigation === 'TaxReports' || navigation === 'HSCodes') {
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

  if (currentScreen === 'AccountManagement') {
    return (
      <AccountManagement
        userName={loggedInEmail}
        onLogout={onLogout}
        onNavigationChange={handleNavigationChange}
      />
    )
  }

  if (currentScreen === 'HSCodes') {
    return (
      <HsCode
        userName={loggedInEmail}
        onLogout={onLogout}
        onNavigationChange={handleNavigationChange}
      />
    )
  }

    if (currentScreen === 'TaxCategories') {
    return (
      <TaxCategories
        userName={loggedInEmail}
        onLogout={onLogout}
        onNavigationChange={handleNavigationChange}
      />
    )
  }

   if (currentScreen === 'TaxReports') {
    return (
      <TaxReports
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

  if (currentScreen === 'tenantData') {
    return (
      <TenantDataScreen
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
