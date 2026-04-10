import React, { useState } from 'react';
import { Card } from '@dxp/ui';
import { useRegion, useRegionMock } from '../../contexts/RegionContext';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const TYPE_STYLES: Record<string, string> = {
  Earnings: 'bg-blue-100 text-blue-700',
  'Ex-Dividend': 'bg-emerald-100 text-emerald-700',
  Results: 'bg-purple-100 text-purple-700',
};

export function EarningsCalendar() {
  const { region } = useRegion();
  const { events } = useRegionMock();
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3); // 0-indexed April

  const thisWeekStart = new Date();
  thisWeekStart.setHours(0, 0, 0, 0);
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 6);

  const monthEvents = events.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const thisWeekEvents = events.filter((e) => {
    const d = new Date(e.date);
    return d >= thisWeekStart && d <= thisWeekEnd;
  });

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(region.currency.locale, { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">{region.flag} {region.name} Earnings Calendar</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">Upcoming earnings reports and ex-dividend dates for {region.marketLabel} equities</p>
      </div>

      {thisWeekEvents.length > 0 && (
        <div className="mb-8">
          <h2 className="text-base font-bold text-amber-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            This Week's Events
          </h2>
          <div className="flex flex-wrap gap-3">
            {thisWeekEvents.map((e, i) => (
              <Card key={i} className="p-3 border-l-4 border-amber-400 flex-1 min-w-[200px] max-w-xs">
                <div className="flex items-center gap-2 mb-1">
                  <span>{e.flag}</span>
                  <span className="text-xs font-mono font-bold text-amber-700">{e.symbol}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${TYPE_STYLES[e.type]}`}>{e.type}</span>
                </div>
                <p className="text-sm font-semibold text-[var(--dxp-text)]">{e.company}</p>
                <p className="text-xs text-[var(--dxp-text-muted)] mt-0.5">{formatDate(e.date)}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="px-3 py-1.5 rounded border border-[var(--dxp-border)] text-sm hover:bg-[var(--dxp-border-light)]">← Prev</button>
        <h2 className="text-xl font-bold text-[var(--dxp-text)]">{MONTH_NAMES[month]} {year}</h2>
        <button onClick={nextMonth} className="px-3 py-1.5 rounded border border-[var(--dxp-border)] text-sm hover:bg-[var(--dxp-border-light)]">Next →</button>
      </div>

      {monthEvents.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-[var(--dxp-text-muted)]">No events scheduled for {MONTH_NAMES[month]} {year}</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {monthEvents.map((e, i) => (
            <Card key={i} className="p-4 flex items-center gap-4">
              <div className="text-center min-w-[48px]">
                <p className="text-xs text-[var(--dxp-text-muted)]">{new Date(e.date).toLocaleDateString(region.currency.locale, { weekday: 'short' })}</p>
                <p className="text-xl font-bold text-[var(--dxp-text)]">{new Date(e.date).getDate()}</p>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-base">{e.flag}</span>
                  <p className="text-sm font-bold text-[var(--dxp-text)]">{e.company}</p>
                  <span className="text-[10px] text-[var(--dxp-text-muted)]">· {e.exchange}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--dxp-text-secondary)]">{e.symbol}</span>
                  {e.note && <span className="text-xs text-[var(--dxp-text-muted)]">· {e.note}</span>}
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TYPE_STYLES[e.type]}`}>{e.type}</span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
