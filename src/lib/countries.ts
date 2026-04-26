export type CountryCode = "BF" | "BJ" | "CI" | "CM" | "CD" | "NE" | "SN" | "TG";

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  dial: string;
  currency: "XOF" | "XAF" | "CDF";
  operators: string[];
}

export const COUNTRIES: Country[] = [
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", dial: "+226", currency: "XOF", operators: ["Orange BF", "Moov BF"] },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", dial: "+229", currency: "XOF", operators: ["MTN BJ", "Moov BJ"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", dial: "+225", currency: "XOF", operators: ["Orange CI", "MTN CI", "Moov CI", "Wave CI"] },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", dial: "+237", currency: "XAF", operators: ["MTN CM", "Orange CM"] },
  { code: "CD", name: "RD Congo", flag: "🇨🇩", dial: "+243", currency: "CDF", operators: ["Orange Money", "Airtel Money"] },
  { code: "NE", name: "Niger", flag: "🇳🇪", dial: "+227", currency: "XOF", operators: ["NITA", "Moov NE", "Zamani Cash"] },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", dial: "+221", currency: "XOF", operators: ["Orange Money", "Wave"] },
  { code: "TG", name: "Togo", flag: "🇹🇬", dial: "+228", currency: "XOF", operators: ["T-Money", "Moov TG"] },
];

export const getCountry = (code?: string | null): Country =>
  COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];

export const formatMoney = (amount: number, currency: "XOF" | "XAF" | "CDF" = "XOF") =>
  `${currency} ${Math.round(amount).toLocaleString("fr-FR")}`;

export const phoneToEmail = (phone: string) =>
  phone.replace(/[\s\-()+ ]/g, "") + "@refrigerateur.app";
