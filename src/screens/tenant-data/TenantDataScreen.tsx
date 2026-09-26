import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import AppLayout from '../../components/AppLayout'
import { authenticatedFetch } from '../../services/authService'
import '../accounts/AccountsScreen.css'
import './TenantDataScreen.css'

type TenantDataScreenProps = {
  userName?: string
  onLogout?: () => void
  onNavigationChange?: (navigation: string) => void
}

type TenantFeatures = {
  baseCurrency: string
  maxTreeDepth: number
  maxCurrencies: number
  allowCustoms: boolean
  maxWarehouses: number
}

type Currency = {
  code: string
  nameEn: string
  nameAr: string
}

const tenantFeaturesUrl = '/api/v1/Tenant/Features'
const baseCurrencyUrl = '/api/v1/Tenant/base-currency'
const currenciesUrl = '/api/v1/Currencies/All'

function isTenantFeatures(value: unknown): value is TenantFeatures {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }

  const features = value as Record<string, unknown>
  return typeof features.baseCurrency === 'string'
    && typeof features.maxTreeDepth === 'number'
    && typeof features.maxCurrencies === 'number'
    && typeof features.allowCustoms === 'boolean'
    && typeof features.maxWarehouses === 'number'
}

function TenantDataScreen({ userName, onLogout, onNavigationChange }: TenantDataScreenProps) {
  const [tenantFeatures, setTenantFeatures] = useState<TenantFeatures | null>(null)
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [newBaseCurrency, setNewBaseCurrency] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCurrenciesLoading, setIsCurrenciesLoading] = useState(true)
  const [currenciesError, setCurrenciesError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const loadTenantFeatures = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await authenticatedFetch(tenantFeaturesUrl, {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`تعذر تحميل بيانات المستأجر (${response.status}).`)
      }

      const responseBody: unknown = await response.json()
      if (!isTenantFeatures(responseBody)) {
        throw new Error('تنسيق بيانات المستأجر غير صالح.')
      }

      setTenantFeatures(responseBody)
      setNewBaseCurrency(responseBody.baseCurrency.toUpperCase())
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل بيانات المستأجر.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadTenantFeatures()
  }, [loadTenantFeatures])

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

  const handleBaseCurrencySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveError('')
    setSaveMessage('')
    setIsSaving(true)

    const normalizedCurrency = newBaseCurrency.trim().toLowerCase()
    try {
      const response = await authenticatedFetch(baseCurrencyUrl, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newBaseCurrency: normalizedCurrency }),
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(responseText || `تعذر تحديث العملة الأساسية (${response.status}).`)
      }

      setTenantFeatures((currentFeatures) => currentFeatures
        ? { ...currentFeatures, baseCurrency: normalizedCurrency.toUpperCase() }
        : currentFeatures)
      setNewBaseCurrency(normalizedCurrency.toUpperCase())
      setSaveMessage('تم تحديث العملة الأساسية بنجاح.')
    } catch (requestError) {
      setSaveError(requestError instanceof Error ? requestError.message : 'تعذر تحديث العملة الأساسية.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppLayout
      userName={userName}
      activeNavigation="الإعدادات"
      activeSubNavigation="tenantData"
      onNavigationChange={onNavigationChange}
      onLogout={onLogout}
    >
      <section className="tenant-data-screen" aria-labelledby="tenant-data-title">
        <header className="tenant-data-header">
          <div>
            <span className="tenant-data-eyebrow">الإعدادات</span>
            <h1 id="tenant-data-title">بيانات المستأجر</h1>
            <p>عرض حدود وخصائص المنشأة وتعديل العملة الأساسية.</p>
          </div>
        </header>

        {isLoading && <p className="tenant-data-state">جارٍ تحميل بيانات المستأجر...</p>}
        {!isLoading && error && (
          <div className="tenant-data-state tenant-data-state-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => void loadTenantFeatures()}>إعادة المحاولة</button>
          </div>
        )}
        {!isLoading && !error && tenantFeatures && (
          <>
            <section className="tenant-data-overview" aria-label="خصائص المستأجر">
              <article className="tenant-data-metric tenant-data-metric-currency">
                <span>العملة الأساسية</span>
                <strong dir="ltr">{tenantFeatures.baseCurrency}</strong>
              </article>
              <article className="tenant-data-metric">
                <span>أقصى عمق لشجرة الحسابات</span>
                <strong>{tenantFeatures.maxTreeDepth}</strong>
              </article>
              <article className="tenant-data-metric">
                <span>الحد الأقصى للعملات</span>
                <strong>{tenantFeatures.maxCurrencies}</strong>
              </article>
              <article className="tenant-data-metric">
                <span>الاعدادات المخصصة</span>
                <strong>{tenantFeatures.allowCustoms ? 'مسموح' : 'غير مسموح'}</strong>
              </article>
              <article className="tenant-data-metric">
                <span>الحد الأقصى للمستودعات</span>
                <strong>{tenantFeatures.maxWarehouses}</strong>
              </article>
            </section>

            <section className="tenant-data-currency-panel" aria-labelledby="tenant-currency-title">
              <div className="tenant-data-panel-heading">
                <div>
                  <span className="tenant-data-panel-label">إعدادات العملة</span>
                  <h2 id="tenant-currency-title">تغيير العملة الأساسية</h2>
                </div>
                <span className="tenant-data-current-currency" dir="ltr">{tenantFeatures.baseCurrency}</span>
              </div>

              <form className="tenant-data-currency-form" onSubmit={handleBaseCurrencySubmit}>
                <label>
                  العملة الجديدة
                  <select
                    required
                    disabled={isCurrenciesLoading || currencies.length === 0}
                    value={newBaseCurrency}
                    onChange={(event) => setNewBaseCurrency(event.target.value)}
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
                {currenciesError && <p className="tenant-data-form-error" role="alert">{currenciesError}</p>}
                {saveError && <p className="tenant-data-form-error" role="alert">{saveError}</p>}
                {saveMessage && <p className="tenant-data-form-success" role="status">{saveMessage}</p>}
                <div className="tenant-data-form-actions">
                  <button
                    className="accounts-create-button"
                    type="submit"
                    disabled={isSaving || isCurrenciesLoading || currencies.length === 0 || !newBaseCurrency || newBaseCurrency.toUpperCase() === tenantFeatures.baseCurrency.toUpperCase()}
                  >
                    {isSaving ? 'جارٍ الحفظ...' : 'حفظ العملة الأساسية'}
                  </button>
                </div>
              </form>
            </section>
          </>
        )}
      </section>
    </AppLayout>
  )
}

export default TenantDataScreen