import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  SlidersHorizontal,
  Sparkles,
  ArrowUpDown,
  X,
  Cpu,
  Layers,
  Check,
  ChevronDown
} from 'lucide-react';
import { AI_MODELS, AiModel } from '../data/aiModelsData';
import { ModelCard } from './ModelCard';
import { LanguageCode, getTranslation } from '../lib/translations';

interface AiModelMarketplaceProps {
  onDeployModel: (model: AiModel) => void;
  onOpenDetails: (model: AiModel) => void;
  onToggleCompare: (model: AiModel) => void;
  comparedModelIds: string[];
  isDarkMode?: boolean;
  currentLang?: LanguageCode;
}

export const AiModelMarketplace: React.FC<AiModelMarketplaceProps> = ({
  onDeployModel,
  onOpenDetails,
  onToggleCompare,
  comparedModelIds,
  isDarkMode = true,
  currentLang = 'en',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedDeveloper, setSelectedDeveloper] = useState<string>('All');
  const [selectedCapability, setSelectedCapability] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'context' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [visibleCount, setVisibleCount] = useState<number>(12);

  const categories = [
    'All',
    'Reasoning & LLM',
    'Multimodal & Vision',
    'Code Generation',
    'Video & 3D Diffusion',
    'Image Generation',
    'Audio & Speech',
    'Open Source Weights',
    'Enterprise & Agents',
  ];

  const developers = [
    { label: 'All Developers', value: 'All' },
    { label: 'Google DeepMind', value: 'Google DeepMind' },
    { label: 'OpenAI', value: 'OpenAI' },
    { label: 'Anthropic', value: 'Anthropic' },
    { label: 'Meta AI', value: 'Meta AI' },
    { label: 'DeepSeek', value: 'DeepSeek' },
    { label: 'Mistral AI', value: 'Mistral AI' },
    { label: 'Alibaba Qwen', value: 'Alibaba Qwen' },
    { label: 'Cohere', value: 'Cohere' },
    { label: 'xAI', value: 'xAI' },
    { label: 'Seedance Video', value: 'Seedance AI' },
  ];

  const capabilityFilters = [
    'All',
    'Multimodal',
    'Reasoning',
    'Code',
    'Vision',
    'Open Weights',
  ];

  // Filter & Sort Logic
  const filteredModels = useMemo(() => {
    let result = AI_MODELS;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.developer.toLowerCase().includes(q) ||
          m.version.toLowerCase().includes(q) ||
          m.shortDescription.toLowerCase().includes(q) ||
          m.capabilities.some((c) => c.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      result = result.filter((m) => m.category === selectedCategory);
    }

    // Developer filter
    if (selectedDeveloper !== 'All') {
      result = result.filter((m) => m.developer === selectedDeveloper);
    }

    // Capability filter
    if (selectedCapability !== 'All') {
      result = result.filter((m) =>
        m.capabilities.some((c) => c.toLowerCase().includes(selectedCapability.toLowerCase()))
      );
    }

    // Sorting
    return [...result].sort((a, b) => {
      if (sortBy === 'featured') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return 0;
      }
      if (sortBy === 'context') {
        return b.contextTokens - a.contextTokens;
      }
      if (sortBy === 'price-asc') {
        const pA = typeof a.pricing.inputPer1M === 'number' ? a.pricing.inputPer1M : 0;
        const pB = typeof b.pricing.inputPer1M === 'number' ? b.pricing.inputPer1M : 0;
        return pA - pB;
      }
      if (sortBy === 'price-desc') {
        const pA = typeof a.pricing.inputPer1M === 'number' ? a.pricing.inputPer1M : 0;
        const pB = typeof b.pricing.inputPer1M === 'number' ? b.pricing.inputPer1M : 0;
        return pB - pA;
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });
  }, [searchQuery, selectedCategory, selectedDeveloper, selectedCapability, sortBy]);

  const displayedModels = filteredModels.slice(0, visibleCount);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedDeveloper('All');
    setSelectedCapability('All');
    setSortBy('featured');
    setVisibleCount(12);
  };

  return (
    <section id="models-marketplace" className="relative py-6 sm:py-8 px-3 sm:px-4 max-w-7xl mx-auto w-full">
      {/* Ambient background glows */}
      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-cyan-600/10 blur-[120px] pointer-events-none -z-10 rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-fuchsia-600/10 blur-[130px] pointer-events-none -z-10 rounded-full" />

      {/* Section Header: Compact & Concise */}
      <div className="text-center max-w-3xl mx-auto mb-5 sm:mb-6">
        <div
          className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10.5px] font-mono font-semibold mb-2 border ${
            isDarkMode
              ? 'text-cyan-300 bg-cyan-950/60 border-cyan-500/30'
              : 'text-indigo-900 bg-indigo-50 border-indigo-200 shadow-sm'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>{getTranslation(currentLang, 'catalogBadge')}</span>
        </div>
        <h2 className="text-xl sm:text-3xl md:text-4xl font-black tracking-tight mb-1.5 leading-tight">
          <span className={isDarkMode ? 'text-white' : 'text-slate-900'}>
            {getTranslation(currentLang, 'catalogTitle1')}{' '}
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-indigo-500 to-fuchsia-600">
            {getTranslation(currentLang, 'catalogTitle2')}
          </span>
        </h2>
        <p
          className={`text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed font-medium ${
            isDarkMode ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          {getTranslation(currentLang, 'catalogDesc')}
        </p>
      </div>

      {/* Control Bar: Compact padding, zero horizontal overflow */}
      <div
        className={`rounded-xl p-3 sm:p-4 mb-6 border backdrop-blur-xl ${
          isDarkMode
            ? 'bg-[#0B0F19]/85 border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.5)]'
            : 'bg-white/90 border-slate-200 shadow-sm'
        }`}
      >
        {/* Search & Dropdown Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5 mb-3">
          {/* Main Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500" />
            <input
              type="text"
              id="input-marketplace-search"
              placeholder={getTranslation(currentLang, 'searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(24);
              }}
              className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                isDarkMode
                  ? 'bg-[#05070F] text-white placeholder-slate-500 border border-white/10 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400'
                  : 'bg-slate-50 text-slate-900 placeholder-slate-400 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
              } outline-none`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Developer Dropdown */}
          <div className="relative shrink-0">
            <select
              value={selectedDeveloper}
              onChange={(e) => {
                setSelectedDeveloper(e.target.value);
                setVisibleCount(24);
              }}
              className={`w-full md:w-44 py-2.5 px-3 rounded-xl text-xs font-semibold appearance-none cursor-pointer border ${
                isDarkMode
                  ? 'bg-[#05070F] text-slate-200 border-white/10 hover:border-white/20'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
              } outline-none`}
            >
              {developers.map((d) => (
                <option key={d.value} value={d.value} className="bg-slate-900 text-white">
                  {d.value === 'All' ? getTranslation(currentLang, 'allDevelopers') : d.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          {/* Sort By Dropdown */}
          <div className="relative shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`w-full md:w-44 py-2.5 px-3 rounded-xl text-xs font-semibold appearance-none cursor-pointer border ${
                isDarkMode
                  ? 'bg-[#05070F] text-slate-200 border-white/10 hover:border-white/20'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
              } outline-none`}
            >
              <option value="featured" className="bg-slate-900 text-white">
                {getTranslation(currentLang, 'sortFeatured')}
              </option>
              <option value="context" className="bg-slate-900 text-white">
                {getTranslation(currentLang, 'sortContext')}
              </option>
              <option value="price-asc" className="bg-slate-900 text-white">
                {getTranslation(currentLang, 'sortPriceAsc')}
              </option>
              <option value="price-desc" className="bg-slate-900 text-white">
                {getTranslation(currentLang, 'sortPriceDesc')}
              </option>
              <option value="name" className="bg-slate-900 text-white">
                {getTranslation(currentLang, 'sortName')}
              </option>
            </select>
            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Category Horizontal Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setVisibleCount(24);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Capability Tags Row */}
        <div className="flex items-center justify-between gap-3 pt-2.5 mt-2.5 border-t border-white/[0.06] text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-slate-400 font-mono text-[10px] uppercase shrink-0">
              {getTranslation(currentLang, 'capability')}
            </span>
            {capabilityFilters.map((cap) => (
              <button
                key={cap}
                onClick={() => {
                  setSelectedCapability(cap);
                  setVisibleCount(24);
                }}
                className={`px-2 py-0.5 rounded text-[10.5px] font-mono cursor-pointer transition-colors whitespace-nowrap ${
                  selectedCapability === cap
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : isDarkMode
                    ? 'text-slate-400 hover:text-slate-200 bg-white/5'
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                }`}
              >
                {cap}
              </button>
            ))}
          </div>

          {/* Results Counter */}
          <div className="text-[11px] font-mono text-slate-400 shrink-0">
            {getTranslation(currentLang, 'showing')}{' '}
            <strong className="text-cyan-400 tabular-nums">{displayedModels.length}</strong>{' '}
            {getTranslation(currentLang, 'of')}{' '}
            <span className="tabular-nums">{filteredModels.length}</span>{' '}
            {getTranslation(currentLang, 'models')}
          </div>
        </div>
      </div>

      {/* Dynamic Product Grid: Responsive clean grid */}
      {filteredModels.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {displayedModels.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onDeploy={onDeployModel}
                onOpenDetails={onOpenDetails}
                onToggleCompare={onToggleCompare}
                isCompared={comparedModelIds.includes(model.id)}
                isDarkMode={isDarkMode}
                currentLang={currentLang}
              />
            ))}
          </div>

          {/* Load More Button: Only on click loads 12 more models */}
          {visibleCount < filteredModels.length && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setVisibleCount((prev) => Math.min(prev + 12, filteredModels.length))}
                id="btn-load-more-models"
                className="py-3 px-8 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 mx-auto border border-blue-400/40"
              >
                <span>
                  {getTranslation(currentLang, 'loadMore')} ({displayedModels.length} / {filteredModels.length})
                </span>
              </button>
            </div>
          )}
        </>
      ) : (
        /* Empty State */
        <div
          className={`text-center py-12 px-4 rounded-xl border ${
            isDarkMode ? 'bg-[#0B0F19]/50 border-white/10 text-slate-300' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold mb-1">No AI Models Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
            No models matched your search query "{searchQuery}". Try broadening your criteria.
          </p>
          <button
            onClick={resetFilters}
            className="py-1.5 px-4 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </section>
  );
};
