import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { WeatherProvider } from './Context/WeatherContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <BrowserRouter>
            <WeatherProvider>
                <App />
            </WeatherProvider>
        </BrowserRouter>
    </React.StrictMode>,
)