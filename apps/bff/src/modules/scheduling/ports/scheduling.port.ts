export interface Appointment {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: { name: string; email: string }[];
  location?: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  meetingUrl?: string;
  notes?: string;
}

export interface CreateAppointmentDto {
  title: string;
  startTime: string;
  endTime: string;
  attendees: { name: string; email: string }[];
  location?: string;
  notes?: string;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export abstract class SchedulingPort {
  abstract createAppointment(dto: CreateAppointmentDto): Promise<Appointment>;
  abstract getAppointment(id: string): Promise<Appointment>;
  abstract listAppointments(from: string, to: string): Promise<Appointment[]>;
  abstract cancelAppointment(id: string, reason?: string): Promise<void>;
  abstract getAvailability(userId: string, date: string): Promise<AvailabilitySlot[]>;
}
