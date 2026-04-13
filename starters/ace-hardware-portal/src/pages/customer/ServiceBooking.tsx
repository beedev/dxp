import React, { useState } from 'react';
import { Card, Badge, Button, Input, Select } from '@dxp/ui';
import { Wrench, Clock, Calendar, CheckCircle, MapPin } from 'lucide-react';
import { services } from '../../data/mock-services';
import { stores } from '../../data/mock-stores';
import type { ServiceOffering } from '../../data/mock-services';

const categoryColors: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  cutting: 'info',
  mixing: 'success',
  repair: 'warning',
  rental: 'default',
  exchange: 'info',
  installation: 'danger',
};

const storeOptions = stores.slice(0, 5).map((s) => ({
  value: s.id,
  label: s.name,
}));

const timeOptions = [
  { value: 'morning', label: 'Morning (8am - 12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm - 4pm)' },
  { value: 'evening', label: 'Evening (4pm - 8pm)' },
];

export function ServiceBooking() {
  const [selectedService, setSelectedService] = useState<ServiceOffering | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // Booking form state
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [selectedStore, setSelectedStore] = useState('S001');
  const [notes, setNotes] = useState('');

  const walkInCount = services.filter((s) => !s.requiresAppointment).length;

  const handleBookNow = (service: ServiceOffering) => {
    setSelectedService(service);
    setShowBookingForm(true);
    setBookingConfirmed(false);
  };

  const handleConfirmBooking = () => {
    setBookingConfirmed(true);
    setShowBookingForm(false);
    // Reset form
    setTimeout(() => {
      setPreferredDate('');
      setPreferredTime('');
      setNotes('');
    }, 300);
  };

  const handleDismissConfirmation = () => {
    setBookingConfirmed(false);
    setSelectedService(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--dxp-text)]">In-Store Services</h1>
        <p className="text-[var(--dxp-text-secondary)] mt-1">
          Expert services from your local ACE. Most are walk-in friendly — no appointment needed.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <p className="text-xs font-semibold text-[var(--dxp-text-muted)] uppercase tracking-wide mb-1">Services Available</p>
            <p className="text-2xl font-bold text-[var(--dxp-text)]">{services.length}</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs font-semibold text-[var(--dxp-text-muted)] uppercase tracking-wide mb-1">Avg Wait Time</p>
            <p className="text-2xl font-bold text-[var(--dxp-text)]">15 min</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-xs font-semibold text-[var(--dxp-text-muted)] uppercase tracking-wide mb-1">Walk-in Friendly</p>
            <p className="text-2xl font-bold text-[var(--dxp-text)]">{walkInCount}</p>
          </Card>
        </div>
      </div>

      {/* Booking Confirmation Toast */}
      {bookingConfirmed && selectedService && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
          <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-green-800">Booking Confirmed!</p>
            <p className="text-xs text-green-700 mt-0.5">
              Your {selectedService.name} appointment has been scheduled.
              We&rsquo;ll send a confirmation email with all the details.
            </p>
          </div>
          <button onClick={handleDismissConfirmation} className="text-green-600 hover:text-green-800 text-xs font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* Service Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {services.map((service) => (
          <Card key={service.id} className="p-5 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-bold text-[var(--dxp-text)]">{service.name}</h3>
              <Badge variant={categoryColors[service.category] || 'default'}>
                {service.category.charAt(0).toUpperCase() + service.category.slice(1)}
              </Badge>
            </div>

            <p className="text-sm text-[var(--dxp-text-secondary)] leading-relaxed mb-3 flex-1">
              {service.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-3 text-xs text-[var(--dxp-text-muted)]">
              <span className="font-bold text-lg text-[var(--dxp-text)]">{service.priceLabel}</span>
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{service.duration}</span>
              </div>
              {service.requiresAppointment && (
                <Badge variant="warning">Requires Appointment</Badge>
              )}
            </div>

            <div className="mt-auto">
              {service.requiresAppointment ? (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => handleBookNow(service)}
                >
                  <Calendar size={14} className="mr-1.5" />
                  Book Now
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={() => handleBookNow(service)}
                >
                  <Wrench size={14} className="mr-1.5" />
                  Walk In
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Booking Form */}
      {showBookingForm && selectedService && (
        <Card className="p-6 mb-6 border-2 border-[var(--dxp-brand)]">
          <h2 className="text-lg font-bold text-[var(--dxp-text)] mb-4">
            Book: {selectedService.name}
          </h2>

          <div className="space-y-4">
            {/* Service (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-[var(--dxp-text-muted)] uppercase tracking-wide mb-1">
                Service
              </label>
              <div className="p-2.5 rounded-lg bg-[var(--dxp-border-light)] border border-[var(--dxp-border)] text-sm text-[var(--dxp-text)]">
                {selectedService.name} — {selectedService.priceLabel}
              </div>
            </div>

            {/* Preferred Date */}
            <div>
              <label className="block text-xs font-semibold text-[var(--dxp-text-muted)] uppercase tracking-wide mb-1">
                Preferred Date
              </label>
              <Input
                type="date"
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
              />
            </div>

            {/* Preferred Time */}
            <div>
              <label className="block text-xs font-semibold text-[var(--dxp-text-muted)] uppercase tracking-wide mb-1">
                Preferred Time
              </label>
              <Select
                options={timeOptions}
                value={preferredTime}
                onChange={setPreferredTime}
                placeholder="Select a time slot..."
              />
            </div>

            {/* Store */}
            <div>
              <label className="block text-xs font-semibold text-[var(--dxp-text-muted)] uppercase tracking-wide mb-1">
                Store Location
              </label>
              <Select
                options={storeOptions}
                value={selectedStore}
                onChange={setSelectedStore}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-[var(--dxp-text-muted)] uppercase tracking-wide mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any special instructions or details..."
                className="w-full p-2.5 rounded-lg border border-[var(--dxp-border)] bg-[var(--dxp-bg)] text-sm text-[var(--dxp-text)] placeholder:text-[var(--dxp-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--dxp-brand)] resize-none"
              />
            </div>

            <div className="flex gap-3">
              <Button variant="primary" onClick={handleConfirmBooking}>
                <CheckCircle size={14} className="mr-1.5" />
                Confirm Booking
              </Button>
              <Button variant="secondary" onClick={() => { setShowBookingForm(false); setSelectedService(null); }}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* My Store Services */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={18} className="text-[var(--dxp-brand)]" />
          <h2 className="text-lg font-bold text-[var(--dxp-text)]">My Store Services</h2>
          <Badge variant="info">Naperville, IL</Badge>
        </div>
        <p className="text-sm text-[var(--dxp-text-secondary)] mb-3">
          Services available at your selected store (ACE Hardware — Naperville):
        </p>
        <div className="flex flex-wrap gap-2">
          {['Key Cutting', 'Paint Mixing', 'Screen Repair', 'Pipe Threading', 'Tool Rental', 'Propane Exchange'].map(
            (svc) => (
              <div
                key={svc}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--dxp-border-light)] border border-[var(--dxp-border)] text-xs font-medium text-[var(--dxp-text)]"
              >
                <CheckCircle size={12} className="text-green-500" />
                {svc}
              </div>
            ),
          )}
        </div>
      </Card>
    </div>
  );
}
