import React, { useState } from 'react';
import { 
  Filter, SlidersHorizontal, MapPin, X, 
  RotateCcw, Sparkles, Gift, ShoppingBag 
} from 'lucide-react';
import { Product, Category } from '../types.js';
import { ProductCard } from '../components/ProductCard.js';

interface BrowseViewProps {
  products: Product[];
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (slug: string | null) => void;
  favorites: string[];
  onToggleFavorite: (e: React.MouseEvent, productId: string) => void;
  onProductClick: (productId: string) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  onNavigate: (view: string) => void;
}

export const BrowseView: React.FC<BrowseViewProps> = ({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  favorites,
  onToggleFavorite,
  onProductClick,
  searchQuery,
  onSearch,
  onNavigate
}) => {
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [conditionFilter, setConditionFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [onlyGifts, setOnlyGifts] = useState<boolean>(false);
  const [showFiltersMobile, setShowFiltersMobile] = useState<boolean>(false);

  // Apply filters in memory for instant responsiveness
  let filtered = products.filter(p => p.status === 'active' || p.status === 'gift_reserved');

  if (selectedCategory) {
    filtered = filtered.filter(p => {
      const cat = categories.find(c => c.slug === selectedCategory || c.id === selectedCategory);
      return cat ? p.categoryId === cat.id : true;
    });
  }

  if (onlyGifts) {
    filtered = filtered.filter(p => p.isGift || p.price === 0);
  }

  if (minPrice && !isNaN(Number(minPrice))) {
    filtered = filtered.filter(p => p.price >= Number(minPrice));
  }

  if (maxPrice && !isNaN(Number(maxPrice))) {
    filtered = filtered.filter(p => p.price <= Number(maxPrice));
  }

  if (cityFilter.trim()) {
    const q = cityFilter.toLowerCase();
    filtered = filtered.filter(p => 
      p.approxLocation.city.toLowerCase().includes(q) || 
      p.approxLocation.province.toLowerCase().includes(q)
    );
  }

  if (conditionFilter) {
    filtered = filtered.filter(p => p.condition === conditionFilter);
  }

  // Sorting
  if (sortBy === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  } else {
    // Default: Featured first, then recent
    filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  const handleResetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setCityFilter('');
    setConditionFilter('');
    setSortBy('recent');
    setOnlyGifts(false);
    onSelectCategory(null);
    onSearch('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header & Quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 font-heading">
            {selectedCategory 
              ? categories.find(c => c.slug === selectedCategory)?.name || 'Catálogo de productos'
              : onlyGifts 
              ? '🎁 Regalos gratis disponibles' 
              : 'Explorar productos en España'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {filtered.length} {filtered.length === 1 ? 'anuncio encontrado' : 'anuncios encontrados'}
            {searchQuery && ` para "${searchQuery}"`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
            className="sm:hidden px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-semibold rounded-lg flex items-center gap-1.5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros</span>
          </button>

          {/* Sort selector */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="recent">Más recientes</option>
            <option value="price-asc">Precio: de menor a mayor</option>
            <option value="price-desc">Precio: de mayor a menor</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Sidebar */}
        <aside className={`lg:block ${showFiltersMobile ? 'block' : 'hidden'} space-y-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs h-fit`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Filtros</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          </div>

          {/* Only Gifts toggle */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50/70 p-2 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={onlyGifts}
                onChange={(e) => setOnlyGifts(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
              />
              <Gift className="w-3.5 h-3.5 text-emerald-600" />
              <span>Solo regalos gratis (0 €)</span>
            </label>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-2">Categoría</label>
            <select
              value={selectedCategory || ''}
              onChange={(e) => onSelectCategory(e.target.value ? e.target.value : null)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          {!onlyGifts && (
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-2">Precio (€)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500"
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Location Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-2">Ubicación (Ciudad o Provincia)</label>
            <div className="relative">
              <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Ej: Madrid, Valencia..."
                className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-2">Estado del producto</label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-hidden focus:border-indigo-500"
            >
              <option value="">Cualquier estado</option>
              <option value="new">Nuevo a estrenar</option>
              <option value="like_new">Como nuevo</option>
              <option value="good">En buen estado</option>
              <option value="fair">Aceptable</option>
            </select>
          </div>
        </aside>

        {/* Product Grid */}
        <main className="lg:col-span-3 space-y-4">
          {filtered.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-6">
              <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 font-heading">
                No se han encontrado productos con estos criterios
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                Prueba a ajustar los filtros de precio, cambiar la ubicación o limpiar la búsqueda.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filtered.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favorites.includes(product.id)}
                  onToggleFavorite={onToggleFavorite}
                  onClick={onProductClick}
                />
              ))}
            </div>
          )}
        </main>
      </div>

    </div>
  );
};
