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

// Customer pages — Phase 5
import { MyStore } from './pages/customer/MyStore';

// Conversational AI Assistant (from shared @dxp/ai-assistant package)
import {
  AgenticAssistant,
  AgentReadiness,
  ConfigBuilder,
  DataPipeline,
} from '@dxp/ai-assistant';

// Manager pages — Phase 5
import { SupplierOrders } from './pages/manager/SupplierOrders';
import { Promotions } from './pages/manager/Promotions';
import { StoreSettings } from './pages/manager/StoreSettings';

// Coop pages — Phase 5
import { StorePerformance } from './pages/coop/StorePerformance';
import { SupplyChain } from './pages/coop/SupplyChain';
import { Procurement } from './pages/coop/Procurement';
import { VendorManagement } from './pages/coop/VendorManagement';
import { QualityCompliance } from './pages/coop/QualityCompliance';

// ---------------------------------------------------------------------------
// Navigation definitions
// ---------------------------------------------------------------------------

const customerNav: NavItem[] = [
  { label: 'Dashboard', href: '/customer' },
  { label: 'AI Assistant', href: '/customer/ai-assistant' },
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
  { label: 'Agent Readiness', href: '/manager/agent-readiness' },
  { label: 'Config Builder', href: '/manager/config-builder' },
  { label: 'Data Pipeline', href: '/manager/data-pipeline' },
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
    case '/customer/ai-assistant':
      return <AgenticAssistant />;
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
      return <MyStore />;

    // Manager
    case '/manager':
      return <ManagerDashboard />;
    case '/manager/agent-readiness':
      return <AgentReadiness />;
    case '/manager/config-builder':
      return <ConfigBuilder />;
    case '/manager/data-pipeline':
      return <DataPipeline />;
    case '/manager/inventory':
      return <InventoryManagement />;
    case '/manager/sales':
      return <SalesAnalytics />;
    case '/manager/staff':
      return <StaffSchedule />;
    case '/manager/insights':
      return <CustomerInsights />;
    case '/manager/suppliers':
      return <SupplierOrders />;
    case '/manager/promotions':
      return <Promotions />;
    case '/manager/settings':
      return <StoreSettings />;

    // Coop
    case '/coop':
      return <NetworkDashboard />;
    case '/coop/performance':
      return <StorePerformance />;
    case '/coop/supply-chain':
      return <SupplyChain />;
    case '/coop/procurement':
      return <Procurement />;
    case '/coop/vendors':
      return <VendorManagement />;
    case '/coop/compliance':
      return <QualityCompliance />;

    default:
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold text-[var(--dxp-text)]">Page Not Found</h1>
          <p className="mt-2 text-[var(--dxp-text-secondary)]">The page at &ldquo;{path}&rdquo; does not exist.</p>
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  // Initialize from the browser URL so direct links work (e.g. /manager/agent-readiness)
  const initialPath =
    typeof window !== 'undefined' && window.location.pathname !== '/'
      ? window.location.pathname
      : '/customer';

  const [currentPath, setCurrentPathState] = useState(initialPath);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Keep the browser URL in sync when user navigates internally
  const setCurrentPath = (p: string) => {
    setCurrentPathState(p);
    if (typeof window !== 'undefined' && window.location.pathname !== p) {
      window.history.pushState({}, '', p);
    }
  };

  // Handle browser back/forward
  React.useEffect(() => {
    const onPop = () => setCurrentPathState(window.location.pathname || '/customer');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

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
