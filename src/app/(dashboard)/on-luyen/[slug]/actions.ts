'use server'

import { createClient, createAdminClient } from '@/lib/shared/utils/supabase/server'
import { KetQuaChamDiem } from '@/lib/modules/on-luyen/types'

export async function chamDiemCauHoi(cauHoiId: string, luaChonDaChon: string, phienId?: string): Promise<KetQuaChamDiem> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Bạn cần đăng nhập để làm bài');
  }

  const supabaseAdmin = await createAdminClient();

  // Lấy đáp án và căn cứ từ bảng gốc (bypass RLS bằng admin client)
  const { data: cauHoi, error } = await supabaseAdmin
    .from('cau_hoi')
    .select('dap_an_dung, can_cu_phap_ly')
    .eq('id', cauHoiId)
    .single();

  if (error || !cauHoi) {
    console.error('Lỗi chấm điểm:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error('Lỗi khi chấm điểm hoặc câu hỏi không tồn tại');
  }

  const isDung = cauHoi.dap_an_dung.toLowerCase() === luaChonDaChon.toLowerCase();

  // Lưu lịch sử
  const insertData: any = {
    hoc_vien_id: user.id,
    cau_hoi_id: cauHoiId,
    lua_chon_da_chon: luaChonDaChon.toLowerCase(),
    dung: isDung
  };

  if (phienId) {
    insertData.phien_id = phienId;
  }

  const { error: insertError } = await supabaseAdmin
    .from('lich_su_on_luyen')
    .insert(insertData);

  if (insertError) {
    console.error('Lỗi khi lưu lịch sử:', insertError);
  }

  return {
    dung: isDung,
    dap_an_dung: cauHoi.dap_an_dung.toUpperCase(),
    can_cu_phap_ly: cauHoi.can_cu_phap_ly
  };
}
