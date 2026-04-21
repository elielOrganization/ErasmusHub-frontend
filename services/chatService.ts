import Cookies from 'js-cookie';
import { API_URL } from '@/lib/api';

export interface ChatMessage {
    id: number;
    chat_id: number;
    sender_id: number;
    sender_name: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export interface Chat {
    id: number;
    opportunity_id: number;
    opportunity_name: string;
    student_id: number;
    student_name: string;
    teachers_names: string;
    unread_count: number;
    last_message: ChatMessage | null;
    created_at: string;
}

export interface TeacherInfo {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}

function authHeaders() {
    const token = Cookies.get('auth_token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

export async function fetchMyChats(): Promise<Chat[]> {
    const res = await fetch(`${API_URL}/chat/`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
}

export async function getOrCreateChat(opportunityId: number): Promise<Chat> {
    const res = await fetch(`${API_URL}/chat/opportunity/${opportunityId}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
}

export async function fetchMessages(chatId: number): Promise<ChatMessage[]> {
    const res = await fetch(`${API_URL}/chat/${chatId}/messages`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
}

export async function sendMessage(chatId: number, content: string): Promise<ChatMessage> {
    const res = await fetch(`${API_URL}/chat/${chatId}/messages`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
}

export async function fetchOpportunityTeachers(opportunityId: number): Promise<TeacherInfo[]> {
    const res = await fetch(`${API_URL}/chat/opportunities/${opportunityId}/teachers`, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
}

export async function addOpportunityTeacher(opportunityId: number, teacherId: number): Promise<TeacherInfo> {
    const res = await fetch(`${API_URL}/chat/opportunities/${opportunityId}/teachers`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ teacher_id: teacherId }),
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
    return res.json();
}

export async function removeOpportunityTeacher(opportunityId: number, teacherId: number): Promise<void> {
    const res = await fetch(`${API_URL}/chat/opportunities/${opportunityId}/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);
}

export async function fetchAllTeachers(): Promise<TeacherInfo[]> {
    const res = await fetch(`${API_URL}/users/teachers`, { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
}
