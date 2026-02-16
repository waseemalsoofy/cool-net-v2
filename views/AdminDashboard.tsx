
import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus, TransactionStatus } from '../types';
import Navbar from '../components/Navbar';
import { api } from '../services/api';
import { PACKAGES } from '../constants';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'CARDS' | 'DEPOSITS' | 'WHOLESALERS'>('CARDS');
  const [dbState, setDbState] = useState<{ users: User[], cards: any[], transactions: any[] }>({
    users: [],
    cards: [],
    transactions: []
  });

  const refreshState = () => {
    api.getAdminData().then(data => {
      setDbState(data);
    });
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleApproveDeposit = async (id: string) => {
    await api.approveDeposit(id);
    refreshState();
  };

  const handleApproveUser = async (id: string) => {
    await api.approveWholesaler(id);
    refreshState();
  };

  const availableCardsCount = (pkgId: string) =>
    dbState.cards.filter(c => c.packageId === pkgId && c.status === 'AVAILABLE').length;

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      <div className="bg-gray-800 text-white p-6">
        <h2 className="text-2xl font-bold">لوحة تحكم المدير</h2>
        <div className="flex gap-4 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('CARDS')}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition ${activeTab === 'CARDS' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            المخزون والكروت
          </button>
          <button
            onClick={() => setActiveTab('DEPOSITS')}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition ${activeTab === 'DEPOSITS' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            طلبات الشحن ({dbState.transactions.filter(t => t.status === TransactionStatus.PENDING).length})
          </button>
          <button
            onClick={() => setActiveTab('WHOLESALERS')}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition ${activeTab === 'WHOLESALERS' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            طلبات التجار ({dbState.users.filter(u => u.status === UserStatus.PENDING).length})
          </button>
        </div>
      </div>

      <main className="flex-1 p-6">
        {activeTab === 'CARDS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {PACKAGES.map(pkg => (
              <div key={pkg.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-500 mb-2">{pkg.name}</h4>
                <div className="text-4xl font-bold text-gray-900 mb-4">{availableCardsCount(pkg.id)}</div>
                <p className="text-xs text-gray-400">كرت متاح حالياً</p>
                <button className="w-full mt-6 py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl text-sm font-bold hover:border-blue-300 hover:text-blue-600 transition">
                  + إضافة كروت
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'DEPOSITS' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">طلبات شحن الرصيد المعلقة</h3>
            {dbState.transactions.filter(t => t.status === TransactionStatus.PENDING).length === 0 ? (
              <p className="p-12 text-center text-gray-400">لا توجد طلبات معلقة</p>
            ) : (
              dbState.transactions.filter(t => t.status === TransactionStatus.PENDING).map(t => {
                const reqUser = dbState.users.find(u => u.id === t.userId);
                return (
                  <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{t.amount} ريال</p>
                      <p className="text-sm font-bold">{reqUser?.name}</p>
                      <p className="text-xs text-gray-400">{t.paymentMethod} - {t.reference}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveDeposit(t.id)}
                        className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold text-sm"
                      >
                        قبول
                      </button>
                      <button className="bg-red-50 text-red-600 px-6 py-2 rounded-xl font-bold text-sm">
                        رفض
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'WHOLESALERS' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">تجار جدد في انتظار التفعيل</h3>
            {dbState.users.filter(u => u.status === UserStatus.PENDING).length === 0 ? (
              <p className="p-12 text-center text-gray-400">لا يوجد تجار بانتظار التفعيل</p>
            ) : (
              dbState.users.filter(u => u.status === UserStatus.PENDING).map(u => (
                <div key={u.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold">{u.name}</p>
                    <p className="text-sm text-gray-500">{u.phone}</p>
                    <p className="text-xs text-gray-400">التاريخ: {new Date().toLocaleDateString('ar-YE')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveUser(u.id)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm"
                    >
                      تفعيل الحساب
                    </button>
                    <button className="bg-gray-100 text-gray-500 px-6 py-2 rounded-xl font-bold text-sm">
                      عرض الملف
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
