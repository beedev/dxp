import React, { useState, useMemo } from 'react';
import { Card, Badge, Input, Select, FilterBar } from '@dxp/ui';
import { Search, Star, ShoppingCart } from 'lucide-react';
import { products } from '../../data/mock-products';

interface ProductCatalogProps {
  onNavigate: (page: string) => void;
  onSelectProduct: (id: string) => void;
}

const categoryFilters = [
  { key: 'all', label: 'All', value: 'all' },
  { key: 'paint', label: 'Paint', value: 'paint' },
  { key: 'tools', label: 'Tools', value: 'tools' },
  { key: 'plumbing', label: 'Plumbing', value: 'plumbing' },
  { key: 'electrical', label: 'Electrical', value: 'electrical' },
  { key: 'outdoor', label: 'Outdoor', value: 'outdoor' },
  { key: 'hardware', label: 'Hardware', value: 'hardware' },
  { key: 'seasonal', label: 'Seasonal', value: 'seasonal' },
];

const sortOptions = [
  { value: 'name-asc', label: 'Name A→Z' },
  { value: 'price-asc', label: 'Price Low→High' },
  { value: 'price-desc', label: 'Price High→Low' },
  { value: 'rating-desc', label: 'Highest Rated' },
];

function StarRating({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={12}
            className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
          />
        ))}
      </div>
      <span className="text-[10px] text-[var(--dxp-text-muted)]">({count})</span>
    </div>
  );
}

export function ProductCatalog({ onNavigate, onSelectProduct }: ProductCatalogProps) {
  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>(['all']);
  const [sortBy, setSortBy] = useState('name-asc');

  const handleToggle = (key: string) => {
    if (key === 'all') {
      setActiveCategories(['all']);
    } else {
      const without = activeCategories.filter((k) => k !== 'all');
      if (without.includes(key)) {
        const updated = without.filter((k) => k !== key);
        setActiveCategories(updated.length === 0 ? ['all'] : updated);
      } else {
        setActiveCategories([...without, key]);
      }
    }
  };

  const filtered = useMemo(() => {
    let result = products;

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (!activeCategories.includes('all')) {
      result = result.filter((p) => activeCategories.includes(p.category));
    }

    // Sort
    const sorted = [...result];
    switch (sortBy) {
      case 'price-asc': sorted.sort((a, b) => a.price - b.price); break;
      case 'price-desc': sorted.sort((a, b) => b.price - a.price); break;
      case 'rating-desc': sorted.sort((a, b) => b.rating - a.rating); break;
      default: sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
    }

    return sorted;
  }, [search, activeCategories, sortBy]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Product Catalog</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Browse our full range of hardware, tools, paint, and more</p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--dxp-text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, brand, or category..."
            className="pl-9"
          />
        </div>
        <div className="w-48">
          <Select options={sortOptions} value={sortBy} onChange={(v) => setSortBy(v)} placeholder="Sort by..." />
        </div>
      </div>

      {/* Category Filters */}
      <div className="mb-4">
        <FilterBar
          filters={categoryFilters}
          activeFilters={activeCategories}
          onToggle={handleToggle}
          onClear={() => setActiveCategories(['all'])}
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-[var(--dxp-text-muted)] mb-4">
        Showing {filtered.length} of {products.length} products
      </p>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((product) => (
          <Card key={product.id} className="p-4 hover:shadow-md transition-shadow flex flex-col">
            {/* Header row */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                {product.price < product.msrp && (
                  <Badge variant="success">Save ${(product.msrp - product.price).toFixed(2)}</Badge>
                )}
                {product.inStoreOnly && (
                  <Badge variant="warning">In-store only</Badge>
                )}
              </div>
              <span className="text-[10px] text-[var(--dxp-text-muted)] font-medium uppercase tracking-wide">
                {product.brand}
              </span>
            </div>

            {/* Product name */}
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-1 line-clamp-2">{product.name}</h3>
            <p className="text-xs text-[var(--dxp-text-muted)] capitalize mb-2">{product.category}</p>

            {/* Rating */}
            <StarRating rating={product.rating} count={product.reviewCount} />

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-lg font-bold text-[var(--dxp-text)]">${product.price.toFixed(2)}</span>
              {product.price < product.msrp && (
                <span className="text-xs text-[var(--dxp-text-muted)] line-through">${product.msrp.toFixed(2)}</span>
              )}
            </div>

            {/* View Details */}
            <div className="mt-auto pt-3">
              <button
                onClick={() => {
                  onSelectProduct(product.id);
                  onNavigate('/customer/product-detail');
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--dxp-brand)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <ShoppingCart size={14} />
                View Details
              </button>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-lg font-semibold text-[var(--dxp-text)]">No products found</p>
          <p className="text-sm text-[var(--dxp-text-muted)] mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
