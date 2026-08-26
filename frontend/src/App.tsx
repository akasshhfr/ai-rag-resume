import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './pages/ResumeUpload';
import AnalysisView from './pages/AnalysisView';
import InterviewChat from './pages/InterviewChat';
import InterviewSummary from './pages/InterviewSummary';
import GradientBackground from './components/GradientBackground';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <div
            className="min-h-screen flex flex-col relative"
            style={{ backgroundColor: 'var(--bg-base)', transition: 'background-color 0.3s ease, color 0.3s ease' }}
          >
            <GradientBackground />
            <Navbar />
            <main className="flex-grow w-full">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/upload" element={<ProtectedRoute><ResumeUpload /></ProtectedRoute>} />
                <Route path="/analysis/:id" element={<ProtectedRoute><AnalysisView /></ProtectedRoute>} />
                <Route path="/interview/:sessionId" element={<ProtectedRoute><InterviewChat /></ProtectedRoute>} />
                <Route path="/interview/:sessionId/summary" element={<ProtectedRoute><InterviewSummary /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
