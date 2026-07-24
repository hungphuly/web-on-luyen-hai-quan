import { createClient } from '@/lib/shared/utils/supabase/server';
import ReactMarkdown from 'react-markdown';

export const metadata = {
  title: 'Giới thiệu - Ôn Luyện Hải Quan',
};

export default async function GioiThieuPage() {
  const supabase = await createClient();
  const { data: gioiThieuList } = await supabase
    .from('noi_dung_gioi_thieu')
    .select('*')
    .order('cap_nhat_luc', { ascending: false })
    .limit(1);

  const baiGioiThieu = gioiThieuList?.[0] || {
    tieu_de: 'Giới thiệu về Web Ôn Luyện',
    noi_dung_markdown: 'Chưa có nội dung giới thiệu nào được cập nhật.'
  };

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-8">
      <div className="bg-white rounded-xl border p-6 md:p-10 shadow-sm prose prose-blue max-w-none">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{baiGioiThieu.tieu_de}</h1>
        <ReactMarkdown>
          {baiGioiThieu.noi_dung_markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}
