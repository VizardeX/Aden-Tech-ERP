import type { ReactNode } from 'react'
import './AppLayout.css'

type AppLayoutProps = {
  children: ReactNode
  userName?: string
  activeNavigation?: string
  onLogout?: () => void
}

const navigationItems = [
  { label: 'لوحة التحكم', icon: '▦', active: true },
  { label: 'الحسابات', icon: '♧' },
  { label: 'العملات', icon: '◈' },
  { label: 'دفتر الأستاذ', icon: '▤' },
  { label: 'ميزان المراجعة', icon: '⚖' },
  { label: 'الإعدادات', icon: '⚙' },
]

function AppLayout({ children, userName = 'مازن ق.', activeNavigation = 'لوحة التحكم', onLogout }: AppLayoutProps) {
  return (
    <div className="app-layout" dir="rtl" lang="ar">
      <header className="app-topbar">
        <div className="app-identity">
          <button className="app-icon-button" type="button" aria-label="فتح القائمة">
            ☰
          </button>
          <div className="app-logo" aria-hidden="true">A</div>
          <span className="app-tenant-name">شركة عدن التقنية</span>
        </div>

        <label className="app-search" aria-label="البحث">
          <span aria-hidden="true">⌕</span>
          <input type="search" placeholder="بحث... (Ctrl+K)" />
        </label>

        <div className="app-toolbar-actions">
          <button className="app-toolbar-button" type="button">ع / E</button>
          <button className="app-toolbar-button app-notification-button" type="button" aria-label="الإشعارات">
            ♧<span>3</span>
          </button>
          <button className="app-user-menu" type="button" onClick={onLogout}>
            <span className="app-user-avatar">م</span>
            <span>{userName}</span>
            <span aria-hidden="true">⌄</span>
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
              >
                <span className="app-navigation-icon" aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <button className="app-collapse-button" type="button">
            <span aria-hidden="true">‹</span>
            طي القائمة
          </button>
        </aside>

        <main className="app-main">
          <div className="app-breadcrumbs" aria-label="مسار الصفحة">
            <span>الرئيسية</span>
            <span aria-hidden="true">/</span>
            <span>النظام المالي</span>
            <span aria-hidden="true">/</span>
            <strong>{activeNavigation}</strong>
          </div>
          <div className="app-content">{children}</div>
          <footer className="app-footer">
            <span>إصدار التطبيق 1.4.0</span>
            <span className="app-footer-status"><i aria-hidden="true" /> قاعدة البيانات متصلة</span>
            <span>الخطة النشطة: Enterprise</span>
          </footer>
        </main>
      </div>
    </div>
  )
}

export default AppLayout