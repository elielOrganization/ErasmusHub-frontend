import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SERVER_API_URL } from '@/lib/api';
import { deleteUser, toggleRole } from './actions';

interface Role {
    id: number;
    name: string;
    slug?: string;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    role?: Role | string;
}

async function getTokenFromCookie() {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value;
}

async function fetchUsers(token: string): Promise<User[]> {
    const response = await fetch(`${SERVER_API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });

    if (!response.ok) return [];
    return response.json();
}

export default async function AdminUsersPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const token = await getTokenFromCookie();
    if (!token) {
        redirect(`/${locale}/login`);
    }

    const users = await fetchUsers(token);

    return (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {users.length} Total Users
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-gray-100 text-gray-400 text-sm">
                            <th className="pb-4 font-medium">User</th>
                            <th className="pb-4 font-medium">Email</th>
                            <th className="pb-4 font-medium">Role</th>
                            <th className="pb-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map((user) => {
                            const roleName = typeof user.role === 'string' ? user.role : user.role?.name ?? 'Unknown';
                            const roleLabel = roleName.toString();

                            return (
                                <tr key={user.id} className="group hover:bg-gray-50 transition-colors">
                                    <td className="py-4 font-medium text-gray-700">{user.first_name} {user.last_name}</td>
                                    <td className="py-4 text-gray-500">{user.email}</td>
                                    <td className="py-4">
                                        <span
                                            className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                                                roleLabel.toLowerCase().includes('admin')
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-emerald-100 text-emerald-700'
                                            }`}
                                        >
                                            {roleLabel}
                                        </span>
                                    </td>
                                    <td className="py-4 text-right">
                                        <form action={toggleRole} className="inline">
                                            <input type="hidden" name="userId" value={user.id} />
                                            <input type="hidden" name="currentRole" value={roleLabel} />
                                            <input type="hidden" name="locale" value={locale} />
                                            <button className="text-indigo-600 hover:text-indigo-900 mr-4 text-sm font-bold transition-colors">
                                                Toggle Role
                                            </button>
                                        </form>
                                        <form action={deleteUser} className="inline">
                                            <input type="hidden" name="userId" value={user.id} />
                                            <input type="hidden" name="locale" value={locale} />
                                            <button
                                                type="submit"
                                                className="text-rose-500 hover:text-rose-700 text-sm font-bold transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </form>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}