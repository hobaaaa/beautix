"use client";

import { StaffListItem } from "../../../types";

export function StaffTable({
  loadingId,
  onEdit,
  onToggleActive,
  staff,
}: {
  loadingId: string | null;
  onEdit: (staffMember: StaffListItem) => void;
  onToggleActive: (staffMember: StaffListItem) => void;
  staff: StaffListItem[];
}) {
  if (staff.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
        Henüz personel bulunmuyor.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {staff.map((staffMember) => (
        <div
          key={staffMember.id}
          className="rounded-lg border p-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
        >
          <div className="space-y-2">
            <div>
              <div className="font-medium">{staffMember.name}</div>
              <div className="text-sm text-muted-foreground">
                {staffMember.is_active ? "Aktif personel" : "Pasif personel"}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {staffMember.appointment_types.length > 0 ? (
                staffMember.appointment_types.map((service) => (
                  <span
                    key={service.id}
                    className="rounded-full bg-muted px-3 py-1 text-xs"
                  >
                    {service.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  Hizmet atanmamış
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onEdit(staffMember)}
              disabled={loadingId === staffMember.id}
              className="rounded-md border px-3 py-2 text-sm disabled:opacity-50 bg-slate-900"
            >
              Düzenle
            </button>
            <button
              type="button"
              onClick={() => onToggleActive(staffMember)}
              disabled={loadingId === staffMember.id}
              className="rounded-md border px-3 py-2 text-sm disabled:opacity-50 bg-slate-900"
            >
              {loadingId === staffMember.id
                ? "Güncelleniyor..."
                : staffMember.is_active
                  ? "Pasife al"
                  : "Aktifleştir"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
