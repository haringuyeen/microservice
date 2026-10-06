import React, { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';

export const Newsletter: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 4000);
    }
  };

  return (
    <section id="newsletter" className="my-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-olive-600 rounded-3xl p-8 sm:p-12 text-center text-pearl relative overflow-hidden shadow-xl">
        {/* Subtle Decorative Background Rings */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full border border-olive-500/30 pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full border border-olive-500/30 pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="text-[11px] uppercase tracking-[0.3em] font-semibold text-olive-300 block mb-2">
            Ưu Đãi Đặc Quyền
          </span>

          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-white mb-3">
            Subscribe to get 10% off your first order
          </h2>

          <p className="text-xs sm:text-sm text-olive-100 font-light mb-8 max-w-md mx-auto">
            Nhận tin tức sớm nhất về các đợt phát hành công thức mới, bí quyết chăm sóc da hữu cơ và ưu đãi thành viên VELVETY.
          </p>

          {subscribed ? (
            <div className="inline-flex items-center gap-2 py-3 px-6 rounded-full bg-olive-500 text-white text-xs font-semibold animate-in fade-in duration-200">
              <Check size={16} />
              <span>Cảm ơn bạn! Mã giảm giá 10% đã được gửi tới hòm thư của bạn.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="Nhập địa chỉ email của bạn..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full sm:flex-1 px-5 py-3.5 rounded-full text-xs text-charcoal bg-white placeholder:text-subtitle focus:outline-none focus:ring-2 focus:ring-olive-300"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3.5 rounded-full bg-olive-800 hover:bg-olive-900 text-white text-xs font-semibold tracking-wider uppercase transition-colors flex items-center justify-center gap-2 shadow-md flex-shrink-0"
              >
                <span>Gửi ngay</span>
                <ArrowRight size={14} />
              </button>
            </form>
          )}

          <div className="mt-4 text-[11px] text-olive-200/80">
            Chúng tôi cam kết bảo mật thông tin và không gửi thư rác.
          </div>
        </div>
      </div>
    </section>
  );
};
