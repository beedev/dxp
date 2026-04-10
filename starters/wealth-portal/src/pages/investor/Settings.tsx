import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@dxp/ui';
import { useRegion } from '../../contexts/RegionContext';

export function Settings() {
  const { region } = useRegion();
  const [baseCurrency, setBaseCurrency] = useState(region.currency.code);
  const [riskProfile, setRiskProfile] = useState('Moderate Growth');
  const [benchmark, setBenchmark] = useState(region.benchmarkLabel);

  // When user switches region, reset defaults
  useEffect(() => {
    setBaseCurrency(region.currency.code);
    setBenchmark(region.benchmarkLabel);
  }, [region.id, region.currency.code, region.benchmarkLabel]);
  const [notifications, setNotifications] = useState({
    emailPriceAlerts: true,
    emailNews: false,
    emailDividends: true,
    pushPriceAlerts: true,
    pushNews: false,
    pushDividends: true,
  });
  const [saved, setSaved] = useState(false);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Settings</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Portfolio preferences and notification settings</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Base Currency */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-[var(--dxp-text)] mb-4">Base Currency</h2>
          <div className="flex flex-wrap gap-2">
            {region.availableCurrencies.map((c) => (
              <button
                key={c}
                onClick={() => setBaseCurrency(c)}
                className={`px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${
                  baseCurrency === c ? 'bg-amber-600 text-white border-amber-600' : 'bg-[var(--dxp-surface)] text-[var(--dxp-text-secondary)] border-[var(--dxp-border)] hover:border-amber-400'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Card>

        {/* Risk Profile */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-[var(--dxp-text)] mb-4">Risk Profile</h2>
          <div className="grid grid-cols-2 gap-3">
            {['Conservative', 'Balanced', 'Moderate Growth', 'Aggressive Growth'].map((r) => (
              <button
                key={r}
                onClick={() => setRiskProfile(r)}
                className={`p-3 rounded-lg border text-sm font-semibold text-left transition-colors ${
                  riskProfile === r ? 'bg-amber-50 border-amber-400 text-amber-700' : 'bg-[var(--dxp-surface)] border-[var(--dxp-border)] text-[var(--dxp-text-secondary)] hover:border-amber-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </Card>

        {/* Benchmark */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-[var(--dxp-text)] mb-4">Benchmark Index</h2>
          <div className="flex flex-wrap gap-2">
            {[region.benchmarkLabel, 'MSCI Asia Pacific', 'MSCI EM Asia', 'MSCI World'].map((b) => (
              <button
                key={b}
                onClick={() => setBenchmark(b)}
                className={`px-4 py-2 rounded-lg border font-semibold text-sm transition-colors ${
                  benchmark === b ? 'bg-amber-600 text-white border-amber-600' : 'bg-[var(--dxp-surface)] text-[var(--dxp-text-secondary)] border-[var(--dxp-border)] hover:border-amber-400'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-[var(--dxp-text)] mb-4">Notification Preferences</h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--dxp-text-muted)] mb-2">Email</p>
              {[
                { key: 'emailPriceAlerts' as const, label: 'Price alerts triggered' },
                { key: 'emailNews' as const, label: 'Daily market news digest' },
                { key: 'emailDividends' as const, label: 'Dividend payment notifications' },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between py-2 border-b border-[var(--dxp-border-light)] last:border-0">
                  <span className="text-sm text-[var(--dxp-text)]">{n.label}</span>
                  <div
                    onClick={() => toggleNotification(n.key)}
                    className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${notifications[n.key] ? 'bg-amber-600' : 'bg-gray-200'} relative`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[n.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--dxp-text-muted)] mb-2">Push</p>
              {[
                { key: 'pushPriceAlerts' as const, label: 'Price alerts triggered' },
                { key: 'pushNews' as const, label: 'Breaking market news' },
                { key: 'pushDividends' as const, label: 'Dividend ex-date reminders' },
              ].map((n) => (
                <div key={n.key} className="flex items-center justify-between py-2 border-b border-[var(--dxp-border-light)] last:border-0">
                  <span className="text-sm text-[var(--dxp-text)]">{n.label}</span>
                  <div
                    onClick={() => toggleNotification(n.key)}
                    className={`w-10 h-5 rounded-full transition-colors cursor-pointer ${notifications[n.key] ? 'bg-amber-600' : 'bg-gray-200'} relative`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifications[n.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Data Source */}
        <Card className="p-5">
          <h2 className="text-base font-bold text-[var(--dxp-text)] mb-4">Data Source & Brokerage</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div>
                <p className="text-sm font-bold text-amber-700">Paper Trading (Active)</p>
                <p className="text-xs text-[var(--dxp-text-muted)]">Simulated portfolio — no real money</p>
              </div>
              <Badge variant="warning">Connected</Badge>
            </div>
            {['Tiger Brokers', 'Interactive Brokers (IBKR)', 'Saxo Markets'].map((broker) => (
              <div key={broker} className="flex items-center justify-between p-3 border border-[var(--dxp-border)] rounded-lg opacity-60">
                <div>
                  <p className="text-sm font-semibold text-[var(--dxp-text)]">{broker}</p>
                  <p className="text-xs text-[var(--dxp-text-muted)]">Real-time portfolio sync</p>
                </div>
                <Button variant="secondary" size="sm">Connect</Button>
              </div>
            ))}
          </div>
        </Card>

        <Button variant="primary" size="lg" onClick={handleSave}>
          {saved ? '✓ Settings Saved' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
