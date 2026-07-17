export const API_ERROR_MESSAGES = {
  unauthorized: "Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.",
  forbidden: "Bu kaynağa erişim yetkiniz bulunmuyor.",
  notFound: "İstenen kayıt bulunamadı.",
  conflict: "Seçtiğiniz saat artık müsait değil.",
  generic: "İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.",
  network:
    "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
} as const;

