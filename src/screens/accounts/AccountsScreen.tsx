import { useEffect, useState } from 'react'
import AppLayout from '../../components/AppLayout'
import { authenticatedFetch } from '../../services/authService'
import './AccountsScreen.css'

type Account = {
  id: string
  accountCode: string
  accountNameEn: string
  accountNameAr: string
  parentId: string | null
  path: string
  depth: number
  accountType: string
  isPostable: boolean
  currencyCode: string
  children: unknown[]
}

type ChildAccount = {
  id?: string
  accountCode?: string
  accountNameAr?: string
  accountNameEn?: string
}

const accountsUrl = '/api/v1/finance/Accounts/tree'

function getAuthToken() {
  const tokenCookie = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('authToken='))

  return tokenCookie ? decodeURIComponent(tokenCookie.substring('authToken='.length)) : ''
}

function getChildLabel(child: unknown) {
  if (typeof child === 'string') {
    return child
  }

  if (typeof child === 'object' && child !== null) {
    const childAccount = child as ChildAccount
    const childName = childAccount.accountNameAr || childAccount.accountNameEn
    return [childAccount.accountCode, childName].filter(Boolean).join(' - ') || childAccount.id || 'حساب فرعي'
  }

  return 'حساب فرعي'
}

function AccountsScreen({ userName, onLogout }: { userName?: string; onLogout?: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [accountSearch, setAccountSearch] = useState('')
  const [isAccountListOpen, setIsAccountListOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadAccounts = async () => {
      const token = getAuthToken()

      if (!token) {
        setError('تعذر تحميل الحسابات: رمز الدخول غير متوفر.')
        setIsLoading(false)
        return
      }

      try {
        const response = await authenticatedFetch(accountsUrl, {
          headers: {
            Accept: 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`تعذر تحميل الحسابات (${response.status}).`)
        }

        const responseBody: unknown = await response.json()
        if (!Array.isArray(responseBody)) {
          throw new Error('تنسيق بيانات الحسابات غير صالح.')
        }

        const loadedAccounts = responseBody as Account[]
        setAccounts(loadedAccounts)
        setSelectedAccountId(loadedAccounts[0]?.id ?? '')
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل الحسابات.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadAccounts()
  }, [])

  const selectedAccount = accounts.find((account) => account.id === selectedAccountId)
  const filteredAccounts = accounts.filter((account) => {
    const searchTerm = accountSearch.trim().toLocaleLowerCase()
    return [account.accountCode, account.accountNameAr, account.accountNameEn]
      .some((value) => value.toLocaleLowerCase().includes(searchTerm))
  })

  const selectAccount = (account: Account) => {
    setSelectedAccountId(account.id)
    setAccountSearch(`${account.accountCode} - ${account.accountNameAr || account.accountNameEn}`)
    setIsAccountListOpen(false)
  }

  return (
    <AppLayout userName={userName} activeNavigation="الحسابات" onLogout={onLogout}>
      <section className="accounts-screen" aria-labelledby="accounts-title">
        <header className="accounts-header">
          <div>
            <span className="accounts-eyebrow">النظام المالي</span>
            <h1 id="accounts-title">دليل الحسابات</h1>
            <p>استعرض الحسابات وتفاصيلها من شجرة الحسابات.</p>
          </div>
          <button className="accounts-create-button" type="button">
            <span aria-hidden="true">+</span>
            إنشاء حساب
          </button>
        </header>

        <div className="accounts-layout">
          <section className="accounts-tree-panel" aria-labelledby="accounts-tree-title">
            <div className="accounts-panel-heading">
              <div>
                <span className="accounts-panel-label">الحسابات</span>
                <h2 id="accounts-tree-title">شجرة الحسابات</h2>
              </div>
              <span className="accounts-count">{accounts.length} حساب</span>
            </div>

            {isLoading && <p className="accounts-message">جارٍ تحميل الحسابات...</p>}
            {!isLoading && error && <p className="accounts-message accounts-message-error" role="alert">{error}</p>}
            {!isLoading && !error && accounts.length === 0 && <p className="accounts-message">لا توجد حسابات لعرضها.</p>}
            {!isLoading && !error && accounts.length > 0 && (
              <div className="accounts-combobox-field">
                <label className="accounts-select-label" htmlFor="account-combobox">
                  ابحث عن حساب
                  <input
                    id="account-combobox"
                    type="text"
                    role="combobox"
                    aria-expanded={isAccountListOpen}
                    aria-controls="account-options"
                    aria-autocomplete="list"
                    placeholder="اكتب رمز الحساب أو اسمه..."
                    value={accountSearch}
                    onFocus={() => setIsAccountListOpen(true)}
                    onChange={(event) => {
                      setAccountSearch(event.target.value)
                      setIsAccountListOpen(true)
                    }}
                  />
                </label>
                {isAccountListOpen && (
                  <div className="accounts-combobox-options" id="account-options" role="listbox">
                    {filteredAccounts.length > 0 ? filteredAccounts.map((account) => (
                      <button
                        className={`accounts-combobox-option${account.id === selectedAccountId ? ' accounts-combobox-option-selected' : ''}`}
                        type="button"
                        role="option"
                        aria-selected={account.id === selectedAccountId}
                        key={account.id}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectAccount(account)}
                      >
                        <span>{account.accountCode}</span>
                        <strong>{account.accountNameAr || account.accountNameEn}</strong>
                      </button>
                    )) : (
                      <p className="accounts-combobox-empty">لا توجد نتائج مطابقة.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="account-details-panel" aria-labelledby="account-details-title">
            <div className="accounts-panel-heading">
              <div>
                <span className="accounts-panel-label">تفاصيل الحساب</span>
                <h2 id="account-details-title">بيانات الحساب المحدد</h2>
              </div>
              <span className="account-details-icon" aria-hidden="true">▤</span>
            </div>

            {selectedAccount ? (
              <>
                <div className="account-name-block">
                  <span>{selectedAccount.accountCode}</span>
                  <h3>{selectedAccount.accountNameAr || selectedAccount.accountNameEn}</h3>
                </div>
                <dl className="account-details-list">
                  <div><dt>اسم الحساب بالعربية</dt><dd>{selectedAccount.accountNameAr || 'غير متوفر'}</dd></div>
                  <div><dt>رمز الحساب</dt><dd>{selectedAccount.accountCode}</dd></div>
                  <div><dt>المسار</dt><dd>{selectedAccount.path || 'غير متوفر'}</dd></div>
                  <div><dt>نوع الحساب</dt><dd>{selectedAccount.accountType || 'غير متوفر'}</dd></div>
                  <div><dt>المستوى</dt><dd>{selectedAccount.depth}</dd></div>
                  <div><dt>العملة</dt><dd>{selectedAccount.currencyCode || 'غير متوفر'}</dd></div>
                  <div><dt>قابل للترحيل</dt><dd>{selectedAccount.isPostable ? 'نعم' : 'لا'}</dd></div>
                </dl>
                {selectedAccount.children.length > 0 && (
                  <div className="account-children-section">
                    <h3>الحسابات الفرعية</h3>
                    <ul className="account-children-list">
                      {selectedAccount.children.map((child, index) => (
                        <li key={`${selectedAccount.id}-child-${index}`}>
                          <span aria-hidden="true">└</span>
                          {getChildLabel(child)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="account-details-actions">
                  <button type="button" className="account-edit-button">تعديل الحساب</button>
                  <button type="button" className="account-deactivate-button">تعطيل الحساب</button>
                </div>
              </>
            ) : (
              <p className="accounts-message">اختر حساباً لعرض تفاصيله.</p>
            )}
          </section>
        </div>
      </section>
    </AppLayout>
  )
}

export default AccountsScreen