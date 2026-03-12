import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/home.css'
import App from './App.jsx'
// 1. IMPORT THÊM BROWSER ROUTER
import { BrowserRouter } from 'react-router-dom' 

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* 2. BỌC BROWSER ROUTER BÊN NGOÀI APP */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)