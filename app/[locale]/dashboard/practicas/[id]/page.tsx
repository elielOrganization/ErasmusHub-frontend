import { redirect } from 'next/navigation';

export default async function PracticaPage({ params }: { params: Promise<{ id: string; locale: string }> }) {
    const { id, locale } = await params;
    redirect(`/${locale}/dashboard/practicas/${id}/datos-generales`);
}
