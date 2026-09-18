import React from 'react';
import { Category } from '../types.js';
import { CategoryIcon } from './CategoryIcon.js';
import { LayoutGrid } from 'lucide-react';

interface CategoryBarProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory
}) => {
  return (
    <div className="w-full bg-white border-b border-slate-200/80 py-3 overflow-x-auto no-scrollbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2">
        
        {/* All categories pill */}
        <button
          onClick={() => onSelectCategory(null)}
          className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            selectedCategory === null
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Todas</span>
        </button>

        {/* Categories list */}
        {categories.map((category) => {
          const isSelected = selectedCategory === category.slug || selectedCategory === category.id;
          return (
            <button
              key={category.id}
              onClick={() => onSelectCategory(isSelected ? null : category.slug)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                  : 'bg-slate-100/90 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <CategoryIcon name={category.iconName || category.slug} className="w-3.5 h-3.5" />
              <span>{category.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
