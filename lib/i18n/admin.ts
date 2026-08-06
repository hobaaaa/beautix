import { defaultLocale, type Locale } from "./constants";

export type AdminMessages = {
  brandSuffix: string;
  panel: string;
  menu: string;
  openMenu: string;
  closeMenu: string;
  close: string;
  version: string;
  nav: {
    dashboard: string;
    services: string;
    staff: string;
    clients: string;
    appointments: string;
    notifications: string;
    hours: string;
    settings: string;
  };
  logout: string;
  loggingOut: string;
  logoutFailed: string;
  userMenuOpen: string;
  dashboard: {
    title: string;
    description: string;
    newAppointment: string;
    today: string;
    tomorrow: string;
    upcomingAppointments: string;
    todayCountDescription: string;
    tomorrowCountDescription: string;
    upcomingCountDescription: string;
    todayAppointments: string;
    tomorrowAppointments: string;
    noTodayAppointments: string;
    noTomorrowAppointments: string;
    statusLabels: {
      confirmed: string;
      completed: string;
      cancelled: string;
      no_show: string;
    };
  };
  services: {
    createTitle: string;
    nameLabel: string;
    durationLabel: string;
    durationText: (minutes: number) => string;
    createButton: string;
    creating: string;
    nameRequired: string;
    durationInvalid: string;
    createFailed: string;
    createSuccess: string;
    genericError: string;
    emptyTitle: string;
    emptyDescription: string;
    deleteFailed: string;
    deleteSuccess: string;
    statusUpdateFailed: string;
    statusUpdateSuccess: string;
    active: string;
    passive: string;
    delete: string;
    deleting: string;
    updating: string;
    deactivate: string;
    activate: string;
  };
  settings: {
    title: string;
    description: string;
    publicBookingOnly: string;
    slugLabel: string;
    slugHelp: string;
    preview: string;
    save: string;
    saving: string;
    updateSuccess: string;
    updateFailed: string;
    defaultBusinessName: (orgIdPrefix: string) => string;
  };
  notifications: {
    title: string;
    description: string;
    emptyTitle: string;
    attempt: (attemptNumber: number) => string;
    recipient: string;
    channel: string;
    provider: string;
    providerMessageId: string;
    error: string;
    typeLabels: Record<string, string>;
    statusLabels: Record<string, string>;
    channelLabels: Record<string, string>;
    providerLabels: Record<string, string>;
  };
  hours: {
    open: string;
    closed: string;
    active: string;
    startTime: string;
    endTime: string;
    saving: string;
    save: string;
    requiredTimes: (dayName: string) => string;
    invalidRange: (dayName: string) => string;
    saveFailed: string;
    saveSuccess: string;
    weekDays: Array<{ day_of_week: number; day_name: string }>;
  };
  staff: {
    title: string;
    description: string;
    nameRequired: string;
    serviceRequired: string;
    saveFailed: string;
    createSuccess: string;
    updateSuccess: string;
    statusUpdateFailed: string;
    deactivated: string;
    activated: string;
    deleteFailed: string;
    deleteSuccess: string;
    updateButton: string;
    createButton: string;
    editTitle: string;
    createTitle: string;
    formDescription: string;
    nameLabel: string;
    namePlaceholder: string;
    servicesLabel: string;
    durationText: (minutes: number) => string;
    inactiveService: string;
    cancel: string;
    saving: string;
    activeStaff: string;
    inactiveStaff: string;
    noServiceAssigned: string;
    edit: string;
    updating: string;
    deactivate: string;
    activate: string;
    deleting: string;
    delete: string;
    emptyTitle: string;
    emptyDescription: string;
    activeSection: string;
    inactiveSection: string;
  };
  clients: {
    title: string;
    description: string;
    newClient: string;
    searchPlaceholder: string;
    emptyTitle: string;
    noResults: string;
    createTitle: string;
    editTitle: string;
    addClient: string;
    saveChanges: string;
    closeForm: string;
    close: string;
    formDescription: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    address: string;
    birthDate: string;
    notes: string;
    cancel: string;
    saving: string;
    requiredFields: string;
    invalidEmail: string;
    saveFailed: string;
    createSuccess: string;
    updateSuccess: string;
    statusUpdateFailed: string;
    deactivated: string;
    activated: string;
    inviteEmailRequired: string;
    inviteFailed: string;
    inviteSuccess: string;
    active: string;
    inactive: string;
    createdAt: string;
    accountActive: string;
    accountMissing: string;
    actions: string;
    appointments: string;
    sending: string;
    resendInvite: string;
    sendInvite: string;
    edit: string;
    updating: string;
    deactivate: string;
    activate: string;
    activeSection: string;
    inactiveSection: string;
    backToClients: string;
    appointmentDescription: string;
    activeClient: string;
    inactiveClient: string;
    upcomingAppointments: string;
    noUpcomingAppointments: string;
    pastAndCancelledAppointments: string;
    noPastOrCancelledAppointments: string;
  };
  appointments: {
    title: string;
    dayDescription: string;
    allDescription: string;
    add: string;
    today: string;
    tomorrow: string;
    allAppointments: string;
    allServices: string;
    allStaff: string;
    emptyDay: string;
    emptyAll: string;
    loadMore: string;
    createSuccess: string;
    updateSuccess: string;
    cancelFailed: string;
    cancelSuccess: string;
    editTitle: string;
    createTitle: string;
    editDescription: string;
    createDescription: string;
    close: string;
    updateSubmit: string;
    createSubmit: string;
    clientRequired: string;
    serviceRequired: string;
    staffRequired: string;
    dateRequired: string;
    slotRequired: string;
    loadSlotsFailed: string;
    updateFailed: string;
    createFailed: string;
    client: string;
    selectClient: string;
    service: string;
    selectService: string;
    staff: string;
    selectStaff: string;
    autoSelectedStaff: (name: string) => string;
    noEligibleStaff: string;
    date: string;
    availableSlots: string;
    selectRequiredForSlots: string;
    loadingSlots: string;
    noSlots: string;
    notes: string;
    optionalNotes: string;
    saving: string;
    time: string;
    duration: string;
    status: string;
    active: string;
    inactive: string;
    durationText: (minutes: number) => string;
    edit: string;
    cancelling: string;
    cancel: string;
    noNotes: string;
    statusLabels: {
      confirmed: string;
      completed: string;
      cancelled: string;
      no_show: string;
    };
    lifecycle: {
      title: string;
      completed: string;
      noShow: string;
      completedConfirm: string;
      noShowConfirm: string;
      completedSuccess: string;
      noShowSuccess: string;
      failed: string;
      dismiss: string;
      updating: string;
    };
  };
};

const tr: AdminMessages = {
  brandSuffix: "Yönetim",
  panel: "Panel",
  menu: "Menü",
  openMenu: "Yönetim menüsünü aç",
  closeMenu: "Yönetim menüsünü kapat",
  close: "Menüyü kapat",
  version: "v0.1 (MVP)",
  nav: {
    dashboard: "Gösterge Paneli",
    services: "Hizmetler",
    staff: "Personeller",
    clients: "Müşteriler",
    appointments: "Randevular",
    notifications: "Bildirimler",
    hours: "Çalışma Saatleri",
    settings: "Ayarlar",
  },
  logout: "Çıkış Yap",
  loggingOut: "Çıkış yapılıyor...",
  logoutFailed: "Çıkış yapılırken bir hata oluştu.",
  userMenuOpen: "Kullanıcı menüsünü aç",
  dashboard: {
    title: "Gösterge Paneli",
    description:
      "Günlük randevu özetinizi ve hızlı erişimleri görüntüleyin.",
    newAppointment: "Yeni Randevu",
    today: "Bugün",
    tomorrow: "Yarın",
    upcomingAppointments: "Yaklaşan Randevular",
    todayCountDescription: "Bugünkü iptal edilmeyen randevu sayısı",
    tomorrowCountDescription: "Yarının iptal edilmeyen randevu sayısı",
    upcomingCountDescription:
      "Şu andan sonraki iptal edilmeyen toplam randevu sayısı",
    todayAppointments: "Bugünün Randevuları",
    tomorrowAppointments: "Yarının Randevuları",
    noTodayAppointments: "Bugün için randevu bulunmuyor.",
    noTomorrowAppointments: "Yarın için randevu bulunmuyor.",
    statusLabels: {
      confirmed: "Onaylandı",
      completed: "Tamamlandı",
      cancelled: "İptal Edildi",
      no_show: "Gelmedi",
    },
  },
  services: {
    createTitle: "Yeni Hizmet Oluştur",
    nameLabel: "Hizmet Adı:",
    durationLabel: "Süre (dakika):",
    durationText: (minutes) => `Süre: ${minutes} dakika`,
    createButton: "Hizmet Oluştur",
    creating: "Oluşturuluyor...",
    nameRequired: "Hizmet adı zorunludur.",
    durationInvalid: "Süre 1 ile 600 dakika arasında olmalıdır.",
    createFailed: "Hizmet oluşturulamadı.",
    createSuccess: "Hizmet başarıyla oluşturuldu.",
    genericError: "Bir hata oluştu.",
    emptyTitle: "Henüz hizmet bulunmuyor.",
    emptyDescription: "İlk hizmetinizi oluşturduğunuzda burada listelenir.",
    deleteFailed: "Hizmet silinemedi.",
    deleteSuccess: "Hizmet başarıyla silindi.",
    statusUpdateFailed: "Hizmet durumu güncellenemedi.",
    statusUpdateSuccess: "Hizmet durumu başarıyla güncellendi.",
    active: "Aktif",
    passive: "Pasif",
    delete: "Sil",
    deleting: "Siliniyor...",
    updating: "Güncelleniyor...",
    deactivate: "Pasifleştir",
    activate: "Aktifleştir",
  },
  settings: {
    title: "Ayarlar",
    description: "İşletme profilinizi ve public randevu bağlantınızı yönetin.",
    publicBookingOnly:
      "Bu kartta yalnızca public randevu URL altyapısı yönetilir.",
    slugLabel: "Public Randevu Bağlantısı",
    slugHelp:
      "Müşterileriniz bu bağlantı üzerinden üyelik oluşturmadan randevu alabilir.",
    preview: "Önizleme",
    save: "Kaydet",
    saving: "Kaydediliyor...",
    updateSuccess: "Public randevu bağlantısı güncellendi.",
    updateFailed: "Public randevu bağlantısı güncellenemedi.",
    defaultBusinessName: (orgIdPrefix) => `İşletme ${orgIdPrefix}`,
  },
  notifications: {
    title: "Bildirimler",
    description: "Son 100 bildirim gönderim kaydını görüntüleyin.",
    emptyTitle: "Henüz bildirim kaydı bulunmuyor.",
    attempt: (attemptNumber) => `Deneme #${attemptNumber}`,
    recipient: "Alıcı",
    channel: "Kanal",
    provider: "Provider",
    providerMessageId: "Provider Mesaj ID",
    error: "Hata",
    typeLabels: {
      booking_confirmation: "Randevu Onayı",
      appointment_reminder: "Randevu Hatırlatması",
      business_booking_notification: "Yeni Randevu Bildirimi",
    },
    statusLabels: {
      sent: "Gönderildi",
      failed: "Başarısız",
      skipped: "Atlandı",
    },
    channelLabels: {
      email: "E-posta",
    },
    providerLabels: {
      resend: "Resend",
    },
  },
  hours: {
    open: "Açık",
    closed: "Kapalı",
    active: "Aktif",
    startTime: "Başlangıç saati",
    endTime: "Bitiş saati",
    saving: "Kaydediliyor...",
    save: "Çalışma Saatlerini Kaydet",
    requiredTimes: (dayName) => `${dayName}: başlangıç ve bitiş saati zorunludur.`,
    invalidRange: (dayName) =>
      `${dayName}: başlangıç saati bitiş saatinden önce olmalıdır.`,
    saveFailed: "Çalışma saatleri kaydedilemedi.",
    saveSuccess: "Çalışma saatleri başarıyla güncellendi.",
    weekDays: [
      { day_of_week: 1, day_name: "Pazartesi" },
      { day_of_week: 2, day_name: "Salı" },
      { day_of_week: 3, day_name: "Çarşamba" },
      { day_of_week: 4, day_name: "Perşembe" },
      { day_of_week: 5, day_name: "Cuma" },
      { day_of_week: 6, day_name: "Cumartesi" },
      { day_of_week: 7, day_name: "Pazar" },
    ],
  },
  staff: {
    title: "Personeller",
    description: "Personelleri ve verdikleri hizmetleri yönetin.",
    nameRequired: "Personel adı zorunludur.",
    serviceRequired: "En az bir hizmet seçmeniz gerekir.",
    saveFailed: "Personel kaydedilemedi.",
    createSuccess: "Personel başarıyla oluşturuldu.",
    updateSuccess: "Personel başarıyla güncellendi.",
    statusUpdateFailed: "Personel durumu güncellenemedi.",
    deactivated: "Personel pasife alındı.",
    activated: "Personel aktifleştirildi.",
    deleteFailed: "Personel silinemedi.",
    deleteSuccess: "Personel silindi.",
    updateButton: "Personeli Güncelle",
    createButton: "Personel Oluştur",
    editTitle: "Personeli düzenle",
    createTitle: "Yeni personel oluştur",
    formDescription: "Personelin verebildiği hizmetleri seçin.",
    nameLabel: "Personel adı",
    namePlaceholder: "Örn. Ayşe",
    servicesLabel: "Verdiği hizmetler",
    durationText: (minutes) => `${minutes} dk`,
    inactiveService: "Pasif hizmet",
    cancel: "Vazgeç",
    saving: "Kaydediliyor...",
    activeStaff: "Aktif personel",
    inactiveStaff: "Pasif personel",
    noServiceAssigned: "Hizmet atanmamış",
    edit: "Düzenle",
    updating: "Güncelleniyor...",
    deactivate: "Pasife al",
    activate: "Aktifleştir",
    deleting: "Siliniyor...",
    delete: "Sil",
    emptyTitle: "Henüz personel bulunmuyor.",
    emptyDescription:
      "Personel eklediğinizde aktif ve pasif personeller burada listelenir.",
    activeSection: "Aktif Personeller",
    inactiveSection: "Pasif Personeller",
  },
  clients: {
    title: "Müşteriler",
    description: "Müşteri kayıtlarını yönetin.",
    newClient: "Yeni Müşteri",
    searchPlaceholder: "Ad, soyad, telefon veya e-posta ara",
    emptyTitle: "Henüz müşteri bulunmuyor.",
    noResults: "Sonuç bulunamadı.",
    createTitle: "Yeni Müşteri",
    editTitle: "Müşteriyi Düzenle",
    addClient: "Müşteri Ekle",
    saveChanges: "Değişiklikleri Kaydet",
    closeForm: "Müşteri formunu kapat",
    close: "Kapat",
    formDescription: "Müşteri bilgilerini eksiksiz girin.",
    firstName: "Ad",
    lastName: "Soyad",
    phone: "Telefon",
    email: "E-posta",
    address: "Adres",
    birthDate: "Doğum Tarihi",
    notes: "Notlar",
    cancel: "Vazgeç",
    saving: "Kaydediliyor...",
    requiredFields: "Ad, soyad ve e-posta alanları zorunludur.",
    invalidEmail: "Geçerli bir e-posta adresi girin.",
    saveFailed: "Müşteri kaydedilemedi.",
    createSuccess: "Müşteri eklendi.",
    updateSuccess: "Müşteri güncellendi.",
    statusUpdateFailed: "Müşteri durumu güncellenemedi.",
    deactivated: "Müşteri pasife alındı.",
    activated: "Müşteri aktif edildi.",
    inviteEmailRequired: "Bu müşteri için geçerli bir e-posta adresi gerekli.",
    inviteFailed: "Davet gönderilirken bir hata oluştu.",
    inviteSuccess: "Hesap daveti gönderildi.",
    active: "Aktif",
    inactive: "Pasif",
    createdAt: "Oluşturulma",
    accountActive: "Hesap aktif",
    accountMissing: "Hesap oluşturulmamış",
    actions: "Müşteri işlemleri",
    appointments: "Randevular",
    sending: "Gönderiliyor...",
    resendInvite: "Daveti Yeniden Gönder",
    sendInvite: "Hesap Daveti Gönder",
    edit: "Düzenle",
    updating: "Güncelleniyor...",
    deactivate: "Pasife Al",
    activate: "Aktif Et",
    activeSection: "Aktif Müşteriler",
    inactiveSection: "Pasif Müşteriler",
    backToClients: "Müşterilere dön",
    appointmentDescription: "Bu müşteriye ait randevu kayıtları.",
    activeClient: "Aktif müşteri",
    inactiveClient: "Pasif müşteri",
    upcomingAppointments: "Yaklaşan Randevular",
    noUpcomingAppointments: "Bu müşteri için yaklaşan randevu bulunmuyor.",
    pastAndCancelledAppointments: "Geçmiş ve İptal Edilen Randevular",
    noPastOrCancelledAppointments:
      "Bu müşteri için geçmiş veya iptal edilmiş randevu bulunmuyor.",
  },
  appointments: {
    title: "Randevular",
    dayDescription: "Seçilen tarihe ait günlük randevu listesi.",
    allDescription: "Son 3 aydaki randevuları görüntüleyin.",
    add: "Randevu Ekle",
    today: "Bugün",
    tomorrow: "Yarın",
    allAppointments: "Tüm Randevular",
    allServices: "Tüm hizmetler",
    allStaff: "Tüm personeller",
    emptyDay: "Seçilen tarih için randevu bulunmuyor.",
    emptyAll: "Son 3 ay için randevu bulunmuyor.",
    loadMore: "Daha fazla göster",
    createSuccess: "Randevu oluşturuldu.",
    updateSuccess: "Randevu güncellendi.",
    cancelFailed: "Randevu iptal edilemedi.",
    cancelSuccess: "Randevu iptal edildi.",
    editTitle: "Randevuyu Düzenle",
    createTitle: "Randevu Ekle",
    editDescription: "Seçili randevu bilgilerini güncelleyin.",
    createDescription: "Seçili tarih için manuel olarak randevu oluşturun.",
    close: "Kapat",
    updateSubmit: "Randevuyu Güncelle",
    createSubmit: "Randevu Oluştur",
    clientRequired: "Müşteri seçimi zorunludur.",
    serviceRequired: "Hizmet seçimi zorunludur.",
    staffRequired: "Personel seçimi zorunludur.",
    dateRequired: "Tarih zorunludur.",
    slotRequired: "Müsait bir saat seçmeniz zorunludur.",
    loadSlotsFailed: "Müsait saatler yüklenemedi.",
    updateFailed: "Randevu güncellenemedi.",
    createFailed: "Randevu oluşturulamadı.",
    client: "Müşteri",
    selectClient: "Müşteri seçin",
    service: "Hizmet",
    selectService: "Hizmet seçin",
    staff: "Personel",
    selectStaff: "Personel seçin",
    autoSelectedStaff: (name) => `${name} otomatik seçildi.`,
    noEligibleStaff: "Bu hizmet için uygun personel bulunamadı.",
    date: "Tarih",
    availableSlots: "Müsait Saatler",
    selectRequiredForSlots: "Saatleri görmek için tarih, hizmet ve personel seçin.",
    loadingSlots: "Müsait saatler yükleniyor...",
    noSlots: "Seçilen tarih için uygun saat bulunamadı.",
    notes: "Notlar",
    optionalNotes: "İsteğe bağlı notlar",
    saving: "Kaydediliyor...",
    time: "Saat",
    duration: "Süre",
    status: "Durum",
    active: "Aktif",
    inactive: "Pasif",
    durationText: (minutes) => `${minutes} dk`,
    edit: "Düzenle",
    cancelling: "İptal ediliyor...",
    cancel: "İptal et",
    noNotes: "-",
    statusLabels: {
      confirmed: "Onaylandı",
      completed: "Tamamlandı",
      cancelled: "İptal Edildi",
      no_show: "Gelmedi",
    },
    lifecycle: {
      title: "Randevu durumu",
      completed: "Tamamlandı",
      noShow: "Gelmedi",
      completedConfirm:
        "Bu randevuyu tamamlandı olarak işaretlemek istediğinize emin misiniz?",
      noShowConfirm: "Bu müşteriyi gelmedi olarak işaretlemek istediğinize emin misiniz?",
      completedSuccess: "Randevu tamamlandı olarak işaretlendi.",
      noShowSuccess: "Randevu gelmedi olarak işaretlendi.",
      failed: "Randevu durumu güncellenemedi.",
      dismiss: "Vazgeç",
      updating: "Güncelleniyor...",
    },
  },
};

const en: AdminMessages = {
  brandSuffix: "Admin",
  panel: "Panel",
  menu: "Menu",
  openMenu: "Open admin menu",
  closeMenu: "Close admin menu",
  close: "Close menu",
  version: "v0.1 (MVP)",
  nav: {
    dashboard: "Dashboard",
    services: "Services",
    staff: "Staff",
    clients: "Clients",
    appointments: "Appointments",
    notifications: "Notifications",
    hours: "Working Hours",
    settings: "Settings",
  },
  logout: "Log Out",
  loggingOut: "Logging out...",
  logoutFailed: "An error occurred while logging out.",
  userMenuOpen: "Open user menu",
  dashboard: {
    title: "Dashboard",
    description: "View your daily appointment summary and quick links.",
    newAppointment: "New Appointment",
    today: "Today",
    tomorrow: "Tomorrow",
    upcomingAppointments: "Upcoming Appointments",
    todayCountDescription: "Non-cancelled appointments for today",
    tomorrowCountDescription: "Non-cancelled appointments for tomorrow",
    upcomingCountDescription:
      "Total non-cancelled appointments from now onward",
    todayAppointments: "Today's Appointments",
    tomorrowAppointments: "Tomorrow's Appointments",
    noTodayAppointments: "No appointments found for today.",
    noTomorrowAppointments: "No appointments found for tomorrow.",
    statusLabels: {
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
      no_show: "No-show",
    },
  },
  services: {
    createTitle: "Create New Service",
    nameLabel: "Service Name:",
    durationLabel: "Duration (minutes):",
    durationText: (minutes) => `Duration: ${minutes} minutes`,
    createButton: "Create Service",
    creating: "Creating...",
    nameRequired: "Service name is required.",
    durationInvalid: "Duration must be between 1 and 600 minutes.",
    createFailed: "Service could not be created.",
    createSuccess: "Service was created successfully.",
    genericError: "An error occurred.",
    emptyTitle: "No services found yet.",
    emptyDescription: "Your first service will be listed here after you create it.",
    deleteFailed: "Service could not be deleted.",
    deleteSuccess: "Service was deleted successfully.",
    statusUpdateFailed: "Service status could not be updated.",
    statusUpdateSuccess: "Service status was updated successfully.",
    active: "Active",
    passive: "Inactive",
    delete: "Delete",
    deleting: "Deleting...",
    updating: "Updating...",
    deactivate: "Deactivate",
    activate: "Activate",
  },
  settings: {
    title: "Settings",
    description: "Manage your business profile and public booking link.",
    publicBookingOnly:
      "Only the public booking URL setup is managed on this card.",
    slugLabel: "Public Booking Link",
    slugHelp:
      "Customers can book through this link without creating an account.",
    preview: "Preview",
    save: "Save",
    saving: "Saving...",
    updateSuccess: "Public booking link was updated.",
    updateFailed: "Public booking link could not be updated.",
    defaultBusinessName: (orgIdPrefix) => `Business ${orgIdPrefix}`,
  },
  notifications: {
    title: "Notifications",
    description: "View the latest 100 notification delivery logs.",
    emptyTitle: "No notification logs found yet.",
    attempt: (attemptNumber) => `Attempt #${attemptNumber}`,
    recipient: "Recipient",
    channel: "Channel",
    provider: "Provider",
    providerMessageId: "Provider Message ID",
    error: "Error",
    typeLabels: {
      booking_confirmation: "Booking Confirmation",
      appointment_reminder: "Appointment Reminder",
      business_booking_notification: "New Booking Notification",
    },
    statusLabels: {
      sent: "Sent",
      failed: "Failed",
      skipped: "Skipped",
    },
    channelLabels: {
      email: "Email",
    },
    providerLabels: {
      resend: "Resend",
    },
  },
  hours: {
    open: "Open",
    closed: "Closed",
    active: "Active",
    startTime: "Start time",
    endTime: "End time",
    saving: "Saving...",
    save: "Save Working Hours",
    requiredTimes: (dayName) => `${dayName}: start and end time are required.`,
    invalidRange: (dayName) => `${dayName}: start time must be before end time.`,
    saveFailed: "Working hours could not be saved.",
    saveSuccess: "Working hours were updated successfully.",
    weekDays: [
      { day_of_week: 1, day_name: "Monday" },
      { day_of_week: 2, day_name: "Tuesday" },
      { day_of_week: 3, day_name: "Wednesday" },
      { day_of_week: 4, day_name: "Thursday" },
      { day_of_week: 5, day_name: "Friday" },
      { day_of_week: 6, day_name: "Saturday" },
      { day_of_week: 7, day_name: "Sunday" },
    ],
  },
  staff: {
    title: "Staff",
    description: "Manage staff members and the services they provide.",
    nameRequired: "Staff name is required.",
    serviceRequired: "You must select at least one service.",
    saveFailed: "Staff member could not be saved.",
    createSuccess: "Staff member was created successfully.",
    updateSuccess: "Staff member was updated successfully.",
    statusUpdateFailed: "Staff status could not be updated.",
    deactivated: "Staff member was deactivated.",
    activated: "Staff member was activated.",
    deleteFailed: "Staff member could not be deleted.",
    deleteSuccess: "Staff member was deleted.",
    updateButton: "Update Staff Member",
    createButton: "Create Staff Member",
    editTitle: "Edit staff member",
    createTitle: "Create new staff member",
    formDescription: "Select the services this staff member can provide.",
    nameLabel: "Staff name",
    namePlaceholder: "Example: Emma",
    servicesLabel: "Assigned services",
    durationText: (minutes) => `${minutes} min`,
    inactiveService: "Inactive service",
    cancel: "Cancel",
    saving: "Saving...",
    activeStaff: "Active staff",
    inactiveStaff: "Inactive staff",
    noServiceAssigned: "No service assigned",
    edit: "Edit",
    updating: "Updating...",
    deactivate: "Deactivate",
    activate: "Activate",
    deleting: "Deleting...",
    delete: "Delete",
    emptyTitle: "No staff members found yet.",
    emptyDescription:
      "Active and inactive staff members will be listed here after you add them.",
    activeSection: "Active Staff",
    inactiveSection: "Inactive Staff",
  },
  clients: {
    title: "Clients",
    description: "Manage client records.",
    newClient: "New Client",
    searchPlaceholder: "Search by first name, last name, phone or email",
    emptyTitle: "No clients found yet.",
    noResults: "No results found.",
    createTitle: "New Client",
    editTitle: "Edit Client",
    addClient: "Add Client",
    saveChanges: "Save Changes",
    closeForm: "Close client form",
    close: "Close",
    formDescription: "Enter all client details.",
    firstName: "First Name",
    lastName: "Last Name",
    phone: "Phone",
    email: "Email",
    address: "Address",
    birthDate: "Birth Date",
    notes: "Notes",
    cancel: "Cancel",
    saving: "Saving...",
    requiredFields: "First name, last name and email are required.",
    invalidEmail: "Enter a valid email address.",
    saveFailed: "Client could not be saved.",
    createSuccess: "Client was added.",
    updateSuccess: "Client was updated.",
    statusUpdateFailed: "Client status could not be updated.",
    deactivated: "Client was deactivated.",
    activated: "Client was activated.",
    inviteEmailRequired: "A valid email address is required for this client.",
    inviteFailed: "An error occurred while sending the invitation.",
    inviteSuccess: "Account invitation was sent.",
    active: "Active",
    inactive: "Inactive",
    createdAt: "Created",
    accountActive: "Account active",
    accountMissing: "Account not created",
    actions: "Client actions",
    appointments: "Appointments",
    sending: "Sending...",
    resendInvite: "Resend Invitation",
    sendInvite: "Send Account Invitation",
    edit: "Edit",
    updating: "Updating...",
    deactivate: "Deactivate",
    activate: "Activate",
    activeSection: "Active Clients",
    inactiveSection: "Inactive Clients",
    backToClients: "Back to clients",
    appointmentDescription: "Appointment records for this client.",
    activeClient: "Active client",
    inactiveClient: "Inactive client",
    upcomingAppointments: "Upcoming Appointments",
    noUpcomingAppointments: "No upcoming appointments found for this client.",
    pastAndCancelledAppointments: "Past and Cancelled Appointments",
    noPastOrCancelledAppointments:
      "No past or cancelled appointments found for this client.",
  },
  appointments: {
    title: "Appointments",
    dayDescription: "Daily appointment list for the selected date.",
    allDescription: "View appointments from the last 3 months.",
    add: "Add Appointment",
    today: "Today",
    tomorrow: "Tomorrow",
    allAppointments: "All Appointments",
    allServices: "All services",
    allStaff: "All staff",
    emptyDay: "No appointments found for the selected date.",
    emptyAll: "No appointments found for the last 3 months.",
    loadMore: "Show more",
    createSuccess: "Appointment was created.",
    updateSuccess: "Appointment was updated.",
    cancelFailed: "Appointment could not be cancelled.",
    cancelSuccess: "Appointment was cancelled.",
    editTitle: "Edit Appointment",
    createTitle: "Add Appointment",
    editDescription: "Update the selected appointment details.",
    createDescription: "Create an appointment manually for the selected date.",
    close: "Close",
    updateSubmit: "Update Appointment",
    createSubmit: "Create Appointment",
    clientRequired: "Client selection is required.",
    serviceRequired: "Service selection is required.",
    staffRequired: "Staff selection is required.",
    dateRequired: "Date is required.",
    slotRequired: "You must select an available time.",
    loadSlotsFailed: "Available times could not be loaded.",
    updateFailed: "Appointment could not be updated.",
    createFailed: "Appointment could not be created.",
    client: "Client",
    selectClient: "Select client",
    service: "Service",
    selectService: "Select service",
    staff: "Staff",
    selectStaff: "Select staff",
    autoSelectedStaff: (name) => `${name} was selected automatically.`,
    noEligibleStaff: "No eligible staff found for this service.",
    date: "Date",
    availableSlots: "Available Times",
    selectRequiredForSlots: "Select date, service and staff to see available times.",
    loadingSlots: "Loading available times...",
    noSlots: "No available time found for the selected date.",
    notes: "Notes",
    optionalNotes: "Optional notes",
    saving: "Saving...",
    time: "Time",
    duration: "Duration",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    durationText: (minutes) => `${minutes} min`,
    edit: "Edit",
    cancelling: "Cancelling...",
    cancel: "Cancel",
    noNotes: "-",
    statusLabels: {
      confirmed: "Confirmed",
      completed: "Completed",
      cancelled: "Cancelled",
      no_show: "No-show",
    },
    lifecycle: {
      title: "Appointment status",
      completed: "Completed",
      noShow: "No-show",
      completedConfirm: "Are you sure you want to mark this appointment as completed?",
      noShowConfirm: "Are you sure you want to mark this client as no-show?",
      completedSuccess: "Appointment was marked as completed.",
      noShowSuccess: "Appointment was marked as no-show.",
      failed: "Appointment status could not be updated.",
      dismiss: "Cancel",
      updating: "Updating...",
    },
  },
};

export function getAdminMessages(locale: Locale = defaultLocale) {
  return locale === "en" ? en : tr;
}

export function getAdminHref(path = "", localePrefix?: Locale) {
  return `${localePrefix ? `/${localePrefix}` : ""}/admin${path}`;
}
