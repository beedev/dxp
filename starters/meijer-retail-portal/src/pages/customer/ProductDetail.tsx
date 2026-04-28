import React, { useState, useMemo } from 'react';
import { Card, Badge, Tabs, Button, DataTable, StatusBadge } from '@dxp/ui';
import { ArrowLeft, Star, ShoppingCart } from 'lucide-react';
import { products } from '../../data/mock-products';
import { stores } from '../../data/mock-stores';

interface ProductDetailProps {
  productId: string;
  onNavigate: (page: string) => void;
}

const reviews = [
  { id: 'RV1', author: 'Mike T.', rating: 5, title: 'Best drill I\'ve ever owned', body: 'Powerful, lightweight, and the two batteries mean I never run out of juice mid-project. Chuck is solid and true. Highly recommend for both DIY and professional use.', date: '2026-03-28', helpful: 42 },
  { id: 'RV2', author: 'Sarah K.', rating: 4, title: 'Great value for the price', body: 'Does everything I need for home projects. The carrying case is a nice touch. Took off one star because the charger is a bit slow, but otherwise excellent.', date: '2026-03-15', helpful: 18 },
  { id: 'RV3', author: 'Dave R.', rating: 5, title: 'Professional quality at a fair price', body: 'I\'m a contractor and this handles daily use without complaint. Battery life is solid and the ergonomics are comfortable for extended use.', date: '2026-02-22', helpful: 31 },
  { id: 'RV4', author: 'Jennifer L.', rating: 4, title: 'Perfect for weekend projects', body: 'My husband and I built a deck this spring and this drill was a workhorse. Light enough for overhead work. The LED light is super helpful in tight spaces.', date: '2026-02-10', helpful: 24 },
  { id: 'RV5', author: 'Chris M.', rating: 3, title: 'Good but battery could be bigger', body: 'The drill itself is solid but the 1.3Ah batteries don\'t last long under heavy use. I\'d recommend upgrading to 2.0Ah batteries separately.', date: '2026-01-18', helpful: 15 },
];

const stockData = [
  { storeId: 'S001', store: 'ACE — Naperville, IL', status: 'In Stock', qty: 12 },
  { storeId: 'S002', store: 'ACE — Austin Downtown, TX', status: 'In Stock', qty: 8 },
  { storeId: 'S003', store: 'ACE — Cherry Creek, CO', status: 'Low Stock', qty: 2 },
  { storeId: 'S009', store: 'ACE — Bellevue, WA', status: 'In Stock', qty: 15 },
  { storeId: 'S004', store: 'ACE — Hawthorne, OR', status: 'Out of Stock', qty: 0 },
];

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
        />
      ))}
    </div>
  );
}

export function ProductDetail({ productId, onNavigate }: ProductDetailProps) {
  const product = products.find((p) => p.id === productId) || products[0];
  const [activeTab, setActiveTab] = useState('specs');

  const relatedProducts = useMemo(
    () => products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4),
    [product]
  );

  const savings = product.msrp - product.price;
  const hasSavings = savings > 0;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => onNavigate('/customer/catalog')}
        className="flex items-center gap-1.5 text-sm font-medium text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-brand)] transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to catalog
      </button>

      {/* Product Header */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Image placeholder */}
          <div className="w-full lg:w-72 h-56 rounded-lg bg-[var(--dxp-border-light)] flex items-center justify-center shrink-0">
            <span className="text-[var(--dxp-text-muted)] text-sm">Product Image</span>
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="info">{product.brand}</Badge>
              <Badge variant="default">{product.category}</Badge>
              {product.inStoreOnly && <Badge variant="warning">In-store only</Badge>}
            </div>

            <h1 className="text-2xl font-extrabold text-[var(--dxp-text)] mb-2">{product.name}</h1>
            <p className="text-sm text-[var(--dxp-text-secondary)] mb-4">{product.description}</p>

            {/* Rating summary */}
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={product.rating} size={18} />
              <span className="text-sm font-semibold text-[var(--dxp-text)]">{product.rating.toFixed(1)}</span>
              <span className="text-sm text-[var(--dxp-text-muted)]">({product.reviewCount.toLocaleString()} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-3xl font-extrabold text-[var(--dxp-text)]">${product.price.toFixed(2)}</span>
              {hasSavings && (
                <>
                  <span className="text-lg text-[var(--dxp-text-muted)] line-through">${product.msrp.toFixed(2)}</span>
                  <Badge variant="success">You save ${savings.toFixed(2)}</Badge>
                </>
              )}
            </div>

            {/* SKU / Barcode */}
            <div className="flex items-center gap-4 text-xs text-[var(--dxp-text-muted)] mb-4">
              <span>SKU: {product.sku}</span>
              <span>UPC: {product.barcode}</span>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => onNavigate('/customer/cart')}
              className="flex items-center gap-2"
            >
              <ShoppingCart size={18} />
              Add to Cart
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="mb-6">
        <Tabs
          tabs={[
            { key: 'specs', label: 'Specifications' },
            { key: 'reviews', label: 'Reviews', count: reviews.length },
            { key: 'availability', label: 'Store Availability' },
          ]}
          active={activeTab}
          onChange={setActiveTab}
          variant="underline"
        />
      </div>

      {/* Tab content */}
      {activeTab === 'specs' && (
        <Card className="p-6 mb-6">
          <h3 className="text-base font-bold text-[var(--dxp-text)] mb-4">Product Specifications</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {Object.entries(product.specs).map(([key, value]) => (
              <div key={key} className="flex justify-between py-2 border-b border-[var(--dxp-border-light)]">
                <dt className="text-sm font-medium text-[var(--dxp-text-muted)]">{key}</dt>
                <dd className="text-sm font-semibold text-[var(--dxp-text)]">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {activeTab === 'reviews' && (
        <div className="space-y-4 mb-6">
          {reviews.map((review) => (
            <Card key={review.id} className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[var(--dxp-text)]">{review.author}</span>
                  <StarRating rating={review.rating} />
                </div>
                <span className="text-xs text-[var(--dxp-text-muted)]">{review.date}</span>
              </div>
              <h4 className="text-sm font-semibold text-[var(--dxp-text)] mb-1">{review.title}</h4>
              <p className="text-sm text-[var(--dxp-text-secondary)] mb-2">{review.body}</p>
              <span className="text-xs text-[var(--dxp-text-muted)]">{review.helpful} people found this helpful</span>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'availability' && (
        <div className="mb-6">
          <DataTable
            columns={[
              { key: 'store', header: 'Store' },
              {
                key: 'status',
                header: 'Availability',
                render: (val: unknown) => {
                  const v = val as string;
                  const statusMap: Record<string, 'approved' | 'pending' | 'rejected'> = {
                    'In Stock': 'approved',
                    'Low Stock': 'pending',
                    'Out of Stock': 'rejected',
                  };
                  return <StatusBadge status={statusMap[v] || 'pending'} label={v} />;
                },
              },
              {
                key: 'qty',
                header: 'Qty Available',
                render: (val: unknown) => <span className="text-sm font-medium">{val as number}</span>,
              },
            ]}
            data={stockData}
          />
        </div>
      )}

      {/* Related Products */}
      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">You Might Also Like</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {relatedProducts.map((p) => (
          <Card key={p.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => {
            onNavigate('/customer/product-detail');
          }}>
            <div className="flex items-start justify-between mb-2">
              <Badge variant={p.price < p.msrp ? 'success' : 'info'}>
                {p.price < p.msrp ? `Save $${(p.msrp - p.price).toFixed(2)}` : p.brand}
              </Badge>
            </div>
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-1 line-clamp-2">{p.name}</h3>
            <div className="flex items-center gap-0.5 mb-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} size={10} className={s <= Math.round(p.rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'} />
              ))}
              <span className="text-[10px] text-[var(--dxp-text-muted)] ml-1">({p.reviewCount})</span>
            </div>
            <span className="text-base font-bold text-[var(--dxp-text)]">${p.price.toFixed(2)}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}
