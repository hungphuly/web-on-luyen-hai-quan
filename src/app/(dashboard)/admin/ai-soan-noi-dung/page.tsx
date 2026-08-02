import { createClient } from '@/lib/shared/utils/supabase/server';
import { getDanhSachTaiLieu } from '@/lib/modules/tai-lieu/services/tai-lieu.service';
import { 
  getDanhSachCauHoiNhap, 
  getDanhSachFlashcardNhap 
} from '@/lib/modules/admin/actions/ai-soan-noi-dung.actions';
import { AISoanNoiDungClient } from './AISoanNoiDungClient';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdminAISoanNoiDungPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: hocVien } = await supabase
    .from('hoc_vien')
    .select('loai_tai_khoan')
    .eq('id', user.id)
    .single();

  if (hocVien?.loai_tai_khoan !== 'admin') {
    redirect('/');
  }

  // Lấy danh sách chuyên đề
  const { data: chuyenDeList } = await supabase
    .from('danh_muc_chuyen_de')
    .select('id, ten')
    .order('thu_tu');

  // Lấy danh sách tài liệu văn bản pháp luật có file trên R2
  const taiLieuList = await getDanhSachTaiLieu();

  // Lấy danh sách câu hỏi nháp và flashcard nháp đang chờ duyệt
  const [cauHoiNhapList, flashcardNhapList] = await Promise.all([
    getDanhSachCauHoiNhap('cho_duyet'),
    getDanhSachFlashcardNhap('cho_duyet'),
  ]);

  return (
    <div className="space-y-6 pb-20">
      <AISoanNoiDungClient
        chuyenDeList={chuyenDeList || []}
        taiLieuList={taiLieuList || []}
        initialCauHoiList={cauHoiNhapList}
        initialFlashcardList={flashcardNhapList}
      />
    </div>
  );
}
