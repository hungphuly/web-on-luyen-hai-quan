'use server'

import { createClient, createAdminClient } from '@/lib/shared/utils/supabase/server';
import { getFileBlobFromR2 } from '@/lib/shared/utils/r2';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { revalidatePath } from 'next/cache';

async function checkAdminAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Bạn chưa đăng nhập');
  }

  const { data: hocVien } = await supabase
    .from('hoc_vien')
    .select('loai_tai_khoan')
    .eq('id', user.id)
    .single();

  if (hocVien?.loai_tai_khoan !== 'admin') {
    throw new Error('Bạn không có quyền admin');
  }

  return user;
}

function parseAIJson<T>(rawText: string): T {
  let cleaned = rawText.trim();
  // Tìm mảng JSON đầu tiên trong chuỗi kết quả
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1);
  } else {
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
  }

  return JSON.parse(cleaned);
}

export interface SinhNoiDungParams {
  chuyenDeId: string;
  nguonFile: string; // Tên file trên R2 hoặc tên file PDF upload
  loaiNoiDung: 'cau_hoi' | 'flashcard' | 'ca_hai';
  soLuongCauHoi: number;
  soLuongFlashcard: number;
  fileBufferBase64?: string; // Tùy chọn nếu tải file mới trực tiếp
}

export async function sinhNoiDungTuPDF(params: SinhNoiDungParams) {
  await checkAdminAuth();

  const { chuyenDeId, nguonFile, loaiNoiDung, soLuongCauHoi, soLuongFlashcard, fileBufferBase64 } = params;

  if (!chuyenDeId) {
    return { success: false, message: 'Vui lòng chọn chuyên đề áp dụng.' };
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const ai = (env as any)?.AI;

    if (!ai) {
      return { 
        success: false, 
        message: 'Tính năng AI soạn nội dung yêu cầu môi trường Cloudflare Workers AI.' 
      };
    }

    // 1. Chuẩn bị Blob của file PDF
    let pdfBlob: Blob;
    if (fileBufferBase64) {
      const buffer = Buffer.from(fileBufferBase64, 'base64');
      pdfBlob = new Blob([buffer], { type: 'application/pdf' });
      console.log('>>> [AI Soạn Nội Dung] Đã nhận file trực tiếp từ upload, kích thước:', pdfBlob.size, 'bytes');
    } else if (nguonFile) {
      console.log('>>> [AI Soạn Nội Dung] Đang lấy file từ Cloudflare R2 với Key:', nguonFile);
      pdfBlob = await getFileBlobFromR2(nguonFile);
      console.log('>>> [AI Soạn Nội Dung] Lấy file từ R2 thành công, kích thước:', pdfBlob.size, 'bytes');
    } else {
      return { success: false, message: 'Không tìm thấy nguồn file PDF.' };
    }

    // 2. Dùng env.AI.toMarkdown() để chuyển đổi PDF sang Markdown text
    const mdDocs = await ai.toMarkdown([
      {
        name: nguonFile || 'document.pdf',
        blob: pdfBlob,
      }
    ]);

    const markdownText = mdDocs?.[0]?.data || '';
    if (!markdownText || markdownText.trim().length === 0) {
      return { success: false, message: 'Không thể trích xuất văn bản từ file PDF được cung cấp.' };
    }

    // Giới hạn độ dài văn bản để vừa context window của LLM (khoảng 18,000 ký tự đầu tiên nếu file quá dài)
    const contextContent = markdownText.slice(0, 18000);

    const supabaseAdmin = await createAdminClient();
    let cauHoiCount = 0;
    let flashcardCount = 0;

    // 3. Sinh câu hỏi trắc nghiệm
    if (loaiNoiDung === 'cau_hoi' || loaiNoiDung === 'ca_hai') {
      const promptCauHoi = `Bạn là trợ lý soạn thảo nội dung ôn thi nghiệp vụ Hải quan. Dưới đây là nội dung văn bản pháp luật:

--- NỘI DUNG VĂN BẢN ---
${contextContent}
-----------------------

NHIỆM VỤ: Sinh ra chính xác ${soLuongCauHoi || 5} câu hỏi trắc nghiệm 4 đáp án DỰA HOÀN TOÀN vào nội dung văn bản trên.

QUY TẮC BẮT BUỘC:
1. Trích dẫn CHÍNH XÁC số Điều/Khoản/Nghị định/Thông tư từ văn bản vào trường "can_cu_phap_ly". Nếu không chắc chắn về số Điều/Khoản, KHÔNG tự suy diễn, để trống trường "can_cu_phap_ly" và đặt "can_kiem_tra": true để admin tự tra lại. Nếu trích dẫn chuẩn xác, đặt "can_kiem_tra": false.
2. Không tạo câu hỏi có đáp án dạng "tất cả các phương án trên đều đúng" hoặc "cả A và B đều đúng".
3. Độ khó quy định: "de", "trung_binh", hoặc "kho".
4. CHỈ TRẢ VỀ DUY NHẤT 1 MẢNG JSON HỢP LỆ (không kèm markdown format, không bọc \`\`\`json, không thêm lời dẫn) theo mẫu:
[
  {
    "noi_dung": "Nội dung câu hỏi...",
    "cac_lua_chon": { "a": "Lựa chọn A", "b": "Lựa chọn B", "c": "Lựa chọn C", "d": "Lựa chọn D" },
    "dap_an_dung": "a",
    "can_cu_phap_ly": "Điều ...",
    "giai_thich_chi_tiet": "Giải thích...",
    "do_kho": "trung_binh",
    "can_kiem_tra": false
  }
]
`;

      const aiResCauHoi = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [{ role: 'user', content: promptCauHoi }],
        temperature: 0.2,
        max_tokens: 3500,
      });

      const rawCauHoi = aiResCauHoi?.response || (typeof aiResCauHoi === 'string' ? aiResCauHoi : '');
      try {
        const listCauHoi = parseAIJson<any[]>(rawCauHoi);
        if (Array.isArray(listCauHoi) && listCauHoi.length > 0) {
          const insertRows = listCauHoi.map(item => ({
            chuyen_de_id: chuyenDeId,
            noi_dung: item.noi_dung || 'Chưa có nội dung',
            cac_lua_chon: item.cac_lua_chon || { a: '', b: '', c: '', d: '' },
            dap_an_dung: (item.dap_an_dung || 'a').toLowerCase().trim()[0] || 'a',
            can_cu_phap_ly: item.can_cu_phap_ly || '',
            giai_thich_chi_tiet: item.giai_thich_chi_tiet || '',
            do_kho: ['de', 'trung_binh', 'kho'].includes(item.do_kho) ? item.do_kho : 'trung_binh',
            phan_loai: 1,
            can_kiem_tra: Boolean(item.can_kiem_tra || !item.can_cu_phap_ly),
            nguon_file: nguonFile,
            trang_thai: 'cho_duyet',
            tao_boi_ai: true,
          }));

          const { error: insErr } = await supabaseAdmin.from('cau_hoi_nhap').insert(insertRows);
          if (!insErr) {
            cauHoiCount = insertRows.length;
          } else {
            console.error('Lỗi insert cau_hoi_nhap:', insErr);
          }
        }
      } catch (err) {
        console.error('Lỗi parse JSON câu hỏi AI:', err, rawCauHoi);
      }
    }

    // 4. Sinh Flashcard
    if (loaiNoiDung === 'flashcard' || loaiNoiDung === 'ca_hai') {
      const promptFlashcard = `Bạn là trợ lý soạn thảo nội dung ôn thi nghiệp vụ Hải quan. Dưới đây là nội dung văn bản pháp luật:

--- NỘI DUNG VĂN BẢN ---
${contextContent}
-----------------------

NHIỆM VỤ: Sinh ra chính xác ${soLuongFlashcard || 10} flashcard (thẻ ghi nhớ) DỰA HOÀN TOÀN vào các khái niệm, định nghĩa, mốc thời gian, thẩm quyền, hoặc quy trình quan trọng trong văn bản.

QUY TẮC BẮT BUỘC:
1. Mặt trước (mat_truoc): Câu hỏi ngắn, thuật ngữ, hoặc tình huống cần ghi nhớ.
2. Mặt sau (mat_sau): Câu trả lời súc tích, rõ ràng, kèm trích dẫn Điều/Khoản căn cứ.
3. CHỈ TRẢ VỀ DUY NHẤT 1 MẢNG JSON HỢP LỆ (không kèm markdown format, không bọc \`\`\`json, không thêm lời dẫn) theo mẫu:
[
  {
    "mat_truoc": "Khái niệm X là gì?",
    "mat_sau": "Là ... (theo Điều Y)"
  }
]
`;

      const aiResFlashcard = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [{ role: 'user', content: promptFlashcard }],
        temperature: 0.2,
        max_tokens: 3000,
      });

      const rawFlashcard = aiResFlashcard?.response || (typeof aiResFlashcard === 'string' ? aiResFlashcard : '');
      try {
        const listFlashcard = parseAIJson<any[]>(rawFlashcard);
        if (Array.isArray(listFlashcard) && listFlashcard.length > 0) {
          const insertRows = listFlashcard.map(item => ({
            chuyen_de_id: chuyenDeId,
            mat_truoc: item.mat_truoc || '',
            mat_sau: item.mat_sau || '',
            nguon_file: nguonFile,
            trang_thai: 'cho_duyet',
            tao_boi_ai: true,
          }));

          const { error: insFcErr } = await supabaseAdmin.from('flashcard_nhap').insert(insertRows);
          if (!insFcErr) {
            flashcardCount = insertRows.length;
          } else {
            console.error('Lỗi insert flashcard_nhap:', insFcErr);
          }
        }
      } catch (err) {
        console.error('Lỗi parse JSON flashcard AI:', err, rawFlashcard);
      }
    }

    revalidatePath('/admin/ai-soan-noi-dung');
    return {
      success: true,
      message: `Đã sinh thành công ${cauHoiCount} câu hỏi nháp và ${flashcardCount} flashcard nháp từ tài liệu PDF. Vui lòng rà duyệt!`,
      cauHoiCount,
      flashcardCount,
    };
  } catch (error: any) {
    console.error('Lỗi sinh nội dung AI:', error);
    return {
      success: false,
      message: error?.message || 'Đã xảy ra lỗi trong quá trình xử lý AI.',
    };
  }
}

// Lấy danh sách câu hỏi nháp
export async function getDanhSachCauHoiNhap(trangThai: string = 'cho_duyet', chuyenDeId?: string) {
  await checkAdminAuth();
  const supabaseAdmin = await createAdminClient();

  let query = supabaseAdmin
    .from('cau_hoi_nhap')
    .select(`
      *,
      danh_muc_chuyen_de (
        id,
        ten
      )
    `)
    .order('created_at', { ascending: false });

  if (trangThai && trangThai !== 'all') {
    query = query.eq('trang_thai', trangThai);
  }

  if (chuyenDeId && chuyenDeId !== 'all') {
    query = query.eq('chuyen_de_id', chuyenDeId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Lỗi lấy câu hỏi nháp:', error);
    return [];
  }
  return data || [];
}

// Lấy danh sách flashcard nháp
export async function getDanhSachFlashcardNhap(trangThai: string = 'cho_duyet', chuyenDeId?: string) {
  await checkAdminAuth();
  const supabaseAdmin = await createAdminClient();

  let query = supabaseAdmin
    .from('flashcard_nhap')
    .select(`
      *,
      danh_muc_chuyen_de (
        id,
        ten
      )
    `)
    .order('created_at', { ascending: false });

  if (trangThai && trangThai !== 'all') {
    query = query.eq('trang_thai', trangThai);
  }

  if (chuyenDeId && chuyenDeId !== 'all') {
    query = query.eq('chuyen_de_id', chuyenDeId);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Lỗi lấy flashcard nháp:', error);
    return [];
  }
  return data || [];
}

// Duyệt 1 câu hỏi nháp -> chuyển sang bảng cau_hoi thật
export async function duyetCauHoiNhap(id: string) {
  const user = await checkAdminAuth();
  const supabaseAdmin = await createAdminClient();

  const { data: nhap, error: fetchErr } = await supabaseAdmin
    .from('cau_hoi_nhap')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !nhap) {
    return { success: false, message: 'Không tìm thấy câu hỏi nháp.' };
  }

  // Ánh xạ do_kho sang integer: 'de' -> 1, 'trung_binh' -> 2, 'kho' -> 3
  const doKhoInt = nhap.do_kho === 'de' ? 1 : nhap.do_kho === 'kho' ? 3 : 2;

  // Insert vào bảng cau_hoi thật
  const { error: insErr } = await supabaseAdmin.from('cau_hoi').insert({
    chuyen_de_id: nhap.chuyen_de_id,
    noi_dung: nhap.noi_dung,
    cac_lua_chon: nhap.cac_lua_chon,
    dap_an_dung: nhap.dap_an_dung,
    giai_thich_chi_tiet: nhap.giai_thich_chi_tiet,
    can_cu_phap_ly: nhap.can_cu_phap_ly || '',
    do_kho: doKhoInt,
    phan_loai: nhap.phan_loai || 1,
    nguoi_tao_id: user.id,
  });

  if (insErr) {
    console.error('Lỗi duyệt câu hỏi nháp:', insErr);
    return { success: false, message: 'Lỗi khi lưu vào ngân hàng câu hỏi chính thức: ' + insErr.message };
  }

  // Cập nhật trạng thái câu hỏi nháp
  await supabaseAdmin
    .from('cau_hoi_nhap')
    .update({ trang_thai: 'da_duyet' })
    .eq('id', id);

  revalidatePath('/admin/ai-soan-noi-dung');
  revalidatePath('/admin/ngan-hang-de');
  return { success: true, message: 'Đã duyệt câu hỏi vào ngân hàng chính thức thành công!' };
}

// Từ chối câu hỏi nháp
export async function tuChoiCauHoiNhap(id: string) {
  await checkAdminAuth();
  const supabaseAdmin = await createAdminClient();

  const { error } = await supabaseAdmin
    .from('cau_hoi_nhap')
    .update({ trang_thai: 'tu_choi' })
    .eq('id', id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/ai-soan-noi-dung');
  return { success: true, message: 'Đã từ chối câu hỏi nháp.' };
}

// Cập nhật nội dung câu hỏi nháp
export async function suaCauHoiNhap(id: string, data: any) {
  await checkAdminAuth();
  const supabaseAdmin = await createAdminClient();

  const { error } = await supabaseAdmin
    .from('cau_hoi_nhap')
    .update({
      noi_dung: data.noi_dung,
      cac_lua_chon: data.cac_lua_chon,
      dap_an_dung: data.dap_an_dung,
      can_cu_phap_ly: data.can_cu_phap_ly,
      giai_thich_chi_tiet: data.giai_thich_chi_tiet,
      do_kho: data.do_kho,
      can_kiem_tra: data.can_kiem_tra,
    })
    .eq('id', id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/ai-soan-noi-dung');
  return { success: true, message: 'Đã cập nhật câu hỏi nháp.' };
}

// Duyệt flashcard nháp -> chuyển sang bảng flashcard thật
export async function duyetFlashcardNhap(id: string) {
  await checkAdminAuth();
  const supabaseAdmin = await createAdminClient();

  const { data: nhap, error: fetchErr } = await supabaseAdmin
    .from('flashcard_nhap')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !nhap) {
    return { success: false, message: 'Không tìm thấy flashcard nháp.' };
  }

  const { error: insErr } = await supabaseAdmin.from('flashcard').insert({
    chuyen_de_id: nhap.chuyen_de_id,
    mat_truoc: nhap.mat_truoc,
    mat_sau: nhap.mat_sau,
  });

  if (insErr) {
    return { success: false, message: 'Lỗi lưu flashcard: ' + insErr.message };
  }

  await supabaseAdmin
    .from('flashcard_nhap')
    .update({ trang_thai: 'da_duyet' })
    .eq('id', id);

  revalidatePath('/admin/ai-soan-noi-dung');
  revalidatePath('/admin/flashcard');
  return { success: true, message: 'Đã duyệt flashcard vào hệ thống thành công!' };
}

// Từ chối flashcard nháp
export async function tuChoiFlashcardNhap(id: string) {
  await checkAdminAuth();
  const supabaseAdmin = await createAdminClient();

  const { error } = await supabaseAdmin
    .from('flashcard_nhap')
    .update({ trang_thai: 'tu_choi' })
    .eq('id', id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/ai-soan-noi-dung');
  return { success: true, message: 'Đã từ chối flashcard nháp.' };
}

// Cập nhật flashcard nháp
export async function suaFlashcardNhap(id: string, mat_truoc: string, mat_sau: string) {
  await checkAdminAuth();
  const supabaseAdmin = await createAdminClient();

  const { error } = await supabaseAdmin
    .from('flashcard_nhap')
    .update({
      mat_truoc,
      mat_sau,
    })
    .eq('id', id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath('/admin/ai-soan-noi-dung');
  return { success: true, message: 'Đã cập nhật flashcard nháp.' };
}
