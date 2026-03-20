/**
 * Translates a backend role name using the `roles` translation namespace.
 *
 * Usage:
 *   const tRoles = useTranslations('roles');
 *   translateRole(user.role?.name, tRoles);
 */
export function translateRole(
    roleName: string | undefined | null,
    t: { (key: string): string; has(key: string): boolean },
): string {
    if (!roleName) return t('noRole');
    const key = roleName.toLowerCase();
    if (t.has(key)) return t(key);
    return roleName;
}
