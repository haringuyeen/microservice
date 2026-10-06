import React from 'react';
import { Leaf, Sparkles, Droplets } from 'lucide-react';

export const Commitments: React.FC = () => {
  return (
    <section className="my-16 py-12 px-6 sm:px-12 bg-mint/60 border-y border-mint-border rounded-3xl max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        
        {/* Commitment 1 */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white border border-mint-border flex items-center justify-center text-olive-700 mb-4 shadow-xs">
            <Leaf size={22} />
          </div>
          <h3 className="font-serif text-lg font-bold text-charcoal tracking-wide mb-2">
            100% Organic
          </h3>
          <p className="text-xs text-subtitle font-light leading-relaxed max-w-xs">
            We craft all formulas using the most respected organic ingredients, free from harsh additives and cruelty-free.
          </p>
        </div>

        {/* Commitment 2 */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white border border-mint-border flex items-center justify-center text-olive-700 mb-4 shadow-xs">
            <Sparkles size={22} />
          </div>
          <h3 className="font-serif text-lg font-bold text-charcoal tracking-wide mb-2">
            Fits your skin
          </h3>
          <p className="text-xs text-subtitle font-light leading-relaxed max-w-xs">
            Facial natural and processed based on traditional botanical knowledge, tailored seamlessly for every complexion.
          </p>
        </div>

        {/* Commitment 3 */}
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white border border-mint-border flex items-center justify-center text-olive-700 mb-4 shadow-xs">
            <Droplets size={22} />
          </div>
          <h3 className="font-serif text-lg font-bold text-charcoal tracking-wide mb-2">
            Easy to use
          </h3>
          <p className="text-xs text-subtitle font-light leading-relaxed max-w-xs">
            Packed with a unique minimalist design as well as neutral textures that effortlessly elevate your daily care ritual.
          </p>
        </div>

      </div>
    </section>
  );
};
