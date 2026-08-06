import { defaultLocale, type Locale } from "./constants";

export type AuthMessages = {
  adminLoginTitle: string;
  adminLoginDescription: string;
  customerLoginTitle: string;
  customerLoginDescription: string;
  email: string;
  password: string;
  emailPlaceholder: string;
  passwordPlaceholder: string;
  loginButton: string;
  loggingIn: string;
  forgotPassword: string;
  forgotPasswordTitle: string;
  forgotPasswordDescription: string;
  resetPasswordTitle: string;
  resetPasswordDescription: string;
  newPassword: string;
  newPasswordConfirm: string;
  newPasswordPlaceholder: string;
  newPasswordConfirmPlaceholder: string;
  verifyLink: string;
  updatingPassword: string;
  updatePassword: string;
  sendResetLink: string;
  sending: string;
  back: string;
  backToLogin: string;
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  newPasswordRequired: string;
  newPasswordMinLength: string;
  passwordConfirmRequired: string;
  passwordsDoNotMatch: string;
  turnstileRequired: string;
  turnstileFailed: string;
  turnstileLoadFailed: string;
  turnstilePending: string;
  loginFailed: string;
  resetFailed: string;
  resetRequestSuccess: string;
  resetLinkInvalid: string;
  passwordWeak: string;
  passwordSame: string;
  passwordUpdateFailed: string;
  passwordUpdateSuccess: string;
  networkError: string;
};

const tr: AuthMessages = {
  adminLoginTitle: "İşletme Girişi",
  adminLoginDescription: "Yönetim paneline erişmek için hesabınızla giriş yapın.",
  customerLoginTitle: "Müşteri Girişi",
  customerLoginDescription:
    "İşletmede kayıtlı müşteri hesabınızla giriş yapın.",
  email: "E-posta",
  password: "Şifre",
  emailPlaceholder: "ornek@artexo.com",
  passwordPlaceholder: "Şifreniz",
  loginButton: "Giriş Yap",
  loggingIn: "Giriş yapılıyor...",
  forgotPassword: "Şifremi unuttum",
  forgotPasswordTitle: "Şifremi Unuttum",
  forgotPasswordDescription:
    "E-posta adresinizi girin, hesabınız varsa sıfırlama bağlantısı gönderelim.",
  resetPasswordTitle: "Yeni Şifre Oluştur",
  resetPasswordDescription: "Hesabınız için yeni şifre belirleyin.",
  newPassword: "Yeni Şifre",
  newPasswordConfirm: "Yeni Şifre Tekrar",
  newPasswordPlaceholder: "En az 8 karakter",
  newPasswordConfirmPlaceholder: "Şifrenizi tekrar girin",
  verifyLink: "Bağlantı doğrulanıyor...",
  updatingPassword: "Şifre güncelleniyor...",
  updatePassword: "Şifreyi Güncelle",
  sendResetLink: "Sıfırlama Bağlantısı Gönder",
  sending: "Gönderiliyor...",
  back: "Geri",
  backToLogin: "Giriş ekranına dön",
  emailRequired: "E-posta adresinizi girin.",
  emailInvalid: "Geçerli bir e-posta adresi girin.",
  passwordRequired: "Şifrenizi girin.",
  newPasswordRequired: "Yeni şifrenizi girin.",
  newPasswordMinLength: "Şifre en az 8 karakter olmalıdır.",
  passwordConfirmRequired: "Yeni şifrenizi tekrar girin.",
  passwordsDoNotMatch: "Şifreler eşleşmiyor.",
  turnstileRequired: "Güvenlik doğrulamasının tamamlanmasını bekleyin.",
  turnstileFailed: "Güvenlik doğrulaması başarısız oldu. Lütfen tekrar deneyin.",
  turnstileLoadFailed: "Güvenlik doğrulaması yüklenemedi.",
  turnstilePending:
    "Devam etmek için güvenlik doğrulamasının tamamlanmasını bekleyin.",
  loginFailed: "Giriş yapılırken bir hata oluştu.",
  resetFailed: "Şifre sıfırlama bağlantısı gönderilemedi.",
  resetRequestSuccess:
    "Eğer bu e-posta sistemde kayıtlıysa birkaç dakika içinde şifre sıfırlama bağlantısı gelir. Gelmezse spam klasörünü kontrol edin veya işletmeden hesap daveti isteyin.",
  resetLinkInvalid:
    "Şifre belirleme bağlantısı geçersiz veya süresi dolmuş olabilir.",
  passwordWeak:
    "Şifre güvenlik kurallarını karşılamıyor. Daha güçlü bir şifre belirleyin.",
  passwordSame: "Yeni şifre eski şifrenizden farklı olmalıdır.",
  passwordUpdateFailed: "Şifre güncellenirken bir hata oluştu.",
  passwordUpdateSuccess:
    "Şifreniz başarıyla güncellendi. Giriş ekranına yönlendiriliyorsunuz.",
  networkError:
    "Sunucuya ulaşılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
};

const en: AuthMessages = {
  adminLoginTitle: "Business Login",
  adminLoginDescription: "Sign in with your account to access the dashboard.",
  customerLoginTitle: "Customer Login",
  customerLoginDescription:
    "Sign in with your customer account registered by the business.",
  email: "Email",
  password: "Password",
  emailPlaceholder: "example@artexo.com",
  passwordPlaceholder: "Your password",
  loginButton: "Sign In",
  loggingIn: "Signing in...",
  forgotPassword: "Forgot password",
  forgotPasswordTitle: "Forgot Password",
  forgotPasswordDescription:
    "Enter your email address. If your account exists, we will send a reset link.",
  resetPasswordTitle: "Create New Password",
  resetPasswordDescription: "Set a new password for your account.",
  newPassword: "New Password",
  newPasswordConfirm: "Confirm New Password",
  newPasswordPlaceholder: "At least 8 characters",
  newPasswordConfirmPlaceholder: "Enter your password again",
  verifyLink: "Verifying link...",
  updatingPassword: "Updating password...",
  updatePassword: "Update Password",
  sendResetLink: "Send Reset Link",
  sending: "Sending...",
  back: "Back",
  backToLogin: "Back to login",
  emailRequired: "Enter your email address.",
  emailInvalid: "Enter a valid email address.",
  passwordRequired: "Enter your password.",
  newPasswordRequired: "Enter your new password.",
  newPasswordMinLength: "Password must be at least 8 characters.",
  passwordConfirmRequired: "Enter your new password again.",
  passwordsDoNotMatch: "Passwords do not match.",
  turnstileRequired: "Please wait for the security verification to complete.",
  turnstileFailed: "Security verification failed. Please try again.",
  turnstileLoadFailed: "Security verification could not be loaded.",
  turnstilePending:
    "Please wait for the security verification to complete before continuing.",
  loginFailed: "An error occurred while signing in.",
  resetFailed: "The password reset link could not be sent.",
  resetRequestSuccess:
    "If this email is registered, a password reset link will arrive in a few minutes. If it does not, check spam or request an account invitation from the business.",
  resetLinkInvalid:
    "The password setup link may be invalid or expired.",
  passwordWeak:
    "The password does not meet security requirements. Choose a stronger password.",
  passwordSame: "The new password must be different from your old password.",
  passwordUpdateFailed: "An error occurred while updating the password.",
  passwordUpdateSuccess:
    "Your password has been updated. Redirecting you to the login screen.",
  networkError:
    "The server could not be reached. Check your internet connection and try again.",
};

export function getAuthMessages(locale: Locale = defaultLocale) {
  return locale === "en" ? en : tr;
}

export function getLocalizedAuthHref(path: string, locale?: Locale) {
  return `${locale ? `/${locale}` : ""}${path}`;
}
