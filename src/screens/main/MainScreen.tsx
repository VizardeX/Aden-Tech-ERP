import AccountsScreen from '../accounts/AccountsScreen'
import './MainScreen.css'

type MainScreenProps = {
  loggedInEmail: string
  onLogout: () => void
}

function MainScreen({ loggedInEmail, onLogout }: MainScreenProps) {
  return <AccountsScreen userName={loggedInEmail} onLogout={onLogout} />
}

export default MainScreen
