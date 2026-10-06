import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';

const STORIES = [
  {
    id: 1,
    title: 'The Art of Botanical Infusions for Morning Glow',
    date: 'September 2026',
    category: 'Rituals',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600',
    summary: 'Discover how cold-pressed botanical essences reactivate cell vitality during sunrise skincare rituals.'
  },
  {
    id: 2,
    title: 'Scented Notes: Why Natural Bergamot Relaxes Mind & Skin',
    date: 'August 2026',
    category: 'Ingredients',
    image: 'https://images.unsplash.com/photo-1512290900672-1f4864c399c6?w=600',
    summary: 'Unveiling the therapeutic chemistry behind steam-distilled bergamot and neroli blossoms.'
  },
  {
    id: 3,
    title: 'A Minimalist Approach to Deep Evening Restoration',
    date: 'August 2026',
    category: 'Skincare',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600',
    summary: 'Why less is truly more when applying overnight plant-based peptide repair elixirs.'
  },
  {
    id: 4,
    title: 'Sustainable Harvesting in Alpine Botanical Gardens',
    date: 'July 2026',
    category: 'Heritage',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600',
    summary: 'A journey into high-altitude floral cultivation that respects seasonal regeneration cycles.'
  }
];

export const StoriesSection: React.FC = () => {
  const [startIndex, setStartIndex] = useState(0);

  const prevStory = () => {
    setStartIndex((prev) => (prev === 0 ? STORIES.length - 3 : Math.max(0, prev - 1)));
  };

  const nextStory = () => {
    setStartIndex((prev) => (prev >= STORIES.length - 3 ? 0 : prev + 1));
  };

  const visibleStories = STORIES.slice(startIndex, startIndex + 3);

  return (
    <section id="stories" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header & Slider Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] font-semibold text-olive-600 block mb-1">
            VELVETY Journal
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-charcoal tracking-tight">
            Scented stories for every mood
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prevStory}
            className="w-10 h-10 rounded-full border border-mint-border bg-white hover:bg-mint flex items-center justify-center text-charcoal transition-colors shadow-xs"
            title="Trước"
          >
            <ArrowLeft size={16} />
          </button>
          <button
            onClick={nextStory}
            className="w-10 h-10 rounded-full border border-mint-border bg-white hover:bg-mint flex items-center justify-center text-charcoal transition-colors shadow-xs"
            title="Tiếp"
          >
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Stories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {visibleStories.map((story) => (
          <div
            key={story.id}
            className="group flex flex-col justify-between rounded-3xl bg-white border border-mint-border overflow-hidden p-5 hover:shadow-lg transition-all duration-300"
          >
            <div>
              {/* Image Frame */}
              <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden mb-4 bg-mint-card">
                <img
                  src={story.image}
                  alt={story.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full text-olive-800">
                  {story.category}
                </span>
              </div>

              <div className="text-[11px] text-subtitle mb-2">{story.date}</div>

              <h3 className="font-serif text-lg font-bold text-charcoal leading-snug group-hover:text-olive-700 transition-colors">
                {story.title}
              </h3>

              <p className="text-xs text-subtitle font-light mt-2 line-clamp-2 leading-relaxed">
                {story.summary}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-mint-border flex items-center justify-between">
              <span className="text-xs font-semibold text-olive-800 group-hover:underline flex items-center gap-1">
                Read more <ArrowUpRight size={13} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
