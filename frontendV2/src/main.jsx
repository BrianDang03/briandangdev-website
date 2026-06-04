import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'      // Layer 1: raw values
import './styles/theme.css'       // Layer 2: semantic roles
import './styles/base.css'        // Layer 3: element defaults
import './styles/animations.css'  // Layer 4: keyframes
import './styles/utilities.css'   // Layer 5: shared patterns
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
