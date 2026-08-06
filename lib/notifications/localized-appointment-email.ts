import "server-only";

import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/constants";

type AppointmentEmailInput = {
  organizationName: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
  locale?: Locale;
};

type BusinessBookingNotificationEmailInput = AppointmentEmailInput & {
  clientPhone: string | null;
  clientEmail: string | null;
  notes: string | null;
};

type AppointmentEmailMessages = {
  htmlLang: string;
  bookingConfirmationSubject: string;
  bookingConfirmationTitle: string;
  bookingConfirmationIntro: (
    clientName: string,
    organizationName: string,
  ) => string;
  bookingConfirmationFooter: string;
  reminderSubject: string;
  reminderTitle: string;
  reminderIntro: (clientName: string, organizationName: string) => string;
  reminderFooter: string;
  businessNotificationSubject: string;
  businessNotificationTitle: string;
  businessNotificationIntro: (clientName: string) => string;
  businessNotificationFooter: string;
  organization: string;
  client: string;
  service: string;
  staff: string;
  date: string;
  start: string;
  end: string;
  duration: string;
  minute: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
  empty: string;
};

const emailMessages: Record<Locale, AppointmentEmailMessages> = {
  tr: {
    htmlLang: "tr",
    bookingConfirmationSubject: "Randevunuz Onaylandı - Artexo",
    bookingConfirmationTitle: "Randevunuz onaylandı",
    bookingConfirmationIntro: (clientName, organizationName) =>
      `${clientName}, ${organizationName} için oluşturduğunuz randevu başarıyla onaylandı.`,
    bookingConfirmationFooter:
      "Bu e-posta randevunuzun onaylandığını bildirmek için gönderilmiştir.",
    reminderSubject: "Randevu Hatırlatması - Artexo",
    reminderTitle: "Randevu hatırlatması",
    reminderIntro: (clientName, organizationName) =>
      `${clientName}, ${organizationName} için randevunuz yarın. Randevu bilgilerinizi aşağıda görebilirsiniz.`,
    reminderFooter:
      "Bu e-posta yaklaşan randevunuzu hatırlatmak için gönderilmiştir.",
    businessNotificationSubject: "Yeni Randevu Oluşturuldu - Artexo",
    businessNotificationTitle: "Yeni randevu oluşturuldu",
    businessNotificationIntro: (clientName) =>
      `${clientName} tarafından yeni bir randevu oluşturuldu. Randevu bilgilerini aşağıda görebilirsiniz.`,
    businessNotificationFooter:
      "Bu e-posta işletmenize yeni bir müşteri randevusu oluşturulduğunu bildirmek için gönderilmiştir.",
    organization: "İşletme",
    client: "Müşteri",
    service: "Hizmet",
    staff: "Personel",
    date: "Tarih",
    start: "Başlangıç",
    end: "Bitiş",
    duration: "Süre",
    minute: "dakika",
    clientPhone: "Müşteri Telefonu",
    clientEmail: "Müşteri E-postası",
    notes: "Not",
    empty: "-",
  },
  en: {
    htmlLang: "en",
    bookingConfirmationSubject: "Your Appointment Is Confirmed - Artexo",
    bookingConfirmationTitle: "Your appointment is confirmed",
    bookingConfirmationIntro: (clientName, organizationName) =>
      `${clientName}, your appointment with ${organizationName} has been confirmed.`,
    bookingConfirmationFooter:
      "This email was sent to confirm your appointment.",
    reminderSubject: "Appointment Reminder - Artexo",
    reminderTitle: "Appointment reminder",
    reminderIntro: (clientName, organizationName) =>
      `${clientName}, your appointment with ${organizationName} is tomorrow. You can review the details below.`,
    reminderFooter:
      "This email was sent to remind you about your upcoming appointment.",
    businessNotificationSubject: "New Appointment Created - Artexo",
    businessNotificationTitle: "New appointment created",
    businessNotificationIntro: (clientName) =>
      `${clientName} created a new appointment. You can review the details below.`,
    businessNotificationFooter:
      "This email was sent to notify your business about a new customer appointment.",
    organization: "Business",
    client: "Customer",
    service: "Service",
    staff: "Staff",
    date: "Date",
    start: "Start",
    end: "End",
    duration: "Duration",
    minute: "minutes",
    clientPhone: "Customer Phone",
    clientEmail: "Customer Email",
    notes: "Notes",
    empty: "-",
  },
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeEmailLocale(locale: string | null | undefined): Locale {
  const candidate = locale ?? undefined;

  return isLocale(candidate) ? candidate : defaultLocale;
}

function getEmailMessages(locale: Locale = defaultLocale) {
  return emailMessages[locale];
}

export function getBookingConfirmationEmailSubject(locale?: Locale) {
  return getEmailMessages(locale).bookingConfirmationSubject;
}

export function getAppointmentReminderEmailSubject(locale?: Locale) {
  return getEmailMessages(locale).reminderSubject;
}

export function getBusinessBookingNotificationEmailSubject(locale?: Locale) {
  return getEmailMessages(locale).businessNotificationSubject;
}

export function formatLocalizedAppointmentDate(value: string, locale?: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    dateStyle: "full",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function formatLocalizedAppointmentTime(value: string, locale?: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Istanbul",
  }).format(new Date(value));
}

export function renderBookingConfirmationEmail(input: AppointmentEmailInput) {
  const locale = normalizeEmailLocale(input.locale);
  const messages = getEmailMessages(locale);

  return renderAppointmentEmail({
    ...input,
    locale,
    title: messages.bookingConfirmationTitle,
    intro: messages.bookingConfirmationIntro(
      input.clientName,
      input.organizationName,
    ),
    footer: messages.bookingConfirmationFooter,
  });
}

export function renderAppointmentReminderEmail(input: AppointmentEmailInput) {
  const locale = normalizeEmailLocale(input.locale);
  const messages = getEmailMessages(locale);

  return renderAppointmentEmail({
    ...input,
    locale,
    title: messages.reminderTitle,
    intro: messages.reminderIntro(input.clientName, input.organizationName),
    footer: messages.reminderFooter,
  });
}

export function renderBusinessBookingNotificationEmail({
  organizationName,
  clientName,
  clientPhone,
  clientEmail,
  serviceName,
  staffName,
  startAt,
  endAt,
  durationMinutes,
  notes,
  locale,
}: BusinessBookingNotificationEmailInput) {
  const normalizedLocale = normalizeEmailLocale(locale);
  const messages = getEmailMessages(normalizedLocale);
  const safeClientPhone = clientPhone ? escapeHtml(clientPhone) : messages.empty;
  const safeClientEmail = clientEmail ? escapeHtml(clientEmail) : messages.empty;
  const safeNotes = notes?.trim() ? escapeHtml(notes.trim()) : messages.empty;

  return renderAppointmentEmail({
    organizationName,
    clientName,
    serviceName,
    staffName,
    startAt,
    endAt,
    durationMinutes,
    locale: normalizedLocale,
    title: messages.businessNotificationTitle,
    intro: messages.businessNotificationIntro(clientName),
    footer: messages.businessNotificationFooter,
    extraRows: [
      renderDetailRow(messages.clientPhone, safeClientPhone),
      renderDetailRow(messages.clientEmail, safeClientEmail),
      renderDetailRow(messages.notes, safeNotes),
    ],
  });
}

function renderAppointmentEmail({
  organizationName,
  clientName,
  serviceName,
  staffName,
  startAt,
  endAt,
  durationMinutes,
  locale,
  title,
  intro,
  footer,
  extraRows = [],
}: AppointmentEmailInput & {
  title: string;
  intro: string;
  footer: string;
  extraRows?: string[];
}) {
  const normalizedLocale = normalizeEmailLocale(locale);
  const messages = getEmailMessages(normalizedLocale);
  const safeOrganizationName = escapeHtml(organizationName);
  const safeClientName = escapeHtml(clientName);
  const safeServiceName = escapeHtml(serviceName);
  const safeStaffName = escapeHtml(staffName);
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeFooter = escapeHtml(footer);
  const date = escapeHtml(
    formatLocalizedAppointmentDate(startAt, normalizedLocale),
  );
  const startTime = escapeHtml(
    formatLocalizedAppointmentTime(startAt, normalizedLocale),
  );
  const endTime = escapeHtml(
    formatLocalizedAppointmentTime(endAt, normalizedLocale),
  );

  return `<!doctype html>
<html lang="${messages.htmlLang}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${safeTitle}</title>
  </head>
  <body style="margin:0;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f7fb;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:28px 28px 10px;">
                <div style="font-size:14px;font-weight:700;letter-spacing:0.08em;color:#2563eb;text-transform:uppercase;">Artexo</div>
                <h1 style="margin:14px 0 8px;font-size:26px;line-height:1.2;color:#0f172a;">${safeTitle}</h1>
                <p style="margin:0;color:#475569;font-size:15px;line-height:1.6;">${safeIntro}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px 28px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:separate;border-spacing:0 10px;">
                  ${renderDetailRow(messages.organization, safeOrganizationName)}
                  ${renderDetailRow(messages.client, safeClientName)}
                  ${renderDetailRow(messages.service, safeServiceName)}
                  ${renderDetailRow(messages.staff, safeStaffName)}
                  ${renderDetailRow(messages.date, date)}
                  ${renderDetailRow(messages.start, startTime)}
                  ${renderDetailRow(messages.end, endTime)}
                  ${renderDetailRow(messages.duration, `${durationMinutes} ${messages.minute}`)}
                  ${extraRows.join("")}
                </table>
                <p style="margin:18px 0 0;color:#64748b;font-size:13px;line-height:1.6;">${safeFooter}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderDetailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:12px 14px;background:#f8fafc;border-radius:12px 0 0 12px;color:#64748b;font-size:13px;width:34%;">${label}</td>
    <td style="padding:12px 14px;background:#f8fafc;border-radius:0 12px 12px 0;color:#0f172a;font-size:14px;font-weight:700;">${value}</td>
  </tr>`;
}
