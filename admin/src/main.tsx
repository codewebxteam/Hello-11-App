import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import { DataProvider } from './context/DataContext'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <DataProvider>
        <App />
      </DataProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
