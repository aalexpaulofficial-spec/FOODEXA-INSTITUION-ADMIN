import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Clock,
  Utensils,
  DollarSign,
  RefreshCw,
  Check
} from 'lucide-react';
import { MenuItem, MenuStatus, DietaryType, Counter, MenuCategory } from '../../../types';
import { supabase } from '../../../lib/supabaseClient';

interface AddEditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MenuItem) => Promise<string | null>;
  editingItem?: MenuItem | null;
  onNotify: (msg: string) => void;
  counters?: Counter[];
  categories?: MenuCategory[];
}

export const AddEditMenuModal: React.FC<AddEditMenuModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  onNotify,
  counters = [],
  categories = []
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [foodType, setFoodType] = useState<DietaryType>('Veg');
  const [availability, setAvailability] = useState(true);
  const [status, setStatus] = useState<MenuStatus>('published');
  const [selectedCounterId, setSelectedCounterId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = categories.filter(
    c => !selectedCounterId || c.canteen_id === selectedCounterId
  );

  useEffect(() => {
    if (editingItem) {
      setImageUrl(editingItem.imageUrl || '');
      setName(editingItem.name || '');
      setDescription(editingItem.description || '');
      setCategory(editingItem.category || '');
      setPrice(editingItem.price ? editingItem.price.toString() : '');
      setDiscountPrice(editingItem.discountPrice ? editingItem.discountPrice.toString() : '');
      setPrepTimeMinutes(editingItem.prepTimeMinutes ? editingItem.prepTimeMinutes.toString() : '');
      setServingSize(editingItem.servingSize || '');
      setFoodType(editingItem.food_type as DietaryType || editingItem.dietaryType || 'Veg');
      setAvailability(editingItem.isAvailable);
      setStatus(editingItem.status || 'published');
      setSelectedCounterId(editingItem.canteen_id || '');
      setSelectedCategoryId(editingItem.category_id || '');
      setSaveError(null);
    } else {
      setImageUrl('');
      setName('');
      setDescription('');
      setCategory('');
      setPrice('');
      setDiscountPrice('');
      setPrepTimeMinutes('');
      setServingSize('');
      setFoodType('Veg');
      setAvailability(true);
      setStatus('published');
      setSelectedCounterId('');
      setSelectedCategoryId('');
      setSaveError(null);
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      onNotify('Uploading image to storage...');
      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const filePath = `menu-items/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { data, error } = await supabase.storage.from('food-images').upload(filePath, file, { upsert: true });
        if (error) {
          onNotify(`Upload failed: ${error.message}`);
          setIsUploading(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(data.path);
        setImageUrl(urlData.publicUrl);
        onNotify('Image uploaded successfully');
      } catch (err: any) {
        onNotify(`Upload error: ${err.message}`);
      }
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSubmitting(true);

    const savedItem: MenuItem = {
      id: editingItem ? editingItem.id : `menu-${Date.now()}`,
      vendorId: selectedCounterId || editingItem?.vendorId || '',
      vendorName: counters.find(c => c.id === selectedCounterId)?.name || editingItem?.vendorName || '',
      name: name || 'Campus Dish',
      category: category || 'General',
      price: parseFloat(price) || 0,
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      prepTimeMinutes: parseInt(prepTimeMinutes) || 10,
      servingSize: servingSize || '1 Serving',
      calories: editingItem?.calories || 0,
      proteinGrams: editingItem?.proteinGrams || 0,
      isVegetarian: foodType === 'Veg' || foodType === 'Vegan' || foodType === 'Jain',
      food_type: foodType,
      dietaryType: foodType,
      isAvailable: availability,
      stockCount: 50,
      imageUrl: imageUrl || '',
      description: description || '',
      ingredients: editingItem?.ingredients || [],
      allergens: editingItem?.allergens || [],
      aiPopularityScore: editingItem?.aiPopularityScore || 75,
      status: status,
      tags: editingItem?.tags || [],
      analytics: editingItem?.analytics || undefined,
      canteen_id: selectedCounterId || undefined,
      category_id: selectedCategoryId || undefined,
    };

    const result = await onSave(savedItem);
    if (result === null) {
      setSaveError('Failed to save. Check console for details.');
      setIsSubmitting(false);
      return;
    }

    onNotify(status === 'draft' ? 'Draft saved' : 'Menu item published successfully');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-3xl bg-[#0C0C0E] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#09090B]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <p className="text-xs text-zinc-400">Configure item details, pricing, and category.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {saveError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Food Image
                </label>
                <div className="relative h-52 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-900/40 overflow-hidden flex flex-col items-center justify-center group transition-all">
                  {imageUrl ? (
                    <div className="relative w-full h-full">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow"
                        >
                          Change Image
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
                      <p className="text-xs font-bold text-white">Upload food image</p>
                      <p className="text-[10px] text-zinc-500">JPG, PNG, WEBP up to 5MB</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold flex items-center space-x-1 mx-auto"
                      >
                        {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                        <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Food Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Crispy Masala Dosa"
                    required
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Category *</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Breakfast, Snacks, Beverages"
                    required
                    list="category-suggestions"
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <datalist id="category-suggestions">
                    {categories.map(c => <option key={c.id} value={c.name} />)}
                    <option value="Breakfast" /><option value="Lunch" /><option value="Dinner" />
                    <option value="Snacks" /><option value="Beverages" /><option value="Desserts" />
                    <option value="Healthy Meals" /><option value="Fast Food" />
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short engaging description..."
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Regular Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Discount Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discountPrice}
                  onChange={(e) => setDiscountPrice(e.target.value)}
                  placeholder="Optional"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Prep Time (mins)</label>
                <input
                  type="number"
                  min="0"
                  value={prepTimeMinutes}
                  onChange={(e) => setPrepTimeMinutes(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Serving Size</label>
                <input
                  type="text"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  placeholder="e.g. 1 Bowl (350g)"
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Food Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Veg', 'Non-Veg', 'Vegan', 'Jain'] as DietaryType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFoodType(type)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        foodType === type
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow'
                          : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Availability & Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MenuStatus)}
                    className="bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="hidden">Hidden</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="archived">Archived</option>
                  </select>
                  <label className="flex items-center space-x-2 cursor-pointer px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={availability}
                      onChange={(e) => setAvailability(e.target.checked)}
                      className="rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-zinc-200">Available</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Assign to Counter</label>
                <select
                  value={selectedCounterId}
                  onChange={(e) => { setSelectedCounterId(e.target.value); setSelectedCategoryId(''); }}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Counter --</option>
                  {counters.map((c) => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">Menu Category (DB)</label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- None (Type above) --</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-zinc-800/80">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Publish Item'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
