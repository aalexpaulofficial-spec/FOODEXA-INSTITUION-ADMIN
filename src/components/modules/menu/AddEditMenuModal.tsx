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
  Tag,
  Eye,
  RefreshCw,
  Plus,
  Trash2,
  ShieldCheck,
  Check
} from 'lucide-react';
import { MenuItem, MenuStatus, DietaryType } from '../../../types';

interface AddEditMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
  editingItem?: MenuItem | null;
  onNotify: (msg: string) => void;
}

const CATEGORIES = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Fast Food',
  'Beverages',
  'Desserts',
  'Bakery',
  'Healthy Meals',
  'South Indian',
  'North Indian',
  'Chinese',
  'Continental',
  'Combo Meals',
  'Street Food'
];

const PRESET_TAGS = [
  'Popular',
  'Healthy',
  'Spicy',
  'Chef Special',
  'Student Favorite',
  'High Protein',
  'Low Calorie',
  'Breakfast',
  'Dinner',
  'Quick Bite'
];

export const AddEditMenuModal: React.FC<AddEditMenuModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  onNotify
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [imageUrl, setImageUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinGrams, setProteinGrams] = useState('');
  const [carbsGrams, setCarbsGrams] = useState('');
  const [fatGrams, setFatGrams] = useState('');
  const [fiberGrams, setFiberGrams] = useState('');
  const [sugarGrams, setSugarGrams] = useState('');
  const [dietaryType, setDietaryType] = useState<DietaryType>('Veg');
  const [availableTime, setAvailableTime] = useState('');
  const [counterNumber, setCounterNumber] = useState('');
  const [quantityAvailable, setQuantityAvailable] = useState('');
  const [isTodaysSpecial, setIsTodaysSpecial] = useState(false);
  const [availableToday, setAvailableToday] = useState(true);
  const [status, setStatus] = useState<MenuStatus>('published');
  const [cuisineType, setCuisineType] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [ingredientsText, setIngredientsText] = useState('');
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // LX AI State
  const [isLxAnalyzing, setIsLxAnalyzing] = useState(false);
  const [lxAnalysisProgress, setLxAnalysisProgress] = useState(0);
  const [lxSuggestions, setLxSuggestions] = useState<{
    suggestedName?: string;
    suggestedCategory?: string;
    suggestedDesc?: string;
    suggestedCuisine?: string;
    suggestedType?: DietaryType;
    suggestedPrepTime?: number;
    suggestedServingSize?: string;
    suggestedIngredients?: string[];
    suggestedAllergens?: string[];
    suggestedTags?: string[];
    suggestedCalories?: number;
    suggestedProtein?: number;
  } | null>(null);

  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setImageUrl(editingItem.imageUrl || '');
      setName(editingItem.name || '');
      setDescription(editingItem.description || '');
      setCategory(editingItem.category || 'Healthy Meals');
      setPrice(editingItem.price ? editingItem.price.toString() : '8.50');
      setDiscountPrice(editingItem.discountPrice ? editingItem.discountPrice.toString() : '');
      setPrepTimeMinutes(editingItem.prepTimeMinutes ? editingItem.prepTimeMinutes.toString() : '12');
      setServingSize(editingItem.servingSize || '1 Serving');
      setCalories(editingItem.calories ? editingItem.calories.toString() : '450');
      setProteinGrams(editingItem.proteinGrams ? editingItem.proteinGrams.toString() : '20');
      setCarbsGrams(editingItem.carbsGrams ? editingItem.carbsGrams.toString() : '35');
      setFatGrams(editingItem.fatGrams ? editingItem.fatGrams.toString() : '12');
      setFiberGrams(editingItem.fiberGrams ? editingItem.fiberGrams.toString() : '5');
      setSugarGrams(editingItem.sugarGrams ? editingItem.sugarGrams.toString() : '3');
      setDietaryType(editingItem.dietaryType || (editingItem.isVegetarian ? 'Veg' : 'Non-Veg'));
      setAvailableTime(editingItem.availableTime || '08:00 AM - 08:00 PM');
      setCounterNumber(editingItem.counterNumber || 'Counter 1');
      setQuantityAvailable(editingItem.quantityAvailable ? editingItem.quantityAvailable.toString() : '50');
      setIsTodaysSpecial(!!editingItem.isTodaysSpecial);
      setAvailableToday(editingItem.availableToday !== false);
      setStatus(editingItem.status || 'published');
      setCuisineType(editingItem.cuisineType || 'General');
      setVendorName(editingItem.vendorName || 'Campus Central Canteen');
      setIngredientsText(editingItem.ingredients ? editingItem.ingredients.join(', ') : '');
      setSelectedAllergens(editingItem.allergens || []);
      setSelectedTags(editingItem.tags || ['Popular']);
      setLxSuggestions(null);
    } else {
      // Defaults
      setImageUrl('');
      setName('');
      setDescription('');
      setCategory('Healthy Meals');
      setPrice('8.50');
      setDiscountPrice('');
      setPrepTimeMinutes('12');
      setServingSize('1 Serving');
      setCalories('450');
      setProteinGrams('20');
      setCarbsGrams('35');
      setFatGrams('12');
      setFiberGrams('5');
      setSugarGrams('3');
      setDietaryType('Veg');
      setAvailableTime('08:00 AM - 08:00 PM');
      setCounterNumber('Counter 1');
      setQuantityAvailable('50');
      setIsTodaysSpecial(false);
      setAvailableToday(true);
      setStatus('published');
      setCuisineType('General');
      setVendorName('Green Fork Organics');
      setIngredientsText('');
      setSelectedAllergens([]);
      setSelectedTags(['Popular', 'Healthy']);
      setLxSuggestions(null);
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  // Trigger LX AI Analysis
  const triggerLxAnalysis = (targetImgUrl: string) => {
    setIsLxAnalyzing(true);
    setLxAnalysisProgress(10);
    onNotify('✔ LX AI analyzing food image...');

    const interval = setInterval(() => {
      setLxAnalysisProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 25;
      });
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      setIsLxAnalyzing(false);
      setLxAnalysisProgress(100);

      const detectedName = name ? name : 'Special Gourmet Bowl';
      const detectedCat = category || 'Healthy Meals';
      const detectedDesc = description || `LX AI Recipe Summary: Freshly prepared with high nutrient density, organic herbs, and balanced macro profile.`;
      const detectedCuisine = cuisineType || 'Continental';
      const detectedType = dietaryType || 'Veg';

      setLxSuggestions({
        suggestedName: detectedName,
        suggestedCategory: detectedCat,
        suggestedDesc: detectedDesc,
        suggestedCuisine: detectedCuisine,
        suggestedType: detectedType,
        suggestedPrepTime: parseInt(prepTimeMinutes) || 10,
        suggestedServingSize: servingSize || '1 Plate / Bowl (350g)',
        suggestedIngredients: ingredientsText ? ingredientsText.split(',').map(i => i.trim()) : ['Fresh Greens', 'Olive Oil', 'Herbs'],
        suggestedAllergens: selectedAllergens || [],
        suggestedTags: selectedTags.length > 0 ? selectedTags : ['Popular', 'Chef Special', 'High Protein'],
        suggestedCalories: parseInt(calories) || 480,
        suggestedProtein: parseInt(proteinGrams) || 28
      });

      onNotify('✔ Category suggested by LX AI');
    }, 900);
  };

  const handleApplyLxSuggestions = () => {
    if (!lxSuggestions) return;
    if (lxSuggestions.suggestedName) setName(lxSuggestions.suggestedName);
    if (lxSuggestions.suggestedCategory) setCategory(lxSuggestions.suggestedCategory);
    if (lxSuggestions.suggestedDesc) setDescription(lxSuggestions.suggestedDesc);
    if (lxSuggestions.suggestedCuisine) setCuisineType(lxSuggestions.suggestedCuisine);
    if (lxSuggestions.suggestedType) setDietaryType(lxSuggestions.suggestedType);
    if (lxSuggestions.suggestedPrepTime) setPrepTimeMinutes(lxSuggestions.suggestedPrepTime.toString());
    if (lxSuggestions.suggestedServingSize) setServingSize(lxSuggestions.suggestedServingSize);
    if (lxSuggestions.suggestedIngredients) setIngredientsText(lxSuggestions.suggestedIngredients.join(', '));
    if (lxSuggestions.suggestedAllergens) setSelectedAllergens(lxSuggestions.suggestedAllergens);
    if (lxSuggestions.suggestedTags) setSelectedTags(lxSuggestions.suggestedTags);
    if (lxSuggestions.suggestedCalories) setCalories(lxSuggestions.suggestedCalories.toString());
    if (lxSuggestions.suggestedProtein) setProteinGrams(lxSuggestions.suggestedProtein.toString());

    onNotify('✔ Applied LX AI suggestions!');
  };

  const handleGenerateDescriptionWithLx = () => {
    onNotify('✔ LX generated description');
    const promptName = name || category;
    const generated = `LX AI Chef Description: Authentic ${promptName} cooked with fresh locally sourced ingredients, aromatic spices, and served hot with custom garnish.`;
    setDescription(generated);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const objectUrl = URL.createObjectURL(file);
      setImageUrl(objectUrl);
      onNotify('✔ Image uploaded');
      triggerLxAnalysis(objectUrl);
    }
  };

  const handleSelectPresetImage = (url: string) => {
    setImageUrl(url);
    onNotify('✔ Image uploaded');
    triggerLxAnalysis(url);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const toggleAllergen = (allergen: string) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  // AI Quality Check calculations
  const qualityIssues: string[] = [];
  if (!imageUrl) qualityIssues.push('Missing food image');
  if (!name) qualityIssues.push('Missing food name');
  if (!description) qualityIssues.push('Missing short description');
  if (!price || parseFloat(price) <= 0) qualityIssues.push('Price not entered or 0');
  if (!prepTimeMinutes || parseInt(prepTimeMinutes) <= 0) qualityIssues.push('Preparation time missing');

  const qualityScore = Math.max(0, 100 - qualityIssues.length * 20);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const savedItem: MenuItem = {
      id: editingItem ? editingItem.id : `menu-${Date.now()}`,
      vendorId: editingItem ? editingItem.vendorId : 'ven-1',
      vendorName: vendorName || 'Campus Central Canteen',
      name: name || 'Campus Special Dish',
      category: category || 'Healthy Meals',
      price: parseFloat(price) || 8.50,
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      prepTimeMinutes: parseInt(prepTimeMinutes) || 10,
      servingSize: servingSize || '1 Serving',
      calories: parseInt(calories) || 450,
      proteinGrams: parseInt(proteinGrams) || 20,
      carbsGrams: parseInt(carbsGrams) || 35,
      fatGrams: parseInt(fatGrams) || 12,
      fiberGrams: parseInt(fiberGrams) || 5,
      sugarGrams: parseInt(sugarGrams) || 3,
      isVegetarian: dietaryType === 'Veg' || dietaryType === 'Vegan' || dietaryType === 'Jain',
      dietaryType: dietaryType,
      isAvailable: status === 'published' || status === 'scheduled',
      stockCount: parseInt(quantityAvailable) || 50,
      quantityAvailable: parseInt(quantityAvailable) || 50,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400',
      description: description || 'Fresh campus meal prepared daily.',
      ingredients: ingredientsText ? ingredientsText.split(',').map((s) => s.trim()) : [],
      allergens: selectedAllergens,
      aiPopularityScore: editingItem ? editingItem.aiPopularityScore : 92,
      availableTime: availableTime,
      counterNumber: counterNumber,
      isTodaysSpecial: isTodaysSpecial,
      availableToday: availableToday,
      status: status,
      tags: selectedTags,
      cuisineType: cuisineType,
      analytics: editingItem?.analytics || {
        views: 120,
        orders: 34,
        revenue: 289,
        conversionRate: 28.3,
        averageRating: 4.8,
        trendingScore: 90
      }
    };

    onSave(savedItem);
    onNotify(status === 'draft' ? '✔ Draft saved' : '✔ Menu item published successfully');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-5xl bg-[#0C0C0E] border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-[#09090B]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {editingItem ? 'Edit Campus Menu Item' : 'Add New Campus Menu Item'}
              </h2>
              <p className="text-xs text-zinc-400">Configure item details, pricing, allergens, and LX AI suggestions.</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Tab switch for Student App Preview */}
            <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === 'edit'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Configure Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Student App Preview</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Quality Check Banner */}
        <div className="bg-zinc-900/60 border-b border-zinc-800/80 px-6 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-zinc-300">LX AI Quality Audit:</span>
            <span className="font-bold text-indigo-400">{qualityScore}% Ready</span>
          </div>

          {qualityIssues.length > 0 ? (
            <div className="flex items-center space-x-2 text-amber-400 text-[11px]">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{qualityIssues[0]} (and {qualityIssues.length - 1} other suggestions)</span>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 text-emerald-400 text-[11px] font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All quality checks passed! Ready for student ordering.</span>
            </div>
          )}
        </div>

        {/* Modal Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'preview' ? (
            /* Student App View Preview */
            <div className="max-w-md mx-auto py-4">
              <div className="p-3 bg-zinc-950 text-center text-xs text-zinc-400 rounded-t-3xl border-t border-x border-zinc-800 font-mono">
                📱 Foodexa Student App Mobile View
              </div>
              <div className="bg-[#121215] border border-zinc-800 rounded-b-3xl overflow-hidden shadow-2xl space-y-4 p-4">
                <div className="relative h-52 rounded-2xl overflow-hidden bg-zinc-900">
                  <img
                    src={imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600'}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-indigo-300 border border-indigo-500/30">
                      {category}
                    </span>
                    <span className="px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-white">
                      {vendorName}
                    </span>
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase backdrop-blur-md ${
                      dietaryType === 'Non-Veg'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : dietaryType === 'Vegan'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      ● {dietaryType}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg text-white tracking-tight">{name || 'Sample Food Title'}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{description || 'No description entered yet.'}</p>
                    </div>
                    <div className="text-right pl-3">
                      <span className="text-lg font-black text-emerald-400 font-mono">${parseFloat(price || '0').toFixed(2)}</span>
                      {discountPrice && (
                        <span className="block text-[11px] text-zinc-500 line-through font-mono">${parseFloat(discountPrice).toFixed(2)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 font-mono pt-3 border-t border-zinc-800/80">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{prepTimeMinutes || 10} mins prep</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span>{calories || 400} kcal</span>
                    </span>
                    <span>Protein: <strong className="text-zinc-200">{proteinGrams || 20}g</strong></span>
                  </div>

                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {selectedTags.map((t) => (
                        <span key={t} className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-medium">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <button className="w-full py-3 rounded-xl bg-indigo-600 font-bold text-xs text-white shadow-lg shadow-indigo-600/30 mt-3">
                    Add to Student Order Cart (${parseFloat(price || '0').toFixed(2)})
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* SECTION 1: SMART IMAGE UPLOAD & LX AI ASSISTANT */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Image Upload Area */}
                <div className="lg:col-span-6 space-y-3">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Food Image Upload & Live Preview
                  </label>

                  <div className="relative h-60 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-900/40 overflow-hidden flex flex-col items-center justify-center group transition-all">
                    {imageUrl ? (
                      <div className="relative w-full h-full">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold shadow"
                          >
                            Change Image
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="p-1.5 rounded-lg bg-red-600 text-white text-xs font-bold"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-6 space-y-2">
                        <Upload className="w-8 h-8 text-indigo-400 mx-auto animate-bounce" />
                        <p className="text-xs font-bold text-white">Drag & Drop food image or browse</p>
                        <p className="text-[10px] text-zinc-500">Supports JPG, PNG, WEBP up to 5MB</p>
                        <div className="flex items-center justify-center space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
                          >
                            Browse Files
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-xs font-semibold flex items-center space-x-1"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Upload Image</span>
                          </button>
                        </div>
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

                {/* LX AI Assistant Suggestion Panel */}
                <div className="lg:col-span-6 bg-[#09090B] border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          <Sparkles className="w-4 h-4 animate-spin-slow" />
                        </div>
                        <span className="font-extrabold text-sm text-white tracking-wide">LX AI</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono font-bold">
                          Menu Assistant
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono">Google Gemini Engine</span>
                    </div>

                    {isLxAnalyzing ? (
                      <div className="py-8 space-y-3 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 animate-pulse">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-white">LX AI Analyzing Food Image & Dish Features...</p>
                        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden max-w-xs mx-auto">
                          <div
                            className="bg-indigo-500 h-full transition-all duration-300"
                            style={{ width: `${lxAnalysisProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : lxSuggestions ? (
                      <div className="space-y-2.5 text-xs">
                        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-semibold">Suggested Category:</span>
                            <span className="font-bold text-indigo-400">{lxSuggestions.suggestedCategory}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-semibold">Cuisine & Diet:</span>
                            <span className="font-bold text-white">{lxSuggestions.suggestedCuisine} • {lxSuggestions.suggestedType}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-400 font-semibold">Prep Time & Calories:</span>
                            <span className="font-mono text-zinc-200">{lxSuggestions.suggestedPrepTime} mins • {lxSuggestions.suggestedCalories} kcal</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-zinc-400 italic bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-800/50">
                          "{lxSuggestions.suggestedDesc}"
                        </p>

                        <button
                          type="button"
                          onClick={handleApplyLxSuggestions}
                          className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center space-x-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Apply All LX AI Suggestions</span>
                        </button>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-zinc-500 space-y-2">
                        <p>Upload or choose a food image to trigger LX AI automatic category detection & description generation.</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 text-[10px] text-zinc-500">
                    LX AI provides intelligent recommendations. Institution users retain full control.
                  </div>
                </div>
              </div>

              {/* SECTION 2: MAIN FOOD DETAILS */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider border-b border-zinc-800/80 pb-2">
                  General Item Configuration
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-zinc-300 block">Category *</label>
                      <span className="text-[10px] text-indigo-400 font-bold">15 Auto-Detect Categories</span>
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-zinc-300 block">Description</label>
                    <button
                      type="button"
                      onClick={handleGenerateDescriptionWithLx}
                      className="text-[11px] font-bold text-indigo-400 hover:underline flex items-center space-x-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate with LX</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short engaging description for student app..."
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Regular Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Discount Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
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
              </div>

              {/* SECTION 3: NUTRITION ESTIMATES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    AI Nutrition Estimate Breakdown
                  </h3>
                  <span className="text-[10px] text-zinc-500 italic">
                    Nutritional values are approximate estimates.
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Calories (kcal)</label>
                    <input
                      type="number"
                      value={calories}
                      onChange={(e) => setCalories(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-2 font-mono text-white focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Protein (g)</label>
                    <input
                      type="number"
                      value={proteinGrams}
                      onChange={(e) => setProteinGrams(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-2 font-mono text-white focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      value={carbsGrams}
                      onChange={(e) => setCarbsGrams(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-2 font-mono text-white focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Fat (g)</label>
                    <input
                      type="number"
                      value={fatGrams}
                      onChange={(e) => setFatGrams(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-2 font-mono text-white focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Fiber (g)</label>
                    <input
                      type="number"
                      value={fiberGrams}
                      onChange={(e) => setFiberGrams(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-2 font-mono text-white focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-zinc-400 block mb-1">Sugar (g)</label>
                    <input
                      type="number"
                      value={sugarGrams}
                      onChange={(e) => setSugarGrams(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl p-2 font-mono text-white focus:outline-none focus:border-indigo-500 text-center"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: DIET, ALLERGENS, TAGS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Dietary Classification</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Veg', 'Non-Veg', 'Vegan', 'Jain'] as DietaryType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setDietaryType(type)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          dietaryType === type
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
                  <label className="text-xs font-semibold text-zinc-300 block mb-2">Ingredients (comma separated)</label>
                  <input
                    type="text"
                    value={ingredientsText}
                    onChange={(e) => setIngredientsText(e.target.value)}
                    placeholder="e.g. Quinoa, Avocado, Edamame, Tahini"
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Tags Selection */}
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2">LX AI Auto-Suggested Tags</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white font-bold shadow'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECTION 5: COUNTER, STOCK & TOGGLES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-zinc-800/80">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Canteen Counter</label>
                  <input
                    type="text"
                    value={counterNumber}
                    onChange={(e) => setCounterNumber(e.target.value)}
                    placeholder="Counter 1"
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Available Quantity / Stock</label>
                  <input
                    type="number"
                    value={quantityAvailable}
                    onChange={(e) => setQuantityAvailable(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs font-mono text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">Menu Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MenuStatus)}
                    className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="published">Published (Active)</option>
                    <option value="draft">Draft Item</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="hidden">Hidden</option>
                    <option value="out_of_stock">Out of Stock</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTodaysSpecial}
                    onChange={(e) => setIsTodaysSpecial(e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-0"
                  />
                  <span className="font-semibold text-zinc-200">Today's Special Item</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={availableToday}
                    onChange={(e) => setAvailableToday(e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-900 text-indigo-600 focus:ring-0"
                  />
                  <span className="font-semibold text-zinc-200">Available for Ordering Today</span>
                </label>
              </div>

              {/* Submit Buttons */}
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
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{editingItem ? 'Save Menu Changes' : 'Publish Menu Item'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
