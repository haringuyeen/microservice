import React from 'react';
import { Clock, MapPin, Mail, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer id="about" className="bg-white border-t border-mint-border text-charcoal pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-12 border-b border-mint-border">
          
          {/* Column 1: Brand & Opening Hours */}
          <div className="space-y-4 max-w-md">
            <div>
              <div className="font-serif text-2xl font-bold tracking-wider text-olive-800">
                Nhóm 9
              </div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-subtitle font-sans -mt-0.5">
                Microservice
              </div>
            </div>

            <p className="text-xs text-subtitle font-light leading-relaxed">
              Hệ sinh thái kiến trúc Microservices & Cửa hàng trực tuyến hiện đại, kết nối đồng bộ thời gian thực cùng hệ thống quản lý kho vận WMS.
            </p>

            <div className="pt-2 text-xs text-subtitle space-y-1.5 font-light">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-olive-700" />
                <span>Thứ 2 - Thứ 7: 8:00 - 20:00</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-olive-700" />
                <span>Chủ nhật: 9:00 - 18:00</span>
              </div>
            </div>
          </div>

          {/* Column 2: Stores & Contact */}
          <div className="space-y-4 md:pl-12">
            <h4 className="font-serif text-sm font-bold tracking-wider uppercase text-charcoal mb-4">
              Thông tin liên hệ
            </h4>
            <div className="space-y-2.5 text-xs text-subtitle font-light">
              <div className="flex items-start gap-2">
                <MapPin size={14} className="text-olive-700 flex-shrink-0 mt-0.5" />
                <span>Trụ sở: Tòa nhà Công nghệ, Hà Nội</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-olive-700 flex-shrink-0" />
                <span>Hotline: 1900 8888 (8h - 20h)</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-olive-700 flex-shrink-0" />
                <span>contact@nhom9-microservices.vn</span>
              </div>
            </div>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-subtitle font-light gap-4">
          <p>© 2026 Nhóm 9 - WMS Microservices System. All rights reserved.</p>
          <div className="flex items-center space-x-6 text-[11px]">
            <a href="#about" className="hover:underline">Privacy Policy</a>
            <a href="#about" className="hover:underline">Terms of Service</a>
            <a href="#about" className="hover:underline">Cookies Settings</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
