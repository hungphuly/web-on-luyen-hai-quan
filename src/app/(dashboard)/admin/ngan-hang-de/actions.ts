'use server'

import { createClient } from '@/lib/shared/utils/supabase/server'
import * as xlsx from 'xlsx'
import { ExcelRowData, ImportError } from '@/lib/modules/ngan-hang-de/types'
import { revalidatePath } from 'next/cache'

export async function importExcelQuestions(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    const chuyenDeId = formData.get('chuyenDeId') as string;

    if (!file) {
      return { success: false, errors: [{ row: 0, reason: 'Không tìm thấy file' }] };
    }
    if (!chuyenDeId) {
      return { success: false, errors: [{ row: 0, reason: 'Chưa chọn chuyên đề áp dụng' }] };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, errors: [{ row: 0, reason: 'Chưa đăng nhập' }] };
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Đọc dưới dạng mảng 2 chiều (array of arrays)
    const rawData = xlsx.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    
    if (rawData.length === 0) {
      return { success: false, errors: [{ row: 0, reason: 'File Excel trống' }] };
    }

    const errors: ImportError[] = [];
    const questionsToInsert: any[] = [];

    // Duyệt qua từng dòng Excel
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      
      // Bỏ qua nếu dòng rỗng
      if (!row || row.length === 0) continue;

      // Chuyển cột TT sang số
      const tt = parseInt(row[0]);
      
      // Chỉ xử lý các dòng có cột TT là số nguyên dương
      if (isNaN(tt) || tt <= 0) continue;

      const noi_dung = row[1]?.toString().trim();
      const dap_an_dung = row[2]?.toString().trim().toLowerCase();
      const lua_chon_a = row[3]?.toString().trim();
      const lua_chon_b = row[4]?.toString().trim();
      const lua_chon_c = row[5]?.toString().trim();
      const lua_chon_d = row[6]?.toString().trim();
      const can_cu_phap_ly = row[7]?.toString().trim();
      // Độ khó mặc định cho import hàng loạt là trung_binh
      const do_kho = 'trung_binh'; 

      // Validate nội dung và lựa chọn
      if (!noi_dung) errors.push({ row: tt, reason: 'Nội dung câu hỏi không được để trống' });
      if (!lua_chon_a || !lua_chon_b || !lua_chon_c || !lua_chon_d) {
        errors.push({ row: tt, reason: 'Phải điền đủ 4 phương án A, B, C, D' });
      }

      // Validate đáp án
      if (!['a', 'b', 'c', 'd'].includes(dap_an_dung)) {
        errors.push({ row: tt, reason: `Đáp án "${dap_an_dung}" không hợp lệ. Chỉ chấp nhận A, B, C, D` });
      }

      // Validate căn cứ pháp lý
      if (!can_cu_phap_ly) errors.push({ row: tt, reason: 'Căn cứ pháp lý không được để trống' });

      // Nếu không có lỗi ở dòng này, chuẩn bị data
      if (errors.length === 0) {
        questionsToInsert.push({
          chuyen_de_id: chuyenDeId,
          noi_dung,
          cac_lua_chon: { a: lua_chon_a, b: lua_chon_b, c: lua_chon_c, d: lua_chon_d },
          dap_an_dung,
          can_cu_phap_ly,
          do_kho,
          nguoi_tao_id: user.id
        });
      }
    }

    // NẾU CÓ LỖI (DÙ CHỈ 1 DÒNG) => TỪ CHỐI TOÀN BỘ
    if (errors.length > 0) {
      return { success: false, errors };
    }

    if (questionsToInsert.length === 0) {
      return { success: false, errors: [{ row: 0, reason: 'Không tìm thấy dòng dữ liệu hợp lệ nào (Cột TT phải là số nguyên dương)' }] };
    }

    // Nếu tất cả hợp lệ, tiến hành insert
    const { error: insertError } = await supabase
      .from('cau_hoi')
      .insert(questionsToInsert);

    if (insertError) {
      console.error('Lỗi khi insert:', insertError);
      return { success: false, errors: [{ row: 0, reason: `Lỗi cơ sở dữ liệu: ${insertError.message}` }] };
    }

    revalidatePath('/admin/ngan-hang-de');
    return { success: true, count: questionsToInsert.length };
    
  } catch (error: any) {
    console.error('Lỗi khi xử lý file Excel:', error);
    return { success: false, errors: [{ row: 0, reason: `Lỗi không xác định: ${error.message}` }] };
  }
}
