import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import AppLayout from '../../components/AppLayout'
import { authenticatedFetch } from '../../services/authService'
import '../accounts/AccountsScreen.css'
import './ExchangeRatesScreen.css'

type ExchangeRatesScreenProps = {
  userName?: string
  onLogout?: () => void
  onNavigationChange?: (navigation: string) => void
}

type ExchangeRate = {
  id: string
  fromCurrency: string
  toCurrency: string
  rate: number
  effectiveDate: string
  isActive: boolean
  baseCurrency: string
  isHistory: boolean | null
  fromDate: string | null
  toDate: string | null
}

type Currency = {
  code: string
  nameEn: string
  nameAr: string
}

const exchangeRatesUrl = '/api/v1/Currencies/exchange-rates'
const currenciesUrl = '/api/v1/Currencies/All'

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getEffectiveDateTime(dateValue: string) {
  const currentTime = new Date()
  const selectedDate = new Date(`${dateValue}T00:00:00`)
  selectedDate.setHours(
    currentTime.getHours(),
    currentTime.getMinutes(),
    currentTime.getSeconds(),
    currentTime.getMilliseconds(),
  )

  return selectedDate.toISOString()
}

function formatEffectiveDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ar', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function formatOptionalDate(value: string | null) {
  return value ? formatEffectiveDate(value) : 'غير محدد'
}

function ExchangeRatesScreen({ userName, onLogout, onNavigationChange }: ExchangeRatesScreenProps) {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCurrenciesLoading, setIsCurrenciesLoading] = useState(true)
  const [currenciesError, setCurrenciesError] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [historyCurrency, setHistoryCurrency] = useState('')
  const [historyRates, setHistoryRates] = useState<ExchangeRate[]>([])
  const [isHistoryLoading, setIsHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState('')
  const [createForm, setCreateForm] = useState({
    fromCurrencyCode: '',
    rate: '',
    effectiveDate: getTodayDate(),
  })

  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        const response = await authenticatedFetch(exchangeRatesUrl, {
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
          throw new Error(`تعذر تحميل أسعار الصرف (${response.status}).`)
        }

        const responseBody: unknown = await response.json()
        if (!Array.isArray(responseBody)) {
          throw new Error('تنسيق بيانات أسعار الصرف غير صالح.')
        }

        setExchangeRates(responseBody as ExchangeRate[])
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل أسعار الصرف.')
      } finally {
        setIsLoading(false)
      }
    }

    void loadExchangeRates()
  }, [])

  useEffect(() => {
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
        setCurrenciesError(requestError instanceof Error ? requestError.message : 'تعذر تحميل العملات.')
      } finally {
        setIsCurrenciesLoading(false)
      }
    }

    void loadCurrencies()
  }, [])

  const refreshExchangeRates = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await authenticatedFetch(exchangeRatesUrl, {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`تعذر تحميل أسعار الصرف (${response.status}).`)
      }

      const responseBody: unknown = await response.json()
      if (!Array.isArray(responseBody)) {
        throw new Error('تنسيق بيانات أسعار الصرف غير صالح.')
      }

      setExchangeRates(responseBody as ExchangeRate[])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل أسعار الصرف.')
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setCreateError('')
    setCreateForm({
      fromCurrencyCode: currencies[0]?.code || '',
      rate: '',
      effectiveDate: getTodayDate(),
    })
    setIsCreateDialogOpen(true)
  }

  const closeCreateDialog = () => {
    if (!isCreating) {
      setIsCreateDialogOpen(false)
    }
  }

  const handleCreateExchangeRate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError('')
    setIsCreating(true)

    try {
      const response = await authenticatedFetch(exchangeRatesUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromCurrencyCode: createForm.fromCurrencyCode,
          toCurrencyCode: 'string',
          rate: Number(createForm.rate),
          effectiveDate: getEffectiveDateTime(createForm.effectiveDate),
        }),
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(responseText || `تعذر إنشاء سعر الصرف (${response.status}).`)
      }

      setIsCreateDialogOpen(false)
      await refreshExchangeRates()
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : 'تعذر إنشاء سعر الصرف.')
    } finally {
      setIsCreating(false)
    }
  }

  const closeHistoryDialog = () => {
    if (!isHistoryLoading) {
      setHistoryCurrency('')
    }
  }

  const handleShowHistory = async (fromCurrency: string) => {
    setHistoryCurrency(fromCurrency)
    setHistoryRates([])
    setHistoryError('')
    setIsHistoryLoading(true)

    try {
      const historyUrl = `${exchangeRatesUrl}?FromCurrency=${encodeURIComponent(fromCurrency)}&IsHistory=true`
      const response = await authenticatedFetch(historyUrl, {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`تعذر تحميل سجل ${fromCurrency} (${response.status}).`)
      }

      const responseBody: unknown = await response.json()
      if (!Array.isArray(responseBody)) {
        throw new Error('تنسيق سجل أسعار الصرف غير صالح.')
      }

      setHistoryRates(responseBody as ExchangeRate[])
    } catch (requestError) {
      setHistoryError(requestError instanceof Error ? requestError.message : 'تعذر تحميل سجل أسعار الصرف.')
    } finally {
      setIsHistoryLoading(false)
    }
  }

  return (
    <AppLayout
      userName={userName}
      activeNavigation="الإعدادات"
      activeSubNavigation="exchangeRates"
      onNavigationChange={onNavigationChange}
      onLogout={onLogout}
    >
      <section className="exchange-rates-screen" aria-labelledby="exchange-rates-title">
        <header className="exchange-rates-header">
          <div>
            <span className="exchange-rates-eyebrow">الإعدادات</span>
            <h1 id="exchange-rates-title">أسعار الصرف</h1>
            <p>إدارة أسعار صرف العملات المستخدمة في النظام المالي.</p>
          </div>
          <button className="accounts-create-button exchange-rates-create-button" type="button" onClick={openCreateDialog}>
            <span aria-hidden="true">+</span>
            إنشاء سعر صرف
          </button>
        </header>

        <section className="exchange-rates-panel" aria-labelledby="exchange-rates-table-title">
          <div className="exchange-rates-panel-heading">
            <div>
              <span className="exchange-rates-panel-label">أسعار الصرف</span>
              <h2 id="exchange-rates-table-title">أسعار الصرف المسجلة</h2>
            </div>
            <span className="exchange-rates-count">{exchangeRates.length} اسعار</span>
          </div>

          {isLoading && <p className="exchange-rates-message">جارٍ تحميل أسعار الصرف...</p>}
          {!isLoading && error && <p className="exchange-rates-message exchange-rates-message-error" role="alert">{error}</p>}
          {!isLoading && !error && exchangeRates.length === 0 && (
            <p className="exchange-rates-message">لا توجد أسعار صرف مسجلة.</p>
          )}
          {!isLoading && !error && exchangeRates.length > 0 && (
            <div className="exchange-rates-table-wrapper">
              <table className="exchange-rates-table">
                <thead>
                  <tr>
                    <th scope="col">من العملة</th>
                    <th scope="col">إلى العملة</th>
                    <th scope="col">سعر الصرف</th>
                    <th scope="col">تاريخ التفعيل</th>
                    <th scope="col">من تاريخ</th>
                    <th scope="col">إلى تاريخ</th>
                    <th scope="col">الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {exchangeRates.map((exchangeRate) => (
                    <tr key={exchangeRate.id}>
                      <td>{exchangeRate.fromCurrency}</td>
                      <td>{exchangeRate.toCurrency}</td>
                      <td>{exchangeRate.rate}</td>
                      <td>{formatEffectiveDate(exchangeRate.effectiveDate)}</td>
                      <td>{formatOptionalDate(exchangeRate.fromDate)}</td>
                      <td>{formatOptionalDate(exchangeRate.toDate)}</td>
                      <td>
                        <button
                          className="exchange-rates-history-button"
                          type="button"
                          onClick={() => void handleShowHistory(exchangeRate.fromCurrency)}
                        >
                          عرض السجل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>

      {isCreateDialogOpen && (
        <div className="account-dialog-backdrop" role="presentation" onMouseDown={closeCreateDialog}>
          <section
            className="account-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-exchange-rate-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="account-dialog-header">
              <div>
                <span className="exchange-rates-panel-label">أسعار الصرف</span>
                <h2 id="create-exchange-rate-title">إنشاء سعر صرف جديد</h2>
              </div>
              <button className="account-dialog-close" type="button" aria-label="إغلاق" onClick={closeCreateDialog}>×</button>
            </div>

            <form className="account-create-form" onSubmit={handleCreateExchangeRate}>
              <label>
                العملة
                <select
                  required
                  value={createForm.fromCurrencyCode}
                  disabled={isCurrenciesLoading || currencies.length === 0}
                  onChange={(event) => setCreateForm({ ...createForm, fromCurrencyCode: event.target.value })}
                >
                  <option value="">
                    {isCurrenciesLoading ? 'جارٍ تحميل العملات...' : 'اختر العملة'}
                  </option>
                  {currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.nameAr || currency.nameEn}
                    </option>
                  ))}
                </select>
              </label>
              {currenciesError && <p className="accounts-message accounts-message-error" role="alert">{currenciesError}</p>}
              <label>
                سعر الصرف
                <input
                  required
                  type="number"
                  min="0"
                  step="any"
                  value={createForm.rate}
                  onChange={(event) => setCreateForm({ ...createForm, rate: event.target.value })}
                />
              </label>
              <label>
                تاريخ التفعيل
                <input
                  required
                  type="date"
                  min={getTodayDate()}
                  value={createForm.effectiveDate}
                  onChange={(event) => setCreateForm({ ...createForm, effectiveDate: event.target.value })}
                />
              </label>
              {createError && <p className="accounts-message accounts-message-error" role="alert">{createError}</p>}
              <div className="account-dialog-actions">
                <button className="account-dialog-cancel" type="button" onClick={closeCreateDialog}>إلغاء</button>
                <button className="accounts-create-button" type="submit" disabled={isCreating || isCurrenciesLoading || currencies.length === 0}>
                  {isCreating ? 'جارٍ الإنشاء...' : 'إنشاء سعر الصرف'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {historyCurrency && (
        <div className="account-dialog-backdrop" role="presentation" onMouseDown={closeHistoryDialog}>
          <section
            className="account-dialog exchange-rates-history-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="exchange-rates-history-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="account-dialog-header">
              <div>
                <span className="exchange-rates-panel-label">سجل التغييرات</span>
                <h2 id="exchange-rates-history-title">سجل أسعار {historyCurrency}</h2>
              </div>
              <button className="account-dialog-close" type="button" aria-label="إغلاق" onClick={closeHistoryDialog}>×</button>
            </div>

            {isHistoryLoading && <p className="exchange-rates-message">جارٍ تحميل سجل أسعار الصرف...</p>}
            {!isHistoryLoading && historyError && (
              <p className="exchange-rates-message exchange-rates-message-error" role="alert">{historyError}</p>
            )}
            {!isHistoryLoading && !historyError && historyRates.length === 0 && (
              <p className="exchange-rates-message">لا توجد تغييرات مسجلة لهذه العملة.</p>
            )}
            {!isHistoryLoading && !historyError && historyRates.length > 0 && (
              <div className="exchange-rates-history-table-wrapper">
                <table className="exchange-rates-table exchange-rates-history-table">
                  <thead>
                    <tr>
                      <th scope="col">العملة من</th>
                      <th scope="col">العملة إلى</th>
                      <th scope="col">سعر الصرف</th>
                      <th scope="col">تاريخ التفعيل</th>
                      <th scope="col">من تاريخ</th>
                      <th scope="col">إلى تاريخ</th>
                      <th scope="col">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRates.map((historyRate) => (
                      <tr key={historyRate.id}>
                        <td>{historyRate.fromCurrency}</td>
                        <td>{historyRate.toCurrency}</td>
                        <td>{historyRate.rate}</td>
                        <td>{formatEffectiveDate(historyRate.effectiveDate)}</td>
                        <td>{formatOptionalDate(historyRate.fromDate)}</td>
                        <td>{formatOptionalDate(historyRate.toDate)}</td>
                        <td>
                          <span className={`exchange-rates-status${historyRate.isActive ? ' exchange-rates-status-active' : ''}`}>
                            {historyRate.isActive ? 'نشط' : 'سابق'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </AppLayout>
  )
}

export default ExchangeRatesScreen