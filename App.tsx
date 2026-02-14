
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, UserStatus } from './types';
import Login from './views/Login';
import Register from './views/Register';
import AdminDashboard from './views/AdminDashboard';
import CustomerDashboard from './views/CustomerDashboard';
import WholesalerDashboard from './views/WholesalerDashboard';
import { mockAuth } from './services/mockData';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'DASHBOARD'>('LOGIN');

  // Check for saved session
  useEffect(() => {
    const saved = localStorage.getItem('coolnet_user');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
      setView('DASHBOARD');
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('coolnet_user', JSON.stringify(user));
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('coolnet_user');
    setView('LOGIN');
  };

  const renderDashboard = () => {
    if (!currentUser) return null;

    switch (currentUser.role) {
      case UserRole.ADMIN:
        return <AdminDashboard user={currentUser} onLogout={handleLogout} />;
      case UserRole.WHOLESALER:
        return <WholesalerDashboard user={currentUser} onLogout={handleLogout} />;
      case UserRole.CUSTOMER:
      default:
        return <CustomerDashboard user={currentUser} onLogout={handleLogout} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-cairo">
      {view === 'LOGIN' && (
        <Login 
          onLogin={handleLogin} 
          onGoToRegister={() => setView('REGISTER')} 
        />
      )}
      {view === 'REGISTER' && (
        <Register 
          onBackToLogin={() => setView('LOGIN')} 
        />
      )}
      {view === 'DASHBOARD' && renderDashboard()}
      
      {/* Installation Banner (Simulated PWA) */}
      <footer className="mt-auto p-4 bg-white border-t border-gray-200 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} كوول نت - جميع الحقوق محفوظة
      </footer>
    </div>
  );
};

export default App;
