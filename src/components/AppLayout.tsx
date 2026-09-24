import { useState } from 'react'
import type { ReactNode } from 'react'
import mainLogo from '../assets/MainLogo.png'
import './AppLayout.css'

type AppLayoutProps = {
  children: ReactNode
  userName?: string
  activeNavigation?: string
  activeSubNavigation?: string
  onNavigationChange?: (navigation: string) => void
  onLogout?: () => void
}

const navigationItems = [
  { label: 'لوحة التحكم', icon: '▦', active: true },
  { label: 'دفتر الأستاذ', icon: '▤' },
  { label: 'ميزان المراجعة', icon: '⚖' },
]

const settingsItems = [
  { label: 'دليل الحسابات', value: 'chartOfAccounts' },
  { label: 'العملات', value: 'currencies' },
  { label: 'أسعار الصرف', value: 'exchangeRates' },
]

function AppLayout({
  children,
  userName = '',
  activeNavigation = 'لوحة التحكم',
  activeSubNavigation = '',
  onNavigationChange,
  onLogout,
}: AppLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(activeNavigation === 'الإعدادات')

  return (
    <div className={`app-layout${isSidebarCollapsed ? ' app-layout-sidebar-collapsed' : ''}`} dir="rtl" lang="ar">
      <header className="app-topbar">
        <div className="app-identity">
          <button
            className="app-icon-button"
            type="button"
            aria-label={isSidebarCollapsed ? 'فتح القائمة' : 'طي القائمة'}
            aria-expanded={!isSidebarCollapsed}
            onClick={() => setIsSidebarCollapsed((currentState) => !currentState)}
          >
            ☰
          </button>
          <img className="app-logo" src={mainLogo} alt="Aden Tech ERP" />
          <span className="app-tenant-name">Aden Tech ERP</span>
        </div>

        <label className="app-search" aria-label="البحث">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="بحث... (Ctrl+K)" />
        </label>

        <div className="app-toolbar-actions">
          <button className="app-language-button" type="button">English</button>
          <button className="app-toolbar-button app-notification-button" type="button" aria-label="الإشعارات">
            <svg className="app-notification-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          </button>
          <button className="app-user-menu" type="button" onClick={onLogout}>
            <span className="app-user-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="3.2" />
                <path d="M5.5 20c.7-3.3 3-5 6.5-5s5.8 1.7 6.5 5" />
              </svg>
            </span>
            <span>{userName}</span>
          </button>
        </div>
      </header>

      <div className="app-body">
        <aside className="app-sidebar" aria-label="التنقل الرئيسي">
          <nav className="app-navigation">
            {navigationItems.map((item) => (
              <button
                className={`app-navigation-item${item.label === activeNavigation ? ' app-navigation-item-active' : ''}`}
                type="button"
                key={item.label}
                onClick={() => onNavigationChange?.(item.label)}
              >
                <span className="app-navigation-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
            <button
              className={`app-navigation-item${activeNavigation === 'الإعدادات' ? ' app-navigation-item-active' : ''}`}
              type="button"
              aria-expanded={isSettingsOpen}
              onClick={() => setIsSettingsOpen((currentState) => !currentState)}
            >
              <span className="app-navigation-icon" aria-hidden="true">⚙</span>
              <span>الإعدادات</span>
              <span
                className={`app-navigation-chevron${isSettingsOpen ? ' app-navigation-chevron-open' : ''}`}
                aria-hidden="true"
              />
            </button>
            {isSettingsOpen && (
              <div className="app-navigation-submenu">
                {settingsItems.map((item) => (
                  <button
                    className={`app-navigation-subitem${item.value === activeSubNavigation ? ' app-navigation-subitem-active' : ''}`}
                    type="button"
                    key={item.value}
                    onClick={() => onNavigationChange?.(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </nav>
        </aside>

        <main className="app-main">
          <div className="app-content">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default AppLayout