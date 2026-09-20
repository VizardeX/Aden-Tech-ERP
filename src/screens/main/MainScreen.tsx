import { useState } from 'react'
import './MainScreen.css'

type MainScreenProps = {
  loggedInEmail: string
  onLogout: () => void
}

function MainScreen({ loggedInEmail, onLogout }: MainScreenProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState('')

  const getCookie = (name: string) => {
    const cookie = document.cookie
      .split('; ')
      .find((value) => value.startsWith(`${name}=`))

    return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : ''
  }

  const saveCookie = (name: string, value: string) => {
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`
  }

  const handleRefreshToken = async () => {
    setRefreshError('')
    const token = getCookie('authToken')
    const refreshToken = getCookie('refreshToken')

    if (!token || !refreshToken) {
      setRefreshError('The current session cannot be refreshed.')
      return
    }

    setIsRefreshing(true)

    try {
      const response = await fetch('/api/v1/Auth/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, refreshToken }),
      })
      const responseText = await response.text()
      const responseBody = responseText ? JSON.parse(responseText) : null

      if (!response.ok || !responseBody?.token) {
        setRefreshError(responseBody?.message || `Token refresh failed: ${response.statusText}`)
        return
      }

      saveCookie('authToken', responseBody.token)
      if (responseBody.refreshToken) {
        saveCookie('refreshToken', responseBody.refreshToken)
      }
    } catch {
      setRefreshError('Unable to reach the token refresh service.')
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <main className="main-page">
      <aside className="main-sidebar">
        <div className="main-sidebar-brand">
          <span className="main-sidebar-logo">A</span>
          <span className="main-sidebar-title">Aden Tech ERP</span>
        </div>

        <nav className="main-sidebar-nav">
          <span className="main-sidebar-link main-sidebar-link-active">Dashboard</span>
          <span className="main-sidebar-link">Sales</span>
          <span className="main-sidebar-link">Inventory</span>
          <span className="main-sidebar-link">Reports</span>
        </nav>
      </aside>

      <section className="main-content">
        <header className="main-topbar">
          <div>
            <span className="main-kicker">Workspace</span>
            <h1 className="main-title">Main Page</h1>
          </div>

          <div className="main-topbar-actions">
            <button className="refresh-token-button" type="button" onClick={handleRefreshToken} disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing...' : 'Refresh token'}
            </button>
            <button className="logout-button" type="button" onClick={onLogout}>
              Logout
            </button>
          </div>
        </header>

        <section className="main-placeholder-panel">
          <div className="main-placeholder-card">
            <span className="main-placeholder-icon" aria-hidden="true">
              ✓
            </span>
            <h2>Welcome</h2>
            <p>This is a simple placeholder for the main page.</p>
            <p className="main-placeholder-meta">Signed in as: {loggedInEmail || 'Unknown user'}</p>
            <p className="main-placeholder-meta">Dashboard content will be added here.</p>
            {refreshError && <p className="refresh-token-error" role="alert">{refreshError}</p>}
          </div>
        </section>
      </section>
    </main>
  )
}

export default MainScreen
