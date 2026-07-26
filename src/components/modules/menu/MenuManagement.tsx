import React, { useState, useEffect, useRef } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Sparkles,
  Flame,
  CheckCircle2,
  XCircle,
  FileUp,
  Tag,
  DollarSign,
  Info,
  Clock,
  Copy,
  Archive,
  Eye,
  FileText,
  Keyboard,
  TrendingUp,
  Filter,
  BarChart2,
  SlidersHorizontal,
  X,
  AlertCircle,
  Check
} from 'lucide-react';
import { MenuItem, MenuStatus } from '../../../types';
import { AddEditMenuModal } from './AddEditMenuModal';
import { BulkMenuImportModal } from './BulkMenuImportModal';
import { RevenueGrowthChart } from './RevenueGrowthChart';
import { exportMenuToPdf } from './MenuPdfExporter';

interface MenuManagementProps {
  menuItems: MenuItem[];
  onAddMenuItem: (item: MenuItem) => void;
  onToggleAvailability: (itemId: string) => void;
}

const SECTION_TABS: { id: string; label: string; count?: number }[] = [
  { id: 'all', label: 'All Menu Items' },
  { id: 'categories', label: 'Categories' },
  { id: 'todays_specials', label: "Today's Specials" },
  { id: 'active', label: 'Active Items' },
  { id: 'draft', label: 'Draft Items' },
  { id: 'out_of_stock', label: 'Out of Stock' },
  { id: 'scheduled', label: 'Scheduled Items' }
];

const PROMPT_SUGGESTIONS = [
  'Show vegetarian meals',
  'Find breakfast items',
  'Show beverages',
  'Find meals below $8.00',
  "Show today's specials"
];

export const MenuManagement: React.FC<MenuManagementProps> = ({
  menuItems: initialMenuItems,
  onAddMenuItem,
  onToggleAvailability
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Main State
  const [items, setItems] = useState<MenuItem[]>(initialMenuItems);
  const [activeSectionTab, setActiveSectionTab] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'popularity' | 'price_low' | 'price_high' | 'rating' | 'orders'>('popularity');
  const [showAnalyticsPanel, setShowAnalyticsPanel] = useState(false);

  // Modals & Drawers
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Selected Items for Bulk Action
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Toast Notifications System
  const [toasts, setToasts] = useState<{ id: string; message: string; type?: 'success' | 'info' }[]>([]);

  useEffect(() => {
    setItems(initialMenuItems);
  }, [initialMenuItems]);

  const addToast = (message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setEditingItem(null);
        setIsAddEditOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportMenuToPdf(items);
        addToast('✔ Exporting Menu PDF Report...');
      } else if (e.key === 'Escape') {
        setIsAddEditOpen(false);
        setIsBulkOpen(false);
        setShowShortcutsModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items]);

  // Handle Save from Add/Edit Modal
  const handleSaveItem = (savedItem: MenuItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.id === savedItem.id);
      if (exists) {
        return prev.map((i) => (i.id === savedItem.id ? savedItem : i));
      } else {
        return [savedItem, ...prev];
      }
    });

    onAddMenuItem(savedItem);
  };

  // Quick Duplicate
  const handleDuplicate = (item: MenuItem) => {
    const duplicated: MenuItem = {
      ...item,
      id: `menu-copy-${Date.now()}`,
      name: `${item.name} (Copy)`,
      status: 'draft',
      isAvailable: false
    };

    setItems((prev) => [duplicated, ...prev]);
    addToast(`✔ Duplicated "${item.name}" to Drafts`);
  };

  // Quick Archive
  const handleArchive = (itemId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, status: 'archived', isAvailable: false } : i))
    );
    addToast('✔ Menu item archived');
  };

  // Toggle Selection
  const toggleSelectItem = (id: string) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkStatusChange = (newStatus: MenuStatus) => {
    if (selectedItemIds.length === 0) return;
    setItems((prev) =>
      prev.map((i) =>
        selectedItemIds.includes(i.id)
          ? { ...i, status: newStatus, isAvailable: newStatus === 'published' }
          : i
      )
    );
    addToast(`✔ Updated ${selectedItemIds.length} items to ${newStatus}`);
    setSelectedItemIds([]);
  };

  // Filtering Logic
  const filteredItems = items.filter((item) => {
    // 1. Section Tab Filter
    if (activeSectionTab === 'todays_specials' && !item.isTodaysSpecial) return false;
    if (activeSectionTab === 'active' && (!item.isAvailable || item.status === 'archived')) return false;
    if (activeSectionTab === 'draft' && item.status !== 'draft') return false;
    if (activeSectionTab === 'out_of_stock' && item.status !== 'out_of_stock' && item.isAvailable) return false;
    if (activeSectionTab === 'scheduled' && item.status !== 'scheduled') return false;

    // 2. Category Filter
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;

    // 3. Search & Natural Query Parsing
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();

      // Smart natural query matches
      if (q.includes('veg') && !item.isVegetarian) return false;
      if (q.includes('non-veg') && item.isVegetarian) return false;
      if (q.includes('today') && !item.isTodaysSpecial) return false;
      if (q.includes('below') || q.includes('<')) {
        const num = parseFloat(q.replace(/[^0-9.]/g, ''));
        if (num && item.price > num) return false;
      }

      // Standard text search
      const textMatch =
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.vendorName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));

      if (!textMatch) return false;
    }

    return true;
  });

  // Sorting
  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    if (sortBy === 'rating') return (b.analytics?.averageRating || 0) - (a.analytics?.averageRating || 0);
    if (sortBy === 'orders') return (b.analytics?.orders || 0) - (a.analytics?.orders || 0);
    return (b.aiPopularityScore || 0) - (a.aiPopularityScore || 0);
  });

  // Extract All Categories for Sub-Filter
  const allCategories = ['All', ...Array.from(new Set(items.map((i) => i.category)))];

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      {/* Toast Notifications Floating Bar */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto px-4 py-3 rounded-2xl bg-[#0C0C0E] border border-indigo-500/40 text-white text-xs font-bold shadow-2xl flex items-center space-x-2 animate-bounce-short"
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Main Module Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>LX AI-Enhanced Workspace</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Campus Menu Management</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage canteen dishes, auto-detect categories, generate LX AI descriptions, and track student demand analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAnalyticsPanel(!showAnalyticsPanel)}
            className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center space-x-2 ${
              showAnalyticsPanel
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
            }`}
          >
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>{showAnalyticsPanel ? 'Hide Analytics' : 'Live Analytics & Heatmap'}</span>
          </button>

          <button
            onClick={() => exportMenuToPdf(items)}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Export Catalog PDF</span>
          </button>

          <button
            onClick={() => setIsBulkOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold transition-all flex items-center space-x-2"
          >
            <FileUp className="w-4 h-4 text-indigo-400" />
            <span>Bulk Import (CSV)</span>
          </button>

          <button
            onClick={() => setShowShortcutsModal(true)}
            className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
            title="Keyboard Shortcuts (Ctrl+N, Ctrl+F, Ctrl+E)"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsAddEditOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      {/* Collapsible Analytics & Heatmap Panel */}
      {showAnalyticsPanel && (
        <RevenueGrowthChart
          menuItems={items}
          onReorderPriority={(reordered) => {
            setItems(reordered);
            addToast('✔ Reordered KDS & Student App priority queue');
          }}
        />
      )}

      {/* Primary Section Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto border-b border-zinc-800/80 pb-2">
        {SECTION_TABS.map((tab) => {
          const isActive = activeSectionTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSectionTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search, Categories, Sort, and Smart Suggestions Bar */}
      <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-zinc-800/80 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {allCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input & Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search or try 'vegetarian', 'below $8'..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
            >
              <option value="popularity">Sort: LX Popularity</option>
              <option value="price_low">Sort: Price Low to High</option>
              <option value="price_high">Sort: Price High to Low</option>
              <option value="rating">Sort: Student Rating</option>
              <option value="orders">Sort: Highest Orders</option>
            </select>
          </div>
        </div>

        {/* Smart Query Prompts */}
        <div className="flex items-center space-x-2 pt-1 overflow-x-auto text-xs">
          <span className="text-[10px] text-zinc-500 font-bold uppercase shrink-0">Smart Search Prompts:</span>
          {PROMPT_SUGGESTIONS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => setSearchTerm(prompt)}
              className="px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-400 hover:text-indigo-300 text-[11px] shrink-0 transition-colors"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Action Controls if items selected */}
      {selectedItemIds.length > 0 && (
        <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center space-x-2 text-indigo-300">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold">{selectedItemIds.length} menu items selected</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleBulkStatusChange('published')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              Publish Selected
            </button>
            <button
              onClick={() => handleBulkStatusChange('out_of_stock')}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold"
            >
              Mark Out of Stock
            </button>
            <button
              onClick={() => handleBulkStatusChange('archived')}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold"
            >
              Archive Selected
            </button>
            <button
              onClick={() => setSelectedItemIds([])}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Menu Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedItems.map((item) => {
          const isSelected = selectedItemIds.includes(item.id);

          return (
            <div
              key={item.id}
              className={`group rounded-3xl bg-[#0C0C0E] border transition-all duration-300 overflow-hidden shadow-xl flex flex-col justify-between ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/20'
                  : 'border-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div>
                {/* Image & Badges */}
                <div className="relative h-48 overflow-hidden bg-zinc-950">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Selection Checkbox */}
                  <div className="absolute top-3 left-3 z-10">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-4 h-4 rounded border-zinc-700 bg-black/60 text-indigo-600 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  {/* Top Tags & Vendor */}
                  <div className="absolute top-3 left-10 flex gap-1.5">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                      {item.category}
                    </span>
                    {item.isTodaysSpecial && (
                      <span className="px-2 py-1 rounded-lg bg-amber-500/20 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-500/30">
                        ★ Today's Special
                      </span>
                    )}
                  </div>

                  {/* Status & Diet Badge */}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase backdrop-blur-md ${
                        item.status === 'published' || item.isAvailable
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : item.status === 'draft'
                          ? 'bg-zinc-800/80 text-zinc-300 border border-zinc-700'
                          : 'bg-red-500/20 text-red-300 border border-red-500/30'
                      }`}
                    >
                      {item.status ? item.status.toUpperCase() : item.isAvailable ? 'ACTIVE' : 'OUT OF STOCK'}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase backdrop-blur-md ${
                        item.isVegetarian
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950/80 text-red-400 border border-red-800'
                      }`}
                    >
                      ● {item.dietaryType || (item.isVegetarian ? 'Veg' : 'Non-Veg')}
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-white tracking-tight">{item.name}</h3>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <div className="text-right pl-3 shrink-0">
                      <span className="text-lg font-black text-emerald-400 font-mono">
                        ${item.price.toFixed(2)}
                      </span>
                      {item.discountPrice && (
                        <span className="block text-[10px] text-zinc-500 line-through font-mono">
                          ${item.discountPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Specs & Nutrition Row */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 font-mono pt-2 border-t border-zinc-800/80">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{item.prepTimeMinutes || 10}m prep</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>{item.calories} kcal</span>
                    </span>
                    <span>Prot: <strong className="text-zinc-200">{item.proteinGrams}g</strong></span>
                  </div>

                  {/* LX Popularity Meter & Live Analytics */}
                  <div className="bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/60 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400 font-semibold flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>LX Popularity Score</span>
                      </span>
                      <span className="font-bold font-mono text-indigo-400">{item.aiPopularityScore} / 100</span>
                    </div>

                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full"
                        style={{ width: `${item.aiPopularityScore}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 font-mono">
                      <span>{item.analytics?.views || 1200} Views</span>
                      <span>{item.analytics?.orders || 340} Orders</span>
                      <span>★ {item.analytics?.averageRating || 4.8}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Actions Footer */}
              <div className="p-4 border-t border-zinc-800/80 bg-[#09090B] flex items-center justify-between">
                <button
                  onClick={() => onToggleAvailability(item.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    item.isAvailable
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  {item.isAvailable ? 'Available' : 'Out of Stock'}
                </button>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsAddEditOpen(true);
                    }}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                    title="Edit Item Details"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDuplicate(item)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                    title="Duplicate Item"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleArchive(item.id)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Archive Item"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Full-Screen Modal */}
      <AddEditMenuModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSaveItem}
        editingItem={editingItem}
        onNotify={addToast}
      />

      {/* Bulk Import Modal */}
      <BulkMenuImportModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        onImportSuccess={(newItems) => {
          setItems((prev) => [...newItems, ...prev]);
        }}
        onNotify={addToast}
      />

      {/* Keyboard Shortcuts Dialog */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0C0C0E] border border-zinc-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">Keyboard Shortcuts</h3>
              <button onClick={() => setShowShortcutsModal(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-300">Open Add Menu Item</span>
                <kbd className="px-2 py-1 rounded bg-zinc-800 text-indigo-400 font-mono font-bold">Ctrl + N</kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-300">Focus Search Bar</span>
                <kbd className="px-2 py-1 rounded bg-zinc-800 text-indigo-400 font-mono font-bold">Ctrl + F</kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-300">Export Menu Catalog PDF</span>
                <kbd className="px-2 py-1 rounded bg-zinc-800 text-indigo-400 font-mono font-bold">Ctrl + E</kbd>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <span className="text-zinc-300">Close Open Modal / Drawer</span>
                <kbd className="px-2 py-1 rounded bg-zinc-800 text-indigo-400 font-mono font-bold">Esc</kbd>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
