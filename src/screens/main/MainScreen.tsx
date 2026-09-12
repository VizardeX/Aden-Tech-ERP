import './MainScreen.css'

type MainScreenProps = {
  loggedInEmail: string
  onLogout: () => void
}

function MainScreen({ loggedInEmail, onLogout }: MainScreenProps) {
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

          <button className="logout-button" type="button" onClick={onLogout}>
            Logout
          </button>
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
          </div>
        </section>
      </section>
    </main>
  )
}

export default MainScreen
