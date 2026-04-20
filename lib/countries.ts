export interface Country {
    code: string; // ISO 3166-1 alpha-2
    en: string;
    es: string;
    cs: string;
}

export const COUNTRIES: Country[] = [
    { code: "AL", en: "Albania", es: "Albania", cs: "Albánie" },
    { code: "AD", en: "Andorra", es: "Andorra", cs: "Andorra" },
    { code: "AT", en: "Austria", es: "Austria", cs: "Rakousko" },
    { code: "BE", en: "Belgium", es: "Bélgica", cs: "Belgie" },
    { code: "BA", en: "Bosnia and Herzegovina", es: "Bosnia y Herzegovina", cs: "Bosna a Hercegovina" },
    { code: "BG", en: "Bulgaria", es: "Bulgaria", cs: "Bulharsko" },
    { code: "HR", en: "Croatia", es: "Croacia", cs: "Chorvatsko" },
    { code: "CY", en: "Cyprus", es: "Chipre", cs: "Kypr" },
    { code: "CZ", en: "Czech Republic", es: "República Checa", cs: "Česká republika" },
    { code: "DK", en: "Denmark", es: "Dinamarca", cs: "Dánsko" },
    { code: "EE", en: "Estonia", es: "Estonia", cs: "Estonsko" },
    { code: "FI", en: "Finland", es: "Finlandia", cs: "Finsko" },
    { code: "FR", en: "France", es: "Francia", cs: "Francie" },
    { code: "DE", en: "Germany", es: "Alemania", cs: "Německo" },
    { code: "GR", en: "Greece", es: "Grecia", cs: "Řecko" },
    { code: "HU", en: "Hungary", es: "Hungría", cs: "Maďarsko" },
    { code: "IS", en: "Iceland", es: "Islandia", cs: "Island" },
    { code: "IE", en: "Ireland", es: "Irlanda", cs: "Irsko" },
    { code: "IT", en: "Italy", es: "Italia", cs: "Itálie" },
    { code: "XK", en: "Kosovo", es: "Kosovo", cs: "Kosovo" },
    { code: "LV", en: "Latvia", es: "Letonia", cs: "Lotyšsko" },
    { code: "LI", en: "Liechtenstein", es: "Liechtenstein", cs: "Lichtenštejnsko" },
    { code: "LT", en: "Lithuania", es: "Lituania", cs: "Litva" },
    { code: "LU", en: "Luxembourg", es: "Luxemburgo", cs: "Lucembursko" },
    { code: "MT", en: "Malta", es: "Malta", cs: "Malta" },
    { code: "MD", en: "Moldova", es: "Moldavia", cs: "Moldavsko" },
    { code: "MC", en: "Monaco", es: "Mónaco", cs: "Monako" },
    { code: "ME", en: "Montenegro", es: "Montenegro", cs: "Černá Hora" },
    { code: "NL", en: "Netherlands", es: "Países Bajos", cs: "Nizozemsko" },
    { code: "MK", en: "North Macedonia", es: "Macedonia del Norte", cs: "Severní Makedonie" },
    { code: "NO", en: "Norway", es: "Noruega", cs: "Norsko" },
    { code: "PL", en: "Poland", es: "Polonia", cs: "Polsko" },
    { code: "PT", en: "Portugal", es: "Portugal", cs: "Portugalsko" },
    { code: "RO", en: "Romania", es: "Rumanía", cs: "Rumunsko" },
    { code: "RS", en: "Serbia", es: "Serbia", cs: "Srbsko" },
    { code: "SK", en: "Slovakia", es: "Eslovaquia", cs: "Slovensko" },
    { code: "SI", en: "Slovenia", es: "Eslovenia", cs: "Slovinsko" },
    { code: "ES", en: "Spain", es: "España", cs: "Španělsko" },
    { code: "SE", en: "Sweden", es: "Suecia", cs: "Švédsko" },
    { code: "CH", en: "Switzerland", es: "Suiza", cs: "Švýcarsko" },
    { code: "TR", en: "Turkey", es: "Turquía", cs: "Turecko" },
    { code: "UA", en: "Ukraine", es: "Ucrania", cs: "Ukrajina" },
    { code: "GB", en: "United Kingdom", es: "Reino Unido", cs: "Spojené království" },
    { code: "VA", en: "Vatican City", es: "Ciudad del Vaticano", cs: "Vatikán" },
    { code: "AR", en: "Argentina", es: "Argentina", cs: "Argentina" },
    { code: "AU", en: "Australia", es: "Australia", cs: "Austrálie" },
    { code: "BR", en: "Brazil", es: "Brasil", cs: "Brazílie" },
    { code: "CA", en: "Canada", es: "Canadá", cs: "Kanada" },
    { code: "CL", en: "Chile", es: "Chile", cs: "Chile" },
    { code: "CN", en: "China", es: "China", cs: "Čína" },
    { code: "CO", en: "Colombia", es: "Colombia", cs: "Kolumbie" },
    { code: "EG", en: "Egypt", es: "Egipto", cs: "Egypt" },
    { code: "IN", en: "India", es: "India", cs: "Indie" },
    { code: "JP", en: "Japan", es: "Japón", cs: "Japonsko" },
    { code: "MX", en: "Mexico", es: "México", cs: "Mexiko" },
    { code: "MA", en: "Morocco", es: "Marruecos", cs: "Maroko" },
    { code: "NZ", en: "New Zealand", es: "Nueva Zelanda", cs: "Nový Zéland" },
    { code: "PE", en: "Peru", es: "Perú", cs: "Peru" },
    { code: "ZA", en: "South Africa", es: "Sudáfrica", cs: "Jihoafrická republika" },
    { code: "KR", en: "South Korea", es: "Corea del Sur", cs: "Jižní Korea" },
    { code: "TN", en: "Tunisia", es: "Túnez", cs: "Tunisko" },
    { code: "US", en: "United States", es: "Estados Unidos", cs: "Spojené státy" },
    { code: "UY", en: "Uruguay", es: "Uruguay", cs: "Uruguay" },
];

export function searchCountries(query: string, locale: string): Country[] {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const lang = locale === "cs" ? "cs" : locale === "es" ? "es" : "en";
    return COUNTRIES.filter(c =>
        c[lang].toLowerCase().includes(q) ||
        c.en.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    ).slice(0, 6);
}
