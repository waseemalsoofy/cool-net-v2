
import React, { useState } from 'react';
import { User, UserStatus, Package } from '../types';
import Navbar from '../components/Navbar';
import { WALLET_DISCOUNT, PAYMENT_METHODS } from '../constants';
import { api } from '../services/api';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const WholesalerDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'SELL' | 'WALLET' | 'ORDER'>('SELL');
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);

  // Sell State
  const [targetPhone, setTargetPhone] = useState('');
  const [selectedPkg, setSelectedPkg] = useState('');

  // Wallet State
  const [balanceRequest, setBalanceRequest] = useState({ amount: '', method: PAYMENT_METHODS[0].id, reference: '' });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // Order Physical State
  const [orderQuantities, setOrderQuantities] = useState<Record<string, number>>({});

  React.useEffect(() => {
    const loadData = async () => {
      const { data } = await api.getPackages();
      if (data) {
        setPackages(data);
        if (data.length > 0) {
          setSelectedPkg(data[0].id);
          setOrderQuantities(data.reduce((acc, pkg) => ({ ...acc, [pkg.id]: 0 }), {} as Record<string, number>));
        }
      }
    };
    loadData();
  }, []);

  const [showShareOptions, setShowShareOptions] = useState(false);

  const getOrderMessage = () => {
    const lines = packages
      .filter(p => (orderQuantities[p.id] || 0) > 0)
      .map(p => `- ${p.name}: ${orderQuantities[p.id]} كرت`);

    return `*طلب كروت ورقية جديد*\n` +
      `التاجر: ${user.shopName || user.name} (${user.phone})\n` +
      `----------\n` +
      lines.join('\n') +
      `\n--------\n` +
      `يرجى التجهيز والتواصل معي.`;
  };

  const validateOrder = () => {
    const hasItems = Object.values(orderQuantities).some((q: number) => q > 0);
    if (!hasItems) {
      alert('يرجى تحديد كمية واحدة على الأقل');
      return false;
    }
    return true;
  };

  const handleSendWhatsApp = () => {
    const message = getOrderMessage();
    const safeUrl = `https://wa.me/967775937337?text=${encodeURIComponent(message)}`;
    window.open(safeUrl, '_blank');
    setShowShareOptions(false);
  };

  const handleSendSMS = () => {
    const message = getOrderMessage();
    const safeUrl = `sms:775937337?body=${encodeURIComponent(message)}`;
    window.open(safeUrl, '_self');
    setShowShareOptions(false);
  };

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

  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await api.requestDeposit(user.id, Number(balanceRequest.amount), balanceRequest.method, balanceRequest.reference, receiptFile);
    if (error) {
      alert(error);
    } else {
      alert('تم إرسال طلب شحن الرصيد بنجاح، سيتم المراجعة من قبل الإدارة.');
      setBalanceRequest({ amount: '', method: PAYMENT_METHODS[0].id, reference: '' });
      setReceiptFile(null);
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
    <div className="flex-1 flex flex-col bg-gray-50 mb-20 relative">
      <Navbar user={user} onLogout={onLogout} />

      {showShareOptions && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowShareOptions(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-center mb-4">اختر طريقة الإرسال</h3>
            <button
              onClick={handleSendWhatsApp}
              className="w-full py-4 bg-[#25D366] text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:brightness-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" /></svg>
              إرسال عبر واتساب
            </button>
            <button
              onClick={handleSendSMS}
              className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:brightness-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              إرسال رسالة نصية (SMS)
            </button>
            <button
              onClick={() => setShowShareOptions(false)}
              className="w-full py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      <div className="p-4 bg-indigo-700 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-indigo-100 text-sm">رصيد الجملة</p>
            <h2 className="text-3xl font-bold">{user.walletBalance.toLocaleString()} <span className="text-lg">ريال</span></h2>
          </div>
          <div className="text-left">
            <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold border border-white/30 mb-1">
              تاجر جملة معتمد
            </div>
            <p className="text-xs text-indigo-200">{user.shopName}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-6 max-w-lg mx-auto w-full">

        {activeTab === 'SELL' && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 animate-fade-in">
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
                  {packages.map(pkg => (
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
                    {(packages.find(p => p.id === selectedPkg)?.wholesalePrice! * 0.95 || 0).toFixed(1)} ريال
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
        )}

        {activeTab === 'WALLET' && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">طلب تعزيز رصيد المحفظة</h3>
            <form onSubmit={handleBalanceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المبلغ</label>
                <input
                  type="number"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                  placeholder="مثال: 50000"
                  value={balanceRequest.amount}
                  onChange={(e) => setBalanceRequest({ ...balanceRequest, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">طريقة الإيداع</label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                  value={balanceRequest.method}
                  onChange={(e) => setBalanceRequest({ ...balanceRequest, method: e.target.value })}
                >
                  {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم السند / الحوالة</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                  placeholder="رقم مرجع التحويل"
                  value={balanceRequest.reference}
                  onChange={(e) => setBalanceRequest({ ...balanceRequest, reference: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">صورة الإيصال (اختياري)</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white"
                  onChange={(e) => setReceiptFile(e.target.files ? e.target.files[0] : null)}
                />
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg">
                إرسال طلب التعزيز
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                ملاحظة: سيتم إضافة الرصيد بعد مراجعة الإيداع من قبل الإدارة.
              </p>
            </form>
          </div>
        )}

        {activeTab === 'ORDER' && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">طلب كروت ورقية</h3>
            <p className="text-sm text-gray-500 text-center mb-6">حدد الكمية المطلوبة من كل فئة.</p>

            <div className="space-y-4 mb-8">
              {packages.map(pkg => (
                <div key={pkg.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-lg">{pkg.name}</p>
                    <p className="text-sm text-gray-500">سعر الجملة: {pkg.wholesalePrice} ريال</p>
                  </div>
                  <div className="w-1/3">
                    <input
                      type="number"
                      min="0"
                      placeholder="الكمية"
                      className="w-full px-4 py-2 text-center rounded-xl border border-gray-300 focus:border-indigo-500 outline-none text-xl font-bold"
                      value={orderQuantities[pkg.id] === 0 ? '' : orderQuantities[pkg.id]}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setOrderQuantities(prev => ({ ...prev, [pkg.id]: isNaN(val) ? 0 : val }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-green-50 p-4 rounded-xl mb-6 border border-green-100">
              <p className="text-sm text-green-800 font-bold text-center">
                إجمالي عدد الكروت: {Object.values(orderQuantities).reduce((a: number, b: number) => a + b, 0)}
              </p>
            </div>

            <button
              onClick={() => {
                if (validateOrder()) setShowShareOptions(true);
              }}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-700 transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              إرسال الطلب
            </button>
          </div>
        )}

      </main>

      {/* Bottom Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50">
        <button
          onClick={() => setActiveTab('SELL')}
          className={`flex flex-col items-center p-2 rounded-xl transition ${activeTab === 'SELL' ? 'text-indigo-600 scale-110' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-[10px] font-bold mt-1">شحن</span>
        </button>
        <button
          onClick={() => setActiveTab('WALLET')}
          className={`flex flex-col items-center p-2 rounded-xl transition ${activeTab === 'WALLET' ? 'text-indigo-600 scale-110' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <span className="text-[10px] font-bold mt-1">المحفظة</span>
        </button>
        <button
          onClick={() => setActiveTab('ORDER')}
          className={`flex flex-col items-center p-2 rounded-xl transition ${activeTab === 'ORDER' ? 'text-indigo-600 scale-110' : 'text-gray-400'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span className="text-[10px] font-bold mt-1">طلب كروت</span>
        </button>
      </div>
    </div>
  );
};

export default WholesalerDashboard;
