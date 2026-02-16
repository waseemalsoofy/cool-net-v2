
import React, { useState } from 'react';
import { User, UserRole, TransactionStatus } from '../types';
import Navbar from '../components/Navbar';
import { PACKAGES, PAYMENT_METHODS, WALLET_DISCOUNT } from '../constants';
import { api } from '../services/api';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const CustomerDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'BUY' | 'WALLET' | 'HISTORY'>('BUY');
  const [loading, setLoading] = useState(false);
  const [balanceRequest, setBalanceRequest] = useState({ amount: '', method: PAYMENT_METHODS[0].id, reference: '' });
  const [transactions, setTransactions] = useState<any[]>([]);

  React.useEffect(() => {
    if (activeTab === 'HISTORY') {
      api.getTransactions(user.id).then(({ transactions }) => setTransactions(transactions));
    }
  }, [activeTab, user.id]);

  const handleBuy = async (packageId: string, useWallet: boolean) => {
    setLoading(true);
    try {
      const { order, error } = await api.buyCard(user.id, packageId, useWallet);
      if (error) {
        alert(error);
      } else if (order) {
        alert(`تم الشراء بنجاح! رقم الكرت: ${order.cardNumber}. سيتم إرسال الكرت أيضاً عبر واتساب/SMS.`);
      }
    } catch (e: any) {
      alert('حدث خطأ أثناء الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await api.requestDeposit(user.id, Number(balanceRequest.amount), balanceRequest.method, balanceRequest.reference);
    if (error) {
      alert('حدث خطأ أثناء الإرسال');
    } else {
      alert('تم إرسال طلب شحن الرصيد بنجاح، سيتم المراجعة من قبل الإدارة.');
      setBalanceRequest({ amount: '', method: PAYMENT_METHODS[0].id, reference: '' });
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-20">
      <Navbar user={user} onLogout={onLogout} />

      <div className="p-4 bg-blue-600 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-blue-100 text-sm">رصيد محفظتك</p>
            <h2 className="text-3xl font-bold">{user.walletBalance.toLocaleString()} <span className="text-lg">ريال</span></h2>
          </div>
          <button
            onClick={() => setActiveTab('WALLET')}
            className="bg-white/20 p-3 rounded-2xl backdrop-blur-md border border-white/30"
          >
            شحن رصيد
          </button>
        </div>
      </div>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        {activeTab === 'BUY' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-800">اختر باقة الإنترنت</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {PACKAGES.map(pkg => (
                <div key={pkg.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition hover:shadow-md">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-xl font-bold text-gray-800">{pkg.name}</h4>
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">متاح</span>
                  </div>
                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">السعر كاش:</span>
                      <span className="font-bold">{pkg.basePrice} ريال</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>السعر من الرصيد (خصم 5%):</span>
                      <span className="font-bold">{(pkg.basePrice * (1 - WALLET_DISCOUNT)).toFixed(2)} ريال</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={loading}
                      onClick={() => handleBuy(pkg.id, true)}
                      className="flex-1 bg-green-600 text-white py-2 rounded-xl font-bold text-sm shadow-md disabled:opacity-50"
                    >
                      شراء بالرصيد
                    </button>
                    <button
                      disabled={loading}
                      onClick={() => handleBuy(pkg.id, false)}
                      className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      شراء مباشر
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'WALLET' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 text-center">طلب شحن رصيد المحفظة</h3>
            <form onSubmit={handleBalanceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ المراد شحنه</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                  placeholder="مثال: 500"
                  value={balanceRequest.amount}
                  onChange={(e) => setBalanceRequest({ ...balanceRequest, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الدفع</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                  value={balanceRequest.method}
                  onChange={(e) => setBalanceRequest({ ...balanceRequest, method: e.target.value })}
                >
                  {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الإشعار / الحوالة</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                  placeholder="رقم مرجع التحويل"
                  value={balanceRequest.reference}
                  onChange={(e) => setBalanceRequest({ ...balanceRequest, reference: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg">
                إرسال طلب الشحن
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                ملاحظة: سيتم إضافة الرصيد بعد مراجعة الإيداع من قبل فريق العمل.
              </p>
            </form>
          </div>
        )}

        {activeTab === 'HISTORY' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800">سجل المعاملات</h3>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
              {transactions.length === 0 ? (
                <p className="p-8 text-center text-gray-400">لا توجد معاملات سابقة</p>
              ) : (
                <div className="divide-y divide-gray-100">
                  {transactions.map(t => (
                    <div key={t.id} className="p-4 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800">{t.amount} ريال</p>
                        <p className="text-xs text-gray-400">{new Date(t.timestamp).toLocaleDateString('ar-YE')}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${t.status === TransactionStatus.APPROVED ? 'bg-green-100 text-green-600' :
                        t.status === TransactionStatus.PENDING ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                        }`}>
                        {t.status === TransactionStatus.APPROVED ? 'مقبول' : t.status === TransactionStatus.PENDING ? 'قيد المراجعة' : 'مرفوض'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2">
        <button
          onClick={() => setActiveTab('BUY')}
          className={`flex flex-col items-center p-2 rounded-xl transition ${activeTab === 'BUY' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span className="text-xs mt-1">المتجر</span>
        </button>
        <button
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center p-2 rounded-xl transition ${activeTab === 'WALLET' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="text-xs mt-1">المحفظة</span>
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`flex flex-col items-center p-2 rounded-xl transition ${activeTab === 'HISTORY' ? 'text-blue-600' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs mt-1">السجلات</span>
        </button>
      </div>
    </div>
  );
};

export default CustomerDashboard;
