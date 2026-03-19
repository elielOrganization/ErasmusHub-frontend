/**
 * Returns the flagcdn.com URL for a given country ISO 3166-1 alpha-2 code.
 * The DB stores countries as 2-letter codes (DE, US, BR, CZ, ES, IT, MX, AR …).
 */
export function getCountryFlagUrl(code: string | null | undefined, width: number = 20): string | null {
    if (!code || code.trim().length !== 2) return null;
    return `https://flagcdn.com/w${width}/${code.trim().toLowerCase()}.png`;
}
