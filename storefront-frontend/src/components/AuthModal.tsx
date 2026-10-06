import React, { useState } from 'react';
import { X, User, Lock, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';
import { useCustomerAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useCustomerAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({ email, password, fullName, phone, address });
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Đăng nhập/Đăng ký không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-charcoal/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-mint-border">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-pearl border border-mint-border text-subtitle hover:text-charcoal hover:bg-mint transition-colors"
        >
          <X size={18} />
        </button>

        {/* Tab switch */}
        <div className="flex border-b border-mint-border mb-6">
          <button
            onClick={() => { setMode('login'); setErrorMsg(null); }}
            className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
              mode === 'login'
                ? 'border-b-2 border-olive-600 text-olive-800'
                : 'text-subtitle hover:text-charcoal'
            }`}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => { setMode('register'); setErrorMsg(null); }}
            className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
              mode === 'register'
                ? 'border-b-2 border-olive-600 text-olive-800'
                : 'text-subtitle hover:text-charcoal'
            }`}
          >
            Đăng ký tài khoản
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2 border border-red-200">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {mode === 'register' && (
            <div>
              <label className="block font-semibold text-charcoal mb-1">Họ và tên *</label>
              <div className="relative">
                <User size={14} className="absolute left-3.5 top-3 text-subtitle" />
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Thị Mai"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-mint-border focus:outline-none focus:border-olive-500 bg-pearl"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-charcoal mb-1">Email *</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-3 text-subtitle" />
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-mint-border focus:outline-none focus:border-olive-500 bg-pearl"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-charcoal mb-1">Mật khẩu *</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-3 text-subtitle" />
              <input
                type="password"
                required
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-mint-border focus:outline-none focus:border-olive-500 bg-pearl"
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block font-semibold text-charcoal mb-1">Số điện thoại</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-3 text-subtitle" />
                  <input
                    type="tel"
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-mint-border focus:outline-none focus:border-olive-500 bg-pearl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-charcoal mb-1">Địa chỉ mặc định</label>
                <div className="relative">
                  <MapPin size={14} className="absolute left-3.5 top-3 text-subtitle" />
                  <input
                    type="text"
                    placeholder="Địa chỉ giao hàng"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-mint-border focus:outline-none focus:border-olive-500 bg-pearl"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-6 rounded-2xl bg-olive-600 hover:bg-olive-700 text-white font-semibold text-xs tracking-wider uppercase transition-colors shadow-md disabled:opacity-50"
          >
            {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

      </div>
    </div>
  );
};
