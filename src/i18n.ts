import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      username: 'Username',
      password: 'Password',
      login: 'Login',
      forgotPassword: 'Forgot password?',
      enterUsernamePassword: 'Please enter your username and password to login',
      loginToAccount: 'Login to account',
      placeholderUsername: 'user',
      placeholderPassword: '••••••••',
    },
  },
  ar: {
    translation: {
      username: 'اسم المستخدم',
      password: 'كلمة السر',
      login: 'الدخول',
      forgotPassword: 'نسيت كلمة المرور؟',
      enterUsernamePassword: 'الرجاء إدخال اسم المستخدم وكلمة السر للدخول',
      loginToAccount: 'الدخول للحساب',
      placeholderUsername: 'مستخدم',
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
