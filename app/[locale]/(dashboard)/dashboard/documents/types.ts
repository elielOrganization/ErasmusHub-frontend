export type UploadDocType = "idDoc" | "grades" | "coverLetter" | "disability";

export type DocState = "pending" | "approved" | "rejected";

export interface UserDocument {
    id: number;
    user_id: number;
    name: string;
    document_type: string;
    file_path: string;
    uploaded_at: string;
    state: DocState;
}

export interface FileState {
    file: File | null;
    error: string | null;
}

export const emptyFile = (): FileState => ({ file: null, error: null });
