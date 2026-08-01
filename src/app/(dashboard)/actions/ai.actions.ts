'use server'

import { searchContext } from '@/lib/modules/ai-assistant/services/ai.service';
import { createClient, createAdminClient } from '@/lib/shared/utils/supabase/server';

export async function getAILuotHoiConLai() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Lấy loại tài khoản
  const { data: hocVien } = await supabase
    .from('hoc_vien')
    .select('loai_tai_khoan')
    .eq('id', user.id)
    .single();
    
  if (hocVien?.loai_tai_khoan !== 'free') {
    return { unlimited: true };
  }

  // Đếm số lượt hôm nay (dùng admin client vì RLS cản client select)
  const supabaseAdmin = await createAdminClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabaseAdmin
    .from('ai_luot_hoi')
    .select('*', { count: 'exact', head: true })
    .eq('hoc_vien_id', user.id)
    .gte('thoi_gian', today.toISOString());

  const used = count || 0;
  return { unlimited: false, limit: 10, used, remaining: Math.max(0, 10 - used) };
}

export async function hoiTroLyAI(cauHoi: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return "Hệ thống chưa được cấu hình API Key cho Trợ lý AI.";
  }

  const limitInfo = await getAILuotHoiConLai();
  if (limitInfo && !limitInfo.unlimited && limitInfo.remaining !== undefined && limitInfo.remaining <= 0) {
    return "Bạn đã dùng hết 10/10 lượt hỏi AI hôm nay. Vui lòng quay lại vào ngày mai!";
  }

  try {
    // 1. Tìm kiếm context trong DB
    const context = await searchContext(cauHoi);
    
    // Nếu không có context nào, ta vẫn cho AI trả lời nhưng bắt buộc từ chối
    const finalContext = context || "Không tìm thấy dữ liệu liên quan trong hệ thống.";

    // 2. Chuẩn bị prompt
    const systemPrompt = `Bạn là Trợ lý AI hỗ trợ ôn thi chứng chỉ nghiệp vụ Hải Quan.
Dưới đây là các thông tin ngữ cảnh được trích xuất từ cơ sở dữ liệu của hệ thống:

--- NGỮ CẢNH ---
${finalContext}
----------------

NGUYÊN TẮC BẮT BUỘC:
1. CHỈ trả lời dựa trên thông tin trong phần NGỮ CẢNH ở trên. KHÔNG TỰ SUY DIỄN hay lấy kiến thức bên ngoài.
2. Nếu câu hỏi không liên quan hoặc thông tin trong NGỮ CẢNH không đủ để trả lời, BẮT BUỘC phải nói chính xác câu này: "Chưa đủ căn cứ để trả lời chính xác, vui lòng liên hệ admin hoặc tra cứu văn bản gốc."
3. Tuyệt đối KHÔNG suy luận đáp án của các câu hỏi trắc nghiệm. Nếu người dùng hỏi "đáp án câu X là gì" hoặc yêu cầu giải câu trắc nghiệm, BẮT BUỘC từ chối và trả lời: "Tôi không được phép cung cấp đáp án trực tiếp. Vui lòng tự làm bài hoặc xem phần giải thích sau khi nộp bài."
4. Luôn trích dẫn nguồn (VD: [Bài giảng: ...], hoặc Căn cứ pháp lý) ở cuối câu trả lời nếu bạn tìm thấy thông tin trong ngữ cảnh.
`;

    // 3. Gọi Gemini API (v1beta REST API)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          contents: [{
            role: 'user',
            parts: [{ text: cauHoi }]
          }],
          generationConfig: {
            temperature: 0.1, // Giữ temperature thấp để AI bám sát context, không sáng tạo
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      return "Xin lỗi, đã xảy ra lỗi khi kết nối với Trợ lý AI.";
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      const responseText = data.candidates[0].content.parts[0].text;
      
      // Nếu thành công, insert lịch sử
      if (limitInfo && !limitInfo.unlimited) {
        const supabaseAdmin = await createAdminClient();
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabaseAdmin.from('ai_luot_hoi').insert({ hoc_vien_id: user.id });
        }
      }
      
      return responseText;
    }
    
    return "Xin lỗi, tôi không thể tạo câu trả lời lúc này.";
    
  } catch (error) {
    console.error('Lỗi hỏi AI:', error);
    return "Xin lỗi, có lỗi hệ thống xảy ra.";
  }
}
