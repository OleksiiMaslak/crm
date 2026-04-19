import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  en: {
    translation: {
      common: {
        language: {
          label: 'Language',
          english: 'English',
          ukrainian: 'Ukrainian',
        },
      },
      auth: {
        login: {
          title: 'Welcome back',
          subtitle: 'Sign in to your account to continue',
          submit: 'Sign in',
          footer: "Don't have an account?",
          footerLink: 'Create one',
        },
        register: {
          title: 'Create account',
          subtitle: 'Start tracking your GitHub repositories',
          submit: 'Create account',
          footer: 'Already have an account?',
          footerLink: 'Sign in',
        },
        emailLabel: 'Email',
        emailPlaceholder: 'you@example.com',
        passwordLabel: 'Password',
        passwordPlaceholder: '••••••••',
        validation: {
          email: 'Enter a valid email',
          passwordMin: 'Min 8 characters',
        },
      },
      dashboard: {
        title: 'Repositories',
        shownCount: '{{filtered}}/{{total}} shown',
        logout: 'Sign out',
        add: {
          required: 'Repository path is required',
          invalidFormat: 'Use format owner/repository (must contain /)',
          placeholder: 'owner/repository',
          submit: '+ Add repository',
        },
        filters: {
          searchPlaceholder: 'Search by owner, name, or URL',
          allLanguages: 'All languages',
          unknownLanguage: 'Unknown',
          allStars: 'All stars',
          starsGt0: 'Stars > 0',
          starsGte100: 'Stars >= 100',
          starsGte1000: 'Stars >= 1000',
          reset: 'Reset filters',
        },
        table: {
          owner: 'Owner',
          name: 'Name',
          url: 'URL',
          stars: 'Stars',
          forks: 'Forks',
          issues: 'Issues',
          created: 'Created',
          actions: 'Actions',
          openInNewTab: 'Open in new tab',
          go: 'Go',
          createdTooltip: '{{timestamp}} (UTC Unix timestamp)',
          refresh: 'Refresh from GitHub',
          delete: 'Delete',
          empty: 'No repositories yet - add one above',
        },
      },
      errors: {
        auth: {
          registrationFailed: 'Registration failed',
          loginFailed: 'Login failed',
          sessionRestoreFailed: 'Session restore failed',
          unknown: 'Unknown error',
        },
        repositories: {
          loadFailed: 'Failed to load repositories',
          addFailed: 'Failed to add repository',
          addSuccess: 'Repository added successfully',
          removeFailed: 'Failed to remove repository',
          refreshFailed: 'Failed to refresh repository',
          refreshSuccess: 'Repository updated successfully',
          removeSuccess: 'Repository removed successfully',
        },
      },
    },
  },
  uk: {
    translation: {
      common: {
        language: {
          label: 'Мова',
          english: 'Англійська',
          ukrainian: 'Українська',
        },
      },
      auth: {
        login: {
          title: 'З поверненням',
          subtitle: 'Увійдіть у свій акаунт, щоб продовжити',
          submit: 'Увійти',
          footer: 'Ще не маєте акаунта?',
          footerLink: 'Створити',
        },
        register: {
          title: 'Створити акаунт',
          subtitle: 'Почніть відстежувати свої GitHub репозиторії',
          submit: 'Створити акаунт',
          footer: 'Вже маєте акаунт?',
          footerLink: 'Увійти',
        },
        emailLabel: 'Email',
        emailPlaceholder: 'you@example.com',
        passwordLabel: 'Пароль',
        passwordPlaceholder: '••••••••',
        validation: {
          email: 'Введіть коректний email',
          passwordMin: 'Мінімум 8 символів',
        },
      },
      dashboard: {
        title: 'Репозиторії',
        shownCount: 'Показано {{filtered}}/{{total}}',
        logout: 'Вийти',
        add: {
          required: 'Шлях репозиторію обов\'язковий',
          invalidFormat: 'Використайте формат owner/repository (має містити /)',
          placeholder: 'owner/repository',
          submit: '+ Додати репозиторій',
        },
        filters: {
          searchPlaceholder: 'Пошук за власником, назвою або URL проєкту',
          allLanguages: 'Усі мови',
          unknownLanguage: 'Невідомо',
          allStars: 'Усі зірки',
          starsGt0: 'Зірки > 0',
          starsGte100: 'Зірки >= 100',
          starsGte1000: 'Зірки >= 1000',
          reset: 'Скинути фільтри',
        },
        table: {
          owner: 'Власник проєкту',
          name: 'Назва проєкту',
          url: 'URL',
          stars: 'Зірки',
          forks: 'Форки',
          issues: 'Проблеми',
          created: 'Створено',
          actions: 'Дії',
          openInNewTab: 'Відкрити у новій вкладці',
          go: 'Перейти',
          createdTooltip: '{{timestamp}} (UTC Unix timestamp)',
          refresh: 'Оновити з GitHub',
          delete: 'Видалити',
          empty: 'Ще немає репозиторіїв - додайте перший вище',
        },
      },
      errors: {
        auth: {
          registrationFailed: 'Не вдалося зареєструватися',
          loginFailed: 'Не вдалося увійти',
          sessionRestoreFailed: 'Не вдалося відновити сесію',
          unknown: 'Невідома помилка',
        },
        repositories: {
          loadFailed: 'Не вдалося завантажити репозиторії',
          addFailed: 'Не вдалося додати репозиторій',
          addSuccess: 'Репозиторій успішно додано',
          removeFailed: 'Не вдалося видалити репозиторій',
          refreshFailed: 'Не вдалося оновити репозиторій',
          refreshSuccess: 'Репозиторій успішно оновлено',
          removeSuccess: 'Репозиторій успішно видалено',
        },
      },
    },
  },
}

const storedLanguage = localStorage.getItem('crm_language')
const initialLanguage = storedLanguage === 'uk' || storedLanguage === 'en' ? storedLanguage : 'en'

void i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
})

void i18n.on('languageChanged', (lang) => {
  localStorage.setItem('crm_language', lang)
})

export default i18n
