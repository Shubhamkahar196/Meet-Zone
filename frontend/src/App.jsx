
import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext' // Import AuthProvider for authentication context
import Home from './components/Home'
import LoginPage from './components/LoginPage' // Import LoginPage component

function App() {
  return (
    // Wrap the entire app with AuthProvider to provide authentication context
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} /> {/* Home route */}
          <Route path="/login" element={<LoginPage />} /> {/* Login/Signup route */}
          <Route path="/signup" element={<LoginPage />} /> {/* Alias for signup, handled in LoginPage */}
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
