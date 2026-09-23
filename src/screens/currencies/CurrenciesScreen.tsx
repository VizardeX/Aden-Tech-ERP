import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import AppLayout from '../../components/AppLayout'
import { authenticatedFetch } from '../../services/authService'
import '../accounts/AccountsScreen.css'
import './CurrenciesScreen.css'

type CurrenciesScreenProps = {
  userName?: string
  onLogout?: () => void
  onNavigationChange?: (navigation: string) => void
}

type Currency = {
  code: string
  nameEn: string
  nameAr: string
  symbol: string
  decimalPlaces: number
  isActive: boolean
}

const currenciesUrl = '/api/v1/Currencies/All'
const createCurrencyUrl = '/api/v1/Currencies/New'
const updateCurrencyUrl = '/api/v1/Currencies/Update'


type CurrencyForm = {
  code: string
  nameEn: string
  nameAr: string
  symbol: string
  decimalPlaces: string
}

function CurrenciesScreen({ userName, onLogout, onNavigationChange }: CurrenciesScreenProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState('')
  const [isCurrencyListOpen, setIsCurrencyListOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState('')
  const [editForm, setEditForm] = useState<CurrencyForm | null>(null)
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  const [deactivateError, setDeactivateError] = useState('')
  const [createForm, setCreateForm] = useState<CurrencyForm>({
    code: '',
    nameEn: '',
    nameAr: '',
    symbol: '',
    decimalPlaces: '2',
  })

  const loadCurrencies = async () => {
    try {
      const response = await authenticatedFetch(currenciesUrl, {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`تعذر تحميل العملات (${response.status}).`)
      }

      const responseBody: unknown = await response.json()
      if (!Array.isArray(responseBody)) {
        throw new Error('تنسيق بيانات العملات غير صالح.')
      }

      setCurrencies(responseBody as Currency[])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل العملات.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadCurrencies()
  }, [])

  const filteredCurrencies = useMemo(() => {
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase()
    if (!normalizedSearchTerm) {
      return currencies
    }

    return currencies.filter((currency) => [
      currency.code,
      currency.symbol,
      currency.nameAr,
      currency.nameEn,
      String(currency.decimalPlaces),
    ].some((value) => value.toLocaleLowerCase().includes(normalizedSearchTerm)))
  }, [currencies, searchTerm])

  const selectedCurrency = currencies.find((currency) => currency.code === selectedCurrencyCode)

  const selectCurrency = (currency: Currency) => {
    setSelectedCurrencyCode(currency.code)
    setSearchTerm(`${currency.code} - ${currency.nameAr || currency.nameEn}`)
    setIsCurrencyListOpen(false)
  }

  const refreshCurrencies = async () => {
    setIsLoading(true)
    await loadCurrencies()
  }

  const openCreateDialog = () => {
    setCreateError('')
    setIsCreateDialogOpen(true)
  }

  const closeCreateDialog = () => {
    if (!isCreating) {
      setIsCreateDialogOpen(false)
    }
  }

  const handleCreateCurrency = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError('')
    setIsCreating(true)

    try {
      const response = await authenticatedFetch(createCurrencyUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: createForm.code.trim(),
          nameEn: createForm.nameEn.trim(),
          nameAr: createForm.nameAr.trim(),
          symbol: createForm.symbol.trim(),
          decimalPlaces: Number(createForm.decimalPlaces),
        }),
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(responseText || `تعذر إنشاء العملة (${response.status}).`)
      }

      setIsCreateDialogOpen(false)
      setCreateForm({ code: '', nameEn: '', nameAr: '', symbol: '', decimalPlaces: '2' })
      setSelectedCurrencyCode('')
      setSearchTerm('')
      setActionMessage('تم إنشاء العملة بنجاح.')
      await refreshCurrencies()
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : 'تعذر إنشاء العملة.')
    } finally {
      setIsCreating(false)
    }
  }

  const openEditDialog = () => {
    if (!selectedCurrency) {
      return
    }

    setEditError('')
    setEditForm({
      code: selectedCurrency.code,
      nameEn: selectedCurrency.nameEn,
      nameAr: selectedCurrency.nameAr,
      symbol: selectedCurrency.symbol,
      decimalPlaces: String(selectedCurrency.decimalPlaces),
    })
    setIsEditDialogOpen(true)
  }

  const closeEditDialog = () => {
    if (!isEditing) {
      setIsEditDialogOpen(false)
    }
  }

  const updateCurrency = async (currency: CurrencyForm, isActive: boolean) => {
    const response = await authenticatedFetch(`${updateCurrencyUrl}?code=${encodeURIComponent(currency.code)}`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: currency.code,
        nameEn: currency.nameEn.trim(),
        nameAr: currency.nameAr.trim(),
        symbol: currency.symbol.trim(),
        decimalPlaces: Number(currency.decimalPlaces),
        isActive,
      }),
    })

    if (!response.ok) {
      const responseText = await response.text()
      throw new Error(responseText || `تعذر تحديث العملة (${response.status}).`)
    }
  }

  const handleEditCurrency = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editForm) {
      return
    }

    setEditError('')
    setIsEditing(true)
    try {
      await updateCurrency(editForm, true)
      setIsEditDialogOpen(false)
      setActionMessage('تم تعديل العملة بنجاح.')
      await refreshCurrencies()
    } catch (requestError) {
      setEditError(requestError instanceof Error ? requestError.message : 'تعذر تعديل العملة.')
    } finally {
      setIsEditing(false)
    }
  }

  const openDeactivateDialog = () => {
    setDeactivateError('')
    setIsDeactivateDialogOpen(true)
  }

  const closeDeactivateDialog = () => {
    if (!isDeactivating) {
      setIsDeactivateDialogOpen(false)
    }
  }

  const handleDeactivateCurrency = async () => {
    if (!selectedCurrency) {
      return
    }

    setDeactivateError('')
    setIsDeactivating(true)
    try {
      await updateCurrency({
        code: selectedCurrency.code,
        nameEn: selectedCurrency.nameEn,
        nameAr: selectedCurrency.nameAr,
        symbol: selectedCurrency.symbol,
        decimalPlaces: String(selectedCurrency.decimalPlaces),
      }, false)
      setIsDeactivateDialogOpen(false)
      setActionMessage('تم تعطيل العملة بنجاح.')
      await refreshCurrencies()
    } catch (requestError) {
      setDeactivateError(requestError instanceof Error ? requestError.message : 'تعذر تعطيل العملة.')
    } finally {
      setIsDeactivating(false)
    }
  }

  return (
    <AppLayout
      userName={userName}
      activeNavigation="الإعدادات"
      activeSubNavigation="currencies"
      onNavigationChange={onNavigationChange}
      onLogout={onLogout}
    >
      <section className="accounts-screen currencies-screen" aria-labelledby="currencies-title">
        <header className="accounts-header currencies-heading">
          <div>
            <span className="accounts-eyebrow">الإعدادات</span>
            <h1 id="currencies-title">العملات</h1>
            <p>إدارة العملات المستخدمة في النظام المالي.</p>
          </div>
          <button
            className="accounts-create-button currencies-create-button"
            type="button"
            onClick={openCreateDialog}
          >
            <span aria-hidden="true">+</span>
            إنشاء عملة
          </button>
        </header>

        <div className="accounts-layout">
          <section className="accounts-tree-panel" aria-labelledby="currency-tree-title">
            <div className="accounts-panel-heading">
              <div>
                <span className="accounts-panel-label">العملات</span>
                <h2 id="currency-tree-title">قائمة العملات</h2>
              </div>
              <span className="accounts-count">{currencies.length} عملة</span>
            </div>

            {isLoading && <p className="accounts-message">جارٍ تحميل العملات...</p>}
            {!isLoading && error && <p className="accounts-message accounts-message-error" role="alert">{error}</p>}
            {!isLoading && !error && currencies.length === 0 && <p className="accounts-message">لا توجد عملات لعرضها.</p>}
            {!isLoading && !error && currencies.length > 0 && (
              <div className="accounts-combobox-field">
                <label className="accounts-select-label" htmlFor="currency-combobox">
                  ابحث عن عملة
                  <input
                    id="currency-combobox"
                    type="text"
                    role="combobox"
                    aria-expanded={isCurrencyListOpen}
                    aria-controls="currency-options"
                    aria-autocomplete="list"
                    placeholder="اكتب رمز العملة أو اسمها..."
                    value={searchTerm}
                    onFocus={() => setIsCurrencyListOpen(true)}
                    onChange={(event) => {
                      setSearchTerm(event.target.value)
                      setIsCurrencyListOpen(true)
                    }}
                  />
                </label>
                {isCurrencyListOpen && (
                  <div className="accounts-combobox-options" id="currency-options" role="listbox">
                    {filteredCurrencies.length > 0 ? filteredCurrencies.map((currency) => (
                      <button
                        className={`accounts-combobox-option${currency.code === selectedCurrencyCode ? ' accounts-combobox-option-selected' : ''}`}
                        type="button"
                        role="option"
                        aria-selected={currency.code === selectedCurrencyCode}
                        key={currency.code}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => selectCurrency(currency)}
                      >
                        <span>{currency.code}</span>
                        <strong>{currency.nameAr || currency.nameEn}</strong>
                      </button>
                    )) : (
                      <p className="accounts-combobox-empty">لا توجد نتائج مطابقة.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="account-details-panel" aria-labelledby="currency-details-title">
            <div className="accounts-panel-heading">
              <div>
                <span className="accounts-panel-label">تفاصيل العملة</span>
                <h2 id="currency-details-title">بيانات العملة المحددة</h2>
              </div>
              <span className="account-details-icon" aria-hidden="true">◈</span>
            </div>

            {selectedCurrency ? (
              <>
                <div className="account-name-block">
                  <span>{selectedCurrency.code}</span>
                  <h3>{selectedCurrency.nameAr || selectedCurrency.nameEn}</h3>
                </div>
                <dl className="account-details-list">
                  <div><dt>اسم العملة بالعربية</dt><dd>{selectedCurrency.nameAr || 'غير متوفر'}</dd></div>
                  <div><dt>اسم العملة بالإنجليزية</dt><dd>{selectedCurrency.nameEn || 'غير متوفر'}</dd></div>
                  <div><dt>رمز العملة</dt><dd>{selectedCurrency.code}</dd></div>
                  <div><dt>الرمز المختصر</dt><dd>{selectedCurrency.symbol || 'غير متوفر'}</dd></div>
                  <div><dt>المنازل العشرية</dt><dd>{selectedCurrency.decimalPlaces}</dd></div>
                </dl>
                <div className="account-details-actions">
                  <button type="button" className="account-edit-button" onClick={openEditDialog}>تعديل العملة</button>
                  <button type="button" className="account-deactivate-button" onClick={openDeactivateDialog}>تعطيل العملة</button>
                </div>
              </>
            ) : (
              <p className="accounts-message">اختر عملة لعرض تفاصيلها.</p>
            )}
          </section>
        </div>
        {actionMessage && <p className="currencies-action-message" role="status">{actionMessage}</p>}
      </section>

      {isCreateDialogOpen && (
        <div className="account-dialog-backdrop" role="presentation" onMouseDown={closeCreateDialog}>
          <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="create-currency-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="account-dialog-header">
              <div>
                <span className="accounts-panel-label">العملات</span>
                <h2 id="create-currency-title">إنشاء عملة جديدة</h2>
              </div>
              <button className="account-dialog-close" type="button" aria-label="إغلاق" onClick={closeCreateDialog}>×</button>
            </div>

            <form className="account-create-form" onSubmit={handleCreateCurrency}>
              <label>رمز العملة<input required dir="ltr" value={createForm.code} onChange={(event) => setCreateForm({ ...createForm, code: event.target.value })} /></label>
              <label>اسم العملة بالعربية<input required value={createForm.nameAr} onChange={(event) => setCreateForm({ ...createForm, nameAr: event.target.value })} /></label>
              <label>اسم العملة بالإنجليزية<input required dir="ltr" value={createForm.nameEn} onChange={(event) => setCreateForm({ ...createForm, nameEn: event.target.value })} /></label>
              <label>الرمز المختصر<input required dir="ltr" value={createForm.symbol} onChange={(event) => setCreateForm({ ...createForm, symbol: event.target.value })} /></label>
              <label>المنازل العشرية<input required type="number" min="0" step="1" value={createForm.decimalPlaces} onChange={(event) => setCreateForm({ ...createForm, decimalPlaces: event.target.value })} /></label>
              {createError && <p className="accounts-message accounts-message-error" role="alert">{createError}</p>}
              <div className="account-dialog-actions">
                <button className="account-dialog-cancel" type="button" onClick={closeCreateDialog}>إلغاء</button>
                <button className="accounts-create-button" type="submit" disabled={isCreating}>{isCreating ? 'جارٍ الإنشاء...' : 'إنشاء العملة'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isEditDialogOpen && editForm && (
        <div className="account-dialog-backdrop" role="presentation" onMouseDown={closeEditDialog}>
          <section className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-currency-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="account-dialog-header">
              <div>
                <span className="accounts-panel-label">العملات</span>
                <h2 id="edit-currency-title">تعديل العملة</h2>
              </div>
              <button className="account-dialog-close" type="button" aria-label="إغلاق" onClick={closeEditDialog}>×</button>
            </div>

            <form className="account-create-form" onSubmit={handleEditCurrency}>
              <label>رمز العملة<input className="currency-read-only-field" required readOnly dir="ltr" value={editForm.code} /></label>
              <label>اسم العملة بالعربية<input required value={editForm.nameAr} onChange={(event) => setEditForm({ ...editForm, nameAr: event.target.value })} /></label>
              <label>اسم العملة بالإنجليزية<input required dir="ltr" value={editForm.nameEn} onChange={(event) => setEditForm({ ...editForm, nameEn: event.target.value })} /></label>
              <label>الرمز المختصر<input required dir="ltr" value={editForm.symbol} onChange={(event) => setEditForm({ ...editForm, symbol: event.target.value })} /></label>
              <label>المنازل العشرية<input required type="number" min="0" step="1" value={editForm.decimalPlaces} onChange={(event) => setEditForm({ ...editForm, decimalPlaces: event.target.value })} /></label>
              {editError && <p className="accounts-message accounts-message-error" role="alert">{editError}</p>}
              <div className="account-dialog-actions">
                <button className="account-dialog-cancel" type="button" onClick={closeEditDialog}>إلغاء</button>
                <button className="accounts-create-button" type="submit" disabled={isEditing}>{isEditing ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {isDeactivateDialogOpen && selectedCurrency && (
        <div className="account-dialog-backdrop" role="presentation" onMouseDown={closeDeactivateDialog}>
          <section className="account-dialog account-confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="deactivate-currency-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="account-dialog-header">
              <div>
                <span className="accounts-panel-label">تأكيد الإجراء</span>
                <h2 id="deactivate-currency-title">تعطيل العملة</h2>
              </div>
              <button className="account-dialog-close" type="button" aria-label="إغلاق" onClick={closeDeactivateDialog}>×</button>
            </div>
            <p className="account-confirmation-message">هل أنت متأكد من تعطيل العملة «{selectedCurrency.nameAr || selectedCurrency.nameEn}»؟</p>
            {deactivateError && <p className="accounts-message accounts-message-error" role="alert">{deactivateError}</p>}
            <div className="account-dialog-actions">
              <button className="account-dialog-cancel" type="button" onClick={closeDeactivateDialog}>إلغاء</button>
              <button className="account-deactivate-confirm-button" type="button" onClick={() => void handleDeactivateCurrency()} disabled={isDeactivating}>
                {isDeactivating ? 'جارٍ التعطيل...' : 'تأكيد التعطيل'}
              </button>
            </div>
          </section>
        </div>
      )}
    </AppLayout>
  )
}

export default CurrenciesScreen