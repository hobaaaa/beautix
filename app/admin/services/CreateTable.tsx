"use client";

import { useState } from "react";
import { createService } from "./actions";
import { Message } from "./types";

export const CreateTable = ({
  setMessage,
}: {
  setMessage: React.Dispatch<React.SetStateAction<Message>>;
}) => {
  const [loading, setLoading] = useState(false);

  async function action(formData: FormData) {
    setLoading(true);
    setMessage(null);
    try {
      await createService(formData);
      setMessage({ type: "success", text: "Service created successfully." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="">
          Service Name:
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="border border-gray-300 rounded px-2 py-1 w-full"
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="duration_minutes">Duration (minutes):</label>
        <input
          type="number"
          id="duration_minutes"
          name="duration_minutes"
          required
          className="border border-gray-300 rounded px-2 py-1 w-full"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {loading ? "Creating..." : "Create Service"}
      </button>
    </form>
  );
};
