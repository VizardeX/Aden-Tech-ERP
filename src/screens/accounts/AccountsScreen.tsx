import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import AppLayout from '../../components/AppLayout'
import { authenticatedFetch, getUserID } from '../../services/authService'
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
  id: string
  accountCode?: string
  accountNameAr?: string
  accountNameEn?: string
  parentId?: string | null
  path?: string
  depth?: number
  accountType?: string
  isPostable?: boolean
  currencyCode?: string
  children?: unknown[]
}

type AccountTypeOption = {
  value: number
  name: string
}

type MetadataAccount = {
  id: string
  name: string
  code: string
}

type CurrencyOption = {
  id: string
  name: string
  code: string
}

type AccountMetadata = {
  accountTypes: AccountTypeOption[]
  accounts: MetadataAccount[]
  currencies: CurrencyOption[]
}

const accountsUrl = '/api/v1/finance/Accounts/tree'
const accountsMetadataUrl = '/api/v1/finance/Accounts/accounts-metadata'
const createAccountUrl = '/api/v1/finance/Accounts'

type AccountForm = {
  id?: string
  accountCode: string
  accountNameEn: string
  accountNameAr: string
  parentId: string
  path?: string
  depth?: number
  accountType: string
  isPostable: boolean
  currencyCode: string
  children?: unknown[]
}

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

function getChildAccount(child: unknown): Account | null {
  if (typeof child !== 'object' || child === null || !('id' in child)) {
    return null
  }

  const childAccount = child as ChildAccount
  return {
    id: childAccount.id,
    accountCode: childAccount.accountCode || '',
    accountNameEn: childAccount.accountNameEn || '',
    accountNameAr: childAccount.accountNameAr || '',
    parentId: childAccount.parentId || null,
    path: childAccount.path || '',
    depth: childAccount.depth || 0,
    accountType: childAccount.accountType || '',
    isPostable: childAccount.isPostable ?? true,
    currencyCode: childAccount.currencyCode || '',
    children: childAccount.children || [],
  }
}

function flattenAccounts(accountList: Account[]): Account[] {
  return accountList.flatMap((account) => [
    account,
    ...flattenAccounts(account.children.map(getChildAccount).filter((child): child is Account => child !== null)),
  ])
}

function getAccountChildren(account: Account, allAccounts: Account[]) {
  const nestedChildIds = new Set(
    account.children
      .map(getChildAccount)
      .filter((child): child is Account => child !== null)
      .map((child) => child.id),
  )
  const relatedChildren = allAccounts.filter((candidate) => (
    candidate.parentId === account.id && !nestedChildIds.has(candidate.id)
  ))

  return [...account.children, ...relatedChildren]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getAccountDetails(responseBody: unknown, fallbackAccount: Account) {
  let candidate: unknown = responseBody

  if (Array.isArray(candidate)) {
    candidate = candidate.find((item) => isRecord(item) && item.id === fallbackAccount.id)
  } else if (isRecord(candidate)) {
    candidate = candidate.data || candidate.result || candidate.account || candidate.item || candidate
  }

  if (!isRecord(candidate)) {
    return fallbackAccount
  }

  return {
    ...fallbackAccount,
    ...candidate,
    children: Array.isArray(candidate.children) ? candidate.children : fallbackAccount.children,
  } as Account
}

function AccountsScreen({ userName, onLogout }: { userName?: string; onLogout?: () => void }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [accountSearch, setAccountSearch] = useState('')
  const [isAccountListOpen, setIsAccountListOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [metadata, setMetadata] = useState<AccountMetadata | null>(null)
  const [isMetadataLoading, setIsMetadataLoading] = useState(false)
  const [metadataError, setMetadataError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState('')
  const [editForm, setEditForm] = useState<AccountForm | null>(null)
  const [editingAccountId, setEditingAccountId] = useState('')
  const [createForm, setCreateForm] = useState<AccountForm>({
    accountCode: '',
    accountNameEn: '',
    accountNameAr: '',
    parentId: '',
    accountType: '',
    isPostable: true,
    currencyCode: '',
  })

  const loadAccounts = async () => {
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
    setSelectedAccountId((currentId) => currentId || loadedAccounts[0]?.id || '')
  }

  useEffect(() => {
    const loadInitialAccounts = async () => {
      if (!getAuthToken()) {
        setError('تعذر تحميل الحسابات: رمز الدخول غير متوفر.')
        setIsLoading(false)
        return
      }

      try {
        await loadAccounts()
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل الحسابات.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadInitialAccounts()
  }, [])

  const openCreateDialog = async () => {
    setIsCreateDialogOpen(true)
    setMetadata(null)
    setMetadataError('')
    setCreateError('')
    setIsMetadataLoading(true)

    try {
      const response = await authenticatedFetch(accountsMetadataUrl, {
        headers: {
          Accept: 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`تعذر تحميل بيانات الحساب (${response.status}).`)
      }

      const loadedMetadata = await response.json() as AccountMetadata
      setMetadata(loadedMetadata)
      setCreateForm((currentForm) => ({
        ...currentForm,
        accountType: currentForm.accountType || String(loadedMetadata.accountTypes[0]?.value ?? ''),
        currencyCode: currentForm.currencyCode || loadedMetadata.currencies[0]?.code || '',
      }))
    } catch (requestError) {
      setMetadataError(requestError instanceof Error ? requestError.message : 'تعذر تحميل بيانات الحساب.')
    } finally {
      setIsMetadataLoading(false)
    }
  }

  const closeCreateDialog = () => {
    if (!isCreating && !isMetadataLoading) {
      setIsCreateDialogOpen(false)
    }
  }

  const openEditDialog = async (account: Account) => {
    setIsEditDialogOpen(true)
    setEditingAccountId(account.id)
    setMetadata(null)
    setMetadataError('')
    setEditError('')
    setEditForm(null)
    setIsMetadataLoading(true)

    try {
      const accountResponse = await authenticatedFetch(`/api/v1/finance/Accounts/tree/${account.id}`, {
        headers: { Accept: 'application/json' },
      })

      if (!accountResponse.ok) {
        throw new Error(`تعذر تحميل بيانات الحساب (${accountResponse.status}).`)
      }

      const accountResponseBody = await accountResponse.json() as unknown
      const accountDetails = getAccountDetails(accountResponseBody, account)
      setEditForm({
        id: accountDetails.id,
        accountCode: accountDetails.accountCode || '',
        accountNameEn: accountDetails.accountNameEn || '',
        accountNameAr: accountDetails.accountNameAr || '',
        parentId: accountDetails.parentId || '',
        path: accountDetails.path || '',
        depth: accountDetails.depth || 0,
        accountType: '',
        isPostable: accountDetails.isPostable ?? true,
        currencyCode: accountDetails.currencyCode || '',
        children: accountDetails.children || [],
      })
    } catch (requestError) {
      setMetadataError(requestError instanceof Error ? requestError.message : 'تعذر تحميل بيانات الحساب.')
    } finally {
      setIsMetadataLoading(false)
    }
  }

  const closeEditDialog = () => {
    if (!isEditing && !isMetadataLoading) {
      setIsEditDialogOpen(false)
    }
  }

  const handleEditAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editForm || !editingAccountId) {
      return
    }

    setEditError('')
    setIsEditing(true)

    try {
      const response = await authenticatedFetch(`/api/v1/finance/Accounts/${editingAccountId}`, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountNameEn: editForm.accountNameEn,
          accountNameAr: editForm.accountNameAr,
          isActive: true,
          userID: Number(getUserID()),
        }),
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(responseText || `تعذر تعديل الحساب (${response.status}).`)
      }

      await loadAccounts()
      setIsEditDialogOpen(false)
    } catch (requestError) {
      setEditError(requestError instanceof Error ? requestError.message : 'تعذر تعديل الحساب.')
    } finally {
      setIsEditing(false)
    }
  }

  const handleCreateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError('')
    setIsCreating(true)

    try {
      const response = await authenticatedFetch(createAccountUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountCode: createForm.accountCode,
          accountNameEn: createForm.accountNameEn,
          accountNameAr: createForm.accountNameAr,
          parentId: createForm.parentId || null,
          accountType: Number(createForm.accountType),
          isPostable: createForm.isPostable,
          currencyCode: createForm.currencyCode,
        }),
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(responseText || `تعذر إنشاء الحساب (${response.status}).`)
      }

      await loadAccounts()
      setIsCreateDialogOpen(false)
      setCreateForm({
        accountCode: '',
        accountNameEn: '',
        accountNameAr: '',
        parentId: '',
        accountType: '',
        isPostable: true,
        currencyCode: '',
      })
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : 'تعذر إنشاء الحساب.')
    } finally {
      setIsCreating(false)
    }
  }

  const searchableAccounts = flattenAccounts(accounts)
  const selectedAccount = searchableAccounts.find((account) => account.id === selectedAccountId)
  const selectedAccountChildren = selectedAccount
    ? getAccountChildren(selectedAccount, searchableAccounts)
    : []
  const filteredAccounts = searchableAccounts.filter((account) => {
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
          <button className="accounts-create-button" type="button" onClick={() => void openCreateDialog()}>
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
                  <div><dt>اسم الحساب بالإنجليزية</dt><dd>{selectedAccount.accountNameEn || 'غير متوفر'}</dd></div>
                  <div><dt>رمز الحساب</dt><dd>{selectedAccount.accountCode}</dd></div>
                  <div><dt>المسار</dt><dd>{selectedAccount.path || 'غير متوفر'}</dd></div>
                  <div><dt>نوع الحساب</dt><dd>{selectedAccount.accountType || 'غير متوفر'}</dd></div>
                  <div><dt>المستوى</dt><dd>{selectedAccount.depth}</dd></div>
                  <div><dt>العملة</dt><dd>{selectedAccount.currencyCode || 'غير متوفر'}</dd></div>
                  <div><dt>قابل للترحيل</dt><dd>{selectedAccount.isPostable ? 'نعم' : 'لا'}</dd></div>
                </dl>
                {selectedAccountChildren.length > 0 && (
                  <div className="account-children-section">
                    <h3>الحسابات الفرعية</h3>
                    <ul className="account-children-list">
                      {selectedAccountChildren.map((child, index) => {
                        const childAccount = getChildAccount(child)

                        return (
                          <li key={`${selectedAccount.id}-child-${index}`}>
                            {childAccount ? (
                              <button type="button" className="account-child-button" onClick={() => selectAccount(childAccount)}>
                                <span aria-hidden="true">└</span>
                                <span className="account-child-label">
                                  <strong>{childAccount.accountCode || '—'}</strong>
                                  {childAccount.accountNameAr || childAccount.accountNameEn || 'حساب فرعي'}
                                </span>
                              </button>
                            ) : (
                              <>
                                <span aria-hidden="true">└</span>
                                {getChildLabel(child)}
                              </>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
                <div className="account-details-actions">
                  <button type="button" className="account-edit-button" onClick={() => void openEditDialog(selectedAccount)}>تعديل الحساب</button>
                  <button type="button" className="account-deactivate-button">تعطيل الحساب</button>
                </div>
              </>
            ) : (
              <p className="accounts-message">اختر حساباً لعرض تفاصيله.</p>
            )}
          </section>
        </div>
      </section>

      {isCreateDialogOpen && (
        <div className="account-dialog-backdrop" role="presentation" onMouseDown={closeCreateDialog}>
          <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="create-account-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="account-dialog-header">
              <div>
                <span className="accounts-panel-label">الحسابات</span>
                <h2 id="create-account-title">إنشاء حساب جديد</h2>
              </div>
              <button className="account-dialog-close" type="button" aria-label="إغلاق" onClick={closeCreateDialog}>×</button>
            </div>

            {isMetadataLoading && <p className="accounts-message">جارٍ تحميل خيارات الحساب...</p>}
            {metadataError && <p className="accounts-message accounts-message-error" role="alert">{metadataError}</p>}
            {metadata && (
              <form className="account-create-form" onSubmit={handleCreateAccount}>
                <label>رمز الحساب<input required value={createForm.accountCode} onChange={(event) => setCreateForm({ ...createForm, accountCode: event.target.value })} /></label>
                <label>اسم الحساب بالعربية<input required value={createForm.accountNameAr} onChange={(event) => setCreateForm({ ...createForm, accountNameAr: event.target.value })} /></label>
                <label>اسم الحساب بالإنجليزية<input required dir="ltr" value={createForm.accountNameEn} onChange={(event) => setCreateForm({ ...createForm, accountNameEn: event.target.value })} /></label>
                <label>نوع الحساب<select required value={createForm.accountType} onChange={(event) => setCreateForm({ ...createForm, accountType: event.target.value })}>{metadata.accountTypes.map((type) => <option key={type.value} value={type.value}>{type.name}</option>)}</select></label>
                <label>الحساب الأب (اختياري)<select value={createForm.parentId} onChange={(event) => setCreateForm({ ...createForm, parentId: event.target.value })}><option value="">بدون حساب أب (حساب رئيسي)</option>{metadata.accounts.map((account) => <option key={account.id} value={account.id}>{account.code} - {account.name}</option>)}</select></label>
                <label>العملة<select required value={createForm.currencyCode} onChange={(event) => setCreateForm({ ...createForm, currencyCode: event.target.value })}>{metadata.currencies.map((currency) => <option key={currency.code} value={currency.code}>{currency.name} ({currency.code})</option>)}</select></label>
                <label className="account-postable-field"><input type="checkbox" checked={createForm.isPostable} onChange={(event) => setCreateForm({ ...createForm, isPostable: event.target.checked })} /> قابل للترحيل</label>
                {createError && <p className="accounts-message accounts-message-error" role="alert">{createError}</p>}
                <div className="account-dialog-actions"><button className="account-dialog-cancel" type="button" onClick={closeCreateDialog}>إلغاء</button><button className="accounts-create-button" type="submit" disabled={isCreating}>{isCreating ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}</button></div>
              </form>
            )}
          </section>
        </div>
      )}

      {isEditDialogOpen && (
        <div className="account-dialog-backdrop" role="presentation" onMouseDown={closeEditDialog}>
          <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-account-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="account-dialog-header">
              <div>
                <span className="accounts-panel-label">الحسابات</span>
                <h2 id="edit-account-title">تعديل الحساب</h2>
              </div>
              <button className="account-dialog-close" type="button" aria-label="إغلاق" onClick={closeEditDialog}>×</button>
            </div>

            {isMetadataLoading && <p className="accounts-message">جارٍ تحميل بيانات الحساب...</p>}
            {metadataError && <p className="accounts-message accounts-message-error" role="alert">{metadataError}</p>}
            {editForm && (
              <form className="account-create-form" onSubmit={handleEditAccount}>
                <label>اسم الحساب بالعربية<input required value={editForm.accountNameAr} onChange={(event) => setEditForm({ ...editForm, accountNameAr: event.target.value })} /></label>
                <label>اسم الحساب بالإنجليزية<input required dir="ltr" value={editForm.accountNameEn} onChange={(event) => setEditForm({ ...editForm, accountNameEn: event.target.value })} /></label>
                {editError && <p className="accounts-message accounts-message-error" role="alert">{editError}</p>}
                <div className="account-dialog-actions"><button className="account-dialog-cancel" type="button" onClick={closeEditDialog}>إلغاء</button><button className="accounts-create-button" type="submit" disabled={isEditing}>{isEditing ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</button></div>
              </form>
            )}
          </section>
        </div>
      )}
    </AppLayout>
  )
}

export default AccountsScreen