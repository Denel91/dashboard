// Browser interni delle app (Instagram, Facebook, Messenger, TikTok…):
// Google blocca l'accesso al loro interno (errore 403 disallowed_useragent).
// WhatsApp e i Messaggi su iPhone aprono invece Safari, quindi non serve
// nulla. Deciso il 9 novembre 2026 (US-02): la pagina d'invito riconosce
// questi browser e chiede di aprire il link in Safari o Chrome.

const IMPRONTE = [
  /Instagram/i,
  /FBAN|FBAV|FB_IAB|FBIOS/, // Facebook
  /Messenger/i,
  /\bLine\//,
  /TikTok|musical_ly|BytedanceWebview/i,
  /Snapchat/i,
  /LinkedInApp/i,
];

export function eBrowserInterno(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return IMPRONTE.some((impronta) => impronta.test(userAgent));
}
