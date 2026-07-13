import "server-only";

type AppointmentEmailInput = {
  organizationName: string;
  clientName: string;
  serviceName: string;
  staffName: string;
  startAt: string;
  endAt: string;
  durationMinutes: number;
};

type BusinessBookingNotificationEmailInput = AppointmentEmailInput & {
  clientPhone: string | null;
  clientEmail: string | null;
  notes: string | null;
};

const DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "full",
  timeZone: "Europe/Istanbul",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatAppointmentDate(value: string) {
  return DATE_FORMATTER.format(new Date(value));
}

export function formatAppointmentTime(value: string) {
  return TIME_FORMATTER.format(new Date(value));
}

export function renderBookingConfirmationEmail(input: AppointmentEmailInput) {
  return renderAppointmentEmail({
    ...input,
    title: "Randevunuz onaylandı",
    intro: `${input.clientName}, ${input.organizationName} için oluşturduğunuz randevu başarıyla onaylandı.`,
    footer: "Bu e-posta randevunuzun onaylandığını bildirmek için gönderilmiştir.",
  });
}

export function renderAppointmentReminderEmail(input: AppointmentEmailInput) {
  return renderAppointmentEmail({
    ...input,
    title: "Randevu hatırlatması",
    intro: `${input.clientName}, ${input.organizationName} için randevunuz yarın. Randevu bilgilerinizi aşağıda görebilirsiniz.`,
    footer: "Bu e-posta yaklaşan randevunuzu hatırlatmak için gönderilmiştir.",
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
}: BusinessBookingNotificationEmailInput) {
  const safeClientPhone = clientPhone ? escapeHtml(clientPhone) : "-";
  const safeClientEmail = clientEmail ? escapeHtml(clientEmail) : "-";
  const safeNotes = notes?.trim() ? escapeHtml(notes.trim()) : "-";

  return renderAppointmentEmail({
    organizationName,
    clientName,
    serviceName,
    staffName,
    startAt,
    endAt,
    durationMinutes,
    title: "Yeni randevu oluşturuldu",
    intro: `${clientName} tarafından yeni bir randevu oluşturuldu. Randevu bilgilerini aşağıda görebilirsiniz.`,
    footer:
      "Bu e-posta işletmenize yeni bir müşteri randevusu oluşturulduğunu bildirmek için gönderilmiştir.",
    extraRows: [
      renderDetailRow("Müşteri Telefonu", safeClientPhone),
      renderDetailRow("Müşteri E-postası", safeClientEmail),
      renderDetailRow("Not", safeNotes),
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
  const safeOrganizationName = escapeHtml(organizationName);
  const safeClientName = escapeHtml(clientName);
  const safeServiceName = escapeHtml(serviceName);
  const safeStaffName = escapeHtml(staffName);
  const safeTitle = escapeHtml(title);
  const safeIntro = escapeHtml(intro);
  const safeFooter = escapeHtml(footer);
  const date = escapeHtml(formatAppointmentDate(startAt));
  const startTime = escapeHtml(formatAppointmentTime(startAt));
  const endTime = escapeHtml(formatAppointmentTime(endAt));

  return `<!doctype html>
<html lang="tr">
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
                  ${renderDetailRow("İşletme", safeOrganizationName)}
                  ${renderDetailRow("Müşteri", safeClientName)}
                  ${renderDetailRow("Hizmet", safeServiceName)}
                  ${renderDetailRow("Personel", safeStaffName)}
                  ${renderDetailRow("Tarih", date)}
                  ${renderDetailRow("Başlangıç", startTime)}
                  ${renderDetailRow("Bitiş", endTime)}
                  ${renderDetailRow("Süre", `${durationMinutes} dakika`)}
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
