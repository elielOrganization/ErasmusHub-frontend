import { SERVER_API_URL } from '@/lib/api';

export interface Opportunity {
    id: number;
    name: string;
    description: string | null;
    country: string | null;
    city: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    max_slots: number;
    filled_slots: number;
    creator_id: number | null;
    created_at: string;
    updated_at: string;
}

export interface AssignedStudent {
    application_id: number;
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    status: string;
}

export interface PaginatedOpportunities {
    items: Opportunity[];
    total: number;
    page: number;
    page_size: number;
}

/** Server-side fetch for opportunities */
export async function fetchOpportunitiesServer(token: string): Promise<Opportunity[]> {
    const response = await fetch(`${SERVER_API_URL}/opportunities/?page=1&page_size=100`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });

    if (!response.ok) return [];
    const data: PaginatedOpportunities = await response.json();
    // API may not return max_slots/filled_slots, provide defaults
    return data.items.map(item => ({
        ...item,
        max_slots: item.max_slots ?? 0,
        filled_slots: item.filled_slots ?? 0,
        creator_id: item.creator_id ?? null,
        updated_at: item.updated_at ?? item.created_at,
    }));
}

/** Server-side fetch for students assigned to an opportunity */
export async function fetchOpportunityStudentsServer(token: string, oppId: number): Promise<AssignedStudent[]> {
    const response = await fetch(`${SERVER_API_URL}/opportunities/${oppId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });
    if (!response.ok) return [];
    return response.json();
}
