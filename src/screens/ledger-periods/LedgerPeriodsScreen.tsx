import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import AppLayout from '../../components/AppLayout'
import { authenticatedFetch } from '../../services/authService'
import '../accounts/AccountsScreen.css'
import './LedgerPeriodsScreen.css'

type LedgerPeriodsScreenProps = {
  userName?: string
  onLogout?: () => void
  onNavigationChange?: (navigation: string) => void
}

type LedgerPeriod = {
  id: string
  periodName: string
  startDate: string
  endDate: string
  isClosed: boolean
  createdAt: string
  createdBy: number
  updatedAt: string
  updatedBy: number
}

const ledgerPeriodsUrl = '/api/v1/ledger/periods'

function getTodayDate() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toIsoDateTime(dateValue: string) {
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

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('ar', { dateStyle: 'medium', timeZone: 'UTC' }).format(date)
}

function LedgerPeriodsScreen({ userName, onLogout, onNavigationChange }: LedgerPeriodsScreenProps) {
  const [ledgerPeriods, setLedgerPeriods] = useState<LedgerPeriod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createForm, setCreateForm] = useState({
    periodName: '',
    startDate: getTodayDate(),
    endDate: getTodayDate(),
  })

  const refreshLedgerPeriods = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await authenticatedFetch(ledgerPeriodsUrl, {
        headers: { Accept: 'application/json' },
      })

      if (!response.ok) {
        throw new Error(`تعذر تحميل الفترات المحاسبية (${response.status}).`)
      }

      const responseBody: unknown = await response.json()
      if (!Array.isArray(responseBody)) {
        throw new Error('تنسيق بيانات الفترات المحاسبية غير صالح.')
      }

      setLedgerPeriods(responseBody as LedgerPeriod[])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'تعذر تحميل الفترات المحاسبية.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshLedgerPeriods()
  }, [refreshLedgerPeriods])

  const openCreateDialog = () => {
    const today = getTodayDate()
    setCreateError('')
    setCreateForm({ periodName: '', startDate: today, endDate: today })
    setIsCreateDialogOpen(true)
  }

  const closeCreateDialog = () => {
    if (!isCreating) {
      setIsCreateDialogOpen(false)
    }
  }

  const handleCreateLedgerPeriod = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCreateError('')

    const today = getTodayDate()
    if (createForm.startDate < today || createForm.endDate < today) {
      setCreateError('يجب أن يكون تاريخ البداية والنهاية اليوم أو تاريخاً لاحقاً.')
      return
    }
    if (createForm.endDate < createForm.startDate) {
      setCreateError('يجب أن يكون تاريخ النهاية مساوياً لتاريخ البداية أو لاحقاً له.')
      return
    }

    setIsCreating(true)
    try {
      const response = await authenticatedFetch(ledgerPeriodsUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          periodName: createForm.periodName,
          startDate: toIsoDateTime(createForm.startDate),
          endDate: toIsoDateTime(createForm.endDate),
        }),
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(responseText || `تعذر إنشاء الفترة المحاسبية (${response.status}).`)
      }

      setIsCreateDialogOpen(false)
      await refreshLedgerPeriods()
    } catch (requestError) {
      setCreateError(requestError instanceof Error ? requestError.message : 'تعذر إنشاء الفترة المحاسبية.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AppLayout
      userName={userName}
      activeNavigation="الإعدادات"
      activeSubNavigation="ledgerPeriods"
      onNavigationChange={onNavigationChange}
      onLogout={onLogout}
    >
      <section className="ledger-periods-screen" aria-labelledby="ledger-periods-title">
        <header className="ledger-periods-header">
          <div>
            <span className="ledger-periods-eyebrow">الإعدادات</span>
            <h1 id="ledger-periods-title">الفترات المحاسبية</h1>
            <p>إدارة الفترات الزمنية المستخدمة في دفتر الأستاذ.</p>
          </div>
          <button className="accounts-create-button ledger-periods-create-button" type="button" onClick={openCreateDialog}>
            <span aria-hidden="true">+</span>
            إنشاء فترة محاسبية
          </button>
        </header>

        <section className="ledger-periods-panel" aria-labelledby="ledger-periods-table-title">
          <div className="ledger-periods-panel-heading">
            <div>
              <span className="ledger-periods-panel-label">دفتر الأستاذ</span>
              <h2 id="ledger-periods-table-title">الفترات المسجلة</h2>
            </div>
            <span className="ledger-periods-count">{ledgerPeriods.length} فترات</span>
          </div>

          {isLoading && <p className="ledger-periods-message">جارٍ تحميل الفترات المحاسبية...</p>}
          {!isLoading && error && <p className="ledger-periods-message ledger-periods-message-error" role="alert">{error}</p>}
          {!isLoading && !error && ledgerPeriods.length === 0 && (
            <p className="ledger-periods-message">لا توجد فترات محاسبية مسجلة.</p>
          )}
          {!isLoading && !error && ledgerPeriods.length > 0 && (
            <div className="ledger-periods-table-wrapper">
              <table className="ledger-periods-table">
                <thead>
                  <tr>
                    <th scope="col">اسم الفترة</th>
                    <th scope="col">تاريخ البداية</th>
                    <th scope="col">تاريخ النهاية</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerPeriods.map((ledgerPeriod) => (
                    <tr key={ledgerPeriod.id}>
                      <td>{ledgerPeriod.periodName}</td>
                      <td>{formatDate(ledgerPeriod.startDate)}</td>
                      <td>{formatDate(ledgerPeriod.endDate)}</td>
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
            aria-labelledby="create-ledger-period-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="account-dialog-header">
              <div>
                <span className="ledger-periods-panel-label">دفتر الأستاذ</span>
                <h2 id="create-ledger-period-title">إنشاء فترة محاسبية جديدة</h2>
              </div>
              <button className="account-dialog-close" type="button" aria-label="إغلاق" onClick={closeCreateDialog}>×</button>
            </div>

            <form className="account-create-form" onSubmit={handleCreateLedgerPeriod}>
              <label className="ledger-periods-name-field">
                اسم الفترة
                <input
                  required
                  type="text"
                  value={createForm.periodName}
                  onChange={(event) => setCreateForm({ ...createForm, periodName: event.target.value })}
                />
              </label>
              <label>
                تاريخ البداية
                <input
                  required
                  type="date"
                  min={getTodayDate()}
                  value={createForm.startDate}
                  onChange={(event) => setCreateForm({
                    ...createForm,
                    startDate: event.target.value,
                    endDate: createForm.endDate < event.target.value ? event.target.value : createForm.endDate,
                  })}
                />
              </label>
              <label>
                تاريخ النهاية
                <input
                  required
                  type="date"
                  min={createForm.startDate || getTodayDate()}
                  value={createForm.endDate}
                  onChange={(event) => setCreateForm({ ...createForm, endDate: event.target.value })}
                />
              </label>
              {createError && <p className="accounts-message accounts-message-error ledger-periods-form-error" role="alert">{createError}</p>}
              <div className="account-dialog-actions">
                <button className="account-dialog-cancel" type="button" onClick={closeCreateDialog}>إلغاء</button>
                <button className="accounts-create-button" type="submit" disabled={isCreating}>
                  {isCreating ? 'جارٍ الإنشاء...' : 'إنشاء الفترة'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AppLayout>
  )
}

export default LedgerPeriodsScreen