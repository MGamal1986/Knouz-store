export function formatPrice(amount: number, locale: string): string {
  if (locale === "ar") {
    return `${amount.toLocaleString("ar-EG", { maximumFractionDigits: 0 })} جنيه`;
  }
  return `EGP ${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatDate(date: Date | string, locale: string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
