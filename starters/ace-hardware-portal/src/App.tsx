import React, { useState } from 'react';
import { PageLayout, type NavItem } from '@dxp/ui';
import { PersonaSwitcher, type Persona } from './components/PersonaSwitcher';

// Dashboard pages
import { CustomerDashboard } from './pages/customer/Dashboard';
import { ManagerDashboard } from './pages/manager/Dashboard';
import { NetworkDashboard } from './pages/coop/NetworkDashboard';

// Customer pages — Phase 2
import { ProductCatalog } from './pages/customer/ProductCatalog';
import { ProductDetail } from './pages/customer/ProductDetail';
import { CartCheckout } from './pages/customer/CartCheckout';
import { OrderHistory } from './pages/customer/OrderHistory';
import { LoyaltyRewards } from './pages/customer/LoyaltyRewards';

// Customer pages — Phase 4
import { ProjectPlanner } from './pages/customer/ProjectPlanner';
import { ServiceBooking } from './pages/customer/ServiceBooking';

// Manager pages — Phase 3
import { InventoryManagement } from './pages/manager/InventoryManagement';
import { SalesAnalytics } from './pages/manager/SalesAnalytics';
import { StaffSchedule } from './pages/manager/StaffSchedule';
import { CustomerInsights } from './pages/manager/CustomerInsights';

// ---------------------------------------------------------------------------
// Navigation definitions
// ---------------------------------------------------------------------------

const customerNav: NavItem[] = [
  { label: 'Dashboard', href: '/customer' },
  { label: 'Product Catalog', href: '/customer/catalog' },
  { label: 'Project Planner', href: '/customer/projects' },
  { label: 'Order History', href: '/customer/orders' },
  { label: 'Cart & Checkout', href: '/customer/cart' },
  { label: 'Service Booking', href: '/customer/services' },
  { label: 'My Store', href: '/customer/store' },
  { label: 'Loyalty & Rewards', href: '/customer/loyalty' },
];

const managerNav: NavItem[] = [
  { label: 'Dashboard', href: '/manager' },
  { label: 'Inventory', href: '/manager/inventory' },
  { label: 'Sales Analytics', href: '/manager/sales' },
  { label: 'Staff Schedule', href: '/manager/staff' },
  { label: 'Customer Insights', href: '/manager/insights' },
  { label: 'Supplier Orders', href: '/manager/suppliers' },
  { label: 'Promotions', href: '/manager/promotions' },
  { label: 'Store Settings', href: '/manager/settings' },
];

const coopNav: NavItem[] = [
  { label: 'Network Dashboard', href: '/coop' },
  { label: 'Store Performance', href: '/coop/performance' },
  { label: 'Supply Chain', href: '/coop/supply-chain' },
  { label: 'Procurement', href: '/coop/procurement' },
  { label: 'Vendor Management', href: '/coop/vendors' },
  { label: 'Quality & Compliance', href: '/coop/compliance' },
];

function navForPersona(persona: Persona): NavItem[] {
  switch (persona) {
    case 'customer': return customerNav;
    case 'manager': return managerNav;
    case 'coop': return coopNav;
  }
}

const defaultPathByPersona: Record<Persona, string> = {
  customer: '/customer',
  manager: '/manager',
  coop: '/coop',
};

function personaFromPath(path: string): Persona {
  if (path.startsWith('/manager')) return 'manager';
  if (path.startsWith('/coop')) return 'coop';
  return 'customer';
}

// ---------------------------------------------------------------------------
// Page router
// ---------------------------------------------------------------------------

function renderPage(
  path: string,
  navigate: (p: string) => void,
  selectedProductId: string | null,
  setSelectedProductId: (id: string) => void,
  selectedProjectId: string | null,
  setSelectedProjectId: (id: string | null) => void,
) {
  switch (path) {
    // Customer
    case '/customer':
      return <CustomerDashboard onNavigate={navigate} />;
    case '/customer/catalog':
      return (
        <ProductCatalog
          onNavigate={navigate}
          onSelectProduct={(id) => { setSelectedProductId(id); }}
        />
      );
    case '/customer/product-detail':
      return (
        <ProductDetail
          productId={selectedProductId || 'T001'}
          onNavigate={navigate}
        />
      );
    case '/customer/cart':
      return <CartCheckout onNavigate={navigate} />;
    case '/customer/orders':
      return <OrderHistory />;
    case '/customer/loyalty':
      return <LoyaltyRewards />;
    case '/customer/projects':
      return <ProjectPlanner selectedProjectId={selectedProjectId} onSelectProject={setSelectedProjectId} />;
    case '/customer/services':
      return <ServiceBooking />;
    case '/customer/store':
      return <PlaceholderPage title={customerNav.find((n) => n.href === path)?.label || path} persona="customer" />;

    // Manager
    case '/manager':
      return <ManagerDashboard />;
    case '/manager/inventory':
      return <InventoryManagement />;
    case '/manager/sales':
      return <SalesAnalytics />;
    case '/manager/staff':
      return <StaffSchedule />;
    case '/manager/insights':
      return <CustomerInsights />;
    case '/manager/suppliers':
    case '/manager/promotions':
    case '/manager/settings':
      return <PlaceholderPage title={managerNav.find((n) => n.href === path)?.label || path} persona="manager" />;

    // Coop
    case '/coop':
      return <NetworkDashboard />;
    case '/coop/performance':
    case '/coop/supply-chain':
    case '/coop/procurement':
    case '/coop/vendors':
    case '/coop/compliance':
      return <PlaceholderPage title={coopNav.find((n) => n.href === path)?.label || path} persona="coop" />;

    default:
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-[var(--dxp-text)]">Page Not Found</h1>
          <p className="mt-2 text-[var(--dxp-text-secondary)]">The page at &ldquo;{path}&rdquo; does not exist.</p>
        </div>
      );
  }
}

// Placeholder for pages that will be built in later phases
function PlaceholderPage({ title, persona }: { title: string; persona: string }) {
  const colors: Record<string, string> = {
    customer: 'from-red-600 to-red-400',
    manager: 'from-gray-700 to-gray-500',
    coop: 'from-emerald-700 to-emerald-500',
  };

  return (
    <div className="p-8">
      <div className={`rounded-xl bg-gradient-to-r ${colors[persona]} text-white p-8 mb-6`}>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="text-sm opacity-80 mt-1">Coming in Phase 3+. This page will be fully built with @dxp/ui components.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 rounded-lg bg-[var(--dxp-border-light)] border border-[var(--dxp-border)] animate-pulse" />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  const [currentPath, setCurrentPath] = useState('/customer');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const currentPersona = personaFromPath(currentPath);

  const handlePersonaChange = (persona: Persona) => {
    setCurrentPath(defaultPathByPersona[persona]);
  };

  const nav = navForPersona(currentPersona).map((item) => ({
    ...item,
    active: item.href === currentPath,
  }));

  return (
    <PageLayout
      appName="ACE Hardware Portal"
      navItems={nav}
      onNavigate={setCurrentPath}
      userMenu={
        <div className="space-y-4">
          <PersonaSwitcher current={currentPersona} onChange={handlePersonaChange} />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--dxp-text-muted)] mb-2">Dev Tools</p>
            <div className="space-y-1">
              {[
                { label: 'Insurance Portal', href: 'http://localhost:4200' },
                { label: 'Wealth Portal', href: 'http://localhost:4400' },
                { label: 'Swagger', href: '/api/docs' },
              ].map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-xs text-[var(--dxp-text-secondary)] hover:text-[var(--dxp-brand)] py-0.5"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      }
    >
      {renderPage(currentPath, setCurrentPath, selectedProductId, setSelectedProductId, selectedProjectId, setSelectedProjectId)}
    </PageLayout>
  );
}
