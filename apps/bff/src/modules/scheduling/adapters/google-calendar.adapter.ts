import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulingPort, Appointment, CreateAppointmentDto, AvailabilitySlot } from '../ports/scheduling.port';

@Injectable()
export class GoogleCalendarAdapter extends SchedulingPort {
  private readonly logger = new Logger(GoogleCalendarAdapter.name);

  constructor(private config: ConfigService) { super(); }

  // In production: use googleapis package with service account or OAuth2

  async createAppointment(dto: CreateAppointmentDto): Promise<Appointment> {
    this.logger.log(`Creating appointment: ${dto.title}`);
    return { id: `apt-${Date.now()}`, ...dto, status: 'scheduled' };
  }

  async getAppointment(id: string): Promise<Appointment> {
    this.logger.debug(`Get appointment: ${id}`);
    return { id, title: '', startTime: '', endTime: '', attendees: [], status: 'scheduled' };
  }

  async listAppointments(from: string, to: string): Promise<Appointment[]> {
    this.logger.debug(`List appointments: ${from} to ${to}`);
    return [];
  }

  async cancelAppointment(id: string): Promise<void> {
    this.logger.log(`Cancel appointment: ${id}`);
  }

  async getAvailability(userId: string, date: string): Promise<AvailabilitySlot[]> {
    this.logger.debug(`Get availability for ${userId} on ${date}`);
    return [
      { start: `${date}T09:00:00`, end: `${date}T10:00:00` },
      { start: `${date}T14:00:00`, end: `${date}T15:00:00` },
    ];
  }
}
