import { useAuth } from '@/context/AuthContext';

const adminTheme = {
    // Sidebar
    logoBg: 'bg-purple-50',
    activeBg: 'bg-purple-50',
    activeText: 'text-purple-700',
    activeIcon: 'text-purple-600',
    installBg: 'bg-purple-600',
    installHover: 'hover:bg-purple-700',
    // Header
    titleText: 'text-purple-600',
    titleHover: 'hover:text-purple-700',
    // Dashboard gradient
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-purple-700',
    gradientSubtext: 'text-purple-100',
    // Spinner
    spinnerBorder: 'border-purple-600/20',
    spinnerTop: 'border-t-purple-600',
    // Action card hover
    actionHover: 'group-hover:text-purple-600',
    // UserDropdown gradient
    avatarFrom: '#9333ea',
    avatarTo: '#7e22ce',
    // Profile pill
    pillBg: 'bg-purple-100',
    pillText: 'text-purple-700',
    // Language selector
    selectedBg: 'bg-purple-50',
    selectedText: 'text-purple-700',
    borderLight: 'border-purple-100',
};

const studentTheme = {
    logoBg: 'bg-emerald-50',
    activeBg: 'bg-emerald-50',
    activeText: 'text-emerald-700',
    activeIcon: 'text-emerald-600',
    installBg: 'bg-emerald-600',
    installHover: 'hover:bg-emerald-700',
    titleText: 'text-emerald-600',
    titleHover: 'hover:text-emerald-700',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-emerald-700',
    gradientSubtext: 'text-emerald-100',
    spinnerBorder: 'border-emerald-600/20',
    spinnerTop: 'border-t-emerald-600',
    actionHover: 'group-hover:text-emerald-600',
    avatarFrom: '#059669',
    avatarTo: '#047857',
    pillBg: 'bg-emerald-100',
    pillText: 'text-emerald-700',
    selectedBg: 'bg-emerald-50',
    selectedText: 'text-emerald-700',
    borderLight: 'border-emerald-100',
};

const teacherTheme = {
    logoBg: 'bg-blue-50',
    activeBg: 'bg-blue-50',
    activeText: 'text-blue-700',
    activeIcon: 'text-blue-600',
    installBg: 'bg-blue-600',
    installHover: 'hover:bg-blue-700',
    titleText: 'text-blue-600',
    titleHover: 'hover:text-blue-700',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-blue-700',
    gradientSubtext: 'text-blue-100',
    spinnerBorder: 'border-blue-600/20',
    spinnerTop: 'border-t-blue-600',
    actionHover: 'group-hover:text-blue-600',
    avatarFrom: '#3b82f6',
    avatarTo: '#1d4ed8',
    pillBg: 'bg-blue-100',
    pillText: 'text-blue-700',
    selectedBg: 'bg-blue-50',
    selectedText: 'text-blue-700',
    borderLight: 'border-blue-100',
};

// Default & Lector: gray
const defaultTheme = {
    logoBg: 'bg-gray-100',
    activeBg: 'bg-gray-100',
    activeText: 'text-gray-700',
    activeIcon: 'text-gray-600',
    installBg: 'bg-gray-600',
    installHover: 'hover:bg-gray-700',
    titleText: 'text-gray-600',
    titleHover: 'hover:text-gray-700',
    gradientFrom: 'from-gray-600',
    gradientTo: 'to-gray-700',
    gradientSubtext: 'text-gray-300',
    spinnerBorder: 'border-gray-600/20',
    spinnerTop: 'border-t-gray-600',
    actionHover: 'group-hover:text-gray-600',
    avatarFrom: '#4b5563',
    avatarTo: '#374151',
    pillBg: 'bg-gray-100',
    pillText: 'text-gray-700',
    selectedBg: 'bg-gray-100',
    selectedText: 'text-gray-700',
    borderLight: 'border-gray-200',
};

export type RoleTheme = typeof adminTheme;

export function useRoleTheme(): RoleTheme {
    const { user } = useAuth();
    const roleName = (user?.role?.name || '').toLowerCase();

    if (roleName.includes('admin')) return adminTheme;
    if (roleName.includes('student')) return studentTheme;
    if (roleName.includes('profesor') || roleName.includes('coordinador')) return teacherTheme;
    return defaultTheme;
}
