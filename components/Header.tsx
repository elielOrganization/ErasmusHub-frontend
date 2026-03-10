import LanguageSelector from "./LanguageSelector";
import UserDropdown from "./UserDropdown";
import NotificationDropdown from "./NotificationDropdown";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 w-full h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30 shadow-sm">
            {/* Espacio vacío a la izquierda para mantener el equilibrio del flex */}
            <div className="w-32" />

            {/* Título de la app CENTRADO ABSOLUTO */}
            <span className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-blue-600 tracking-tight">
                ErasmusHub
            </span>

            {/* Controles a la derecha */}
            <div className="flex items-center gap-2">
                <NotificationDropdown />
                <div className="h-6 w-px bg-gray-100 mx-1"></div>
                <LanguageSelector />
                <UserDropdown />
            </div>
        </header>
    );
}