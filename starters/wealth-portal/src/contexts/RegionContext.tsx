import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { REGIONS, resolveDefaultRegion, type RegionConfig, type RegionId } from '../config/regions';
import { REGION_MOCK, type RegionMock } from '../data/region-mock';

interface RegionContextValue {
  region: RegionConfig;
  regionId: RegionId;
  setRegion: (id: RegionId) => void;
  /** Format a number as currency using the active region's locale + currency code */
  formatCurrency: (value: number, opts?: { compact?: boolean }) => string;
}

const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [regionId, setRegionId] = useState<RegionId>(resolveDefaultRegion);

  const region = REGIONS[regionId];

  const formatCurrency = (value: number, opts?: { compact?: boolean }): string => {
    return new Intl.NumberFormat(region.currency.locale, {
      style: 'currency',
      currency: region.currency.code,
      notation: opts?.compact ? 'compact' : 'standard',
      maximumFractionDigits: opts?.compact ? 1 : 2,
    }).format(value);
  };

  return (
    <RegionContext.Provider value={{ region, regionId, setRegion: setRegionId, formatCurrency }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion(): RegionContextValue {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error('useRegion must be used inside <RegionProvider>');
  return ctx;
}

/** Region-scoped mock data (holdings, earnings events, news fallback) */
export function useRegionMock(): RegionMock {
  const { regionId } = useRegion();
  return REGION_MOCK[regionId];
}

/** The active user persona for the current region */
export function useRegionUser() {
  return useRegionMock().user;
}
