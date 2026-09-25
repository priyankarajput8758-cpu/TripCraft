import React, { useState } from 'react';
import { t } from '../i18n';

const ADDONS = [
  {
    id: 'food_walk',
    name: 'Heritage Food Walk',
    description: 'Explore local street food, heritage eateries, and culinary secrets with a food expert.',
    price: 1200,
    duration: '3 hours',
    tags: ['food', 'heritage', 'food_trail'],
  },
  {
    id: 'cultural_evening',
    name: 'Cultural Evening Show',
    description: 'Immersive folk performance — classical dance, traditional music, and storytelling.',
    price: 800,
    duration: '2 hours',
    tags: ['heritage', 'honeymoon', 'family'],
  },
  {
    id: 'craft_workshop',
    name: 'Local Craft Workshop',
    description: 'Hands-on session with artisans — pottery, block printing, or traditional weaving.',
    price: 1500,
    duration: '2.5 hours',
    tags: ['heritage', 'family'],
  },
  {
    id: 'photo_walk',
    name: 'Photography Experience',
    description: 'Guided photo walk to the most photogenic spots with a professional photographer.',
    price: 2500,
    duration: '4 hours',
    tags: ['adventure', 'honeymoon'],
  },
  {
    id: 'sunrise_trek',
    name: 'Sunrise Trek & Nature Walk',
    description: 'Early morning guided trek to a scenic viewpoint — perfect for adventure seekers.',
    price: 1800,
    duration: '5 hours',
    tags: ['adventure', 'wildlife'],
  },
  {
    id: 'temple_circuit',
    name: 'Sacred Temple Circuit',
    description: 'Guided visit to the most significant temples with historical and spiritual context.',
    price: 900,
    duration: '3 hours',
    tags: ['pilgrimage', 'heritage'],
  },
  {
    id: 'cooking_class',
    name: 'Regional Cooking Class',
    description: 'Learn authentic regional recipes with local chefs in a traditional kitchen setting.',
    price: 2000,
    duration: '3 hours',
    tags: ['food_trail', 'family'],
  },
  {
    id: 'bonfire_night',
    name: 'Romantic Bonfire Night',
    description: 'Private stargazing experience with bonfire, folk music, and curated cuisine.',
    price: 3500,
    duration: '3 hours',
    tags: ['honeymoon'],
  },
];

export default function AddOnsPanel({
  selectedTheme,
  onAddOnsChange,
  currentAddOns = [],
  preferredLanguage = 'en',
  currency = 'INR',
  currencySymbol = '₹'
}) {
  const [addedIds, setAddedIds] = useState(new Set(currentAddOns));

  const relevantAddons = selectedTheme
    ? ADDONS.filter(a => a.tags.includes(selectedTheme) || a.tags.length === 0)
    : ADDONS;

  const toggle = (id, price) => {
    const newSet = new Set(addedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setAddedIds(newSet);
    onAddOnsChange?.(Array.from(newSet), Array.from(newSet).reduce((sum, aid) => {
      const addon = ADDONS.find(a => a.id === aid);
      return sum + (addon?.price || 0);
    }, 0));
  };

  const totalAddOnCost = Array.from(addedIds).reduce((sum, id) => {
    const addon = ADDONS.find(a => a.id === id);
    return sum + (addon?.price || 0);
  }, 0);

  return (
    <div className="bg-white/60 backdrop-blur-md border border-[#84D175]/35 rounded-3xl p-6 space-y-4 shadow-xs text-[#1a2e1a]">
      <div className="flex items-center justify-between border-b border-[#84D175]/25 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-[#1a2e1a]">
            {t('recommended_add_ons', preferredLanguage)}
          </h3>
          <p className="text-xs sm:text-sm text-[#1a2e1a] font-medium">
            {t('personalized_theme', preferredLanguage)}
          </p>
        </div>
        {addedIds.size > 0 && (
          <div className="text-right">
            <div className="text-xs text-[#1a2e1a] font-bold">Add-ons Total</div>
            <div className="text-base sm:text-lg font-serif font-bold text-[#2D6A24]">
              +{currencySymbol}{totalAddOnCost.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {relevantAddons.map(addon => {
          const isAdded = addedIds.has(addon.id);
          return (
            <div
              key={addon.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isAdded
                  ? 'bg-[#84D175]/30 border-[#84D175] shadow-xs ring-1 ring-[#84D175]/40'
                  : 'bg-white/60 border-[#84D175]/35 hover:bg-white'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#1a2e1a]">{addon.name}</div>
                    <div className="text-xs text-[#1a2e1a] font-medium mt-0.5">
                      Duration: {addon.duration}
                    </div>
                  </div>
                  {isAdded && (
                    <span className="text-xs uppercase font-bold text-[#2D6A24] bg-[#84D175]/25 px-2 py-0.5 rounded">
                      Added
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-[#1a2e1a] leading-relaxed line-clamp-2 font-medium">
                  {addon.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#84D175]/25 flex items-center justify-between">
                <span className="text-xs sm:text-sm font-mono font-bold text-[#1a2e1a]">
                  {currencySymbol}{addon.price.toLocaleString()}
                  <span className="text-xs text-[#1a2e1a] font-medium ml-1">/ person</span>
                </span>
                <button
                  onClick={() => toggle(addon.id, addon.price)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-rose-100 text-rose-800 border border-rose-200 hover:bg-rose-200'
                      : 'bg-[#84D175] text-[#1a2e1a] hover:bg-[#67C456] shadow-xs'
                  }`}
                >
                  {isAdded ? 'Remove' : 'Add'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
