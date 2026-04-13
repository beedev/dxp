// @dxp/sdk-react — React hooks and providers for DXP platform

// Provider
export { DxpProvider } from './providers/dxp-provider';

// Client config
export { configureDxp, apiFetch } from './client/api-client';
export type { DxpConfig } from './client/api-client';

// Hooks
export { useAuth } from './hooks/use-auth';
export { useCms, useCmsItem, useCmsCreate } from './hooks/use-cms';
export { useDocuments, useDocumentUpload, useDocumentDownloadUrl } from './hooks/use-documents';
export { useSearch, useSuggest } from './hooks/use-search';
export { useSendNotification } from './hooks/use-notifications';
export { usePresignedUpload, usePresignedDownload } from './hooks/use-storage';

// Payer portal hooks
export { useClaims, useClaimDetail, useClaimEOB, useAppeal, useClaimsDashboard } from './hooks/use-claims';
export { useBenefits, useAccumulators, useCostEstimate, useIdCard } from './hooks/use-eligibility';
export {
  usePriorAuths, usePriorAuthDetail, usePACheck, usePATemplate,
  usePASubmit, usePADecide, usePAQueue, usePADashboard,
} from './hooks/use-prior-auth';
export { useProviderSearch, useProviderDetail } from './hooks/use-providers';
export { useCareTimeline, useCareTeam, usePrograms, useProgramDetail, useDischargePlan } from './hooks/use-care';
export { useMemberList, useMemberDashboard, useMemberProfile, useMemberPreferences, useUpdatePreferences } from './hooks/use-member';
export { usePopulationDashboard, useRiskWorklist, useMemberRiskProfile, useCareGaps, useCloseCareGap } from './hooks/use-population';
export { useQualityDashboard, useQualityCareGaps, useTriggerOutreach } from './hooks/use-quality';
export { useUtilizationDashboard, useContractScorecards, useVBCDetail, useScenarioSimulate } from './hooks/use-analytics';

// Wealth portal hooks
export { useStockQuote, useStockQuotes, useApacIndices, useSymbolSearch, usePriceHistory } from './hooks/use-market-data';
export { useFxRates, useApacFxRates, useFxConvert, useSgdRates } from './hooks/use-fx-rates';
export { useCountryProfiles, useMacroIndicators } from './hooks/use-macro-data';
export { useApacNews, useCompanyNews } from './hooks/use-financial-news';
export { usePortfolio, useHoldings, useTransactions, useAddTransaction } from './hooks/use-wealth-portfolio';
export { useWatchlist, useAddToWatchlist, useRemoveFromWatchlist } from './hooks/use-watchlist';
export { usePaperPortfolio, usePaperOrders, usePlaceOrder, useCancelOrder, useAlerts, useCreateAlert, useDeleteAlert } from './hooks/use-paper-trading';
export { useBrokerAccount, useBrokerOrders, usePlaceBrokerOrder, useCancelBrokerOrder } from './hooks/use-broker';

// Retail portal hooks
export { useProducts, useProduct, useStockLevels, useBarcodeLookup } from './hooks/use-inventory';
export { useDailySales, useSalesRange, useCategoryBreakdown, useTopSellers } from './hooks/use-pos';
export { useProjectTemplates, useProjectTemplate, useMaterialsList } from './hooks/use-project-planner';
export { useLoyaltyMember, usePointsBalance, usePointsHistory, useRewardsCatalog } from './hooks/use-loyalty';
