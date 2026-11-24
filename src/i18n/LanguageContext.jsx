import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { translations } from './translations.js'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = window.localStorage.getItem('elite-language')
    return savedLanguage === 'gu' ? 'gu' : 'en'
  })

  useEffect(() => {
    document.documentElement.lang = language === 'gu' ? 'gu' : 'en'
  }, [language])

  const value = useMemo(() => ({
    language,
    setLanguage(nextLanguage) {
      if (!translations[nextLanguage]) return
      window.localStorage.setItem('elite-language', nextLanguage)
      setLanguage(nextLanguage)
    },
    t(path) {
      return path.split('.').reduce((result, key) => result?.[key], translations[language]) ?? path
    },
  }), [language])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}
