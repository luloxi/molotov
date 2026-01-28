'use client';

import { GalleryFilters } from '../../types';
import styles from './GalleryFilters.module.css';

interface GalleryFiltersBarProps {
  filters: GalleryFilters;
  onChange: (filters: GalleryFilters) => void;
}

export function GalleryFiltersBar({ filters, onChange }: GalleryFiltersBarProps) {
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
            step="0.001"
          />
          <span className={styles.priceSeparator}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={filters.priceMax || ''}
            onChange={(e) => onChange({ ...filters, priceMax: e.target.value || undefined })}
            className={styles.priceInput}
            min="0"
            step="0.001"
          />
        </div>
      </div>
    </div>
  );
}
