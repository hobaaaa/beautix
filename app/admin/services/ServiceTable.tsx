"use client";
import { useState } from "react";
import { deleteService, toggleServiceActiveStatus } from "./actions";
import { Message, Service } from "../../../types";

export const ServiceTable = ({
  services,
  setMessage,
}: {
  services: Service[];
  setMessage: React.Dispatch<React.SetStateAction<Message>>;
}) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (services.length === 0) {
    return <div>No services found.</div>;
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    setMessage(null);
    try {
      await deleteService(id);
      setMessage({ type: "success", text: "Service deleted successfully." });
    } catch (error) {
      console.error("Error deleting service:", error);
      setMessage({ type: "error", text: "Failed to delete service." });
    } finally {
      setLoadingId(null);
    }
  }
  async function handleActiveInactive(id: string, currentIsActive: boolean) {
    setLoadingId(id);
    setMessage(null);
    try {
      await toggleServiceActiveStatus(id, !currentIsActive);
      setMessage({
        type: "success",
        text: "Service status updated successfully.",
      });
    } catch (error) {
      console.error("Error updating service status:", error);
      setMessage({ type: "error", text: "Failed to update service status." });
    } finally {
      setLoadingId(null);
    }
  }
  return (
    <div className="space-y-4">
      <table className="w-full border rounded-lg">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Duration (minutes)</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id} className="border-b">
              <td className="p-2">{service.name}</td>
              <td className="p-2">{service.duration_minutes}</td>
              <td className="p-2 text-center">
                <button
                  onClick={() => handleDelete(service.id)}
                  disabled={loadingId === service.id}
                  className="text-red-600 hover:underline disabled:opacity-50 mr-4"
                >
                  {loadingId === service.id ? "Deleting..." : "Delete"}
                </button>
                <button
                  onClick={() =>
                    handleActiveInactive(service.id, service.is_active)
                  }
                  disabled={loadingId === service.id}
                  className="text-gray-500 hover:underline disabled:opacity-50 mr-4"
                >
                  {loadingId === service.id
                    ? "Updating..."
                    : service.is_active
                      ? "Deactivate"
                      : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
