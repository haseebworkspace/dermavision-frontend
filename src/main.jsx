import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1a2130',
          color: '#e8edf5',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '12px',
          fontSize: '14px',
          fontFamily: 'DM Sans, sans-serif',
        },
        success: {
          iconTheme: { primary: '#22c55e', secondary: '#1a2130' },
        },
        error: {
          iconTheme: { primary: '#ef4444', secondary: '#1a2130' },
        },
      }}
    />
  </StrictMode>
)