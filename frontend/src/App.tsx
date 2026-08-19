import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, ProtectedRoute } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './pages/ResumeUpload';
import AnalysisView from './pages/AnalysisView';
import InterviewChat from './pages/InterviewChat';
import InterviewSummary from './pages/InterviewSummary';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8 max-w-5xl">
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
  );
}

export default App;
