import { defaultLocale, type Locale } from "./constants";

export type PublicBookingMessages = {
  metadataTitle: string;
  pageTitle: string;
  pageDescription: string;
  serviceUnavailable: string;
  selectServiceTitle: string;
  selectServiceDescription: string;
  noServices: string;
  minute: string;
  selectedServiceButton: string;
  selectServiceButton: string;
  selectDateTitle: string;
  changeService: string;
  invalidDate: string;
  selectedDate: string;
  staffAndTimeTitle: string;
  changeDate: string;
  noStaff: string;
  selectStaffTitle: string;
  invalidStaff: string;
  availableSlotsTitle: string;
  availableSlotsDescription: (staffName: string) => string;
  changeStaff: string;
  noSlots: string;
  dateInputLabel: string;
  dateRequired: string;
  pastDate: string;
  continue: string;
  confirmTitle: string;
  confirmDescription: string;
  invalidSlotTitle: string;
  invalidSlotDescription: string;
  changeTime: string;
  summaryTitle: string;
  summaryDescription: string;
  business: string;
  service: string;
  staff: string;
  date: string;
  time: string;
  duration: string;
  enterInfoTitle: string;
  enterInfoDescription: string;
  checkInfoTitle: string;
  checkInfoDescription: string;
  fullName: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
  notesPlaceholder: string;
  consent: string;
  checkInfoButton: string;
  editInfo: string;
  createAppointment: string;
  creatingAppointment: string;
  securityRequired: string;
  securityFailed: string;
  createFailed: string;
  requestTooLarge: string;
  badRequest: string;
  checkYourInfo: string;
  linkNotFound: string;
  selectionInvalid: string;
  contactConflict: string;
  temporaryUnavailable: string;
  rateLimit: string;
  firstNameRequired: string;
  lastNameRequired: string;
  phoneRequired: string;
  phoneInvalid: string;
  emailRequired: string;
  emailInvalid: string;
  notesTooLong: string;
  consentRequired: string;
  networkError: string;
  successTitle: string;
  successDescription: string;
  newAppointment: string;
};

const tr: PublicBookingMessages = {
  metadataTitle: "Online Randevu | Artexo",
  pageTitle: "Online Randevu",
  pageDescription: "Hizmet, tarih, personel ve uygun saat seçimini tamamlayın.",
  serviceUnavailable:
    "Seçtiğiniz hizmet artık randevuya açık değil. Lütfen başka bir hizmet seçin.",
  selectServiceTitle: "Hizmet Seçin",
  selectServiceDescription: "Randevu almak istediğiniz hizmeti seçin.",
  noServices: "Bu işletme şu anda online randevuya açık bir hizmet sunmuyor.",
  minute: "dakika",
  selectedServiceButton: "Bu Hizmet Seçildi",
  selectServiceButton: "Bu Hizmeti Seç",
  selectDateTitle: "Tarih Seçin",
  changeService: "Hizmeti Değiştir",
  invalidDate: "Geçmiş veya geçersiz bir tarih seçilemez.",
  selectedDate: "Seçilen tarih",
  staffAndTimeTitle: "Personel ve Saat",
  changeDate: "Tarihi Değiştir",
  noStaff: "Bu hizmet için uygun personel bulunamadı.",
  selectStaffTitle: "Personel Seçin",
  invalidStaff:
    "Seçtiğiniz personel bu hizmet için uygun değil. Lütfen başka bir personel seçin.",
  availableSlotsTitle: "Uygun Saatler",
  availableSlotsDescription: (staffName) => `${staffName} için uygun saatler.`,
  changeStaff: "Personeli Değiştir",
  noSlots: "Bu tarih için uygun saat bulunamadı.",
  dateInputLabel: "Randevu tarihi",
  dateRequired: "Devam etmek için tarih seçmelisiniz.",
  pastDate: "Geçmiş bir tarih seçilemez.",
  continue: "Devam Et",
  confirmTitle: "Randevu Bilgilerini Onaylayın",
  confirmDescription:
    "Randevu özetini kontrol edin ve iletişim bilgilerinizi girin.",
  invalidSlotTitle: "Saat artık müsait değil",
  invalidSlotDescription:
    "Seçtiğiniz saat artık müsait değil. Lütfen başka bir saat seçin.",
  changeTime: "Saati Değiştir",
  summaryTitle: "Randevu Özeti",
  summaryDescription: "Seçtiğiniz saat tekrar kontrol edildi ve şu anda müsait.",
  business: "İşletme",
  service: "Hizmet",
  staff: "Personel",
  date: "Tarih",
  time: "Saat",
  duration: "Süre",
  enterInfoTitle: "Bilgilerinizi Girin",
  enterInfoDescription: "Randevu oluşturmak için iletişim bilgilerinizi doldurun.",
  checkInfoTitle: "Bilgilerinizi Kontrol Edin",
  checkInfoDescription:
    "Randevu oluşturma adımına geçmeden önce bilgilerinizi kontrol edin.",
  fullName: "Ad Soyad",
  firstName: "Ad",
  lastName: "Soyad",
  phone: "Telefon",
  email: "E-posta",
  notes: "Not",
  notesPlaceholder: "Eklemek istediğiniz bir not varsa yazabilirsiniz.",
  consent:
    "Randevu oluşturmak için bilgilerimin işletmeyle paylaşılmasını kabul ediyorum.",
  checkInfoButton: "Bilgileri Kontrol Et",
  editInfo: "Bilgileri Düzenle",
  createAppointment: "Randevuyu Oluştur",
  creatingAppointment: "Oluşturuluyor...",
  securityRequired: "Güvenlik doğrulamasının tamamlanmasını bekleyin.",
  securityFailed: "Güvenlik doğrulaması başarısız oldu. Lütfen tekrar deneyin.",
  createFailed: "Randevu oluşturulamadı.",
  requestTooLarge: "İstek gövdesi çok büyük.",
  badRequest: "Geçersiz istek gövdesi.",
  checkYourInfo: "Bilgilerinizi kontrol edin.",
  linkNotFound: "Randevu bağlantısı bulunamadı.",
  selectionInvalid: "Randevu seçiminizi kontrol edin.",
  contactConflict:
    "Bilgileriniz doğrulanamadı. Lütfen işletmeyle iletişime geçin.",
  temporaryUnavailable:
    "Randevu sistemi geçici olarak kullanılamıyor. Lütfen daha sonra tekrar deneyin veya işletmeyle iletişime geçin.",
  rateLimit:
    "Çok fazla randevu denemesi yaptınız. Lütfen bir süre sonra tekrar deneyin.",
  firstNameRequired: "Ad alanı zorunludur.",
  lastNameRequired: "Soyad alanı zorunludur.",
  phoneRequired: "Telefon alanı zorunludur.",
  phoneInvalid: "Geçerli bir Türkiye telefon numarası girin.",
  emailRequired: "E-posta alanı zorunludur.",
  emailInvalid: "Geçerli bir e-posta adresi girin.",
  notesTooLong: "Not en fazla 500 karakter olmalıdır.",
  consentRequired:
    "Randevu oluşturmak için bilgilerinizin işletmeyle paylaşılmasını onaylamalısınız.",
  networkError:
    "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
  successTitle: "Randevunuz oluşturuldu",
  successDescription: "Randevu bilgileriniz e-posta adresinize gönderilecektir.",
  newAppointment: "Yeni Randevu Al",
};

const en: PublicBookingMessages = {
  metadataTitle: "Online Booking | Artexo",
  pageTitle: "Online Booking",
  pageDescription: "Choose a service, date, staff member and available time.",
  serviceUnavailable:
    "The selected service is no longer available for online booking. Please choose another service.",
  selectServiceTitle: "Choose a Service",
  selectServiceDescription: "Select the service you want to book.",
  noServices: "This business does not currently offer any online booking services.",
  minute: "minutes",
  selectedServiceButton: "Selected",
  selectServiceButton: "Choose This Service",
  selectDateTitle: "Choose a Date",
  changeService: "Change Service",
  invalidDate: "A past or invalid date cannot be selected.",
  selectedDate: "Selected date",
  staffAndTimeTitle: "Staff and Time",
  changeDate: "Change Date",
  noStaff: "No available staff was found for this service.",
  selectStaffTitle: "Choose Staff",
  invalidStaff:
    "The selected staff member is not available for this service. Please choose another staff member.",
  availableSlotsTitle: "Available Times",
  availableSlotsDescription: (staffName) => `Available times for ${staffName}.`,
  changeStaff: "Change Staff",
  noSlots: "No available time was found for this date.",
  dateInputLabel: "Appointment date",
  dateRequired: "Please choose a date to continue.",
  pastDate: "A past date cannot be selected.",
  continue: "Continue",
  confirmTitle: "Confirm Appointment Details",
  confirmDescription:
    "Review your appointment summary and enter your contact details.",
  invalidSlotTitle: "This time is no longer available",
  invalidSlotDescription:
    "The selected time is no longer available. Please choose another time.",
  changeTime: "Change Time",
  summaryTitle: "Appointment Summary",
  summaryDescription: "The selected time was checked again and is currently available.",
  business: "Business",
  service: "Service",
  staff: "Staff",
  date: "Date",
  time: "Time",
  duration: "Duration",
  enterInfoTitle: "Enter Your Details",
  enterInfoDescription: "Fill in your contact details to create the appointment.",
  checkInfoTitle: "Review Your Details",
  checkInfoDescription:
    "Please review your details before creating the appointment.",
  fullName: "Full Name",
  firstName: "First Name",
  lastName: "Last Name",
  phone: "Phone",
  email: "Email",
  notes: "Notes",
  notesPlaceholder: "Write an optional note if needed.",
  consent:
    "I agree that my details will be shared with the business to create this appointment.",
  checkInfoButton: "Review Details",
  editInfo: "Edit Details",
  createAppointment: "Create Appointment",
  creatingAppointment: "Creating...",
  securityRequired: "Please wait for the security verification to complete.",
  securityFailed: "Security verification failed. Please try again.",
  createFailed: "Appointment could not be created.",
  requestTooLarge: "Request body is too large.",
  badRequest: "Invalid request body.",
  checkYourInfo: "Please check your details.",
  linkNotFound: "Booking link was not found.",
  selectionInvalid: "Please check your appointment selection.",
  contactConflict:
    "Your details could not be verified. Please contact the business.",
  temporaryUnavailable:
    "The booking system is temporarily unavailable. Please try again later or contact the business.",
  rateLimit:
    "Too many booking attempts were made. Please try again later.",
  firstNameRequired: "First name is required.",
  lastNameRequired: "Last name is required.",
  phoneRequired: "Phone number is required.",
  phoneInvalid: "Enter a valid Turkish mobile phone number.",
  emailRequired: "Email is required.",
  emailInvalid: "Enter a valid email address.",
  notesTooLong: "Notes must be at most 500 characters.",
  consentRequired:
    "You must approve sharing your details with the business to create the appointment.",
  networkError:
    "The server could not be reached. Please check your internet connection and try again.",
  successTitle: "Your appointment has been created",
  successDescription: "Your appointment details will be sent to your email address.",
  newAppointment: "Book Another Appointment",
};

export function getPublicBookingMessages(locale: Locale = defaultLocale) {
  return locale === "en" ? en : tr;
}

export function buildPublicBookingHref({
  slug,
  localePrefix,
  path = "",
  params,
  hash,
}: {
  slug: string;
  localePrefix?: Locale;
  path?: string;
  params?: URLSearchParams;
  hash?: string;
}) {
  const base = `${localePrefix ? `/${localePrefix}` : ""}/book/${encodeURIComponent(
    slug,
  )}${path}`;
  const queryString = params?.toString();

  return `${base}${queryString ? `?${queryString}` : ""}${hash ? `#${hash}` : ""}`;
}
