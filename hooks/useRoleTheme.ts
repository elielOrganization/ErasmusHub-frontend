import { useAuth } from '@/context/AuthContext';
import { useRolePreview } from '@/context/RolePreviewContext';

const adminTheme = {
    // Sidebar
    logoBg: 'bg-purple-50 dark:bg-purple-900/30',
    activeBg: 'bg-purple-50 dark:bg-purple-900/30',
    activeText: 'text-purple-700 dark:text-purple-300',
    activeIcon: 'text-purple-600 dark:text-purple-400',
    installBg: 'bg-purple-600',
    installHover: 'hover:bg-purple-700',
    // Header
    titleText: 'text-purple-600 dark:text-purple-400',
    titleHover: 'hover:text-purple-700 dark:hover:text-purple-300',
    // Dashboard gradient
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-purple-700',
    gradientSubtext: 'text-purple-100',
    // Spinner
    spinnerBorder: 'border-purple-600/20',
    spinnerTop: 'border-t-purple-600',
    // Action card hover
    actionHover: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    // UserDropdown gradient
    avatarFrom: '#9333ea',
    avatarTo: '#7e22ce',
    // Profile pill
    pillBg: 'bg-purple-100 dark:bg-purple-900/30',
    pillText: 'text-purple-700 dark:text-purple-300',
    // Language selector
    selectedBg: 'bg-purple-50 dark:bg-purple-900/30',
    selectedText: 'text-purple-700 dark:text-purple-300',
    borderLight: 'border-purple-100 dark:border-purple-800',
    // Dropdown hover
    hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-900/30',
    hoverText: 'hover:text-purple-600 dark:hover:text-purple-400',
    groupHoverIcon: 'group-hover:text-purple-600 dark:group-hover:text-purple-400',
    // General UI
    btnPrimary: 'bg-purple-600',
    btnPrimaryHover: 'hover:bg-purple-700',
    btnDisabled: 'bg-purple-400',
    focusRing: 'focus:ring-purple-200 dark:focus:ring-purple-800 focus:border-purple-400',
    softHover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30',
    accent: 'text-purple-600 dark:text-purple-400',
    accentHover: 'hover:text-purple-700 dark:hover:text-purple-300',
    accentBgHover: 'hover:bg-purple-50 dark:hover:bg-purple-900/30',
    accentBg: 'bg-purple-50 dark:bg-purple-900/30',
    accentText: 'text-purple-700 dark:text-purple-300',
    checkboxBg: 'bg-purple-600 border-purple-600',
    badgeBg: 'bg-purple-600',
    softBgHalf: 'bg-purple-50/30 dark:bg-purple-900/20',
    hoverSoftBgHalf: 'hover:bg-purple-50/30 dark:hover:bg-purple-900/20',
};

const studentTheme = {
    logoBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    activeBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    activeText: 'text-emerald-700 dark:text-emerald-300',
    activeIcon: 'text-emerald-600 dark:text-emerald-400',
    installBg: 'bg-emerald-600',
    installHover: 'hover:bg-emerald-700',
    titleText: 'text-emerald-600 dark:text-emerald-400',
    titleHover: 'hover:text-emerald-700 dark:hover:text-emerald-300',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-emerald-700',
    gradientSubtext: 'text-emerald-100',
    spinnerBorder: 'border-emerald-600/20',
    spinnerTop: 'border-t-emerald-600',
    actionHover: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    avatarFrom: '#059669',
    avatarTo: '#047857',
    pillBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    pillText: 'text-emerald-700 dark:text-emerald-300',
    selectedBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    selectedText: 'text-emerald-700 dark:text-emerald-300',
    borderLight: 'border-emerald-100 dark:border-emerald-800',
    hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
    hoverText: 'hover:text-emerald-600 dark:hover:text-emerald-400',
    groupHoverIcon: 'group-hover:text-emerald-600 dark:group-hover:text-emerald-400',
    btnPrimary: 'bg-emerald-600',
    btnPrimaryHover: 'hover:bg-emerald-700',
    btnDisabled: 'bg-emerald-400',
    focusRing: 'focus:ring-emerald-200 dark:focus:ring-emerald-800 focus:border-emerald-400',
    softHover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30',
    accent: 'text-emerald-600 dark:text-emerald-400',
    accentHover: 'hover:text-emerald-700 dark:hover:text-emerald-300',
    accentBgHover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/30',
    accentBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    accentText: 'text-emerald-700 dark:text-emerald-300',
    checkboxBg: 'bg-emerald-600 border-emerald-600',
    badgeBg: 'bg-emerald-600',
    softBgHalf: 'bg-emerald-50/30 dark:bg-emerald-900/20',
    hoverSoftBgHalf: 'hover:bg-emerald-50/30 dark:hover:bg-emerald-900/20',
};

const teacherTheme = {
    logoBg: 'bg-blue-50 dark:bg-blue-900/30',
    activeBg: 'bg-blue-50 dark:bg-blue-900/30',
    activeText: 'text-blue-700 dark:text-blue-300',
    activeIcon: 'text-blue-600 dark:text-blue-400',
    installBg: 'bg-blue-600',
    installHover: 'hover:bg-blue-700',
    titleText: 'text-blue-600 dark:text-blue-400',
    titleHover: 'hover:text-blue-700 dark:hover:text-blue-300',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-blue-700',
    gradientSubtext: 'text-blue-100',
    spinnerBorder: 'border-blue-600/20',
    spinnerTop: 'border-t-blue-600',
    actionHover: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    avatarFrom: '#3b82f6',
    avatarTo: '#1d4ed8',
    pillBg: 'bg-blue-100 dark:bg-blue-900/30',
    pillText: 'text-blue-700 dark:text-blue-300',
    selectedBg: 'bg-blue-50 dark:bg-blue-900/30',
    selectedText: 'text-blue-700 dark:text-blue-300',
    borderLight: 'border-blue-100 dark:border-blue-800',
    hoverBg: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
    hoverText: 'hover:text-blue-600 dark:hover:text-blue-400',
    groupHoverIcon: 'group-hover:text-blue-600 dark:group-hover:text-blue-400',
    btnPrimary: 'bg-blue-600',
    btnPrimaryHover: 'hover:bg-blue-700',
    btnDisabled: 'bg-blue-400',
    focusRing: 'focus:ring-blue-200 dark:focus:ring-blue-800 focus:border-blue-400',
    softHover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30',
    accent: 'text-blue-600 dark:text-blue-400',
    accentHover: 'hover:text-blue-700 dark:hover:text-blue-300',
    accentBgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/30',
    accentBg: 'bg-blue-50 dark:bg-blue-900/30',
    accentText: 'text-blue-700 dark:text-blue-300',
    checkboxBg: 'bg-blue-600 border-blue-600',
    badgeBg: 'bg-blue-600',
    softBgHalf: 'bg-blue-50/30 dark:bg-blue-900/20',
    hoverSoftBgHalf: 'hover:bg-blue-50/30 dark:hover:bg-blue-900/20',
};

// Default & Lector: light gray
const defaultTheme = {
    logoBg: 'bg-gray-50 dark:bg-gray-800',
    activeBg: 'bg-gray-50 dark:bg-gray-800',
    activeText: 'text-gray-600 dark:text-gray-300',
    activeIcon: 'text-gray-500 dark:text-gray-400',
    installBg: 'bg-gray-500',
    installHover: 'hover:bg-gray-600',
    titleText: 'text-gray-500 dark:text-gray-400',
    titleHover: 'hover:text-gray-600 dark:hover:text-gray-300',
    gradientFrom: 'from-gray-500',
    gradientTo: 'to-gray-600',
    gradientSubtext: 'text-gray-200',
    spinnerBorder: 'border-gray-400/20',
    spinnerTop: 'border-t-gray-400',
    actionHover: 'group-hover:text-gray-500 dark:group-hover:text-gray-400',
    avatarFrom: '#6b7280',
    avatarTo: '#4b5563',
    pillBg: 'bg-gray-50 dark:bg-gray-800',
    pillText: 'text-gray-600 dark:text-gray-300',
    selectedBg: 'bg-gray-50 dark:bg-gray-800',
    selectedText: 'text-gray-600 dark:text-gray-300',
    borderLight: 'border-gray-100 dark:border-gray-700',
    hoverBg: 'hover:bg-gray-50 dark:hover:bg-gray-800',
    hoverText: 'hover:text-gray-600 dark:hover:text-gray-300',
    groupHoverIcon: 'group-hover:text-gray-500 dark:group-hover:text-gray-400',
    btnPrimary: 'bg-gray-500',
    btnPrimaryHover: 'hover:bg-gray-600',
    btnDisabled: 'bg-gray-300',
    focusRing: 'focus:ring-gray-200 dark:focus:ring-gray-700 focus:border-gray-400',
    softHover: 'hover:bg-gray-100 dark:hover:bg-gray-800',
    accent: 'text-gray-500 dark:text-gray-400',
    accentHover: 'hover:text-gray-600 dark:hover:text-gray-300',
    accentBgHover: 'hover:bg-gray-50 dark:hover:bg-gray-800',
    accentBg: 'bg-gray-50 dark:bg-gray-800',
    accentText: 'text-gray-600 dark:text-gray-300',
    checkboxBg: 'bg-gray-500 border-gray-500',
    badgeBg: 'bg-gray-500',
    softBgHalf: 'bg-gray-50/30 dark:bg-gray-800/30',
    hoverSoftBgHalf: 'hover:bg-gray-50/30 dark:hover:bg-gray-800/30',
};

export type RoleTheme = typeof adminTheme;

export function useRoleTheme(): RoleTheme {
    const { user } = useAuth();
    const { effectiveRoleName } = useRolePreview();
    const roleName = (effectiveRoleName || user?.role?.name || '').toLowerCase();

    if (roleName.includes('admin')) return adminTheme;
    if (roleName.includes('student')) return studentTheme;
    if (roleName.includes('professor') || roleName.includes('coordinator')) return teacherTheme;
    return defaultTheme;
}
