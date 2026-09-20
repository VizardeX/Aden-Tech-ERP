import AccountsScreen from '../accounts/AccountsScreen'
import './MainScreen.css'

type MainScreenProps = {
  loggedInEmail: string
  onLogout: () => void
}

function MainScreen({ loggedInEmail, onLogout }: MainScreenProps) {
  return <AccountsScreen userName={loggedInEmail || 'مازن ق.'} onLogout={onLogout} />
}

export default MainScreen
