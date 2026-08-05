'use server'

import { createClient, createAdminClient } from '@/lib/shared/utils/supabase/server'
import { ChiTietCauHoiThiThu, KetQuaThiThu, DeThi } from '@/lib/modules/thi-thu/types'
import { taoDeThi } from '@/lib/modules/thi-thu/services/thi-thu.service'

export async function batDauThiThu(chuyenDeId: string): Promise<DeThi | null> {
  return taoDeThi(chuyenDeId);
}

export async function nopBaiThiThu(
  phienThiId: string, 
  chuyenDeId: string, 
  danhSachCauTraLoi: { cauHoiId: string, luaChon: string | null, noiDung: string, cacLuaChon: any }[],
  thoiGianDaLam: number
): Promise<KetQuaThiThu | { error: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Bạn cần đăng nhập để nộp bài' };
    }

    const supabaseAdmin = await createAdminClient();

    // Lấy danh sách cau_hoi_id cần chấm
    const cauHoiIds = danhSachCauTraLoi.map(c => c.cauHoiId);

    // Lấy đáp án đúng và căn cứ pháp lý từ bảng gốc (bypass RLS)
    const { data: cauHoiList, error } = await supabaseAdmin
      .from('cau_hoi')
      .select('id, dap_an_dung, giai_thich_chi_tiet, can_cu_phap_ly')
      .in('id', cauHoiIds);

    if (error || !cauHoiList) {
      console.error('Lỗi khi lấy đáp án:', error);
      return { error: 'Lỗi khi chấm điểm: ' + (error?.message || '') };
    }

    let soCauDung = 0;
    const chiTietBaiLam: ChiTietCauHoiThiThu[] = danhSachCauTraLoi.map(c => {
      const cauHoiDB = cauHoiList.find(db => db.id === c.cauHoiId);
      if (!cauHoiDB) throw new Error('Không tìm thấy câu hỏi ID: ' + c.cauHoiId);

      const rawSelected = c.luaChon;
      const userAnswers = Array.isArray(rawSelected)
        ? rawSelected.map((x: any) => String(x).trim().toLowerCase()).filter(Boolean).sort().join(',')
        : (rawSelected ? String(rawSelected).trim().toLowerCase().split(',').map((x: string) => x.trim()).filter(Boolean).sort().join(',') : '');

      const dbAnswers = cauHoiDB.dap_an_dung
        ? String(cauHoiDB.dap_an_dung).trim().toLowerCase().split(',').map((x: string) => x.trim()).filter(Boolean).sort().join(',')
        : '';

      // CHẤM ĐIỂM CHẶT CHẼ: Phải có lựa chọn VÀ khớp chính xác đáp án DB (bỏ trống => 0 điểm)
      const isDung = Boolean(userAnswers && dbAnswers && userAnswers === dbAnswers);

      if (isDung) soCauDung++;

      return {
        cau_hoi_id: c.cauHoiId,
        noi_dung: c.noiDung,
        cac_lua_chon: c.cacLuaChon,
        lua_chon_da_chon: userAnswers || null,
        dap_an_dung: dbAnswers.toUpperCase().split(',').join(', '),
        giai_thich_chi_tiet: cauHoiDB.giai_thich_chi_tiet,
        can_cu_phap_ly: cauHoiDB.can_cu_phap_ly,
        la_nhieu_dap_an: dbAnswers.includes(','),
        dung: isDung
      };
    });

    const diemSoStr = `${soCauDung}/${danhSachCauTraLoi.length}`;

    // Insert kết quả
    const { data: ketQua, error: insertError } = await supabaseAdmin
      .from('ket_qua_thi')
      .insert({
        id: phienThiId,
        hoc_vien_id: user.id,
        chuyen_de_id: chuyenDeId,
        loai_bai: 'thi_thu',
        diem_so: diemSoStr as any,
        chi_tiet_bai_lam: chiTietBaiLam,
        thoi_gian_hoan_thanh: thoiGianDaLam
      })
      .select('*, chuyen_de:danh_muc_chuyen_de(ten)')
      .single();

    if (insertError) {
      // Nếu lỗi diem_so numeric, fallback sửa lưu thành số
      const { data: ketQua2, error: insertError2 } = await supabaseAdmin
        .from('ket_qua_thi')
        .insert({
          id: phienThiId,
          hoc_vien_id: user.id,
          chuyen_de_id: chuyenDeId,
          loai_bai: 'thi_thu',
          diem_so: soCauDung,
          chi_tiet_bai_lam: chiTietBaiLam,
          thoi_gian_hoan_thanh: thoiGianDaLam
        })
        .select('*, chuyen_de:danh_muc_chuyen_de(ten)')
        .single();
      
      if (insertError2) {
        console.error('Lỗi lưu kết quả thi:', insertError2);
        return { error: 'Lỗi khi lưu kết quả thi: ' + insertError2.message };
      }
      
      return {
        id: ketQua2.id,
        diem_so: ketQua2.diem_so,
        thoi_gian_hoan_thanh: ketQua2.thoi_gian_hoan_thanh,
        ngay_thi: ketQua2.ngay_thi,
        chi_tiet_bai_lam: ketQua2.chi_tiet_bai_lam,
        chuyen_de_ten: ketQua2.chuyen_de?.ten,
      } as unknown as KetQuaThiThu;
    }

    return {
      id: ketQua.id,
      diem_so: ketQua.diem_so,
      thoi_gian_hoan_thanh: ketQua.thoi_gian_hoan_thanh,
      ngay_thi: ketQua.ngay_thi,
      chi_tiet_bai_lam: ketQua.chi_tiet_bai_lam,
      chuyen_de_ten: ketQua.chuyen_de?.ten,
    } as unknown as KetQuaThiThu;
  } catch (err: any) {
    console.error('Server Action Error nopBaiThiThu:', err);
    return { error: 'Lỗi server (Exception): ' + err.message };
  }
}
