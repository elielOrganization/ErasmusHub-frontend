export type RcGender = 'male' | 'female';

export type RcError =
    | 'invalidRcFormat'
    | 'invalidRcChecksum'
    | 'rcGenderMismatch';

export type RcSuccess = {
    birthDate: string;   // ISO: YYYY-MM-DD
    isMinor: boolean;
    gender: RcGender;
};

export type RcResult = { error: RcError } | RcSuccess;

/**
 * Validates and parses a Czech/Slovak Rodné číslo.
 *
 * Format: YYMMDD/XXXX or YYMMDDXXX (with/without slash, 9 or 10 digits).
 *
 * Length rules:
 *   - 9 digits (cleaned) → old format, year always 1900+yy (pre-1954 births)
 *   - 10 digits (cleaned) → yy ≥ 54: 1900+yy  |  yy < 54: 2000+yy
 *
 * Checksum (10-digit only):
 *   The full 10-digit number must be divisible by 11.
 *   Historical exception (1954–1985): if remainder is 10 and the last digit
 *   is '0', the number is still valid (the trailing 0 was used as a workaround).
 *
 * Month encoding:
 *   +0  → male  (standard)
 *   +20 → male  (overflow since 2004, when same-day quota was exhausted)
 *   +50 → female (standard)
 *   +70 → female (overflow since 2004)
 */
export function parseRodneCislo(
    rc: string,
    gender: RcGender | '' = ''
): RcResult {
    const cleaned = rc.replace(/[/ ]/g, '');

    if (!/^\d{9,10}$/.test(cleaned)) {
        return { error: 'invalidRcFormat' };
    }

    const yy = parseInt(cleaned.slice(0, 2), 10);
    let mm  = parseInt(cleaned.slice(2, 4), 10);
    const dd = parseInt(cleaned.slice(4, 6), 10);
    const isOldFormat = cleaned.length === 9;

    // ── Checksum (10-digit only) ──────────────────────────────────────────
    if (!isOldFormat) {
        const num       = parseInt(cleaned, 10);
        const remainder = num % 11;
        // Historical exception: remainder 10 with a trailing '0' is valid
        const historicException = remainder === 10 && cleaned[9] === '0';
        if (remainder !== 0 && !historicException) {
            return { error: 'invalidRcChecksum' };
        }
    }

    // ── Gender from month encoding ────────────────────────────────────────
    let rcGender: RcGender;
    if      (mm > 70) { rcGender = 'female'; mm -= 70; }
    else if (mm > 50) { rcGender = 'female'; mm -= 50; }
    else if (mm > 20) { rcGender = 'male';   mm -= 20; }
    else              { rcGender = 'male'; }

    if (gender && rcGender !== gender) {
        return { error: 'rcGenderMismatch' };
    }

    if (mm < 1 || mm > 12) {
        return { error: 'invalidRcFormat' };
    }

    // ── Full year ─────────────────────────────────────────────────────────
    // Old format (9 digits) was only issued before 1954 → always 1900+yy.
    // New format (10 digits): yy ≥ 54 means 1954–1999, yy < 54 means 2000–2053.
    const year = isOldFormat
        ? 1900 + yy
        : yy >= 54 ? 1900 + yy : 2000 + yy;

    // ── Date validation ───────────────────────────────────────────────────
    const maxDay = new Date(year, mm, 0).getDate(); // day 0 of next month = last day of mm
    if (dd < 1 || dd > maxDay) {
        return { error: 'invalidRcFormat' };
    }

    const birthDate = `${year}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;

    // ── Age (determines is_minor) ─────────────────────────────────────────
    const today = new Date();
    const birth = new Date(year, mm - 1, dd);
    let age = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;

    return { birthDate, isMinor: age < 18, gender: rcGender };
}
