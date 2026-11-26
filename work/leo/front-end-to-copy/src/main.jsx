import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { IconContext } from '@phosphor-icons/react'
import App from './App.jsx'
import { StoreProvider } from './store.jsx'
import './theme.css'
import './styles.css'

createRoot(document.getElementById('root')).render(
  <IconContext.Provider value={{ weight: 'duotone', size: '1.3em' }}>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </IconContext.Provider>,
)
