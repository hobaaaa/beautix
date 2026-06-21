export type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  org_id: string;
};

export type Client = {
  id: string;
  org_id: string;
  user_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export type AppointmentStatus =
  | "scheduled"
  | "completed"
  | "cancelled"
  | "no_show";

export type Appointment = {
  id: string;
  org_id: string;
  client_id: string;
  appointment_type_id: string;
  start_at: string;
  end_at: string;
  status: AppointmentStatus;
  notes: string | null;
  created_at: string;
};

export type AppointmentListItem = Appointment & {
  client: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  };
  service: {
    id: string;
    name: string;
    duration_minutes: number;
    is_active: boolean;
  };
};

export type Message = {
  type: "success" | "error";
  text: string;
} | null;

export type WorkingHour = {
  id: string;
  org_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
};
