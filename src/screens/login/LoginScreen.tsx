import { useEffect, useState } from 'react'
import mainLogo from '../../assets/MainLogo.png'
import './LoginScreen.css'
import { useTranslation } from 'react-i18next'

type LoginScreenProps = {
  language: 'en' | 'ar'
  onSwitchLanguage: () => void
}

function LoginScreen({ language, onSwitchLanguage }: LoginScreenProps) {
  const { t, i18n } = useTranslation()
  const isArabic = language === 'ar'
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language, i18n])

  return (
    <main className={`login-template ${isArabic ? 'login-template-ar' : 'login-template-en'}`} dir={isArabic ? 'rtl' : 'ltr'} lang={isArabic ? 'ar' : 'en'}>
      <button
        className={`language-button ${isArabic ? 'language-button-en' : 'language-button-ar'}`}
        type="button"
        lang={isArabic ? 'en' : 'ar'}
        dir={isArabic ? 'ltr' : 'rtl'}
        onClick={onSwitchLanguage}
      >
        {isArabic ? 'English' : 'العربية'}
      </button>

      <section className="login-left-panel" aria-label="Background image">
      </section>

      <section className="login-right-panel">
        <div className="login-form-wrap">
          <div className="login-logo-wrap">
            <img src={mainLogo} className="login-logo-image" alt="Aden Tech Logo" />
          </div>

          <section className="login-card">
            <div className="login-header">
              <h1>{t('loginToAccount')}</h1>
              <p>{t('enterUsernamePassword')}</p>
            </div>

            <form className="login-form">
              <div className="form-field">
                <label className="field-label" htmlFor={isArabic ? 'email-ar' : 'email-en'}>
                  {t('username')}
                </label>
                <input className="text-input" type="text" id={isArabic ? 'email-ar' : 'email-en'} name="email" placeholder={t('placeholderUsername')} />
              </div>

              <div className="form-field">
                <label className="field-label" htmlFor={isArabic ? 'password-ar' : 'password-en'}>
                  {t('password')}
                </label>
                <div className="password-input-wrap">
                  <input
                    className="text-input password-input"
                    type={showPassword ? 'text' : 'password'}
                    id={isArabic ? 'password-ar' : 'password-en'}
                    name="password"
                    placeholder={t('placeholderPassword')}
                  />
                  <button
                    className="password-visibility-button"
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg className="password-visibility-icon" viewBox="0 0 24 24" aria-hidden="true">
                      {showPassword ? (
                        <path d="M3 3l18 18M10.6 10.6a4 4 0 0 0 5.4 5.4M9.88 5.08A10.94 10.94 0 0 1 12 5c4.3 0 7.9 2.7 9.9 7a14.6 14.6 0 0 1-3.1 4.2M6.61 6.61C4.65 7.89 3.09 9.68 2 12c2.1 4.3 5.7 7 10 7 1.4 0 2.76-.28 3.99-.79" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      ) : (
                        <>
                          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="login-actions">
                <button className="login-button" type="submit">
                  {t('login')}
                </button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </main>
  )
}

export default LoginScreen
