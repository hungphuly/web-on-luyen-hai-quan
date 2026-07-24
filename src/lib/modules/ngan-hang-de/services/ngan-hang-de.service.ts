import { createClient } from '@/lib/shared/utils/supabase/server';
import { CauHoiAdmin } from '../types';

export async function getDanhSachCauHoiAdmin(chuyenDeId?: string): Promise<CauHoiAdmin[]> {
  const supabase = await createClient();
  
  // Note: Dùng auth service role trong tương lai nếu RLS quá phức tạp, 
  // nhưng vì ta đã set RLS admin thì query bình thường bằng access_token của admin là đủ.
  let query = supabase
    .from('cau_hoi')
    .select(`
      *,
      chuyen_de:danh_muc_chuyen_de(ten)
    `);

  if (chuyenDeId) {
    query = query.eq('chuyen_de_id', chuyenDeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Lỗi khi lấy danh sách câu hỏi (Admin):', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    return [];
  }

  return data as unknown as CauHoiAdmin[];
}
