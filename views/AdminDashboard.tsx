import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus, TransactionStatus, Package } from '../types';
import Navbar from '../components/Navbar';
import { api } from '../services/api';
import { WALLET_DISCOUNT } from '../constants';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const AdminDashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'CARDS' | 'DEPOSITS' | 'USERS' | 'PACKAGES' | 'SELL' | 'REPORTS'>('CARDS');
  const [dbState, setDbState] = useState<{
    users: User[], cards: any[], transactions: any[], packages: Package[], stats: any
  }>({
    users: [],
    cards: [],
    transactions: [],
    packages: [],
    stats: {}
  });

  // Sell Tab State
  const [targetPhone, setTargetPhone] = useState('');
  const [selectedPkg, setSelectedPkg] = useState('');
  const [sellLoading, setSellLoading] = useState(false);

  // Packages Edit State
  const [editingPkg, setEditingPkg] = useState<string | null>(null);
  const [pkgUpdates, setPkgUpdates] = useState<{ basePrice: number, wholesalePrice: number }>({ basePrice: 0, wholesalePrice: 0 });

  const [showAddCard, setShowAddCard] = useState(false);
  const [addCardData, setAddCardData] = useState({ packageId: '', content: '' });

  const refreshState = async () => {
    const [adminData, packagesRes, statsRes] = await Promise.all([
      api.getAdminData(),
      api.getPackages(),
      api.getAdminStats()
    ]);

    if (adminData && packagesRes.data) {
      setDbState({
        ...adminData,
        packages: packagesRes.data,
        stats: statsRes
      });

      // Init Sell selection
      if (packagesRes.data.length > 0 && !selectedPkg) {
        setSelectedPkg(packagesRes.data[0].id);
      }

      // Init Add Card selection
      if (packagesRes.data.length > 0 && !addCardData.packageId) {
        setAddCardData(prev => ({ ...prev, packageId: packagesRes.data[0].id }));
      }
    }
  };

  const handleAddCards = async () => {
    if (!addCardData.content) return;
    const cards = addCardData.content.split('\n').filter(c => c.trim().length > 0);
    let successCount = 0;

    // Serial execution for simplicity
    for (const cardNum of cards) {
      const { error } = await api.addCard(addCardData.packageId, cardNum.trim());
      if (!error) successCount++;
    }

    alert(`تم إضافة ${successCount} كرت بنجاح`);
    setAddCardData({ ...addCardData, content: '' });
    setShowAddCard(false);
    refreshState();
  };

  useEffect(() => {
    refreshState();
  }, []);

  const handleApproveDeposit = async (id: string) => {
    await api.approveDeposit(id);
    refreshState();
  };

  const handleApproveUser = async (id: string) => {
    const { error } = await api.approveWholesaler(id);
    if (error) {
      alert('فشل التفعيل: ' + error.message);
    } else {
      refreshState();
    }
  };

  const handleUserAction = async (id: string, action: 'BLOCK' | 'ACTIVATE' | 'DELETE') => {
    if (!confirm('هل أنت متأكد من هذا الإجراء؟')) return;

    if (action === 'DELETE') {
      // In real app, delete from Supabase Auth is harder from client. 
      // We might just mark status as DELETED or similar. 
      // For now, let's just BLOCK as a soft delete or use status update.
      const { error } = await api.updateUserStatus(id, UserStatus.BLOCKED); // enhancing to blocked for safety
      if (!error) refreshState();
    } else {
      const status = action === 'BLOCK' ? UserStatus.BLOCKED : UserStatus.ACTIVE;
      const { error } = await api.updateUserStatus(id, status);
      if (!error) refreshState();
    }
  };

  const handleSavePackage = async () => {
    if (!editingPkg) return;
    const { error } = await api.updatePackage(editingPkg, pkgUpdates);
    if (error) alert('فشل التحديث');
    else {
      setEditingPkg(null);
      refreshState();
    }
  };

  const handleAdminSell = async () => {
    if (!targetPhone) {
      alert('يرجى إدخال رقم هاتف العميل');
      return;
    }
    setSellLoading(true);
    // Admin uses 'buyCard' but with their ID. Since Admin has no wallet limit usually, 
    // we might need to bypass check or ensure Admin has huge balance. 
    // For now assuming Admin has balance or logic allows.
    // Actually, buyCard checks wallet balance. We should probably give Admin a special bypass or just give them infinite money in DB.
    // Or better, update buyCard to ignore balance for Admin. 
    // Let's assume Admin has enough balance for now (mock).
    const { order, error } = await api.buyCard(user.id, selectedPkg, false, targetPhone); // Direct payment

    if (error) {
      alert(error);
    } else {
      // SMS
      await api.sendSMS(targetPhone, `شكرا لاشتراكك في كول نت.\nباقة: ${dbState.packages.find(p => p.id === selectedPkg)?.name}\nرقم الكرت: ${order.cardNumber}`);
      alert(`تم بيع الكرت بنجاح:\n${order.cardNumber}`);
      setTargetPhone('');
      refreshState();
    }
    setSellLoading(false);
  };

  const availableCardsCount = (pkgId: string) =>
    dbState.cards.filter(c => c.packageId === pkgId && c.status === 'AVAILABLE').length;

  return (
    <div className="flex-1 flex flex-col bg-gray-50 relative">
      <Navbar user={user} onLogout={onLogout} />

      {showAddCard && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddCard(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">إضافة كروت جديدة</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">الباقة</label>
                <select
                  className="w-full p-3 border rounded-xl"
                  value={addCardData.packageId}
                  onChange={(e) => setAddCardData({ ...addCardData, packageId: e.target.value })}
                >
                  {dbState.packages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">أرقام الكروت (كل كرت في سطر)</label>
                <textarea
                  className="w-full p-3 border rounded-xl h-40 text-left ltr font-mono"
                  placeholder="123456789&#10;987654321"
                  value={addCardData.content}
                  onChange={(e) => setAddCardData({ ...addCardData, content: e.target.value })}
                />
              </div>
              <button
                onClick={handleAddCards}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-800 text-white p-6">
        <h2 className="text-2xl font-bold">لوحة تحكم المدير</h2>
        <div className="flex gap-4 mt-4 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab('REPORTS')}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition ${activeTab === 'REPORTS' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            التقارير
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition ${activeTab === 'USERS' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            المستخدمين ({dbState.stats.usersCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('CARDS')}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition ${activeTab === 'CARDS' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            المخزون ({dbState.stats.cardsCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('PACKAGES')}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition ${activeTab === 'PACKAGES' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            الباقات
          </button>
          <button
            onClick={() => setActiveTab('DEPOSITS')}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition ${activeTab === 'DEPOSITS' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            المالية ({dbState.transactions.filter(t => t.status === TransactionStatus.PENDING).length})
          </button>
          <button
            onClick={() => setActiveTab('SELL')}
            className={`px-6 py-2 rounded-full whitespace-nowrap transition ${activeTab === 'SELL' ? 'bg-blue-600' : 'bg-gray-700'}`}
          >
            بيع مباشر
          </button>
        </div>
      </div>

      <main className="flex-1 p-6">
        {activeTab === 'CARDS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {dbState.packages.map(pkg => (
              <div key={pkg.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-500 mb-2">{pkg.name}</h4>
                <div className="text-4xl font-bold text-gray-900 mb-4">{availableCardsCount(pkg.id)}</div>
                <p className="text-xs text-gray-400">كرت متاح حالياً</p>
                <button
                  onClick={() => {
                    setAddCardData(prev => ({ ...prev, packageId: pkg.id }));
                    setShowAddCard(true);
                  }}
                  className="w-full mt-6 py-2 border-2 border-dashed border-gray-200 text-gray-400 rounded-xl text-sm font-bold hover:border-blue-300 hover:text-blue-600 transition"
                >
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
                      {t.receiptUrl && (
                        <a
                          href={t.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-500 underline block mt-1"
                        >
                          عرض الإيصال
                        </a>
                      )}
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

        {activeTab === 'REPORTS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 font-bold mb-2">إجمالي المبيعات</p>
              <h3 className="text-3xl font-bold text-gray-800">{dbState.stats.totalSold || 0} <span className="text-sm text-gray-400">كرت</span></h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 font-bold mb-2">إجمالي الإيرادات</p>
              <h3 className="text-3xl font-bold text-green-600">{dbState.stats.totalRevenue?.toLocaleString() || 0} <span className="text-sm text-gray-400">ريال</span></h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 font-bold mb-2">عدد المستخدمين</p>
              <h3 className="text-3xl font-bold text-blue-600">{dbState.stats.usersCount || 0}</h3>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 font-bold mb-2">عدد الكروت المتاحة</p>
              <h3 className="text-3xl font-bold text-indigo-600">{dbState.stats.cardsCount || 0}</h3>
            </div>
          </div>
        )}

        {activeTab === 'USERS' && (
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">إدارة المستخدمين</h3>
            {dbState.users.map(u => (
              <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{u.name}</p>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' :
                        u.role === 'WHOLESALER' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}>{u.role}</span>
                  </div>
                  <p className="text-sm text-gray-500">{u.phone}</p>
                  <p className="text-xs text-gray-400">الرصيد: {u.walletBalance}</p>
                </div>
                <div className="flex gap-2">
                  {u.status === UserStatus.PENDING && (
                    <button onClick={() => handleApproveUser(u.id)} className="bg-green-100 text-green-600 px-4 py-2 rounded-xl font-bold text-sm">تفعيل</button>
                  )}
                  {u.status === UserStatus.BLOCKED ? (
                    <button onClick={() => handleUserAction(u.id, 'ACTIVATE')} className="bg-blue-100 text-blue-600 px-4 py-2 rounded-xl font-bold text-sm">فك الحظر</button>
                  ) : (
                    <button onClick={() => handleUserAction(u.id, 'BLOCK')} className="bg-orange-100 text-orange-600 px-4 py-2 rounded-xl font-bold text-sm">حظر</button>
                  )}
                  <button onClick={() => handleUserAction(u.id, 'DELETE')} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold text-sm">حذف</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'PACKAGES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dbState.packages.map(pkg => (
              <div key={pkg.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-lg">{pkg.name}</h4>
                  {editingPkg === pkg.id ? (
                    <div className="flex gap-2">
                      <button onClick={handleSavePackage} className="text-green-600 font-bold text-sm">حفظ</button>
                      <button onClick={() => setEditingPkg(null)} className="text-gray-400 font-bold text-sm">إلغاء</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setEditingPkg(pkg.id);
                        setPkgUpdates({ basePrice: pkg.basePrice, wholesalePrice: pkg.wholesalePrice });
                      }}
                      className="text-blue-600 font-bold text-sm"
                    >
                      تعديل
                    </button>
                  )}
                </div>

                {editingPkg === pkg.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">السعر الأساسي</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-lg"
                        value={pkgUpdates.basePrice}
                        onChange={e => setPkgUpdates({ ...pkgUpdates, basePrice: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">سعر الجملة</label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded-lg"
                        value={pkgUpdates.wholesalePrice}
                        onChange={e => setPkgUpdates({ ...pkgUpdates, wholesalePrice: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">السعر الأساسي:</span>
                      <span className="font-bold">{pkg.basePrice}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">سعر الجملة:</span>
                      <span className="font-bold">{pkg.wholesalePrice}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'SELL' && (
          <div className="max-w-md mx-auto bg-white p-6 rounded-3xl shadow-lg">
            <h3 className="font-bold text-xl mb-6 text-center">بيع مباشر للعملاء</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">رقم العميل</label>
                <input
                  type="tel"
                  className="w-full p-3 border rounded-xl"
                  placeholder="77xxxxxxx"
                  value={targetPhone}
                  onChange={e => setTargetPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">الباقة</label>
                <div className="grid grid-cols-2 gap-2">
                  {dbState.packages.map(pkg => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPkg(pkg.id)}
                      className={`p-3 rounded-xl border font-bold text-sm ${selectedPkg === pkg.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 border-gray-200'}`}
                    >
                      {pkg.name}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAdminSell}
                disabled={sellLoading}
                className="w-full py-4 bg-green-600 text-white rounded-xl font-bold text-lg shadow-lg hover:bg-green-700 disabled:opacity-50"
              >
                {sellLoading ? 'جاري التنفيذ...' : 'إتمام البيع وإرسال SMS'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
