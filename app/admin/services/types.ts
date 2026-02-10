export type Service = {
  id: string;
  name: string;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
  org_id: string;
};

export type Message = {
  type: "success" | "error";
  text: string;
} | null;
