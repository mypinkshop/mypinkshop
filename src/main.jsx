import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// 🛑 Global Cache Killer: Saare pages ke sessionStorage cache ko bypass karne ke liye
const originalGetItem = sessionStorage.getItem.bind(sessionStorage);
sessionStorage.getItem = function (key) {
  if (key && key.includes('_cache')) {
    return null; // Component ko hamesha empty lagega, toh wo direct fresh API hit karega!
  }
  return originalGetItem(key);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
