"use client";

import { EmptyState } from "@/components/ui/empty-state";
import type { AdminMessages } from "@/lib/i18n/admin";
import { StaffListItem } from "../../../types";

function StaffTableSection({
  title,
  loadingId,
  onDelete,
  onEdit,
  onToggleActive,
  staff,
  messages,
}: {
  title: string;
  loadingId: string | null;
  onDelete: (staffMember: StaffListItem) => void;
  onEdit: (staffMember: StaffListItem) => void;
  onToggleActive: (staffMember: StaffListItem) => void;
  staff: StaffListItem[];
  messages: AdminMessages["staff"];
}) {
  if (staff.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {staff.map((staffMember) => (
        <div
          key={staffMember.id}
          className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
        >
          <div className="space-y-2">
            <div className="min-w-0">
              <div className="break-words font-medium">{staffMember.name}</div>
              <div className="text-sm text-muted-foreground">
                {staffMember.is_active ? messages.activeStaff : messages.inactiveStaff}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {staffMember.appointment_types.length > 0 ? (
                staffMember.appointment_types.map((service) => (
                  <span key={service.id} className="rounded-full bg-muted px-3 py-1 text-xs">
                    {service.name}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  {messages.noServiceAssigned}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => onEdit(staffMember)}
              disabled={loadingId === staffMember.id}
              className="min-h-11 rounded-md border bg-slate-900 px-3 py-2 text-sm disabled:opacity-50"
            >
              {messages.edit}
            </button>
            <button
              type="button"
              onClick={() => onToggleActive(staffMember)}
              disabled={loadingId === staffMember.id}
              className="min-h-11 rounded-md border bg-slate-900 px-3 py-2 text-sm disabled:opacity-50"
            >
              {loadingId === staffMember.id
                ? messages.updating
                : staffMember.is_active
                  ? messages.deactivate
                  : messages.activate}
            </button>
            {!staffMember.is_active && (
              <button
                type="button"
                onClick={() => onDelete(staffMember)}
                disabled={loadingId === staffMember.id}
                className="min-h-11 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
              >
                {loadingId === staffMember.id ? messages.deleting : messages.delete}
              </button>
            )}
          </div>
        </div>
      ))}
    </section>
  );
}

export function StaffTable({
  loadingId,
  onDelete,
  onEdit,
  onToggleActive,
  staff,
  messages,
}: {
  loadingId: string | null;
  onDelete: (staffMember: StaffListItem) => void;
  onEdit: (staffMember: StaffListItem) => void;
  onToggleActive: (staffMember: StaffListItem) => void;
  staff: StaffListItem[];
  messages: AdminMessages["staff"];
}) {
  if (staff.length === 0) {
    return (
      <EmptyState
        title={messages.emptyTitle}
        description={messages.emptyDescription}
      />
    );
  }

  const activeStaff = staff.filter((staffMember) => staffMember.is_active);
  const inactiveStaff = staff.filter((staffMember) => !staffMember.is_active);

  return (
    <div className="space-y-6">
      <StaffTableSection
        title={messages.activeSection}
        loadingId={loadingId}
        onDelete={onDelete}
        onEdit={onEdit}
        onToggleActive={onToggleActive}
        staff={activeStaff}
        messages={messages}
      />

      <StaffTableSection
        title={messages.inactiveSection}
        loadingId={loadingId}
        onDelete={onDelete}
        onEdit={onEdit}
        onToggleActive={onToggleActive}
        staff={inactiveStaff}
        messages={messages}
      />
    </div>
  );
}

