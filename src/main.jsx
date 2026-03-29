// src/main.jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/home.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom' 
import { initAdminTheme } from './utils/theme.js'


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)