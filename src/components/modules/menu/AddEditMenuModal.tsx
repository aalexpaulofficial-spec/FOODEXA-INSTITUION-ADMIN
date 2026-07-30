import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Check,
  ImageOff,
  Gauge,
  Wand2,
  Hash,
  Tag,
  Sun,
  Moon,
  Zap,
  Package,
  Star,
  Target,
  Activity,
  ChevronDown,
  ChevronUp,
  Layers,
  Store,
  RotateCcw,
  Info,
  SparklesIcon,
  Soup,
  Fish,
  Apple,
  Droplets,
  FlameIcon,
  Sandwich,
  Coffee,
  Cake,
  Dumbbell,
  Percent,
  ClockIcon,
  Scale,
  ChevronRight
} from 'lucide-react';
import { MenuItem, MenuStatus, DietaryType, Counter, MenuCategory } from '../../../types';
import { supabase } from '../../../lib/supabaseClient';

interface AddEditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MenuItem) => Promise<string | null>;
  editingItem?: MenuItem | null;
  initialMode?: 'manual' | 'image';
  onNotify: (msg: string) => void;
  counters?: Counter[];
  categories?: MenuCategory[];
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const AUTO_CATEGORY_MAP: Record<string, string[]> = {
  'chicken biryani': ['Main Course', 'Rice', 'Non Veg', 'Lunch', 'Dinner'],
  'biryani': ['Main Course', 'Rice', 'Lunch', 'Dinner'],
  'paneer': ['Main Course', 'North Indian', 'Veg'],
  'butter chicken': ['Main Course', 'North Indian', 'Veg'],
  'dal': ['Main Course', 'North Indian', 'Veg'],
  'tandoori': ['Main Course', 'North Indian', 'Non Veg'],
  'naan': ['Bread', 'North Indian', 'Veg'],
  'roti': ['Bread', 'North Indian', 'Veg'],
  'paratha': ['Bread', 'North Indian', 'Veg'],
  'dosa': ['Main Course', 'South Indian', 'Veg', 'Breakfast'],
  'idli': ['Main Course', 'South Indian', 'Veg', 'Breakfast'],
  'vada': ['Snacks', 'South Indian', 'Veg'],
  'sambar': ['Main Course', 'South Indian', 'Veg'],
  'chole': ['Main Course', 'North Indian', 'Veg'],
  'pizza': ['Fast Food', 'Continental', 'Italian'],
  'burger': ['Fast Food', 'Continental'],
  'pasta': ['Fast Food', 'Italian', 'Continental'],
  'sandwich': ['Fast Food', 'Continental'],
  'salad': ['Healthy Meals', 'Continental', 'Veg'],
  'smoothie': ['Beverages', 'Healthy Meals'],
  'juice': ['Beverages'],
  'milkshake': ['Beverages', 'Desserts'],
  'coffee': ['Beverages'],
  'tea': ['Beverages'],
  'cake': ['Bakery', 'Desserts'],
  'cookie': ['Bakery', 'Desserts'],
  'bread': ['Bakery', 'Breakfast'],
  'muffin': ['Bakery', 'Desserts'],
  'croissant': ['Bakery', 'Breakfast'],
  'soup': ['Healthy Meals', 'Main Course'],
  'noodles': ['Main Course', 'Chinese', 'Fast Food'],
  'fried rice': ['Main Course', 'Chinese', 'Rice'],
  'manchurian': ['Main Course', 'Chinese', 'Fast Food'],
  'spring roll': ['Snacks', 'Chinese'],
  'ice cream': ['Desserts', 'Beverages'],
  'gelato': ['Desserts'],
  'pudding': ['Desserts'],
  'custard': ['Desserts'],
  'faluda': ['Desserts', 'Beverages'],
  'lassi': ['Beverages', 'Healthy Meals'],
  'chaat': ['Snacks', 'Street Food', 'Fast Food'],
  'pakora': ['Snacks', 'Fast Food'],
  'samosa': ['Snacks', 'Fast Food'],
  'momos': ['Snacks', 'Chinese', 'Fast Food'],
  'steamed momos': ['Snacks', 'Chinese', 'Healthy Meals'],
  'grilled': ['Healthy Meals', 'Fast Food'],
  'grill': ['Healthy Meals', 'Fast Food'],
  'tikka': ['Main Course', 'North Indian', 'Non Veg'],
  'kebab': ['Main Course', 'North Indian', 'Non Veg'],
  'roll': ['Main Course', 'Fast Food'],
  'wrap': ['Main Course', 'Fast Food'],
  'bowl': ['Healthy Meals', 'Main Course'],
  'acai': ['Healthy Meals', 'Beverages', 'Desserts'],
  'granola': ['Healthy Meals', 'Breakfast', 'Snacks'],
  'breakfast': ['Breakfast', 'Healthy Meals'],
  'egg': ['Breakfast', 'Healthy Meals'],
  'omelette': ['Breakfast', 'Healthy Meals'],
  'pancake': ['Breakfast', 'Desserts'],
  'oats': ['Breakfast', 'Healthy Meals'],
};

function suggestCategoriesFromText(value: string): string[] {
  const lower = value.toLowerCase().trim();
  for (const [key, cats] of Object.entries(AUTO_CATEGORY_MAP)) {
    if (lower.includes(key)) return cats;
  }
  return [];
}

function compressImage(file: File, maxWidth = 1200): Promise<{ blob: Blob; preview: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) { height = (maxWidth / width) * height; width = maxWidth; }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas unavailable')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (!blob) { reject(new Error('Compression failed')); return; }
          resolve({ blob, preview: URL.createObjectURL(blob) });
        }, file.type || 'image/jpeg', 0.85);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

export const AddEditMenuModal: React.FC<AddEditMenuModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  initialMode = 'manual',
  onNotify,
  counters = [],
  categories = []
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadRetries, setUploadRetries] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinGrams, setProteinGrams] = useState('');
  const [carbsGrams, setCarbsGrams] = useState('');
  const [fatGrams, setFatGrams] = useState('');
  const [fiberGrams, setFiberGrams] = useState('');
  const [stockCount, setStockCount] = useState('');
  const [foodType, setFoodType] = useState<DietaryType>('Veg');
  const [availability, setAvailability] = useState(true);
  const [status, setStatus] = useState<MenuStatus>('published');
  const [selectedCounterId, setSelectedCounterId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [categoryMode, setCategoryMode] = useState<'auto' | 'manual'>('auto');
  const [autoSuggestions, setAutoSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = categories.filter(
    c => !selectedCounterId || c.canteen_id === selectedCounterId
  );

  const prevIsOpenRef = useRef(false);
  const prevEditingIdRef = useRef<string | null>(null);

  const suggestedAutoCategories = useMemo(() => {
    if (!name.trim() || categoryMode !== 'auto') return [];
    return suggestCategoriesFromText(name);
  }, [name, categoryMode]);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const editingId = editingItem?.id || null;
    const editingChanged = editingId !== prevEditingIdRef.current;

    if (justOpened || editingChanged) {
      if (editingItem) {
        setImageUrl(editingItem.imageUrl || '');
        setName(editingItem.name || '');
        setDescription(editingItem.description || '');
        setPrice(editingItem.price ? editingItem.price.toString() : '');
        setDiscountPrice(editingItem.discountPrice ? editingItem.discountPrice.toString() : '');
        setPrepTimeMinutes(editingItem.prepTimeMinutes ? editingItem.prepTimeMinutes.toString() : '');
        setServingSize(editingItem.servingSize || '');
        setCalories(editingItem.calories ? editingItem.calories.toString() : '');
        setProteinGrams(editingItem.proteinGrams ? editingItem.proteinGrams.toString() : '');
        setFoodType(editingItem.food_type as DietaryType || editingItem.dietaryType || 'Veg');
        setAvailability(editingItem.isAvailable);
        setStatus(editingItem.status || 'published');
        setSelectedCounterId(editingItem.canteen_id || editingItem.vendorId || '');
        setSelectedCategoryId(editingItem.category_id || '');
        setManualCategory(editingItem.category || '');
        setStockCount(editingItem.stockCount ? editingItem.stockCount.toString() : '0');
        setCategoryMode('manual');
        setAutoSuggestions([]);
        setSaveError(null);
      } else {
        setImageUrl('');
        setName('');
        setDescription('');
        setPrice('');
        setDiscountPrice('');
        setPrepTimeMinutes('');
        setServingSize('');
        setCalories('');
        setProteinGrams('');
        setCarbsGrams('');
        setFatGrams('');
        setFiberGrams('');
        setStockCount('0');
        setFoodType('Veg');
        setAvailability(true);
        setStatus('published');
        setSelectedCounterId('');
        setSelectedCategoryId('');
        setManualCategory('');
        setCategoryMode(initialMode === 'image' ? 'auto' : 'manual');
        setAutoSuggestions([]);
        setSaveError(null);
      }
      setUploadProgress(0);
      setUploadRetries(0);
    }

    prevIsOpenRef.current = isOpen;
    prevEditingIdRef.current = editingId;
  }, [editingItem, initialMode, isOpen]);

  useEffect(() => {
    if (categoryMode === 'auto' && name.trim() && suggestedAutoCategories.length > 0) {
      setAutoSuggestions(suggestedAutoCategories);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setAutoSuggestions([]);
    }
  }, [name, categoryMode, suggestedAutoCategories]);

  const selectAutoCategory = (cat: string) => {
    setManualCategory(cat);
    setShowSuggestions(false);
  };

  const processAndUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    onNotify('Validating image...');

    if (!ALLOWED_TYPES.includes(file.type)) {
      onNotify('Invalid format. Use JPG, PNG, or WEBP.');
      setIsUploading(false);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      onNotify('Image too large. Max 5MB.');
      setIsUploading(false);
      return;
    }

    try {
      const nameFromFile = file.name
        .replace(/\.[^.]+$/, '')
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!name.trim() && nameFromFile) {
        setName(nameFromFile.replace(/\b\w/g, char => char.toUpperCase()));
      }
      const imageCategorySuggestions = suggestCategoriesFromText(nameFromFile);
      if (!manualCategory.trim() && imageCategorySuggestions.length > 0) {
        setManualCategory(imageCategorySuggestions[0]);
        setAutoSuggestions(imageCategorySuggestions);
        setShowSuggestions(true);
      }
      setUploadProgress(10);
      onNotify('Compressing image...');
      const { blob, preview } = await compressImage(file);
      setImageUrl(preview);
      setUploadProgress(40);

      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `menu-items/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      onNotify('Uploading to storage...');
      const { data, error } = await supabase.storage.from('food-images').upload(filePath, blob, { upsert: true });
      if (error) {
        onNotify(`Upload failed: ${error.message}`);
        setIsUploading(false);
        return;
      }
      setUploadProgress(90);
      const { data: urlData } = supabase.storage.from('food-images').getPublicUrl(data.path);
      const publicUrl = urlData.publicUrl;
      setImageUrl(publicUrl);
      setUploadProgress(100);
      setCategoryMode('auto');
      onNotify('Image uploaded successfully');
      if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    } catch (err: any) {
      onNotify(`Upload error: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadRetries(0);
    await processAndUpload(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setUploadRetries(0);
    await processAndUpload(file);
  };

  const handleRetryUpload = async () => {
    const input = fileInputRef.current;
    if (input?.files?.[0]) {
      setUploadRetries(0);
      await processAndUpload(input.files[0]);
    } else {
      input?.click();
    }
  };

  const removeImage = () => {
    if (imageUrl.startsWith('blob:')) URL.revokeObjectURL(imageUrl);
    setImageUrl('');
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setIsSubmitting(true);

    const finalCategory = categoryMode === 'auto' ? manualCategory : manualCategory;

    if (initialMode === 'image' && !imageUrl) {
      setSaveError('Please upload a food image before saving this item.');
      setIsSubmitting(false);
      return;
    }

    const savedItem: MenuItem = {
      id: editingItem ? editingItem.id : `menu-${Date.now()}`,
      vendorId: selectedCounterId || editingItem?.vendorId || '',
      vendorName: counters.find(c => c.id === selectedCounterId)?.name || editingItem?.vendorName || '',
      name: name || '',
      category: finalCategory || '',
      price: parseFloat(price) || 0,
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      prepTimeMinutes: parseInt(prepTimeMinutes) || 0,
      servingSize: servingSize || '',
      calories: parseInt(calories) || 0,
      proteinGrams: parseInt(proteinGrams) || 0,
      carbsGrams: carbsGrams ? parseInt(carbsGrams) : undefined,
      fatGrams: fatGrams ? parseInt(fatGrams) : undefined,
      fiberGrams: fiberGrams ? parseInt(fiberGrams) : undefined,
      stockCount: parseInt(stockCount) || 0,
      isVegetarian: foodType === 'Veg' || foodType === 'Vegan' || foodType === 'Jain',
      food_type: foodType,
      dietaryType: foodType,
      isAvailable: availability,
      imageUrl: imageUrl || '',
      description: description || '',
      ingredients: editingItem?.ingredients || [],
      allergens: editingItem?.allergens || [],
      aiPopularityScore: editingItem?.aiPopularityScore || 0,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#0C0C0E] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#09090B]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {editingItem ? 'Edit Menu Item' : initialMode === 'image' ? 'Add Item With Image' : 'Add Item Manually'}
              </h2>
              <p className="text-xs text-zinc-400">
                {initialMode === 'image'
                  ? 'Upload a food photo, confirm the details, and publish it to Supabase.'
                  : 'Enter the food details clearly and publish it to Supabase.'}
              </p>
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT COLUMN: Image */}
              <div className="lg:col-span-1 space-y-3">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Food Image
                </label>
                <div
                  ref={dropRef}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`relative h-52 rounded-2xl border-2 border-dashed transition-all overflow-hidden flex flex-col items-center justify-center group ${
                    imageUrl ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-800 hover:border-indigo-500/50 bg-zinc-900/40'
                  }`}
                >
                  {imageUrl ? (
                    <div className="relative w-full h-full">
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={removeImage}
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold shadow"
                        >
                          Delete
                        </button>
                      </div>
                      {isUploading && (
                        <div className="absolute inset-x-0 top-0 p-2 bg-black/60">
                          <div className="flex items-center space-x-2 text-[10px] text-white font-bold">
                            <Gauge className="w-3.5 h-3.5 animate-spin" />
                            <span>Uploading... {uploadProgress}%</span>
                          </div>
                          <div className="w-full h-1 bg-zinc-700 rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center p-6 space-y-2">
                      <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
                      <p className="text-xs font-bold text-white">Drag & drop or browse</p>
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
                      {isUploading && uploadProgress > 0 && (
                        <div className="w-48 mx-auto h-1 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                        </div>
                      )}
                      {!isUploading && uploadRetries > 0 && (
                        <button type="button" onClick={handleRetryUpload} className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold">
                          Retry upload
                        </button>
                      )}
                    </div>
                  )}
                  {!imageUrl && !isUploading && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 cursor-pointer"
                      aria-label="Upload image"
                    />
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* CENTER COLUMN: Details */}
              <div className="lg:col-span-2 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Food Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Chicken Biryani"
                    required
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Smart Category Section */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-300 block">Category</label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setCategoryMode('auto')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 ${
                          categoryMode === 'auto'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-zinc-900/80 text-zinc-500 border border-zinc-800'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryMode('manual')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 ${
                          categoryMode === 'manual'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-zinc-900/80 text-zinc-500 border border-zinc-800'
                        }`}
                      >
                        <Tag className="w-3 h-3" />
                        <span>Manual</span>
                      </button>
                    </div>
                  </div>

                  {categoryMode === 'auto' ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={manualCategory}
                        onChange={(e) => {
                          setManualCategory(e.target.value);
                          if (!e.target.value.trim()) {
                            setShowSuggestions(false);
                          }
                        }}
                        onFocus={() => { if (suggestedAutoCategories.length > 0) setShowSuggestions(true); }}
                        placeholder="Start typing to get smart suggestions..."
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      {showSuggestions && autoSuggestions.length > 0 && (
                        <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-2 space-y-1 animate-fade-in">
                          <div className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider px-2 py-1 flex items-center space-x-1">
                            <SparklesIcon className="w-3 h-3 text-indigo-400" />
                            <span>Suggested Categories</span>
                          </div>
                          {autoSuggestions.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => selectAutoCategory(cat)}
                              className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-zinc-800 text-xs text-indigo-300 font-semibold transition-colors flex items-center space-x-2"
                            >
                              <Layers className="w-3 h-3" />
                              <span>{cat}</span>
                              <ChevronRight className="w-3 h-3 ml-auto" />
                            </button>
                          ))}
                        </div>
                      )}
                      {manualCategory && (
                        <div className="flex items-center space-x-1 text-xs text-indigo-400">
                          <Info className="w-3 h-3" />
                          <span>Selected: <strong>{manualCategory}</strong> (change anytime above)</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={manualCategory}
                        onChange={(e) => setManualCategory(e.target.value)}
                        placeholder="e.g. Breakfast, Main Course, Snacks"
                        required
                        list="category-suggestions-manual"
                        className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <datalist id="category-suggestions-manual">
                        {categories.map(c => <option key={c.id} value={c.name} />)}
                        <option value="Breakfast" /><option value="Lunch" /><option value="Dinner" />
                        <option value="Snacks" /><option value="Beverages" /><option value="Desserts" />
                        <option value="Healthy Meals" /><option value="Fast Food" />
                        <option value="South Indian" /><option value="North Indian" />
                        <option value="Chinese" /><option value="Continental" /><option value="Bakery" />
                        <option value="Main Course" /><option value="Rice" /><option value="Bread" />
                      </datalist>
                    </div>
                  )}
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

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Price (₹) *</label>
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
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Stock Count</label>
                    <input
                      type="number"
                      min="0"
                      value={stockCount}
                      onChange={(e) => setStockCount(e.target.value)}
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
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Food Type</label>
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
                          {type === 'Veg' ? '🥬' : type === 'Non-Veg' ? '🍗' : type === 'Vegan' ? '🌱' : '🕉'} {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1.5">Nutrition</label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-1.5 bg-zinc-900/80 rounded-lg px-2 py-1.5 border border-zinc-800">
                        <Flame className="w-3 h-3 text-amber-400" />
                        <input
                          type="number"
                          min="0"
                          value={calories}
                          onChange={(e) => setCalories(e.target.value)}
                          placeholder="Cal"
                          className="bg-transparent border-none text-xs text-white w-full focus:outline-none font-mono"
                        />
                        <span className="text-[9px] text-zinc-500">kcal</span>
                      </div>
                      <div className="flex items-center space-x-1.5 bg-zinc-900/80 rounded-lg px-2 py-1.5 border border-zinc-800">
                        <Dumbbell className="w-3 h-3 text-emerald-400" />
                        <input
                          type="number"
                          min="0"
                          value={proteinGrams}
                          onChange={(e) => setProteinGrams(e.target.value)}
                          placeholder="P"
                          className="bg-transparent border-none text-xs text-white w-full focus:outline-none font-mono"
                        />
                        <span className="text-[9px] text-zinc-500">g</span>
                      </div>
                      <div className="flex items-center space-x-1.5 bg-zinc-900/80 rounded-lg px-2 py-1.5 border border-zinc-800">
                        <Activity className="w-3 h-3 text-cyan-400" />
                        <input
                          type="number"
                          min="0"
                          value={carbsGrams}
                          onChange={(e) => setCarbsGrams(e.target.value)}
                          placeholder="Carbs"
                          className="bg-transparent border-none text-xs text-white w-full focus:outline-none font-mono"
                        />
                        <span className="text-[9px] text-zinc-500">g</span>
                      </div>
                      <div className="flex items-center space-x-1.5 bg-zinc-900/80 rounded-lg px-2 py-1.5 border border-zinc-800">
                        <Droplets className="w-3 h-3 text-blue-400" />
                        <input
                          type="number"
                          min="0"
                          value={fatGrams}
                          onChange={(e) => setFatGrams(e.target.value)}
                          placeholder="Fat"
                          className="bg-transparent border-none text-xs text-white w-full focus:outline-none font-mono"
                        />
                        <span className="text-[9px] text-zinc-500">g</span>
                      </div>
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
