
import React, { useState } from 'react';
import { UserRole } from '../types';
import { api } from '../services/api';

interface RegisterProps {
  onBackToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onBackToLogin }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    role: UserRole.CUSTOMER,
    shopName: ''
  });
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate sending OTP
    setStep(2);
    setMessage('تم إرسال رمز التحقق إلى رقم هاتفك (التجريبي: 1234)');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === '1234') {
      try {
        const { user, error } = await api.register(
          formData.name,
          formData.phone,
          formData.password,
          formData.role,
          formData.shopName
        );

        if (error) {
          alert('فشل التسجيل: ' + error);
          return;
        }

        if (user) {
          alert('تم التسجيل بنجاح. ' + (formData.role === UserRole.WHOLESALER ? 'طلبك قيد المراجعة من قبل الإدارة.' : 'يمكنك الآن تسجيل الدخول.'));
          onBackToLogin();
        }
      } catch (err) {
        alert('حدث خطأ أثناء التسجيل');
        console.error(err);
      }
    } else {
      alert('رمز التحقق غير صحيح');
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-blue-600">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center mb-6">إنشاء حساب جديد</h2>

        {step === 1 ? (
          <form onSubmit={handleNext} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
              <input
                type="tel"
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
              <input
                type="password"
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نوع الحساب</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-200"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <option value={UserRole.CUSTOMER}>عميل عادي</option>
                <option value={UserRole.WHOLESALER}>تاجر جملة</option>
              </select>
            </div>

            {formData.role === UserRole.WHOLESALER && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">اسم المحل / النشاط التجاري</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  required
                  placeholder="مثال: بقالة الأمانة"
                />
              </div>
            )}
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">استمرار</button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4 text-center">
            <p className="text-sm text-blue-600 mb-4">{message}</p>
            <input
              type="text"
              placeholder="رمز OTP"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-2xl tracking-widest"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button type="submit" className="w-full py-3 bg-green-600 text-white rounded-xl font-bold">تحقق وتفعيل</button>
            <button type="button" onClick={() => setStep(1)} className="text-gray-500 text-sm">تعديل البيانات</button>
          </form>
        )}

        <button
          onClick={onBackToLogin}
          className="w-full text-center mt-6 text-sm text-gray-500 hover:text-blue-600"
        >
          لديك حساب بالفعل؟ سجل دخولك
        </button>
      </div>
    </div>
  );
};

export default Register;
