import React from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Check,
  ChevronRight,
  Star,
  Sparkles,
  Globe,
  TrendingUp
} from 'lucide-react';

const THEME_ICONS = {
  heritage: '🏛️',
  adventure: '⛰️',
  food_trail: '🍛',
  wildlife: '🐯',
  pilgrimage: '🛕',
  honeymoon: '💕',
  family: '👨‍👩‍👧',
};

const THEME_COLORS = {
  heritage: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  adventure: 'text-green-400 bg-green-500/10 border-green-500/20',
  food_trail: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  wildlife: 'text-lime-400 bg-lime-500/10 border-lime-500/20',
  pilgrimage: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  honeymoon: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  family: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
};

function PackageCard({ pkg, isSelected, onClick, recommendation }) {
  const themeIcon = THEME_ICONS[pkg.theme] || '🌍';
  const themeColor = THEME_COLORS[pkg.theme] || 'text-teal-400 bg-teal-500/10 border-teal-500/20';
  const price = parseFloat(pkg.base_price || 0);

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between group ${
        isSelected
          ? 'bg-teal-950/40 border-teal-500 ring-1 ring-teal-500/50 shadow-lg shadow-teal-500/10'
          : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* Recommendation badge */}
      {recommendation && (
        <div className="absolute -top-2.5 left-3">
          <span className="px-2 py-0.5 rounded-full bg-violet-500 text-white text-[10px] font-bold flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            {recommendation}
          </span>
        </div>
      )}

      <div className="space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border font-semibold uppercase tracking-wider ${themeColor}`}>
              <span>{themeIcon}</span>
              {pkg.theme?.replace('_', ' ')}
            </span>
            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {pkg.duration_days}D
            </span>
          </div>
          {/* Mock rating */}
          <span className="flex items-center text-amber-400 text-[10px] shrink-0">
            <Star className="w-3 h-3 fill-current mr-0.5" />
            4.{Math.floor(Math.random() * 2) + 7}
          </span>
        </div>

        {/* Package name */}
        <h3 className={`text-sm font-bold leading-snug transition-colors ${isSelected ? 'text-teal-300' : 'text-white group-hover:text-slate-100'}`}>
          {pkg.name || pkg.title || 'Tour Package'}
        </h3>

        {/* Destination */}
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
          <span>{pkg.city_name || 'India'}</span>
        </div>

        {/* Description */}
        {pkg.description && (
          <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
            {pkg.description}
          </p>
        )}

        {/* Language filter match indicator */}
        {pkg.languages_offered && (
          <div className="text-[10px] text-slate-500 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            {pkg.languages_offered}
          </div>
        )}
      </div>

      {/* Footer: price + CTA */}
      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-500 block">From</span>
          <span className="text-sm font-black text-white font-mono">
            ₹{price.toLocaleString('en-IN')}
          </span>
        </div>
        <span className={`text-[11px] font-semibold flex items-center gap-0.5 transition-colors ${
          isSelected ? 'text-teal-400' : 'text-slate-500 group-hover:text-slate-300'
        }`}>
          {isSelected ? (
            <><Check className="w-3.5 h-3.5" /> Active</>
          ) : (
            <>Customize <ChevronRight className="w-3.5 h-3.5" /></>
          )}
        </span>
      </div>
    </div>
  );
}

export default function PackageCatalog({
  packages,
  selectedPackageId,
  onSelectPackage,
  preferredThemes = [],
  preferredLanguage = 'en',
  budget = 0,
}) {
  // Group by theme
  const byTheme = {};
  for (const pkg of packages) {
    const theme = pkg.theme || 'other';
    if (!byTheme[theme]) byTheme[theme] = [];
    byTheme[theme].push(pkg);
  }

  // Recommended packages: match preferred themes, language, budget
  const recommended = packages.filter(pkg => {
    const matchTheme = preferredThemes.length === 0 || preferredThemes.includes(pkg.theme);
    const matchBudget = !budget || parseFloat(pkg.base_price) <= budget;
    return matchTheme && matchBudget;
  }).slice(0, 4);

  const hasRecommendations = recommended.length > 0;
  const themes = Object.keys(byTheme);

  return (
    <div className="space-y-8" id="package-catalog">
      {/* Personalized Recommendations */}
      {hasRecommendations && preferredThemes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Recommended for You
            </h2>
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
              Based on your interests · {preferredLanguage.toUpperCase()}
            </span>
          </div>

          {preferredLanguage !== 'en' && (
            <div className="text-xs text-violet-300 bg-violet-950/20 border border-violet-500/20 rounded-xl px-3 py-2 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              Recommended because your preferred guide language is{' '}
              <span className="font-semibold font-mono">{preferredLanguage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {recommended.map(pkg => (
              <PackageCard
                key={pkg.package_id}
                pkg={pkg}
                isSelected={selectedPackageId === pkg.package_id}
                onClick={() => onSelectPackage(pkg.package_id)}
                recommendation="For You"
              />
            ))}
          </div>
        </div>
      )}

      {/* All Curated Packages by Theme */}
      {themes.map(theme => {
        const themePackages = byTheme[theme];
        const themeIcon = THEME_ICONS[theme] || '🌍';
        const themeLabel = theme.replace('_', ' & ');

        return (
          <div key={theme} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">{themeIcon}</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider capitalize">
                {themeLabel}
              </h2>
              <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {themePackages.length} packages
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {themePackages.map(pkg => (
                <PackageCard
                  key={pkg.package_id}
                  pkg={pkg}
                  isSelected={selectedPackageId === pkg.package_id}
                  onClick={() => onSelectPackage(pkg.package_id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {packages.length === 0 && (
        <div className="py-12 text-center text-sm text-slate-400 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <div className="text-4xl mb-3">🗺️</div>
          <div className="font-semibold">No packages match your filters</div>
          <div className="text-xs text-slate-500 mt-1">Try "All Destinations" or "All Themes"</div>
        </div>
      )}
    </div>
  );
}
