/**
 * Auto-translation utility using the unofficial Google Translate endpoint.
 * No API key required. Source language is auto-detected (sl=auto),
 * so it works regardless of what language the content was written in.
 *
 * Target is always the active page locale (en / es / cs).
 */

export interface OpportunityTranslation {
    name: string;
    description: string;
}

/** BCP-47 codes recognised by Google Translate */
const LOCALE_TO_GTAG: Record<string, string> = {
    en: 'en',
    es: 'es',
    cs: 'cs',
};

/**
 * Translate a single string to the target language.
 * Source is auto-detected — works from any language.
 */
async function translateOne(text: string, to: string): Promise<string> {
    if (!text.trim()) return text;
    const tl = LOCALE_TO_GTAG[to] ?? to;
    try {
        const url =
            `https://translate.googleapis.com/translate_a/single` +
            `?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        if (!res.ok) return text;
        // Response shape: [[[translatedChunk, originalChunk], ...], ...]
        const data = await res.json();
        const translated: string = (data?.[0] as unknown[][])
            ?.map((chunk) => chunk?.[0])
            .join('') ?? '';
        return translated || text;
    } catch {
        return text;
    }
}

/**
 * Translate an opportunity's name and description to the active page locale.
 * Auto-detects the source language, so content written in any language
 * will be correctly translated to en / es / cs.
 */
export async function translateOpportunity(
    name: string,
    description: string | null,
    toLocale: string,
): Promise<OpportunityTranslation> {
    const [translatedName, translatedDesc] = await Promise.all([
        translateOne(name, toLocale),
        description ? translateOne(description, toLocale) : Promise.resolve(''),
    ]);
    return { name: translatedName, description: translatedDesc };
}
