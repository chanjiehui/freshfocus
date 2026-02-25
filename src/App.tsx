import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  LayoutDashboard,
  Refrigerator,
  UtensilsCrossed,
  Settings as SettingsIcon,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  X,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Ingredient, Recipe, UserPreferences, ExpiryRisk } from './types';
import { analyzeFridgeImage, generateRecipes } from './services/gemini';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import ReactMarkdown from 'react-markdown';

// --- Components ---

const StatusBadge = ({ risk }: { risk: ExpiryRisk }) => {
  const colors = {
    fresh: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    soon: 'bg-amber-100 text-amber-700 border-amber-200',
    expired: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  const labels = {
    fresh: 'Fresh',
    soon: 'Use Soon',
    expired: 'Expired',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${colors[risk]}`}>
      {labels[risk]}
    </span>
  );
};

const IngredientItem = ({ ingredient, onDelete, onUse, onSelect, selected, className }: { ingredient: Ingredient; onDelete: (id: string) => void; onUse: (id: string, amount: number) => void; onSelect: (id: string, checked: boolean) => void; selected: boolean; className?: string }) => {
  const [isUsing, setIsUsing] = React.useState(false);
  const [useAmount, setUseAmount] = React.useState(1);
  if (!ingredient.quantity || ingredient.quantity <= 0) return null;
  const handleConfirmUse = () => {
    onUse(ingredient.id, useAmount);
    setIsUsing(false);
    setUseAmount(1);
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex items-center justify-between p-6 bg-white rounded-2xl border border-stone-200 card-hover group group w-full min-h-[100px] ${className}`"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${ingredient.expiryRisk === 'fresh' ? 'bg-emerald-50 text-emerald-600' :
          ingredient.expiryRisk === 'soon' ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
          }`}>
          <Refrigerator size={20} />
        </div>
        <div>
          <h4 className="font-medium text-stone-800">{ingredient.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <StatusBadge risk={ingredient.expiryRisk} />
            <span className="text-xs text-stone-400 font-medium">{ingredient.quantity}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-stone-500">Expires in</p>
          <p className={`text-sm font-bold ${ingredient.expiryRisk === 'fresh' ? 'text-emerald-600' :
            ingredient.expiryRisk === 'soon' ? 'text-amber-600' : 'text-rose-600'
            }`}>
            {ingredient.estimatedDaysLeft} days
          </p>
        </div>
        <div className="flex items-center gap-1">
          {!isUsing && (
            <button
              onClick={() => setIsUsing(true)}
              className="px-3 py-1 text-sm font-bold border-2 border-stone-400 rounded-xl hover:border-stone-600 transition-colors"
            >
              Used
            </button>
          )}
          {isUsing && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                max={ingredient.quantity}
                value={useAmount}
                onChange={(e) => setUseAmount(Number(e.target.value))}
                className="w-16 px-2 py-1 border rounded-xl text-sm"
              />
              <button
                onClick={handleConfirmUse}
                className="px-2 py-1 bg-emerald-600 text-white rounded-xl text-sm"
              >
                ✓
              </button>
              <button
                onClick={() => setIsUsing(false)}
                className="px-2 py-1 bg-stone-200 text-stone-600 rounded-xl text-sm"
              >
                ✕
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => onDelete(ingredient.id)}
          className="p-2 text-stone-300 hover:text-rose-500 transition-colors sm:opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={22} />
        </button>
      </div>
    </motion.div>
  );
};

const RecipeCard = ({
  recipe,
  onClick
}: {
  recipe: Recipe;
  onClick: () => void;
}) => (
  <motion.div className="bg-white rounded-3xl border border-stone-200 overflow-hidden card-hover">
    <div className="p-6">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-display text-stone-900">
          {recipe.name}
        </h3>
        {recipe.prepTime && (
          <span className="bg-stone-100 text-stone-700 text-xs font-bold rounded-full px-3 py-1 ml-2 whitespace-nowrap">
            {recipe.prepTime}
          </span>
        )}
      </div>
      {recipe.description && (
        <p className="text-stone-500 text-sm mb-4 line-clamp-2">{recipe.description}</p>
      )}

      {recipe.tags && recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {recipe.tags.map((tag, index) => (
            <span
              key={index}
              className="text-[10px] font-bold uppercase bg-stone-100 text-stone-600 px-2 py-1 rounded-xl"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={onClick}
        className="w-full py-3 bg-stone-900 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors"
      >
        View Recipe <ChevronRight size={18} />
      </button>
    </div>
  </motion.div>
);

const CameraModal = ({ isOpen, onClose, onCapture }: { isOpen: boolean; onClose: () => void; onCapture: (img: string) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    if (isOpen) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setIsStreaming(true);
          }
        })
        .catch(err => console.error("Camera error:", err));
    } else {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
    }
  }, [isOpen]);

  const capture = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const data = canvasRef.current.toDataURL('image/jpeg').split(',')[1];
      onCapture(data);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/20 text-white rounded-full hover:bg-black/40">
          <X size={20} />
        </button>
        <video ref={videoRef} autoPlay playsInline className="w-full aspect-[3/4] object-cover bg-stone-900" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="p-6 flex justify-center">
          <button
            onClick={capture}
            className="w-16 h-16 rounded-full border-4 border-stone-200 flex items-center justify-center bg-stone-900 text-white hover:scale-105 transition-transform"
          >
            <div className="w-12 h-12 rounded-full border-2 border-white/20" />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const getInitialExpiryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().split('T')[0];
};

const calculateDaysLeft = (dateString: string) => {
  if (!dateString) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(dateString);
  return Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
};

export default function App() {
  const [ingredientFilter, setIngredientFilter] = useState<'all' | 'fresh' | 'soon' | 'expired'>('all');
  const [scannedIngredient, setScannedIngredient] = useState<Partial<Ingredient>[] | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'recipes' | 'dashboard' | 'settings'>('inventory');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  // Helper to get selected ingredient objects
  const selectedIngredientObjects = ingredients.filter(i => selectedIngredients.has(i.id));
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryRestrictions: [],
    fitnessGoal: 'balanced',
    tastes: []
  });

  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [manualItem, setManualItem] = useState({ name: '', quantity: 1, expiryDate: getInitialExpiryDate(), unit: 'pcs' });

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualItem.name) return;
    addIngredient([{
      name: manualItem.name,
      quantity: manualItem.quantity,
      estimatedDaysLeft: calculateDaysLeft(manualItem.expiryDate),
      unit: manualItem.unit
    }]);
    setManualItem({ name: '', quantity: 1, expiryDate: getInitialExpiryDate(), unit: 'pcs' });
    setIsManualAddOpen(false);
  };

  // Load data
  useEffect(() => {
    const saved = localStorage.getItem('freshfocus_ingredients');
    if (saved) setIngredients(JSON.parse(saved));
  }, []);

  // Save data
  useEffect(() => {
    localStorage.setItem('freshfocus_ingredients', JSON.stringify(ingredients));
  }, [ingredients]);

  const addIngredient = (newItems: Partial<Ingredient>[]) => {
    const processed = newItems.map(item => {
      const qty = typeof item.quantity === 'number' ? item.quantity : 1;
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: item.name || 'Unknown',
        category: 'General',
        addedDate: new Date().toISOString(),
        quantity: qty,
        originalQuantity: qty,
        unit: item.unit || 'pcs',
        estimatedDaysLeft: item.estimatedDaysLeft ?? 7,
        expiryRisk: (item.estimatedDaysLeft ?? 7) <= 0 ? 'expired' : (item.estimatedDaysLeft ?? 7) <= 7 ? 'soon' : 'fresh' as ExpiryRisk
      };
    });
    setIngredients(prev => [...processed, ...prev]);
  };

  const deleteIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  const handleFridgeScan = async (base64: string) => {
    setIsScanning(true);
    try {
      const results = await analyzeFridgeImage(base64);
      setScannedIngredient(results);
      setIsEditOpen(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateRecipes = async () => {
    if (ingredients.length === 0) return;
    setIsGenerating(true);
    try {
      const results = await generateRecipes(ingredients, preferences);
      setRecipes(results);
      setActiveTab('recipes');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler for using an ingredient
  const handleUseIngredient = (id: string, amount: number) => {
    setIngredients(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity - amount) } : i));
  };

  const handleSelectIngredient = (id: string, checked: boolean) => {
    setSelectedIngredients(prev => {
      const newSet = new Set(prev);
      if (checked) newSet.add(id);
      else newSet.delete(id);
      return newSet;
    });
  };

  // New: Generate recipes from selected ingredients
  const handleGenerateRecipesFromSelection = async () => {
    if (selectedIngredientObjects.length === 0) return;
    setIsGenerating(true);
    try {
      const results = await generateRecipes(selectedIngredientObjects, preferences);
      setRecipes(results);
      setActiveTab('recipes');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Dashboard Data
  const wasteData = [
    {
      name: 'Used', value: ingredients.reduce((sum, i) => {
        if (typeof i.originalQuantity === 'number' && typeof i.quantity === 'number') {
          return sum + (i.originalQuantity - i.quantity);
        }
        return sum;
      }, 0), color: '#10b981'
    },
    { name: 'Soon', value: ingredients.filter(i => i.expiryRisk === 'soon').length, color: '#f59e0b' },
    { name: 'Wasted', value: ingredients.filter(i => i.expiryRisk === 'expired').length, color: '#ef4444' },
  ];

  const healthSummary = [
    { name: 'Veggies', score: 75 },
    { name: 'Protein', score: 60 },
    { name: 'Carbs', score: 45 },
  ];

  const decreaseQuantity = (id: string) => { setIngredients(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item)) };

  return (
    <div className="min-h-screen pb-24 px-4 pt-8 mx-auto max-w-full sm:max-w-3xl lg:max-w-5xl">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display text-stone-900">FreshFocus</h1>
          <p className="text-stone-500 text-sm font-medium">Smart Waste Reduction</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsCameraOpen(true)}
            className="p-3 bg-stone-900 text-white rounded-2xl shadow-lg shadow-stone-200 hover:scale-105 transition-transform"
          >
            <Camera size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <AnimatePresence mode="wait">
          {activeTab === 'inventory' && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl">Fridge Inventory</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsManualAddOpen(true)}
                    className="p-2 text-stone-400 hover:text-stone-600 transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                  <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                    {ingredients.filter(i => i.quantity > 0).length} Items
                  </span>
                </div>
              </div>

              {isManualAddOpen && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleManualAdd}
                  className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm space-y-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      autoFocus
                      placeholder="Ingredient name"
                      className="px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-300"
                      value={manualItem.name}
                      onChange={e => setManualItem({ ...manualItem, name: e.target.value })}
                    />
                    <input
                      type="number"
                      min={1}
                      placeholder="Quantity"
                      className="px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-300"
                      value={manualItem.quantity}
                      onChange={e => setManualItem({ ...manualItem, quantity: Number(e.target.value) })}
                    />
                    <input
                      type="text"
                      placeholder="Unit (pcs, g, ml...)"
                      value={manualItem.unit}
                      onChange={e => setManualItem({ ...manualItem, unit: e.target.value })}
                      className="px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex-1 flex flex-col items-start gap-1">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">
                        Expiry Date <span className="text-stone-400 font-medium normal-case tracking-normal pl-1">({calculateDaysLeft(manualItem.expiryDate)} days left)</span>
                      </span>
                      <input
                        type="date"
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl text-sm outline-none focus:border-stone-300 text-stone-600 font-medium"
                        value={manualItem.expiryDate}
                        onChange={e => setManualItem({ ...manualItem, expiryDate: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-3 mt-1">
                      <button type="button" onClick={() => setIsManualAddOpen(false)} className="text-xs font-bold text-stone-400 uppercase px-3 hover:text-stone-600 transition-colors">Cancel</button>
                      <button type="submit" className="bg-stone-900 text-white text-xs font-bold uppercase px-6 py-2.5 rounded-xl hover:bg-stone-800 transition-colors shadow-lg shadow-stone-200">Add Item</button>
                    </div>
                  </div>
                </motion.form>
              )}

              {isScanning && (
                <div className="p-8 bg-white rounded-3xl border border-stone-200 flex flex-col items-center justify-center gap-4">
                  <Loader2 className="animate-spin text-stone-400" size={32} />
                  <p className="text-sm font-medium text-stone-500">Analyzing your fridge...</p>
                </div>
              )}

              {ingredients.length === 0 && !isScanning ? (
                <div className="p-12 bg-white rounded-3xl border border-dashed border-stone-300 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4 text-stone-300">
                    <Refrigerator size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-stone-800 mb-2">Your fridge is empty</h3>
                  <p className="text-sm text-stone-500 max-w-[200px]">Scan your fridge or add items manually to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Filter Buttons */}
                  <div className="flex gap-2 mb-2">
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${ingredientFilter === 'all' ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}
                      onClick={() => setIngredientFilter('all')}
                    >All</button>
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${ingredientFilter === 'fresh' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}
                      onClick={() => setIngredientFilter('fresh')}
                    >Fresh</button>
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${ingredientFilter === 'soon' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}
                      onClick={() => setIngredientFilter('soon')}
                    >Use Soon</button>
                    <button
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${ingredientFilter === 'expired' ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'}`}
                      onClick={() => setIngredientFilter('expired')}
                    >Expired</button>
                  </div>

                  {/* Filtered Ingredient List */}
                  {ingredients
                    .filter(item => item.quantity > 0)
                    .filter(item => ingredientFilter === 'all' ? true : item.expiryRisk === ingredientFilter)
                    .map(item => (
                      <div key={item.id} className="flex items-center gap-3 w-full">
                        <input
                          type="checkbox"
                          checked={selectedIngredients.has(item.id)}
                          onChange={e => handleSelectIngredient(item.id, e.target.checked)}
                          className="accent-emerald-600 w-4 h-4 rounded"
                          aria-label={`Select ${item.name}`}
                        />
                        <IngredientItem
                          ingredient={item}
                          onDelete={deleteIngredient}
                          onUse={handleUseIngredient}
                          selected={selectedIngredients.has(item.id)}
                          onSelect={handleSelectIngredient}
                          className="flex-1 min-w-0"
                        />
                      </div>
                    ))}
                </div>
              )}

              <button
                onClick={handleGenerateRecipesFromSelection}
                disabled={selectedIngredientObjects.length === 0 || isGenerating}
                className="w-full mt-6 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                Generate Recipes from Selected
              </button>
              <button
                onClick={handleGenerateRecipes}
                disabled={ingredients.length === 0 || isGenerating}
                className="w-full mt-2 py-3 bg-stone-200 text-stone-700 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-stone-300 transition-all disabled:opacity-50 disabled:grayscale"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                Generate Recipes from All
              </button>
            </motion.div>
          )}

          {activeTab === 'recipes' && (
            <motion.div
              key="recipes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl">Recommended for You</h2>
                <button onClick={handleGenerateRecipes} className="text-stone-400 hover:text-stone-600">
                  <Sparkles size={20} />
                </button>
              </div>

              {recipes.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-stone-400">No recipes yet. Tap the magic button to generate some!</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {recipes.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe} onClick={() => setSelectedRecipe(recipe)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h2 className="text-xl">Waste & Health Insights</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-stone-200">
                  <p className="text-[10px] font-bold text-stone-400 uppercase mb-1">Waste Risk</p>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={wasteData}
                          innerRadius={40}
                          outerRadius={60}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {wasteData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-stone-200">
                  <p className="text-[10px] font-bold text-stone-400 uppercase mb-4">Health Balance</p>
                  <div className="space-y-4">
                    {healthSummary.map(stat => (
                      <div key={stat.name}>
                        <div className="flex justify-between text-[10px] font-bold text-stone-500 uppercase mb-1">
                          <span>{stat.name}</span>
                          <span>{stat.score}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                          <div className="h-full bg-stone-900" style={{ width: `${stat.score}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-stone-900 text-white p-6 rounded-3xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="text-emerald-400" size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg">Weekly Impact</h3>
                    <p className="text-stone-400 text-xs">You've saved $12.50 this week</p>
                  </div>
                </div>
                <p className="text-sm text-stone-300 leading-relaxed">
                  By prioritizing your <strong>spinach</strong> and <strong>yogurt</strong>, you prevented 1.2kg of food waste. Keep it up!
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <h2 className="text-xl">Preferences</h2>

              <div className="bg-white rounded-3xl border border-stone-200 divide-y divide-stone-100">
                <div className="p-6">
                  <label className="text-xs font-bold text-stone-400 uppercase block mb-4">Fitness Goal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['balanced', 'high-protein', 'low-carb', 'weight-loss'].map(goal => (
                      <button
                        key={goal}
                        onClick={() => setPreferences(p => ({ ...p, fitnessGoal: goal as any }))}
                        className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all ${preferences.fitnessGoal === goal
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                          }`}
                      >
                        {goal.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  <label className="text-xs font-bold text-stone-400 uppercase block mb-4">Dietary Restrictions</label>
                  <div className="flex flex-wrap gap-2">
                    {['Vegetarian', 'Gluten-Free', 'Dairy-Free', 'Keto'].map(diet => (
                      <button
                        key={diet}
                        onClick={() => {
                          const exists = preferences.dietaryRestrictions.includes(diet);
                          setPreferences(p => ({
                            ...p,
                            dietaryRestrictions: exists
                              ? p.dietaryRestrictions.filter(d => d !== diet)
                              : [...p.dietaryRestrictions, diet]
                          }));
                        }}
                        className={`py-2 px-4 rounded-xl text-sm font-medium border transition-all ${preferences.dietaryRestrictions.includes(diet)
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                          }`}
                      >
                        {diet}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-4 right-4 bg-white/80 backdrop-blur-xl border border-stone-200 rounded-[32px] p-2 flex justify-between items-center shadow-2xl shadow-stone-200/50 z-40">
        {[
          { id: 'inventory', icon: Refrigerator, label: 'Fridge' },
          { id: 'recipes', icon: UtensilsCrossed, label: 'Meals' },
          { id: 'dashboard', icon: LayoutDashboard, label: 'Stats' },
          { id: 'settings', icon: SettingsIcon, label: 'Profile' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl transition-all ${activeTab === tab.id ? 'text-stone-900 bg-stone-100' : 'text-stone-400 hover:text-stone-600'
              }`}
          >
            <tab.icon size={20} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>

      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleFridgeScan}
      />
      {isEditOpen && scannedIngredient && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 max-h-[80vh] overflow-y-auto">

            <h2 className="text-lg font-bold mb-4">Confirm Ingredients</h2>

            {scannedIngredient.map((item, index) => (
              <div key={index} className="mb-4 p-3 border border-stone-200 rounded-xl space-y-2">

                {/* Name */}
                <input
                  type="text"
                  value={item.name || ''}
                  onChange={(e) => {
                    const updated = [...scannedIngredient];
                    updated[index] = { ...updated[index], name: e.target.value };
                    setScannedIngredient(updated);
                  }}
                  placeholder="Ingredient Name"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />

                {/* Quantity */}
                <input
                  type="number"
                  min={1}
                  value={item.quantity || 1}
                  onChange={(e) => {
                    const updated = [...scannedIngredient];
                    updated[index] = { ...updated[index], quantity: Number(e.target.value) };
                    setScannedIngredient(updated);
                  }}
                  placeholder="Quantity"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />

                {/* Unit */}
                <input
                  type="text"
                  value={item.unit || 'pcs'}
                  onChange={(e) => {
                    const updated = [...scannedIngredient];
                    updated[index] = { ...updated[index], unit: e.target.value };
                    setScannedIngredient(updated);
                  }}
                  placeholder="Unit (pcs, g, ml...)"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />

                {/* Calendar to choose expiry */}
                <input
                  type="date"
                  value={(() => {
                    const today = new Date();
                    today.setDate(today.getDate() + (item.estimatedDaysLeft ?? 7));
                    return today.toISOString().split('T')[0];
                  })()}
                  onChange={(e) => {
                    const updated = [...scannedIngredient];
                    const selectedDate = new Date(e.target.value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const daysLeft = Math.max(0, Math.ceil((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
                    updated[index] = {
                      ...updated[index],
                      estimatedDaysLeft: daysLeft,
                      expiryRisk: daysLeft <= 0 ? 'expired' : daysLeft <= 7 ? 'soon' : 'fresh'
                    };
                    setScannedIngredient(updated);
                  }}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm"
                />

                <p className="text-xs text-stone-400">
                  {item.estimatedDaysLeft} days left — Status: {item.estimatedDaysLeft <= 0 ? 'Expired' : item.estimatedDaysLeft <= 7 ? 'Use Soon' : 'Fresh'}
                </p>
              </div>
            ))}

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setScannedIngredient(null);
                }}
                className="flex-1 py-2 border border-stone-200 rounded-xl text-sm"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (scannedIngredient) addIngredient(scannedIngredient);
                  setIsEditOpen(false);
                  setScannedIngredient(null);
                }}
                className="flex-1 py-2 bg-stone-900 text-white rounded-xl text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedRecipe && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 overflow-y-auto max-h-[80vh]">
            <h2 className="text-xl font-bold mb-4">
              {selectedRecipe.name}
            </h2>

            <p className="text-sm text-stone-600 mb-4">
              {selectedRecipe.description}
            </p>

            {selectedRecipe.ingredients && (
              <>
                <h3 className="font-semibold mb-2">Ingredients</h3>
                <ul className="list-disc pl-5 mb-4 text-sm">
                  {selectedRecipe.ingredients.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </>
            )}

            {selectedRecipe.instructions && (
              <>
                <h3 className="font-semibold mb-2">Steps</h3>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                  {selectedRecipe.instructions.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))}
                </ol>
              </>
            )}

            <button
              onClick={() => setSelectedRecipe(null)}
              className="mt-6 w-full py-3 bg-stone-900 text-white rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
