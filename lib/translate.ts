/**
 * Auto-translation utility using the MyMemory API.
 * Free tier — no API key required (up to ~5 000 words/day).
 * https://mymemory.translated.net/doc/spec.php
 *
 * Source language is assumed to be English, which covers most
 * opportunity descriptions entered by coordinators.
 */

export interface OpportunityTranslation {
    name: string;
    description: string;
}

/** Translate a single string from English to the target locale. */
async function translateOne(text: string, to: string): Promise<string> {
    if (!text.trim()) return text;
    try {
        const url =
            `https://api.mymemory.translated.net/get` +
            `?q=${encodeURIComponent(text)}&langpair=en|${to}`;
        const res = await fetch(url);
        if (!res.ok) return text;
        const data = await res.json();
        const translated: string = data?.responseData?.translatedText ?? '';
        // MyMemory sometimes returns the original on failure
        return translated && translated !== text ? translated : text;
    } catch {
        return text;
    }
}

/**
 * Translate an opportunity's name and description to the given locale.
 * Returns the original strings unchanged when locale is 'en'.
 */
export async function translateOpportunity(
    name: string,
    description: string | null,
    toLocale: string,
): Promise<OpportunityTranslation> {
    if (toLocale === 'en') {
        return { name, description: description ?? '' };
    }
    const [translatedName, translatedDesc] = await Promise.all([
        translateOne(name, toLocale),
        description ? translateOne(description, toLocale) : Promise.resolve(''),
    ]);
    return { name: translatedName, description: translatedDesc };
}
