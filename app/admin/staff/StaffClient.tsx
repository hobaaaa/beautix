"use client";

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
}: {
  staff: StaffListItem[];
  services: Service[];
}) {
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
      setMessage({ type: "error", text: "Personel adı zorunludur." });
      return;
    }

    if (values.appointment_type_ids.length === 0) {
      setMessage({
        type: "error",
        text: "En az bir hizmet seçmeniz gerekir.",
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

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Personel kaydedilemedi.");
      }

      setMessage({
        type: "success",
        text: editingStaff
          ? "Personel başarıyla güncellendi."
          : "Personel başarıyla oluşturuldu.",
      });
      resetForm();
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Personel kaydedilemedi.",
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

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || "Personel durumu güncellenemedi.");
      }

      setMessage({
        type: "success",
        text: staffMember.is_active
          ? "Personel pasife alındı."
          : "Personel aktifleştirildi.",
      });
      if (editingStaffId === staffMember.id) {
        resetForm();
      }
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Personel durumu güncellenemedi.",
      });
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Personeller</h1>
        <p className="text-sm text-muted-foreground">
          Personelleri ve verdikleri hizmetleri yönetin.
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
        onEdit={startEdit}
        onToggleActive={handleToggleActive}
        staff={staff}
      />

      <StaffForm
        error={message?.type === "error" ? message.text : null}
        loading={loading}
        onChange={setValues}
        onSubmit={handleSubmit}
        onCancel={editingStaff ? resetForm : undefined}
        services={services}
        submitLabel={editingStaff ? "Personeli Güncelle" : "Personel Oluştur"}
        title={editingStaff ? "Personeli düzenle" : "Yeni personel oluştur"}
        values={values}
      />
    </div>
  );
}
