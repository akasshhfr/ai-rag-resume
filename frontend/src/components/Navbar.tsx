import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="border-b border-gray-800 bg-gray-950">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-5xl">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white hover:text-indigo-400 transition">
          <Briefcase className="w-6 h-6 text-indigo-500" />
          <span>AI Resume Coach</span>
        </Link>
        <div>
          {user ? (
            <div className="flex items-center gap-6">
              <span className="text-sm text-gray-400">{user.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-4">
              <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white">Login</Link>
              <Link to="/register" className="text-sm font-medium text-indigo-400 hover:text-indigo-300">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
