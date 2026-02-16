
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, UserStatus } from './types';
import Login from './views/Login';
import Register from './views/Register';
import AdminDashboard from './views/AdminDashboard';
import CustomerDashboard from './views/CustomerDashboard';
import WholesalerDashboard from './views/WholesalerDashboard';
import { mockAuth } from './services/mockData';
import { supabase } from './services/supabase';
import { api } from './services/api';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<'LOGIN' | 'REGISTER' | 'DASHBOARD'>('LOGIN');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        api.getProfile(session.user.id).then(user => {
          if (user) setCurrentUser(user);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        api.getProfile(session.user.id).then(user => {
          if (user) {
            setCurrentUser(user);
            setView('DASHBOARD');
          }
        });
      } else {
        setCurrentUser(null);
        setView('LOGIN');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setView('DASHBOARD');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
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
