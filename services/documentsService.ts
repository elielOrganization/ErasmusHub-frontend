import Cookies from "js-cookie";
import { API_URL } from "@/lib/api";
import type { UserDocument, UploadDocType } from "@/app/[locale]/(dashboard)/dashboard/documents/types";

function authHeaders(): HeadersInit {
    const token = Cookies.get("auth_token");
    return { Authorization: `Bearer ${token}` };
}

export async function deleteDocument(docId: number): Promise<void> {
    const res = await fetch(`${API_URL}/documents/${docId}`, {
        method: "DELETE",
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`DELETE /documents/${docId} failed: ${res.status}`);
}

export async function fetchDocumentBlob(docId: number): Promise<Blob> {
    const res = await fetch(`${API_URL}/documents/${docId}/file`, {
        headers: authHeaders(),
    });
    if (!res.ok) throw new Error(`GET /documents/${docId}/file failed: ${res.status}`);
    return res.blob();
}

export async function uploadDocument(
    docType: UploadDocType,
    files: { front?: File; back?: File; main?: File }
): Promise<UserDocument[]> {
    const formData = new FormData();
    if (docType === "idDoc") {
        formData.append("id_type", "rodneCislo");
        if (files.front) formData.append("id_document_front", files.front);
        if (files.back) formData.append("id_document_back", files.back);
    } else if (docType === "grades" && files.main) {
        formData.append("grades_certificate", files.main);
    } else if (docType === "coverLetter" && files.main) {
        formData.append("cover_letter", files.main);
    } else if (docType === "disability" && files.main) {
        formData.append("disability_certificate", files.main);
    }
    const res = await fetch(`${API_URL}/documents/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
    });
    if (!res.ok) throw new Error(`POST /documents/upload failed: ${res.status}`);
    return res.json();
}
