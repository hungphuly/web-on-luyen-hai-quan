'use server'

import { searchContext } from '@/lib/modules/ai-assistant/services/ai.service';

export async function hoiTroLyAI(cauHoi: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return "Hệ thống chưa được cấu hình API Key cho Trợ lý AI.";
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
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
      return data.candidates[0].content.parts[0].text;
    }
    
    return "Xin lỗi, tôi không thể tạo câu trả lời lúc này.";
    
  } catch (error) {
    console.error('Lỗi hỏi AI:', error);
    return "Xin lỗi, có lỗi hệ thống xảy ra.";
  }
}
