import { redirect } from 'next/navigation';

export default function PracticaPage({ params }: { params: { id: string; locale: string } }) {
    redirect(`/${params.locale}/dashboard/practicas/${params.id}/datos-generales`);
}
