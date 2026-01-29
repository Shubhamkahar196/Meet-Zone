import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Home from "./components/Home";
import LoginPage from "./components/LoginPage";
import Layout from "./components/Layout";
import VideoMeet from "./components/VideoMeet";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<LoginPage />} />
            <Route path="/:url" element={<VideoMeet/>}/>
          </Routes>
        </Layout>
      </AuthProvider>
    </Router>
  );
}

export default App;
