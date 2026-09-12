
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      userID: 'User ID',
      password: 'Password',
      login: 'Login',
      forgotPassword: 'Forgot password?',
      enterUserIDPassword: 'Please enter your user ID and password to login',
      loginToAccount: 'Login to account',
      placeholderUserID: '0',
      placeholderPassword: '••••••••',
    },
  },
  ar: {
    translation: {
      userID: 'معرف المستخدم',
      password: 'كلمة السر',
      login: 'الدخول',
      forgotPassword: 'نسيت كلمة المرور؟',
      enterUserIDPassword: 'الرجاء إدخال معرف المستخدم وكلمة السر للدخول',
      loginToAccount: 'الدخول للحساب',
      placeholderUserID: '0',
      placeholderPassword: '••••••••',
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
