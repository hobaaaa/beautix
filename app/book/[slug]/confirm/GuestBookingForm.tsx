"use client";

import {
  GUEST_NOTES_MAX_LENGTH,
  type GuestBookingFormErrors,
  type GuestBookingFormValues,
  validateGuestBookingValues,
} from "@/lib/public-booking/guest-booking-schema";
import { TurnstileWidget } from "@/components/security/TurnstileWidget";
import { readApiErrorMessage } from "@/lib/api/client-response";
import type { Locale } from "@/lib/i18n/constants";
import type { PublicBookingMessages } from "@/lib/i18n/public-booking";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";

type AppointmentSummary = {
  organizationName: string;
  serviceName: string;
  staffName: string;
  dateLabel: string;
  startTime: string;
  endTime: string;
  durationLabel: string;
};

type GuestBookingFormProps = {
  summary: AppointmentSummary;
  bookingSelection: {
    slug: string;
    serviceId: string;
    staffId: string;
    date: string;
    time: string;
  };
  slotSelectionHref: string;
  successHref: string;
  locale?: Locale;
  messages: PublicBookingMessages;
};

const initialValues: GuestBookingFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  notes: "",
  consent: false,
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;

  return <p className="text-sm text-red-200">{message}</p>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-background p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold">{value}</dd>
    </div>
  );
}

function localizeGuestBookingErrors(
  errors: GuestBookingFormErrors,
  messages: PublicBookingMessages,
): GuestBookingFormErrors {
  const localizedErrors: GuestBookingFormErrors = {};

  if (errors.firstName) {
    localizedErrors.firstName = messages.firstNameRequired;
  }

  if (errors.lastName) {
    localizedErrors.lastName = messages.lastNameRequired;
  }

  if (errors.phone) {
    localizedErrors.phone = errors.phone.includes("zorunludur")
      ? messages.phoneRequired
      : messages.phoneInvalid;
  }

  if (errors.email) {
    localizedErrors.email = errors.email.includes("zorunludur")
      ? messages.emailRequired
      : messages.emailInvalid;
  }

  if (errors.notes) {
    localizedErrors.notes = messages.notesTooLong;
  }

  if (errors.consent) {
    localizedErrors.consent = messages.consentRequired;
  }

  return localizedErrors;
}

function isSlotUnavailableMessage(
  message: string,
  messages: PublicBookingMessages,
) {
  return (
    message === messages.invalidSlotDescription ||
    message.includes("müsait") ||
    message.toLowerCase().includes("available")
  );
}

export function GuestBookingForm({
  summary,
  bookingSelection,
  slotSelectionHref,
  successHref,
  locale,
  messages,
}: GuestBookingFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<GuestBookingFormValues>(initialValues);
  const [validatedValues, setValidatedValues] =
    useState<GuestBookingFormValues | null>(null);
  const [errors, setErrors] = useState<GuestBookingFormErrors>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [website, setWebsite] = useState("");
  const [startedAt] = useState(() => new Date().toISOString());
  const handleTurnstileToken = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  function updateValue<K extends keyof GuestBookingFormValues>(
    key: K,
    value: GuestBookingFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));
    setMessage(null);
    setSubmitError(null);
  }

  function handleCheck(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const result = validateGuestBookingValues(values);
    setValues(result.values);
    setErrors(localizeGuestBookingErrors(result.errors, messages));

    if (!result.isValid) {
      setValidatedValues(null);
      return;
    }

    setValidatedValues(result.values);
  }

  function handleEdit() {
    if (validatedValues) {
      setValues(validatedValues);
    }
    setValidatedValues(null);
    setMessage(null);
    setSubmitError(null);
  }

  async function handleConfirm() {
    if (!validatedValues || isSubmitting) return;

    if (!turnstileToken && process.env.NODE_ENV === "production") {
      setSubmitError(messages.securityRequired);
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setSubmitError(null);

    try {
      const response = await fetch("/api/public/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...bookingSelection,
          ...validatedValues,
          locale,
          website,
          startedAt,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        setSubmitError(
          await readApiErrorMessage(response, messages.createFailed),
        );
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      const payload = (await response.json()) as {
        bookingId?: string;
      };
      const params = new URLSearchParams();

      if (payload.bookingId) {
        params.set("bookingId", payload.bookingId);
      }

      router.push(
        `${successHref}${
          params.toString() ? `?${params.toString()}` : ""
        }`,
      );
    } catch {
      setSubmitError(messages.networkError);
      setTurnstileResetKey((current) => current + 1);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (validatedValues) {
    return (
      <div className="space-y-5">
        <div className="rounded-3xl border bg-card p-5">
          <h2 className="text-xl font-semibold">{messages.checkInfoTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {messages.checkInfoDescription}
          </p>

          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <SummaryRow
              label={messages.fullName}
              value={`${validatedValues.firstName} ${validatedValues.lastName}`}
            />
            <SummaryRow label={messages.phone} value={validatedValues.phone} />
            <SummaryRow label={messages.email} value={validatedValues.email} />
            <SummaryRow label={messages.business} value={summary.organizationName} />
            <SummaryRow label={messages.service} value={summary.serviceName} />
            <SummaryRow label={messages.staff} value={summary.staffName} />
            <SummaryRow label={messages.date} value={summary.dateLabel} />
            <SummaryRow
              label={messages.time}
              value={`${summary.startTime} - ${summary.endTime}`}
            />
            <SummaryRow label={messages.duration} value={summary.durationLabel} />
            {validatedValues.notes ? (
              <div className="rounded-2xl border bg-background p-3 sm:col-span-2">
                <dt className="text-xs text-muted-foreground">{messages.notes}</dt>
                <dd className="mt-1 whitespace-pre-wrap break-words text-sm font-semibold">
                  {validatedValues.notes}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        {message ? (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-100">
            {message}
          </div>
        ) : null}

        {submitError ? (
          <div className="space-y-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
            <p>{submitError}</p>
            {isSlotUnavailableMessage(submitError, messages) ? (
              <Link
                href={slotSelectionHref}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-300/40 px-4 py-2 text-sm font-semibold"
              >
                {messages.changeTime}
              </Link>
            ) : null}
          </div>
        ) : null}

        <TurnstileWidget
          action="public_booking"
          token={turnstileToken}
          onTokenChange={handleTurnstileToken}
          resetKey={turnstileResetKey}
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={handleEdit}
            disabled={isSubmitting}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold"
          >
            {messages.editInfo}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={
              isSubmitting ||
              (!turnstileToken && process.env.NODE_ENV === "production")
            }
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? messages.creatingAppointment : messages.createAppointment}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleCheck} className="space-y-4 rounded-3xl border bg-card p-5">
      <div>
        <h2 className="text-xl font-semibold">{messages.enterInfoTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {messages.enterInfoDescription}
        </p>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-px w-px overflow-hidden opacity-0"
      >
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="firstName" className="text-sm font-semibold">
            {messages.firstName}
          </label>
          <input
            id="firstName"
            value={values.firstName}
            onChange={(event) => updateValue("firstName", event.target.value)}
            className="min-h-11 w-full rounded-2xl border bg-background px-4 py-3 text-base outline-none focus:border-blue-500"
            autoComplete="given-name"
          />
          <FieldError message={errors.firstName} />
        </div>

        <div className="space-y-2">
          <label htmlFor="lastName" className="text-sm font-semibold">
            {messages.lastName}
          </label>
          <input
            id="lastName"
            value={values.lastName}
            onChange={(event) => updateValue("lastName", event.target.value)}
            className="min-h-11 w-full rounded-2xl border bg-background px-4 py-3 text-base outline-none focus:border-blue-500"
            autoComplete="family-name"
          />
          <FieldError message={errors.lastName} />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-semibold">
            {messages.phone}
          </label>
          <input
            id="phone"
            value={values.phone}
            onChange={(event) => updateValue("phone", event.target.value)}
            className="min-h-11 w-full rounded-2xl border bg-background px-4 py-3 text-base outline-none focus:border-blue-500"
            inputMode="tel"
            autoComplete="tel"
            placeholder="05xx xxx xx xx"
          />
          <FieldError message={errors.phone} />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-semibold">
            {messages.email}
          </label>
          <input
            id="email"
            value={values.email}
            onChange={(event) => updateValue("email", event.target.value)}
            className="min-h-11 w-full rounded-2xl border bg-background px-4 py-3 text-base outline-none focus:border-blue-500"
            inputMode="email"
            autoComplete="email"
          />
          <FieldError message={errors.email} />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-semibold">
          {messages.notes}
        </label>
        <textarea
          id="notes"
          value={values.notes}
          maxLength={GUEST_NOTES_MAX_LENGTH}
          onChange={(event) => updateValue("notes", event.target.value)}
          className="min-h-28 w-full resize-y rounded-2xl border bg-background px-4 py-3 text-base outline-none focus:border-blue-500"
          placeholder={messages.notesPlaceholder}
        />
        <div className="flex justify-between gap-3 text-xs text-muted-foreground">
          <FieldError message={errors.notes} />
          <span className="ml-auto">
            {values.notes.length}/{GUEST_NOTES_MAX_LENGTH}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex gap-3 rounded-2xl border bg-background p-4 text-sm">
          <input
            type="checkbox"
            checked={values.consent}
            onChange={(event) => updateValue("consent", event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0"
          />
          <span>
            {messages.consent}
          </span>
        </label>
        <FieldError message={errors.consent} />
      </div>

      <button
        type="submit"
        className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
      >
        {messages.checkInfoButton}
      </button>
    </form>
  );
}
