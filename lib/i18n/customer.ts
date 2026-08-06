import { defaultLocale, type Locale } from "./constants";

export type CustomerMessages = {
  backToPanel: string;
  logout: string;
  loggingOut: string;
  logoutFailed: string;
  noOrganizationTitle: string;
  noOrganizationDescription: string;
  dashboardTitle: string;
  welcome: (name: string) => string;
  dashboardDescription: string;
  viewServices: string;
  myAppointments: string;
  chooseOrganizationTitle: string;
  chooseOrganizationDescription: string;
  choose: string;
  choosing: string;
  organizationSelectFailed: string;
  organizationFallback: (id: string) => string;
  servicesTitle: string;
  servicesForOrganization: (name: string) => string;
  servicesNeedOrganization: string;
  servicesNoOrganizationDescription: string;
  noActiveServicesTitle: string;
  noActiveServicesDescription: string;
  noServiceDescription: string;
  bookAppointment: string;
  minuteShort: string;
  backToServices: string;
  bookingDateTitle: string;
  customerRecordRequiredForBooking: string;
  serviceNotFoundTitle: string;
  serviceNotFoundDescription: string;
  selectedService: string;
  dateRequired: string;
  pastDate: string;
  appointmentDate: string;
  continue: string;
  staffAndTimeSelection: string;
  staffAndTimeDescription: string;
  changeDate: string;
  changeServices: string;
  noStaff: string;
  chooseStaff: string;
  noSlots: string;
  availableTimes: string;
  changeTime: string;
  bookingConfirmTitle: string;
  bookingCreateNoOrganizationDescription: string;
  selectedSlotUnavailableTitle: string;
  selectedSlotUnavailableDescription: string;
  service: string;
  staff: string;
  date: string;
  time: string;
  duration: string;
  price: string;
  confirmAppointment: string;
  creatingAppointment: string;
  createFailed: string;
  successTitle: string;
  successDescription: string;
  backToCustomerPanel: string;
  newAppointment: string;
  appointmentsTitle: string;
  activeClientNotFoundTitle: string;
  activeClientNotFoundDescription: string;
  upcomingAppointments: string;
  noUpcomingAppointments: string;
  pastAndCancelledAppointments: string;
  noPastOrCancelledAppointments: string;
  statusLabels: {
    confirmed: string;
    completed: string;
    cancelled: string;
    no_show: string;
  };
  cancelAppointment: string;
  cancelDialogTitle: string;
  cancelDialogDescription: string;
  cancelKeep: string;
  cancelConfirm: string;
  cancelling: string;
  cancelSuccess: string;
  cancelFailed: string;
};

const tr: CustomerMessages = {
  backToPanel: "Müşteri paneline dön",
  logout: "Çıkış Yap",
  loggingOut: "Çıkış yapılıyor...",
  logoutFailed: "Çıkış yapılırken bir hata oluştu.",
  noOrganizationTitle: "Bu hesap herhangi bir işletmeye bağlı değil.",
  noOrganizationDescription:
    "Devam etmek için işletme tarafından müşteri kaydınızın oluşturulması gerekir.",
  dashboardTitle: "Müşteri Paneli",
  welcome: (name) => `Hoş geldiniz, ${name}`,
  dashboardDescription:
    "Hizmetleri inceleyebilir ve sonraki adımda randevu akışına devam edebilirsiniz.",
  viewServices: "Hizmetleri Gör",
  myAppointments: "Randevularım",
  chooseOrganizationTitle: "İşletme Seçin",
  chooseOrganizationDescription:
    "Bu hesap birden fazla işletmeye bağlı. Devam etmek istediğiniz işletmeyi seçin.",
  choose: "Seç",
  choosing: "Seçiliyor...",
  organizationSelectFailed: "İşletme seçilemedi.",
  organizationFallback: (id) => `İşletme ${id.slice(0, 8)}`,
  servicesTitle: "Hizmetler",
  servicesForOrganization: (name) => `${name} için aktif hizmetler.`,
  servicesNeedOrganization:
    "Hizmetleri görüntülemek için bir işletme bağlantısı gerekir.",
  servicesNoOrganizationDescription:
    "Hizmetleri görüntülemek için işletme tarafından müşteri kaydınızın oluşturulması gerekir.",
  noActiveServicesTitle:
    "Şu anda randevu alınabilir aktif hizmet bulunmuyor.",
  noActiveServicesDescription:
    "İşletme hizmet eklediğinde burada listelenir.",
  noServiceDescription:
    "Bu hizmet için detaylı açıklama henüz eklenmemiş.",
  bookAppointment: "Randevu Al",
  minuteShort: "dk",
  backToServices: "Hizmetlere Dön",
  bookingDateTitle: "Randevu Tarihi Seç",
  customerRecordRequiredForBooking:
    "Randevu akışına devam etmek için işletme tarafından müşteri kaydınızın oluşturulması gerekir.",
  serviceNotFoundTitle: "Hizmet bulunamadı.",
  serviceNotFoundDescription:
    "Seçtiğiniz hizmet pasif olabilir, kaldırılmış olabilir veya bağlı olduğunuz işletmeye ait olmayabilir.",
  selectedService: "Seçilen hizmet",
  dateRequired: "Devam etmek için tarih seçmelisiniz.",
  pastDate: "Geçmiş bir tarih seçilemez.",
  appointmentDate: "Randevu tarihi",
  continue: "Devam Et",
  staffAndTimeSelection: "Personel ve saat seçimi",
  staffAndTimeDescription:
    "Uygun personel ve müsait saatleri aşağıdan seçebilirsiniz.",
  changeDate: "Tarihi Değiştir",
  changeServices: "Hizmetleri Değiştir",
  noStaff: "Bu hizmet için uygun personel bulunamadı.",
  chooseStaff: "Personel seçin",
  noSlots: "Bu tarih için uygun saat bulunamadı.",
  availableTimes: "Uygun saatler",
  changeTime: "Saati Değiştir",
  bookingConfirmTitle: "Randevu Onayı",
  bookingCreateNoOrganizationDescription:
    "Randevu oluşturmak için işletme tarafından müşteri kaydınızın oluşturulması gerekir.",
  selectedSlotUnavailableTitle: "Seçilen saat müsait değil.",
  selectedSlotUnavailableDescription:
    "Hizmet, personel veya saat seçimi artık geçerli olmayabilir. Lütfen başka bir saat seçin.",
  service: "Hizmet",
  staff: "Personel",
  date: "Tarih",
  time: "Saat",
  duration: "Süre",
  price: "Fiyat",
  confirmAppointment: "Randevuyu Onayla",
  creatingAppointment: "Randevu oluşturuluyor...",
  createFailed: "Randevu oluşturulamadı.",
  successTitle: "Randevunuz oluşturuldu",
  successDescription:
    "Randevu kaydınız başarıyla alındı. Müşteri paneline dönebilir veya yeni bir randevu oluşturabilirsiniz.",
  backToCustomerPanel: "Müşteri Paneline Dön",
  newAppointment: "Yeni Randevu Al",
  appointmentsTitle: "Randevularım",
  activeClientNotFoundTitle: "Aktif müşteri kaydı bulunamadı.",
  activeClientNotFoundDescription:
    "Randevularınızı görüntülemek için müşteri kaydınızın aktif olması gerekir.",
  upcomingAppointments: "Yaklaşan Randevular",
  noUpcomingAppointments: "Henüz yaklaşan randevunuz bulunmuyor.",
  pastAndCancelledAppointments: "Geçmiş ve İptal Edilen Randevular",
  noPastOrCancelledAppointments:
    "Henüz geçmiş veya iptal edilmiş randevunuz bulunmuyor.",
  statusLabels: {
    confirmed: "Onaylandı",
    completed: "Tamamlandı",
    cancelled: "İptal Edildi",
    no_show: "Gelmedi",
  },
  cancelAppointment: "İptal Et",
  cancelDialogTitle: "Randevu iptali",
  cancelDialogDescription:
    "Bu randevuyu iptal etmek istediğinize emin misiniz?",
  cancelKeep: "Vazgeç",
  cancelConfirm: "Randevuyu İptal Et",
  cancelling: "İptal ediliyor...",
  cancelSuccess: "Randevu iptal edildi.",
  cancelFailed: "Randevu iptal edilemedi.",
};

const en: CustomerMessages = {
  backToPanel: "Back to customer panel",
  logout: "Log Out",
  loggingOut: "Logging out...",
  logoutFailed: "An error occurred while logging out.",
  noOrganizationTitle: "This account is not linked to any business.",
  noOrganizationDescription:
    "A customer record must be created by the business before you can continue.",
  dashboardTitle: "Customer Panel",
  welcome: (name) => `Welcome, ${name}`,
  dashboardDescription:
    "You can review services and continue to the booking flow in the next step.",
  viewServices: "View Services",
  myAppointments: "My Appointments",
  chooseOrganizationTitle: "Choose Business",
  chooseOrganizationDescription:
    "This account is linked to multiple businesses. Choose the business you want to continue with.",
  choose: "Choose",
  choosing: "Choosing...",
  organizationSelectFailed: "Business could not be selected.",
  organizationFallback: (id) => `Business ${id.slice(0, 8)}`,
  servicesTitle: "Services",
  servicesForOrganization: (name) => `Active services for ${name}.`,
  servicesNeedOrganization:
    "A business connection is required to view services.",
  servicesNoOrganizationDescription:
    "A customer record must be created by the business before you can view services.",
  noActiveServicesTitle: "There are no active services available for booking.",
  noActiveServicesDescription:
    "Services will appear here when the business adds them.",
  noServiceDescription: "No detailed description has been added for this service yet.",
  bookAppointment: "Book Appointment",
  minuteShort: "min",
  backToServices: "Back to Services",
  bookingDateTitle: "Choose Appointment Date",
  customerRecordRequiredForBooking:
    "A customer record must be created by the business before you can continue booking.",
  serviceNotFoundTitle: "Service not found.",
  serviceNotFoundDescription:
    "The selected service may be inactive, removed, or may not belong to your linked business.",
  selectedService: "Selected service",
  dateRequired: "Please choose a date to continue.",
  pastDate: "A past date cannot be selected.",
  appointmentDate: "Appointment date",
  continue: "Continue",
  staffAndTimeSelection: "Staff and time selection",
  staffAndTimeDescription:
    "Choose an available staff member and time below.",
  changeDate: "Change Date",
  changeServices: "Change Services",
  noStaff: "No available staff was found for this service.",
  chooseStaff: "Choose staff",
  noSlots: "No available time was found for this date.",
  availableTimes: "Available times",
  changeTime: "Change Time",
  bookingConfirmTitle: "Appointment Confirmation",
  bookingCreateNoOrganizationDescription:
    "A customer record must be created by the business before you can create an appointment.",
  selectedSlotUnavailableTitle: "The selected time is not available.",
  selectedSlotUnavailableDescription:
    "The service, staff member, or time may no longer be valid. Please choose another time.",
  service: "Service",
  staff: "Staff",
  date: "Date",
  time: "Time",
  duration: "Duration",
  price: "Price",
  confirmAppointment: "Confirm Appointment",
  creatingAppointment: "Creating appointment...",
  createFailed: "Appointment could not be created.",
  successTitle: "Your appointment has been created",
  successDescription:
    "Your appointment was created successfully. You can return to the customer panel or create a new appointment.",
  backToCustomerPanel: "Back to Customer Panel",
  newAppointment: "Book Another Appointment",
  appointmentsTitle: "My Appointments",
  activeClientNotFoundTitle: "Active customer record was not found.",
  activeClientNotFoundDescription:
    "Your customer record must be active to view appointments.",
  upcomingAppointments: "Upcoming Appointments",
  noUpcomingAppointments: "You do not have any upcoming appointments yet.",
  pastAndCancelledAppointments: "Past and Cancelled Appointments",
  noPastOrCancelledAppointments:
    "You do not have any past or cancelled appointments yet.",
  statusLabels: {
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
    no_show: "No-show",
  },
  cancelAppointment: "Cancel",
  cancelDialogTitle: "Cancel appointment",
  cancelDialogDescription:
    "Are you sure you want to cancel this appointment?",
  cancelKeep: "Keep",
  cancelConfirm: "Cancel Appointment",
  cancelling: "Cancelling...",
  cancelSuccess: "Appointment cancelled.",
  cancelFailed: "Appointment could not be cancelled.",
};

export function getCustomerMessages(locale: Locale = defaultLocale) {
  return locale === "en" ? en : tr;
}

export function getCustomerHref(path = "", localePrefix?: Locale) {
  return `${localePrefix ? `/${localePrefix}` : ""}/customer${path}`;
}
