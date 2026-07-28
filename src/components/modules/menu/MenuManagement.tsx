import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed, Plus, Search, Sparkles, Flame, CheckCircle2, XCircle,
  FileUp, Tag, Clock, Copy, Archive, Eye, FileText, Keyboard, TrendingUp,
  Filter, SlidersHorizontal, X, AlertCircle, Check, Edit3, Trash2, Layers, DollarSign
} from 'lucide-react';
import { MenuItem, MenuStatus, MenuCategory, Counter } from '../../../types';
import { AddEditMenuModal } from './AddEditMenuModal';

interface MenuManagementProps {
  menuItems: MenuItem[];
  categories: MenuCategory[];
  counters: Counter[];
  onAddMenuItem: (item: MenuItem) => Promise<string | null>;
  onUpdateMenuItem: (itemId: string, updates: Partial<MenuItem>) => Promise<void>;
  onDeleteMenuItem: (itemId: string) => Promise<void>;
  onToggleAvailability: (itemId: string) => Promise<void>;
  addMenuCategory: (cat: Partial<MenuCategory>) => Promise<string | null>;
  updateMenuCategory: (catId: string, updates: Partial<MenuCategory>) => Promise<void>;
  deleteMenuCategory: (catId: string) => Promise<void>;
  institutionId: string | null;
}

export const MenuManagement: React.FC<MenuManagementProps> = ({
  menuItems: initialMenuItems,
  categories: initialCategories,
  counters,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onToggleAvailability,
  addMenuCategory,
  updateMenuCategory,
  deleteMenuCategory,
  institutionId,
}) => {
  const [items, setItems] = useState<MenuItem[]>(initialMenuItems);
  const [categories, setCategories] = useState<MenuCategory[]>(initialCategories);
  const [activeSection, setActiveSection] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'popularity' | 'price_low' | 'price_high'>('popularity');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catCounterId, setCatCounterId] = useState('');
  const [catError, setCatError] = useState<string | null>(null);

  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  useEffect(() => { setItems(initialMenuItems); }, [initialMenuItems]);
  useEffect(() => { setCategories(initialCategories); }, [initialCategories]);

  const addToast = (message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const allCategories = ['all', ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items.filter(item => {
    if (activeSection === 'todays_specials' && !item.isTodaysSpecial) return false;
    if (activeSection === 'active' && !item.isAvailable) return false;
    if (activeSection === 'draft' && item.status !== 'draft') return false;
    if (activeSection === 'out_of_stock' && item.isAvailable && item.status !== 'out_of_stock') return false;
    if (activeSection === 'scheduled' && item.status !== 'scheduled') return false;
    if (selectedCategoryFilter !== 'all' && item.category !== selectedCategoryFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const textMatch = item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);
      if (!textMatch) return false;
    }
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    return (b.aiPopularityScore || 0) - (a.aiPopularityScore || 0);
  });

  const groupedByCategory = sortedItems.reduce((acc, item) => {
    const cat = item.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categoryOrder = Object.keys(groupedByCategory).sort();

  const handleSaveItem = async (savedItem: MenuItem) => {
    const result = await onAddMenuItem(savedItem);
    if (result) {
      setItems(prev => {
        const exists = prev.some(i => i.id === savedItem.id);
        if (exists) return prev.map(i => i.id === savedItem.id ? { ...savedItem, id: result } : i);
        return [{ ...savedItem, id: result }, ...prev];
      });
    }
    return result;
  };

  const handleDeleteItem = async (itemId: string) => {
    await onDeleteMenuItem(itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
    addToast('Menu item deleted');
  };

  const handleDuplicate = (item: MenuItem) => {
    const duplicated: MenuItem = {
      ...item,
      id: `dup-${Date.now()}`,
      name: `${item.name} (Copy)`,
      status: 'draft',
      isAvailable: false,
    };
    handleSaveItem(duplicated);
    addToast(`Duplicated "${item.name}" to Drafts`);
  };

  const openCategoryModal = (cat?: MenuCategory) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
      setCatDesc(cat.description);
      setCatCounterId(cat.canteen_id);
    } else {
      setEditingCat(null);
      setCatName('');
      setCatDesc('');
      setCatCounterId('');
    }
    setCatError(null);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatError(null);
    if (!catName.trim()) { setCatError('Category name is required'); return; }
    if (editingCat) {
      await updateMenuCategory(editingCat.id, { name: catName.trim(), description: catDesc, canteen_id: catCounterId || editingCat.canteen_id });
      setCategories(prev => prev.map(c => c.id === editingCat.id ? { ...c, name: catName.trim(), description: catDesc } : c));
      addToast('Category updated');
    } else {
      const result = await addMenuCategory({ name: catName.trim(), description: catDesc, canteen_id: catCounterId || null });
      if (result) {
        setCategories(prev => [...prev, { id: result, institution_id: institutionId || '', canteen_id: catCounterId || '', name: catName.trim(), description: catDesc, sort_order: 0, is_active: true, created_at: new Date().toISOString() }]);
        addToast('Category created');
      } else {
        setCatError('Failed to create category');
        return;
      }
    }
    setIsCatModalOpen(false);
  };

  const handleDeleteCategory = async (catId: string) => {
    await deleteMenuCategory(catId);
    setCategories(prev => prev.filter(c => c.id !== catId));
    addToast('Category deleted');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-12">
      <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto px-4 py-3 rounded-2xl bg-[#0C0C0E] border border-indigo-500/40 text-white text-xs font-bold shadow-2xl flex items-center space-x-2 animate-bounce-short">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Menu Management</h1>
          <p className="text-xs text-zinc-400 mt-1">Manage menu items, organize by category, and control availability.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => openCategoryModal()} className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold transition-all flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Manage Categories ({categories.length})</span>
          </button>
          <button onClick={() => { setEditingItem(null); setIsAddEditOpen(true); }} className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-all shadow-lg shadow-indigo-600/30 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Menu Item</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-1 overflow-x-auto border-b border-zinc-800/80 pb-2">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'categories', label: 'By Category' },
          { id: 'active', label: 'Active' },
          { id: 'draft', label: 'Drafts' },
          { id: 'out_of_stock', label: 'Out of Stock' },
        ].map(tab => (
          <button key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeSection === tab.id ? 'bg-indigo-600/20 border border-indigo-500/40 text-indigo-300' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-[#0C0C0E] border border-zinc-800/80 shadow-xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
            {allCategories.map(cat => (
              <button key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl transition-all ${selectedCategoryFilter === cat ? 'bg-indigo-600 text-white font-bold' : 'bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-zinc-800'}`}
              >
                {cat === 'all' ? 'All' : cat}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-2.5" />
              <input
                type="text" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search menu items..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-zinc-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500">
              <option value="popularity">Popularity</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {activeSection === 'categories' ? (
        <div className="space-y-8">
          {categoryOrder.map(cat => {
            const catItems = groupedByCategory[cat];
            const dbCat = categories.find(c => c.name === cat);
            return (
              <div key={cat}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">{cat}</h2>
                      {dbCat?.description && <p className="text-[10px] text-zinc-500">{dbCat.description}</p>}
                    </div>
                  </div>
                  <span className="text-xs text-zinc-500 font-mono">{catItems.length} item{catItems.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {catItems.map(item => renderCard(item))}
                </div>
              </div>
            );
          })}
          {categoryOrder.length === 0 && (
            <div className="p-12 text-center rounded-2xl bg-[#0C0C0E] border border-zinc-800 text-zinc-500 space-y-3">
              <UtensilsCrossed className="w-10 h-10 mx-auto opacity-40" />
              <p className="font-semibold text-zinc-400">No menu items yet. Click "Add Menu Item" to get started.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#0C0C0E] border border-zinc-800 text-zinc-500 space-y-3">
              <UtensilsCrossed className="w-10 h-10 mx-auto opacity-40" />
              <p className="font-semibold text-zinc-400">No menu items match your current filters.</p>
            </div>
          ) : (
            sortedItems.map(item => renderCard(item))
          )}
        </div>
      )}

      <AddEditMenuModal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        onSave={handleSaveItem}
        editingItem={editingItem}
        onNotify={addToast}
        counters={counters}
        categories={categories}
      />

      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0C0C0E] border border-zinc-800 rounded-3xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-bold text-white text-base">{editingCat ? 'Edit Category' : 'Create Category'}</h3>
              <button onClick={() => setIsCatModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {catError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>{catError}</span>
              </div>
            )}
            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Category Name *</label>
                <input type="text" value={catName} onChange={e => setCatName(e.target.value)} required
                  placeholder="e.g. Breakfast, Snacks, Beverages"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Description</label>
                <input type="text" value={catDesc} onChange={e => setCatDesc(e.target.value)}
                  placeholder="Brief description (optional)"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Link to Counter (optional)</label>
                <select value={catCounterId} onChange={e => setCatCounterId(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-indigo-500">
                  <option value="">-- All Counters --</option>
                  {counters.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold">Cancel</button>
                <button type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30">
                  {editingCat ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
            {editingCat && (
              <div className="pt-2 border-t border-zinc-800">
                <button onClick={() => { if (window.confirm('Delete this category?')) handleDeleteCategory(editingCat.id).then(() => setIsCatModalOpen(false)); }}
                  className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center space-x-1">
                  <Trash2 className="w-3.5 h-3.5" /> <span>Delete this category</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {!isCatModalOpen && (
        <div className="flex flex-wrap gap-2 pt-2">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => openCategoryModal(cat)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-indigo-300 text-xs font-medium transition-colors flex items-center space-x-1.5 group">
              <Layers className="w-3 h-3" />
              <span>{cat.name}</span>
              <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))}
        </div>
      )}
    </div>
  );

  function renderCard(item: MenuItem) {
    return (
      <div key={item.id} className="group rounded-2xl bg-[#0C0C0E] border border-zinc-800/80 hover:border-zinc-700 transition-all duration-300 overflow-hidden shadow-xl flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-56 h-48 sm:h-auto shrink-0 bg-zinc-950">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
              <UtensilsCrossed className="w-10 h-10 text-zinc-700" />
            </div>
          )}
          <div className="absolute top-2 left-2 flex gap-1.5">
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase backdrop-blur-md ${item.isVegetarian ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-red-950/80 text-red-400 border border-red-800'}`}>
              ● {item.food_type || (item.isVegetarian ? 'Veg' : 'Non-Veg')}
            </span>
          </div>
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase backdrop-blur-md ${item.isAvailable ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
              {item.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
        </div>

        <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-bold text-base text-white tracking-tight truncate">{item.name}</h3>
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold whitespace-nowrap">
                    {item.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{item.description}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-lg font-black text-emerald-400 font-mono">₹{item.price.toFixed(2)}</span>
                {item.discountPrice && (
                  <span className="block text-[10px] text-zinc-500 line-through font-mono">₹{item.discountPrice.toFixed(2)}</span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-400 font-mono pt-2 border-t border-zinc-800/80">
              <span className="flex items-center space-x-1"><Clock className="w-3.5 h-3.5 text-indigo-400" /><span>{item.prepTimeMinutes || 10}m prep</span></span>
              <span className="flex items-center space-x-1"><Flame className="w-3.5 h-3.5 text-amber-400" /><span>{item.calories || 0} kcal</span></span>
              <span>Serving: <strong className="text-zinc-200">{item.servingSize || 'Regular'}</strong></span>
            </div>

            <div className="flex items-center space-x-2 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-zinc-500 font-semibold">AI Popularity Score:</span>
              <div className="flex-1 max-w-[120px] bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full" style={{ width: `${item.aiPopularityScore || 50}%` }} />
              </div>
              <span className="font-bold font-mono text-indigo-400">{item.aiPopularityScore || 50}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/80">
            <div className="flex items-center space-x-2">
              <button onClick={() => onToggleAvailability(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${item.isAvailable ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'}`}>
                {item.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
              </button>
            </div>
            <div className="flex items-center space-x-1">
              <button onClick={() => { setEditingItem(item); setIsAddEditOpen(true); }}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors">Edit</button>
              <button onClick={() => handleDuplicate(item)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors" title="Duplicate">
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => { if (window.confirm(`Delete "${item.name}"?`)) handleDeleteItem(item.id); }}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors" title="Delete">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};
