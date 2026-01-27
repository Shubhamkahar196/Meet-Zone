
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './components/Home'
import LoginPage from './components/LoginPage'


function App() {
  return (
    // Wrap the entire app with AuthProvider to provide authentication context
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} /> 

          <Route path="/signup" element={<LoginPage />} /> 
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
