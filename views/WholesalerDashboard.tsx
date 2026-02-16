
import React, { useState } from 'react';
import { User, UserStatus } from '../types';
import Navbar from '../components/Navbar';
import { PACKAGES, WALLET_DISCOUNT } from '../constants';
import { api } from '../services/api';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const WholesalerDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [loading, setLoading] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[0].id);

  const handleWholesaleBuy = async () => {
    if (user.status !== UserStatus.ACTIVE) {
      alert('حسابك مازال قيد المراجعة. لا يمكنك إجراء عمليات حالياً.');
      return;
    }
    if (!targetPhone) {
      alert('يرجى إدخال رقم هاتف العميل');
      return;
    }

    setLoading(true);
    try {
      const { order, error } = await api.buyCard(user.id, selectedPkg, true, targetPhone);
      if (error) {
        alert(error);
      } else {
        alert('✔️ جاهز – تم الإرسال للعميل مباشرة من رقم الإدارة.');
        setTargetPhone('');
      }
    } catch (e: any) {
      alert('حدث خطأ أثناء الاتصال');
    } finally {
      setLoading(false);
    }
  };

  if (user.status === UserStatus.PENDING) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">حسابك قيد المراجعة</h2>
        <p className="text-gray-500 mb-8">سيقوم الأدمن بتفعيل حسابك قريباً. شكراً لانتظارك.</p>
        <button onClick={onLogout} className="bg-red-500 text-white px-8 py-2 rounded-xl font-bold">تسجيل الخروج</button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <Navbar user={user} onLogout={onLogout} />

      <div className="p-4 bg-indigo-700 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-indigo-100 text-sm">رصيد الجملة</p>
            <h2 className="text-3xl font-bold">{user.walletBalance.toLocaleString()} <span className="text-lg">ريال</span></h2>
          </div>
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold border border-white/30">
            تاجر جملة معتمد
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full">
        <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            شحن مباشر لعميل
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رقم هاتف العميل</label>
              <input
                type="tel"
                className="w-full px-5 py-4 rounded-2xl border-2 border-gray-100 focus:border-indigo-500 outline-none transition text-lg tracking-wider"
                placeholder="7XXXXXXXX"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اختر فئة الكرت</label>
              <div className="grid grid-cols-2 gap-3">
                {PACKAGES.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg.id)}
                    className={`p-4 rounded-2xl border-2 transition text-right relative overflow-hidden ${selectedPkg === pkg.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-gray-100 hover:border-indigo-200'
                      }`}
                  >
                    <p className="font-bold text-lg">{pkg.name}</p>
                    <p className="text-xs text-gray-500">جملة: {(pkg.wholesalePrice * (1 - WALLET_DISCOUNT)).toFixed(1)} ريال</p>
                    {selectedPkg === pkg.id && (
                      <div className="absolute top-0 right-0 p-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-indigo-700 text-sm">الإجمالي للخصم:</span>
                <span className="text-indigo-900 font-bold text-xl">
                  {(PACKAGES.find(p => p.id === selectedPkg)?.wholesalePrice! * 0.95).toFixed(1)} ريال
                </span>
              </div>
              <p className="text-[10px] text-indigo-400">سيتم إرسال الكرت فوراً من رقم الإدارة لهاتف العميل.</p>
            </div>

            <button
              disabled={loading}
              onClick={handleWholesaleBuy}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <span className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  شحــن الآن
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8">
          <h4 className="font-bold text-gray-600 mb-4 px-2">ملاحظات هامة:</h4>
          <ul className="space-y-2 text-sm text-gray-500 bg-white p-4 rounded-2xl border border-gray-100">
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              يتم خصم المبلغ من رصيد الجملة الخاص بك فوراً.
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              لا يظهر لك رقم الكرت حفاظاً على أمن الأصول.
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-bold">•</span>
              العميل سيستلم رسالة تحتوي على رقم الكرت فور الضغط على شحن.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default WholesalerDashboard;
