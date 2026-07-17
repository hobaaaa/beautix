export type GuestBookingFormValues = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
  consent: boolean;
};

export type GuestBookingFormErrors = Partial<
  Record<keyof GuestBookingFormValues, string>
>;

export const GUEST_NAME_MAX_LENGTH = 80;
export const GUEST_PHONE_MAX_LENGTH = 24;
export const GUEST_EMAIL_MAX_LENGTH = 160;
export const GUEST_NOTES_MAX_LENGTH = 500;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeSpaces(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeGuestBookingValues(
  values: GuestBookingFormValues,
): GuestBookingFormValues {
  return {
    firstName: normalizeSpaces(values.firstName),
    lastName: normalizeSpaces(values.lastName),
    phone: normalizePublicBookingPhone(normalizeSpaces(values.phone)),
    email: values.email.trim().toLowerCase(),
    notes: values.notes.trim(),
    consent: values.consent,
  };
}

export function isValidGuestPhone(value: string) {
  const compact = value.replace(/[\s()-]/g, "");

  return /^(?:\+?90)?5\d{9}$/.test(compact);
}

export function validateGuestBookingValues(values: GuestBookingFormValues) {
  const normalizedValues = normalizeGuestBookingValues(values);
  const errors: GuestBookingFormErrors = {};

  if (!normalizedValues.firstName) {
    errors.firstName = "Ad alanı zorunludur.";
  } else if (normalizedValues.firstName.length > GUEST_NAME_MAX_LENGTH) {
    errors.firstName = `Ad en fazla ${GUEST_NAME_MAX_LENGTH} karakter olmalıdır.`;
  }

  if (!normalizedValues.lastName) {
    errors.lastName = "Soyad alanı zorunludur.";
  } else if (normalizedValues.lastName.length > GUEST_NAME_MAX_LENGTH) {
    errors.lastName = `Soyad en fazla ${GUEST_NAME_MAX_LENGTH} karakter olmalıdır.`;
  }

  if (!normalizedValues.phone) {
    errors.phone = "Telefon alanı zorunludur.";
  } else if (
    normalizedValues.phone.length > GUEST_PHONE_MAX_LENGTH ||
    !isValidGuestPhone(normalizedValues.phone)
  ) {
    errors.phone = "Geçerli bir Türkiye telefon numarası girin.";
  }

  if (!normalizedValues.email) {
    errors.email = "E-posta alanı zorunludur.";
  } else if (
    normalizedValues.email.length > GUEST_EMAIL_MAX_LENGTH ||
    !EMAIL_PATTERN.test(normalizedValues.email)
  ) {
    errors.email = "Geçerli bir e-posta adresi girin.";
  }

  if (normalizedValues.notes.length > GUEST_NOTES_MAX_LENGTH) {
    errors.notes = `Not en fazla ${GUEST_NOTES_MAX_LENGTH} karakter olmalıdır.`;
  }

  if (!normalizedValues.consent) {
    errors.consent =
      "Randevu oluşturmak için bilgilerinizin işletmeyle paylaşılmasını onaylamalısınız.";
  }

  return {
    values: normalizedValues,
    errors,
    isValid: Object.keys(errors).length === 0,
  };
}
import { normalizePublicBookingPhone } from "./normalize-contact";
