"use client"
import { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export type PreviewRole = 'student' | 'teacher' | 'coordinator' | 'lector' | null;

interface RolePreviewContextType {
    previewRole: PreviewRole;
    setPreviewRole: (role: PreviewRole) => void;
    isRealAdmin: boolean;
    effectiveRoleName: string;
}

const RolePreviewContext = createContext<RolePreviewContextType | undefined>(undefined);

export function RolePreviewProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [previewRole, setPreviewRole] = useState<PreviewRole>(null);

    const realRoleName = user?.role?.name || '';
    const isRealAdmin = realRoleName.toLowerCase().includes('admin');

    // When admin is previewing a role, expose a fake role name so all consumers adapt
    let effectiveRoleName = realRoleName;
    if (isRealAdmin && previewRole !== null) {
        switch (previewRole) {
            case 'student':     effectiveRoleName = 'Student';     break;
            case 'teacher':     effectiveRoleName = 'Professor';   break;
            case 'coordinator': effectiveRoleName = 'Coordinator'; break;
            case 'lector':      effectiveRoleName = 'Reader';      break;
        }
    }

    return (
        <RolePreviewContext.Provider value={{ previewRole, setPreviewRole, isRealAdmin, effectiveRoleName }}>
            {children}
        </RolePreviewContext.Provider>
    );
}

const FALLBACK: RolePreviewContextType = {
    previewRole: null,
    setPreviewRole: () => {},
    isRealAdmin: false,
    effectiveRoleName: '',
};

export function useRolePreview(): RolePreviewContextType {
    return useContext(RolePreviewContext) ?? FALLBACK;
}
