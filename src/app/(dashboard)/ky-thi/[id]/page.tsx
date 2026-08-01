import { createClient } from '@/lib/shared/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getOrCreateKyThiSession } from '@/lib/modules/ky-thi/actions';
import { KyThiSessionClient } from './KyThiSessionClient';

export const metadata = {
  title: 'Làm bài thi thật',
};

export default async function TakeExamPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth');
  }

  const { session, kyThi, error } = await getOrCreateKyThiSession(params.id);

  if (error || !session || !kyThi) {
    return (
      <div className="max-w-3xl mx-auto mt-10 p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
        <h1 className="text-xl font-bold mb-2">Không thể tải kỳ thi</h1>
        <p>{error}</p>
        <a href="/ky-thi" className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition">
          Quay lại danh sách
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <KyThiSessionClient session={session} kyThi={kyThi} />
    </div>
  );
}
