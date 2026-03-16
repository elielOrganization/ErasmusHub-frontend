import LanguageSelector from "./LanguageSelector";
import UserDropdown from "./UserDropdown";
import NotificationDropdown from "./NotificationDropdown";

export default function Header() {
    return (
        <header className="fixed top-0 left-0 w-full h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30 shadow-sm">
            {/* Empty spacer on the left to maintain flex balance */}
            <div className="w-32" />

            {/* App title ABSOLUTELY CENTERED */}
            <span className="absolute left-1/2 -translate-x-1/2 text-xl font-bold text-blue-600 tracking-tight">
                ErasmusHub
            </span>

            {/* Controls on the right */}
            <div className="flex items-center gap-2">
                <NotificationDropdown />
                <div className="h-6 w-px bg-gray-100 mx-1"></div>
                <LanguageSelector />
                <UserDropdown />
            </div>
        </header>
    );
}