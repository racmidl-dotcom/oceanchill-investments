export type CountryCode = "BF" | "CI" | "CM" | "TG";

export interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  dial: string;
  currency: "XOF" | "XAF";
  operators: string[];
}

export const COUNTRIES: Country[] = [
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", dial: "+226", currency: "XOF", operators: ["Orange BF", "Moov BF"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", dial: "+225", currency: "XOF", operators: ["Orange CI", "MTN CI"] },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", dial: "+237", currency: "XAF", operators: ["Orange CM", "MTN CM"] },
  { code: "TG", name: "Togo", flag: "🇹🇬", dial: "+228", currency: "XOF", operators: ["Togocel", "Moov TG"] },
];

export const getCountry = (code?: string | null): Country =>
  COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];

export const formatMoney = (amount: number, currency: "XOF" | "XAF" = "XOF") =>
  `${currency} ${Math.round(amount).toLocaleString("fr-FR")}`;

export const phoneToEmail = (phone: string) =>
  phone.replace(/[\s\-()+ ]/g, "") + "@refrigerateur.app";
