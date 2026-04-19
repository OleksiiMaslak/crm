import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import 'antd/dist/reset.css'
import './index.css'
import './i18n.ts'
import App from './App.tsx'
import { setupInterceptors } from './api/setupInterceptors.ts'
import { restoreSession } from './store/auth/auth.slice.ts'
import { store } from './store/index.ts'

setupInterceptors(store)
void store.dispatch(restoreSession())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
