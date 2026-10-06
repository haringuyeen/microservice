import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section className="py-10 md:py-14 text-center max-w-4xl mx-auto px-4">
      <div className="inline-block text-[11px] uppercase tracking-[0.2em] font-semibold text-olive-700 mb-3 bg-mint px-4 py-1 rounded-full border border-mint-border">
        Hệ Thống Bán Lẻ & Phân Phối Trực Tuyến
      </div>
      
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-medium tracking-tight text-charcoal leading-tight">
        Sản Phẩm Đa Dạng & Chính Hãng
      </h1>
      
      <p className="mt-3 text-xs sm:text-sm text-subtitle max-w-xl mx-auto font-light leading-relaxed">
        Khám phá các sản phẩm thiết bị điện tử, đồ gia dụng, văn phòng phẩm, nội thất kho vận và mỹ phẩm chăm sóc da chất lượng cao, đồng bộ kho vận thời gian thực.
      </p>
    </section>
  );
};
