import React from 'react';
import { Card, StatsDisplay, StatusBadge, Badge } from '@dxp/ui';
import { Star, MapPin, Wrench, FolderOpen, ArrowRight } from 'lucide-react';
import { currentMember } from '../../data/mock-loyalty';
import { products } from '../../data/mock-products';

interface CustomerDashboardProps {
  onNavigate: (path: string) => void;
}

const recommended = products.filter((_, i) => [0, 1, 4, 10, 20, 30].includes(i)).slice(0, 6);

const recentOrders = [
  { id: 'ORD-4812', items: 'Whole Milk, Honeycrisp Apples, DeKalb Bread, Eggs', total: 24.97, status: 'Ready for Pickup' as const, date: '2026-04-07' },
  { id: 'ORD-4798', items: 'Game-Day Bundle: Burgers, Brats, Chips, 12-pack', total: 84.62, status: 'Delivered' as const, date: '2026-04-03' },
  { id: 'ORD-4781', items: 'Birthday Cake (1/4 sheet), Balloon Bouquet, Plates', total: 49.97, status: 'Processing' as const, date: '2026-04-01' },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
        />
      ))}
      <span className="text-[10px] text-[var(--dxp-text-muted)] ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

const statusMap: Record<string, 'info' | 'success' | 'warning'> = {
  'Ready for Pickup': 'info',
  'Delivered': 'success',
  'Processing': 'warning',
};

export function CustomerDashboard({ onNavigate }: CustomerDashboardProps) {
  const tierColors: Record<string, string> = {
    Bronze: 'bg-orange-100 text-orange-700 border-orange-300',
    Silver: 'bg-gray-100 text-gray-700 border-gray-300',
    Gold: 'bg-amber-100 text-amber-700 border-amber-300',
    Platinum: 'bg-purple-100 text-purple-700 border-purple-300',
  };

  return (
    <div>
      {/* Tenant brand strip — uses theme tokens (var(--dxp-info) for the
          navy band, var(--dxp-warning) for the accent line). Both come
          from `src/config/theme.ts` and cascade everywhere via the
          @dxp/ui ThemeProvider. */}
      <div
        className="-mx-6 -mt-6 mb-6 px-6 py-4 flex items-center gap-3"
        style={{
          backgroundColor: 'var(--dxp-info)',
          borderBottom: '4px solid var(--dxp-warning)',
        }}
      >
        <span className="text-white text-lg font-black tracking-tight">meijer</span>
        <span className="text-white/70 text-xs">↗ Higher standards · Lower prices</span>
      </div>

      {/* Welcome Banner */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">
            Welcome back, {currentMember.name.split(' ')[0]}!
          </h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${tierColors[currentMember.tier]}`}>
            {currentMember.tier} Member
          </span>
        </div>
        <p className="text-[var(--dxp-text-secondary)]">mPerks member since {new Date(currentMember.memberSince).getFullYear()}</p>
      </div>

      {/* Quick Stats */}
      <div className="mb-6">
        <StatsDisplay
          stats={[
            { label: 'Loyalty Points', value: currentMember.points, format: 'number' },
            { label: 'Active Orders', value: 2, format: 'number' },
            { label: 'Saved This Year', value: 487, format: 'currency' },
            { label: 'Member Since', value: 2019, format: 'number' },
          ]}
        />
      </div>

      {/* Game-Day Promo Banner — driven by theme tokens (info → warning),
          so swapping the tenant theme changes the gradient automatically. */}
      <Card
        className="p-6 mb-6 text-white"
        style={{
          background: 'linear-gradient(to right, var(--dxp-info), var(--dxp-warning))',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Limited Time Offer</p>
            <h2 className="text-2xl font-extrabold mb-1">Game-Day Savings Event</h2>
            <p className="text-sm opacity-90">20% off grilling meats $30+, $5 off party trays from the Bakery. Use code BBQ20 with mPerks. Through Sunday.</p>
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-5xl font-black">30%</p>
            <p className="text-xs font-bold uppercase tracking-wider opacity-80">OFF</p>
          </div>
        </div>
      </Card>

      {/* Recommended Products */}
      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Recommended for You</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {recommended.map((product) => (
          <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <Badge variant={product.price < product.msrp ? 'success' : 'info'}>
                {product.price < product.msrp ? `Save $${(product.msrp - product.price).toFixed(2)}` : 'Popular'}
              </Badge>
              <span className="text-[10px] text-[var(--dxp-text-muted)]">{product.brand}</span>
            </div>
            <h3 className="text-sm font-bold text-[var(--dxp-text)] mb-1 line-clamp-2">{product.name}</h3>
            <StarRating rating={product.rating} />
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-lg font-bold text-[var(--dxp-text)]">${product.price.toFixed(2)}</span>
              {product.price < product.msrp && (
                <span className="text-xs text-[var(--dxp-text-muted)] line-through">${product.msrp.toFixed(2)}</span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Orders */}
      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Recent Orders</h2>
      <div className="space-y-3 mb-8">
        {recentOrders.map((order) => (
          <Card key={order.id} className="p-4 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold text-[var(--dxp-text)]">{order.id}</p>
                <StatusBadge status={statusMap[order.status] === 'info' ? 'in-review' : statusMap[order.status] === 'success' ? 'approved' : 'pending'} label={order.status} />
              </div>
              <p className="text-xs text-[var(--dxp-text-secondary)] truncate">{order.items}</p>
              <p className="text-xs text-[var(--dxp-text-muted)] mt-0.5">{order.date}</p>
            </div>
            <p className="text-sm font-bold text-[var(--dxp-text)] ml-4">${order.total.toFixed(2)}</p>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-3">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'Find My Store', icon: <MapPin size={20} className="text-[var(--dxp-brand)]" />, path: '/customer/store', desc: 'Locate your nearest Meijer' },
          { label: 'Book a Service', icon: <Wrench size={20} className="text-[var(--dxp-brand)]" />, path: '/customer/services', desc: 'Bakery, deli platters, photo center & more' },
          { label: 'Browse Projects', icon: <FolderOpen size={20} className="text-[var(--dxp-brand)]" />, path: '/customer/projects', desc: 'DIY guides & materials lists' },
        ].map((action) => (
          <button
            key={action.path}
            onClick={() => onNavigate(action.path)}
            className="flex items-center gap-3 p-4 rounded-lg border border-[var(--dxp-border)] bg-[var(--dxp-surface)] hover:bg-red-50 hover:border-red-200 text-left transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--dxp-border-light)] flex items-center justify-center group-hover:bg-red-100 transition-colors">
              {action.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--dxp-text)]">{action.label}</p>
              <p className="text-xs text-[var(--dxp-text-muted)]">{action.desc}</p>
            </div>
            <ArrowRight size={14} className="text-[var(--dxp-text-muted)] group-hover:text-[var(--dxp-brand)] transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
