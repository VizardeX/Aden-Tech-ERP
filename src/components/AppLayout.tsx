import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import mainLogo from '../assets/MainLogo.png'
import './AppLayout.css'
import { getUserById, changePassword } from '../services/userService'
import { authenticatedFetch, getUserID } from '../services/authService';


type AppLayoutProps = {
  children: ReactNode
  userName?: string
  activeNavigation?: string
  activeSubNavigation?: string
  onNavigationChange?: (navigation: string) => void
  onLogout?: () => void
}

interface UserItem {
  userID: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  userType?: number;
  userStatus?: number;
  profileImage?: string;
}

const userTypeMap: Record<string, number> = {
  SysAdmin: 0,
  OrgAdmin: 1,
  Support: 2,
};

const userStatusMap: Record<string, number> = {
  Inactive: 0,
  Active: 1,
  Suspended: 2,
};

interface DropdownItem {
  disabled: boolean;
  group: any;
  selected: boolean;
  text: string;
  value: string;
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
  { label: 'الفترات المحاسبية', value: 'ledgerPeriods' },
  { label: 'بيانات المستأجر', value: 'tenantData' },
  { label: 'إدارة المستخدمين ', icon: '⚙', value: 'AccountManagement' },

]

const TaxItems = [
  { label: 'فئات ومعدلات الضرائب', value: 'TaxCategories' },
  { label: ' تقارير التحقق الضريبي  ', value: 'TaxReports' } 
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
  const [isTaxOpen, setisTaxOpen] = useState(activeNavigation === 'الضريبة')
  const [isUserInfoOpen, setIsUserInfoOpen] = useState(false)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [userTypes, setUserTypes] = useState<DropdownItem[]>([]);
  const [userStatuses, setUserStatuses] = useState<DropdownItem[]>([]);
  const [userType, setUserType] = useState<string | number>('');
  const [userStatus, setUserStatus] = useState<string | number>('');
  const [profileImage, setProfileImage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | number>('');
  const [passMessage, setPassMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const userID = getUserID();


  const getUserTypeLabel = (type: number | string): string => {
    if (typeof type === 'string') {
      const option = userTypes.find(item => item.value === type);
      if (option) return option.text;
    }

    switch (Number(type)) {
      case 0: return 'مدير (Admin)';
      case 1: return 'مستخدم (User)';
      case 2: return 'مشرف (Supervisor)';
      default: return 'غير محدد';
    }
  };

  const getUserStatusLabel = (status: number | string): string => {
    if (typeof status === 'string') {
      const option = userStatuses.find(item => item.value === status);
      if (option) return option.text;
    }

    switch (Number(status)) {
      case 0: return 'غير نشط (Inactive)';
      case 1: return 'فعال (Active)';
      case 2: return 'معلق (Pending)';
      default: return 'غير محدد';
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      if (!isUserInfoOpen || !userID) return;


      try {
        setIsLoading(true);
        const res = await getUserById(String(userID));

        console.log(' البيانات المسترجعة :', res);

        const profileData = res?.profile || res;

        if (profileData) {
          setFirstName(profileData.firstName || '');
          setLastName(profileData.lastName || '');
          setEmail(profileData.email || '');
          setPhone(profileData.phoneNumber || '');
          setUserType(profileData.userType);
          setUserStatus(profileData.userStatus);
          setProfileImage(profileData.profileImage || '');

        }



      } catch (error) {
        console.error(' خطأ في جلب بيانات المستخدم:', error);
        setMessage({ type: 'error', text: 'تعذر جلب بيانات الحساب.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();



  }, [isUserInfoOpen, userID]);


  const handleSave = async (
    e: React.FormEvent,
    pemail: string 
  ) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);


    if (newPassword && confirmPassword) {

      if (newPassword !== confirmPassword) {
        console.error("كلمتا المرور غير متطابقتين!");
        return;
      }

      const payload = {
        email : pemail,
        newPassword: newPassword,
        confirmPassword: confirmPassword
      };

      const response = changePassword(payload);

     

      setIsUserInfoOpen(false)
    }



  };


  const handleUserInfo = (userId: string | number) => {
    setSelectedUserId(userId);
    setIsUserInfoOpen(true);
  };
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
          <button className="app-user-menu" type="button" onClick={() => handleUserInfo(userName)}>
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
            <button
              className={`app-navigation-item${activeNavigation === 'الضريبه' ? ' app-navigation-item-active' : ''}`}
              type="button"
              aria-expanded={isTaxOpen}
              onClick={() => setisTaxOpen((currentState) => !currentState)}
            >
              <span className="app-navigation-icon" aria-hidden="true"></span>
              <span>الضريبه</span>
              <span
                className={`app-navigation-chevron${isTaxOpen ? ' app-navigation-chevron-open' : ''}`}
                aria-hidden="true"
              />
            </button>
            {isTaxOpen && (
              <div className="app-navigation-submenu">
                {TaxItems.map((item) => (
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
      {isUserInfoOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '24px',
            width: '60%',
            maxWidth: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 6, color: '#1E466E', fontSize: '18px' }}>تعديل بيانات المستخدم</h2>
              <button
                onClick={() => setIsUserInfoOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#6B7280' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={(e) => handleSave(e, email)} style={{ display: 'flex', flexDirection: 'row', gap: '24px', alignItems: 'start' }}>


              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: '10px',
                    minWidth: '140px',
                  }}
                >
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '3px solid #1E466E',
                      backgroundColor: '#E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={profileImage}
                      alt="صورة المستخدم"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://ui-avatars.com/api/?name=' +
                          encodeURIComponent(firstName || 'User') +
                          '&background=1E466E&color=fff';
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ width: '1px', backgroundColor: '#E5E7EB', alignSelf: 'stretch' }} />

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', flex: 1, textAlign: 'right' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>الاسم الاول</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      readOnly
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB',backgroundColor: '#F3F4F6', boxSizing: 'border-box', cursor: 'not-allowed', }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>الاسم الاخير</label>
                    <input
                      type="text"
                      value={lastName}
                      readOnly
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #D1D5DB',backgroundColor: '#F3F4F6', boxSizing: 'border-box', cursor: 'not-allowed', }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020303', marginBottom: '8px' }}>
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={email}
                      readOnly
                      style={{
                        color: '#1E466E',
                        backgroundColor: '#F3F4F6',
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'not-allowed',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020203', marginBottom: '8px' }}>
                      رقم الهاتف
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      readOnly
                      style={{
                        color: '#1E466E',
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#F3F4F6',
                        border: '1px solid #D1D5DB',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        direction: 'ltr',
                        cursor: 'not-allowed',
                        textAlign: 'right',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020303', marginBottom: '8px' }}>
                      حالة المستخدم
                    </label>
                    <select
                      value={getUserStatusLabel(Number(userStatus))}
                      style={{
                        color: '#1E466E',
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        backgroundColor: '#F3F4F6',
                        border: '1px solid #D1D5DB',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor: 'not-allowed',
                      }}
                    >
                      <option value={getUserStatusLabel(Number(userStatus))} disabled>
                        {getUserStatusLabel(Number(userStatus))}
                      </option>
                      {userStatuses.map((item) => (
                        <option key={item.value} value={userStatusMap[item.value]} disabled={item.disabled}>
                          {item.text}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020303', marginBottom: '8px' }}>
                      نوع المستخدم
                    </label>
                    <select
                      value={getUserTypeLabel(Number(userType))}
                      style={{
                        color: '#1E466E',
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #D1D5DB',
                        backgroundColor: '#F3F4F6',
                        fontSize: '14px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        cursor : 'not-allowed',
                      }}
                    >
                      <option value={getUserTypeLabel(Number(userType))} disabled>
                        {getUserTypeLabel(Number(userType))}

                      </option>
                      {userTypes.map((item) => (
                        <option key={item.value} value={userTypeMap[item.value]} disabled={item.disabled}>
                          {item.text}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>
                <div style={{ height: '1px', backgroundColor: '#E5E7EB', alignSelf: 'stretch', margin: '16px' }} />

                <div style={{ marginTop: '0px' }}>
                  <h3 style={{ gridColumn: '1 / -1', color: '#919191d6', fontSize: '16px', fontWeight: '600', marginTop: '20px', marginBottom: '16px' }}>
                    تغيير كلمة المرور
                  </h3>

                  {passMessage && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '14px',
                        textAlign: 'right',
                        backgroundColor: passMessage.type === 'success' ? '#DEF7EC' : '#FDE8E8',
                        color: passMessage.type === 'success' ? '#03543F' : '#9B1C1C',
                      }}
                    >
                      {passMessage.text}
                    </div>
                  )}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '16px',
                      textAlign: 'right',
                      width: '100%',
                    }}

                  >

                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020202', marginBottom: '8px' }}>
                        كلمة مرور جديده
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                          color: '#1E466E',
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          textAlign: 'right',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#020202', marginBottom: '8px' }}>
                        تأكيد كلمة المرور
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                          color: '#1E466E',
                          width: '100%',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: '1px solid #D1D5DB',
                          fontSize: '14px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          textAlign: 'right',
                        }}
                      />
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      margin: '10px',
                      gridColumn: '1 / -1',
                      gap: '10px',
                    }}>
                      <button
                        type="submit"
                        disabled={isSaving}
                        style={{
                          backgroundColor: '#1E466E',
                          color: '#ffffff',
                          padding: '10px 24px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: isSaving ? 'not-allowed' : 'pointer',
                          opacity: isSaving ? 0.7 : 1,
                        }}
                      >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                      </button>

                      <button
                        type="button"
                        onClick={(onLogout)}
                        disabled={isSaving}
                        style={{
                          backgroundColor: '#924727',
                          color: '#ffffff',
                          padding: '10px 24px',
                          borderRadius: '8px',
                          border: 'none',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: isSaving ? 'not-allowed' : 'pointer',
                          opacity: isSaving ? 0.7 : 1,
                        }}
                      >
                        {isSaving ? 'جاري الخروج...' : 'الخروج من الحساب'}
                      </button>

                    </div>

                  </div>

                </div>
              </div>

            </form>

          </div>
        </div>
      )
      }
    </div>

  )
}

export default AppLayout