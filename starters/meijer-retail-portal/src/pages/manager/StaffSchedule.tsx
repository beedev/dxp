import React from 'react';
import { Card, StatsDisplay, DataTable, Badge } from '@dxp/ui';
import type { Column } from '@dxp/ui';
import { Users, Clock } from 'lucide-react';
import { staff, weeklySchedule, todayOnDuty, openShiftsThisWeek } from '../../data/mock-staff';
import type { StaffMember, ShiftEntry } from '../../data/mock-staff';

// Build roster table: one row per employee, columns for each day
const days: ShiftEntry['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface RosterRow {
  id: string;
  name: string;
  role: StaffMember['role'];
  Mon: string;
  Tue: string;
  Wed: string;
  Thu: string;
  Fri: string;
  Sat: string;
  Sun: string;
}

const rosterData: RosterRow[] = staff.map((emp) => {
  const row: RosterRow = { id: emp.id, name: emp.name, role: emp.role, Mon: '', Tue: '', Wed: '', Thu: '', Fri: '', Sat: '', Sun: '' };
  for (const day of days) {
    const entry = weeklySchedule.find((s) => s.employeeId === emp.id && s.day === day);
    if (!entry || entry.shift === 'off') {
      row[day] = 'Off';
    } else {
      row[day] = `${entry.startTime} - ${entry.endTime}`;
    }
  }
  return row;
});

const roleBadgeVariant: Record<string, 'info' | 'success' | 'default' | 'warning'> = {
  Manager: 'info',
  Specialist: 'success',
  Associate: 'default',
  Cashier: 'warning',
};

function ShiftCell({ value }: { value: string }) {
  if (value === 'Off') {
    return <span className="text-xs text-[var(--dxp-text-muted)] italic">Off</span>;
  }
  return <span className="text-xs font-medium text-[var(--dxp-text)]">{value}</span>;
}

const rosterColumns: Column<RosterRow>[] = [
  {
    key: 'name',
    header: 'Employee',
    render: (v: unknown) => <span className="font-semibold text-[var(--dxp-text)]">{v as string}</span>,
  },
  {
    key: 'role',
    header: 'Role',
    render: (v: unknown) => <Badge variant={roleBadgeVariant[v as string] || 'default'}>{v as string}</Badge>,
  },
  ...days.map((day) => ({
    key: day as keyof RosterRow,
    header: day,
    render: (v: unknown) => <ShiftCell value={v as string} />,
  })),
];

export function StaffSchedule() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">Staff Schedule</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">ACE Hardware — Naperville, IL</p>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <StatsDisplay
          columns={3}
          stats={[
            { label: 'Total Staff', value: staff.length, format: 'number' },
            { label: 'On Duty Today', value: todayOnDuty.length, format: 'number' },
            { label: 'Open Shifts This Week', value: openShiftsThisWeek, format: 'number', delta: { value: -openShiftsThisWeek, label: 'need coverage' } },
          ]}
        />
      </div>

      {/* Today's Team */}
      <Card className="p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-blue-500" />
          <h2 className="text-lg font-bold text-[var(--dxp-text)]">Today&rsquo;s Team</h2>
          <Badge variant="info">{todayOnDuty.length} on duty</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {todayOnDuty.map((member) => (
            <div
              key={member.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-[var(--dxp-border)] bg-[var(--dxp-bg)]"
            >
              <div className="w-10 h-10 rounded-full bg-[var(--dxp-brand)] text-white flex items-center justify-center text-sm font-bold">
                {member.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--dxp-text)] truncate">{member.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={roleBadgeVariant[member.role] || 'default'}>{member.role}</Badge>
                  <span className="text-[10px] text-[var(--dxp-text-muted)]">{member.department}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-[10px] text-[var(--dxp-text-muted)]">
                  <Clock size={10} />
                  <span>{member.shiftTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Weekly Roster */}
      <div>
        <h2 className="text-base font-bold text-[var(--dxp-text)] mb-3">Weekly Roster</h2>
        <DataTable columns={rosterColumns} data={rosterData} />
      </div>
    </div>
  );
}
