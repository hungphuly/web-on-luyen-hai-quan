'use server'

import { createClient, createAdminClient } from '@/lib/shared/utils/supabase/server'
import { KetQuaChamDiem } from '@/lib/modules/on-luyen/types'

export async function chamDiemCauHoi(cauHoiId: string, luaChonDaChon: string, phienId: string, chuyenDeId: string): Promise<KetQuaChamDiem | { error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Bạn cần đăng nhập để làm bài' };
    }

    const supabaseAdmin = await createAdminClient();
    
    // Lấy đáp án và căn cứ từ bảng gốc (bypass RLS bằng admin client)
    const { data: cauHoi, error: fetchError } = await supabaseAdmin
      .from('cau_hoi')
      .select('dap_an_dung, can_cu_phap_ly')
      .eq('id', cauHoiId)
      .single();

    if (fetchError || !cauHoi) {
      console.error('Lỗi chấm điểm:', fetchError);
      return { error: 'Lỗi khi lấy đáp án: ' + (fetchError?.message || 'Không tìm thấy câu hỏi') };
    }

    const isDung = cauHoi.dap_an_dung.toLowerCase() === luaChonDaChon.toLowerCase();

    // Cập nhật phiên ôn luyện (tăng số câu đã làm, số câu đúng)
    if (phienId && chuyenDeId) {
      const { data: existingSession } = await supabaseAdmin
        .from('phien_on_luyen')
        .select('so_cau_da_lam, so_cau_dung')
        .eq('id', phienId)
        .single();

      if (existingSession) {
        // Update
        const { error: updateError } = await supabaseAdmin
          .from('phien_on_luyen')
          .update({
            so_cau_da_lam: existingSession.so_cau_da_lam + 1,
            so_cau_dung: existingSession.so_cau_dung + (isDung ? 1 : 0),
            ngay_lam: new Date().toISOString()
          })
          .eq('id', phienId);
          
        if (updateError) console.error('Lỗi khi update phiên:', updateError);
      } else {
        // Insert new
        const { error: insertError } = await supabaseAdmin
          .from('phien_on_luyen')
          .insert({
            id: phienId,
            hoc_vien_id: user.id,
            chuyen_de_id: chuyenDeId,
            so_cau_da_lam: 1,
            so_cau_dung: isDung ? 1 : 0
          });
          
        if (insertError) console.error('Lỗi khi insert phiên:', insertError);
      }
    }

    return {
      dung: isDung,
      dap_an_dung: cauHoi.dap_an_dung.toUpperCase(),
      can_cu_phap_ly: cauHoi.can_cu_phap_ly
    };
  } catch (err: any) {
    console.error('Server Action Error:', err);
    return { error: 'Lỗi server (Exception): ' + err.message };
  }
}
