export type UploadDocType = "idDoc" | "grades" | "coverLetter" | "disability" | "parental";

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

export interface CalificacionRead {
    id: number;
    interview: number;
    grade_certificate: number;
    motivation_letter: number;
    language_certificate: number;
    disability_certificate: number;
    updated_at: string;
    updated_by: number | null;
}
