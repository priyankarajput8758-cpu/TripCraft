import React, { useState } from 'react';
import { Plus, Minus, Check, Clock, ShoppingBag } from 'lucide-react';
import { t } from '../i18n';

const ADDONS = [
  {
    id: 'food_walk',
    name: 'Heritage Food Walk',
    description: 'Explore local street food, heritage eateries, and culinary secrets with a food expert.',
    price: 1200,
    duration: '3 hours',
    icon: '🍛',
    tags: ['food', 'heritage', 'food_trail'],
  },
  {
    id: 'cultural_evening',
    name: 'Cultural Evening Show',
    description: 'Immersive folk performance — classical dance, traditional music, and storytelling.',
    price: 800,
    duration: '2 hours',
    icon: '🎭',
    tags: ['heritage', 'honeymoon', 'family'],
  },
  {
    id: 'craft_workshop',
    name: 'Local Craft Workshop',
    description: 'Hands-on session with artisans — pottery, block printing, or traditional weaving.',
    price: 1500,
    duration: '2.5 hours',
    icon: '🏺',
    tags: ['heritage', 'family'],
  },
  {
    id: 'photo_walk',
    name: 'Photography Experience',
    description: 'Guided photo walk to the most photogenic spots with a professional photographer.',
    price: 2500,
    duration: '4 hours',
    icon: '📸',
    tags: ['adventure', 'honeymoon'],
  },
  {
    id: 'sunrise_trek',
    name: 'Sunrise Trek & Nature Walk',
    description: 'Early morning guided trek to a scenic viewpoint — perfect for adventure seekers.',
    price: 1800,
    duration: '5 hours',
    icon: '🌄',
    tags: ['adventure', 'wildlife'],
  },
  {
    id: 'temple_circuit',
    name: 'Sacred Temple Circuit',
    description: 'Guided visit to the most significant temples with historical and spiritual context.',
    price: 900,
    duration: '3 hours',
    icon: '🛕',
    tags: ['pilgrimage', 'heritage'],
  },
  {
    id: 'cooking_class',
    name: 'Regional Cooking Class',
    description: 'Learn authentic regional recipes with local chefs in a traditional kitchen setting.',
    price: 2000,
    duration: '3 hours',
    icon: '👨‍🍳',
    tags: ['food_trail', 'family'],
  },
  {
    id: 'bonfire_night',
    name: 'Romantic Bonfire Night',
    description: 'Private stargazing experience with bonfire, folk music, and curated cuisine.',
    price: 3500,
    duration: '3 hours',
    icon: '🔥',
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
    <div className="bg-white border border-slate-200/90 rounded-3xl p-6 space-y-4 shadow-sm text-slate-900">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 font-bold">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              {t('recommended_add_ons', preferredLanguage)}
            </h3>
            <p className="text-xs text-slate-500">
              {t('personalized_theme', preferredLanguage)}
            </p>
          </div>
        </div>
        {addedIds.size > 0 && (
          <div className="text-right">
            <div className="text-xs text-slate-500 font-medium">Add-ons Total</div>
            <div className="text-sm font-bold text-blue-600 font-mono">
              +{currencySymbol}{totalAddOnCost.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {relevantAddons.map(addon => {
          const isAdded = addedIds.has(addon.id);
          return (
            <div
              key={addon.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isAdded
                  ? 'bg-blue-50/50 border-2 border-blue-600 shadow-sm'
                  : 'bg-slate-50 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{addon.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{addon.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        {addon.duration}
                      </div>
                    </div>
                  </div>
                  {isAdded && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                  {addon.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {currencySymbol}{addon.price.toLocaleString()}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">/ person</span>
                </span>
                <button
                  onClick={() => toggle(addon.id, addon.price)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isAdded
                      ? 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100'
                      : 'bg-blue-600 text-white hover:bg-blue-500 shadow-sm'
                  }`}
                >
                  {isAdded ? (
                    <><Minus className="w-3 h-3" /><span>Remove</span></>
                  ) : (
                    <><Plus className="w-3 h-3" /><span>+ Add</span></>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
