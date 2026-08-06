"use client";

import {
  getClientErrorMessage,
  readApiErrorMessage,
} from "@/lib/api/client-response";
import { getAdminMessages, type AdminMessages } from "@/lib/i18n/admin";
import { defaultLocale, type Locale } from "@/lib/i18n/constants";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Message, Service, StaffListItem } from "../../../types";
import { StaffForm, StaffFormValues } from "./StaffForm";
import { StaffTable } from "./StaffTable";

function createInitialValues(): StaffFormValues {
  return {
    name: "",
    appointment_type_ids: [],
  };
}

export function StaffClient({
  staff,
  services,
  messages,
  locale = defaultLocale,
}: {
  staff: StaffListItem[];
  services: Service[];
  messages?: AdminMessages["staff"];
  locale?: Locale;
}) {
  const labels = messages ?? getAdminMessages(locale).staff;
  const router = useRouter();
  const [message, setMessage] = useState<Message>(null);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [values, setValues] = useState<StaffFormValues>(createInitialValues());

  const editingStaff = staff.find((item) => item.id === editingStaffId) ?? null;

  function startEdit(staffMember: StaffListItem) {
    setEditingStaffId(staffMember.id);
    setValues({
      name: staffMember.name,
      appointment_type_ids: staffMember.appointment_types.map((service) => service.id),
    });
    setMessage(null);
  }

  function resetForm() {
    setEditingStaffId(null);
    setValues(createInitialValues());
  }

  async function handleSubmit() {
    setMessage(null);

    if (!values.name.trim()) {
      setMessage({ type: "error", text: labels.nameRequired });
      return;
    }

    if (values.appointment_type_ids.length === 0) {
      setMessage({
        type: "error",
        text: labels.serviceRequired,
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        editingStaff ? `/api/admin/staff/${editingStaff.id}` : "/api/admin/staff",
        {
          method: editingStaff ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: values.name.trim(),
            appointment_type_ids: values.appointment_type_ids,
            ...(editingStaff ? { is_active: editingStaff.is_active } : {}),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, labels.saveFailed));
      }

      setMessage({
        type: "success",
        text: editingStaff ? labels.updateSuccess : labels.createSuccess,
      });
      resetForm();
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: getClientErrorMessage(error, labels.saveFailed),
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(staffMember: StaffListItem) {
    setMessage(null);
    setLoadingId(staffMember.id);

    try {
      const response = await fetch(`/api/admin/staff/${staffMember.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: staffMember.name,
          is_active: !staffMember.is_active,
          appointment_type_ids: staffMember.appointment_types.map((service) => service.id),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readApiErrorMessage(response, labels.statusUpdateFailed),
        );
      }

      setMessage({
        type: "success",
        text: staffMember.is_active ? labels.deactivated : labels.activated,
      });

      if (editingStaffId === staffMember.id) {
        resetForm();
      }

      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          getClientErrorMessage(error, labels.statusUpdateFailed),
      });
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(staffMember: StaffListItem) {
    setMessage(null);
    setLoadingId(staffMember.id);

    try {
      const response = await fetch(`/api/admin/staff/${staffMember.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, labels.deleteFailed));
      }

      setMessage({
        type: "success",
        text: labels.deleteSuccess,
      });

      if (editingStaffId === staffMember.id) {
        resetForm();
      }

      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: getClientErrorMessage(error, labels.deleteFailed),
      });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{labels.title}</h1>
        <p className="text-sm text-muted-foreground">
          {labels.description}
        </p>
      </div>

      {message && (
        <div
          className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
        >
          {message.text}
        </div>
      )}

      <StaffTable
        loadingId={loadingId}
        onDelete={handleDelete}
        onEdit={startEdit}
        onToggleActive={handleToggleActive}
        staff={staff}
        messages={labels}
      />

      <StaffForm
        error={message?.type === "error" ? message.text : null}
        loading={loading}
        onChange={setValues}
        onSubmit={handleSubmit}
        onCancel={editingStaff ? resetForm : undefined}
        services={services}
        submitLabel={editingStaff ? labels.updateButton : labels.createButton}
        title={editingStaff ? labels.editTitle : labels.createTitle}
        values={values}
        messages={labels}
      />
    </div>
  );
}

