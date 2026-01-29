'use client';

import { GalleryFilters, Category } from '../../types';
import { useCategories } from '../../hooks/useCategories';
import styles from './GalleryFilters.module.css';

interface GalleryFiltersBarProps {
  filters: GalleryFilters;
  onChange: (filters: GalleryFilters) => void;
}

export function GalleryFiltersBar({ filters, onChange }: GalleryFiltersBarProps) {
  const { categories, isLoading: categoriesLoading } = useCategories();

  const toggleCategory = (categoryId: string) => {
    const current = filters.category || [];
    const isSelected = current.includes(categoryId);
    const newCategories = isSelected
      ? current.filter((c) => c !== categoryId)
      : [...current, categoryId];
    onChange({ ...filters, category: newCategories.length ? newCategories : undefined });
  };

  return (
    <div className={styles.container}>
      <div className={styles.filterGroup}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={filters.onlyForSale}
            onChange={(e) => onChange({ ...filters, onlyForSale: e.target.checked })}
          />
          <span>For Sale Only</span>
        </label>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.label}>Category</label>
        <div className={styles.categoryTags}>
          {categoriesLoading ? (
            <span className={styles.loadingText}>Loading...</span>
          ) : (
            categories.map((cat: Category) => {
              const isSelected = filters.category?.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  className={`${styles.categoryTag} ${isSelected ? styles.selected : ''}`}
                  onClick={() => toggleCategory(cat.id)}
                  style={isSelected && cat.color ? { 
                    backgroundColor: cat.color, 
                    borderColor: cat.color,
                    color: '#fff'
                  } : cat.color ? {
                    borderColor: cat.color,
                    color: cat.color
                  } : undefined}
                >
                  {cat.name}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.label}>Media Type</label>
        <div className={styles.mediaTypes}>
          {['image/jpeg', 'image/png', 'image/gif'].map((type) => {
            const isSelected = filters.mediaType?.includes(type);
            const label = type.split('/')[1].toUpperCase();
            
            return (
              <button
                key={type}
                className={`${styles.mediaTypeBtn} ${isSelected ? styles.selected : ''}`}
                onClick={() => {
                  const current = filters.mediaType || [];
                  const newTypes = isSelected
                    ? current.filter(t => t !== type)
                    : [...current, type];
                  onChange({ ...filters, mediaType: newTypes.length ? newTypes : undefined });
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.label}>Sort By</label>
        <select
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value as GalleryFilters['sortBy'] })}
          className={styles.select}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.label}>Price Range (ETH)</label>
        <div className={styles.priceInputs}>
          <input
            type="number"
            placeholder="Min"
            value={filters.priceMin || ''}
            onChange={(e) => onChange({ ...filters, priceMin: e.target.value || undefined })}
            className={styles.priceInput}
            min="0"
            step="0.00001"
          />
          <span className={styles.priceSeparator}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax || ''}
            onChange={(e) => onChange({ ...filters, priceMax: e.target.value || undefined })}
            className={styles.priceInput}
            min="0"
            step="0.00001"
          />
        </div>
      </div>
    </div>
  );
}
