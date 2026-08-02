'use server';

import { createClient } from '@/lib/shared/utils/supabase/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { layThongKeCaNhan, ThongKeCaNhanHocVien } from '../services/ai-coach.service';

export interface AICoachResponse {
  success: boolean;
  feedback?: string;
  generatedAt?: string;
  stats?: ThongKeCaNhanHocVien;
  error?: string;
}

export async function nhanXetHocTapAI(): Promise<AICoachResponse> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Bạn cần đăng nhập để xem nhận xét từ AI Coach.' };
    }

    // 1. Lấy dữ liệu thống kê cá nhân
    const stats = await layThongKeCaNhan(user.id);

    // 2. Nếu chưa có dữ liệu học tập
    if (!stats.coDuLieuHocTap) {
      return {
        success: true,
        feedback: `### 🌟 Chào mừng bạn đến với lộ trình Ôn thi Hải quan!
Bạn hiện chưa có dữ liệu học tập trên hệ thống. 

**Gợi ý bắt đầu ngay hôm nay:**
- 📖 **Học bài giảng lý thuyết:** Bắt đầu với chuyên đề *Thủ tục hải quan* hoặc *Pháp luật hải quan*.
- ✍️ **Làm bài ôn luyện:** Luyện tập từng câu hỏi để nắm chắc kiến thức cơ bản.
- ⏱️ **Thử sức với bài thi thử:** Làm quen với áp lực thời gian và cấu trúc đề thi.

Sau khi bạn hoàn thành một số bài học và câu hỏi ôn luyện, AI Coach sẽ phân tích và đưa ra lộ trình cá nhân hóa chính xác nhất cho bạn!`,
        generatedAt: new Date().toISOString(),
        stats
      };
    }

    // 3. Chuẩn bị ngữ cảnh tóm tắt số liệu (tuyệt đối không chứa nội dung câu hỏi)
    const chiTietText = stats.chiTietChuyenDe
      .map(cd => {
        const onLuyenStr = cd.onLuyen.soCauDaLam > 0 
          ? `Tỷ lệ đúng ${cd.onLuyen.tyLeDung}% (${cd.onLuyen.soCauDung}/${cd.onLuyen.soCauDaLam} câu)`
          : 'Chưa làm ôn luyện';
        const thiThuStr = cd.thiThu.soLuotThi > 0
          ? `${cd.thiThu.soLuotThi} lượt thi, Điểm TB: ${cd.thiThu.diemTrungBinh}/10 (Tỷ lệ đúng: ${cd.thiThu.tyLeDung}%)`
          : 'Chưa thi thử';
        const hocLieuStr = cd.hocLieu.tongSoBai > 0
          ? `Đã hoàn thành ${cd.hocLieu.tyLeHoanThanh}% (${cd.hocLieu.daHoanThanh}/${cd.hocLieu.tongSoBai} bài)`
          : '100%';

        return `* Chuyên đề: "${cd.tenChuyenDe}"
  - Ôn luyện: ${onLuyenStr}
  - Thi thử: ${thiThuStr}
  - Tiến độ bài giảng: ${hocLieuStr}`;
      })
      .join('\n\n');

    const promptUserData = `DƯỚI ĐÂY LÀ SỐ LIỆU HỌC TẬP THỰC TẾ CỦA HỌC VIÊN:
- Tổng quan Ôn luyện: ${stats.tongSoCauOnLuyen} câu đã làm, đúng ${stats.tongSoCauDungOnLuyen} câu (Tỷ lệ đúng chung: ${stats.tyLeDungOnLuyenChung}%).
- Tổng quan Thi thử: ${stats.tongSoLuotThiThu} lượt thi thử, Điểm trung bình chung: ${stats.diemThiThuTrungBinhChung}/10.
- Tiến độ bài giảng: Đã học ${stats.tongBaiHocLieuDaHoc}/${stats.tongBaiHocLieu} bài (${stats.tyLeHocLieuChung}%).
- Xu hướng 7 ngày gần đây: ${stats.xuHuong7Ngay.moTa}

CHI TIẾT TIẾN ĐỘ THEO TỪNG CHUYÊN ĐỀ:
${chiTietText}`;

    const systemPrompt = `Bạn là Huấn luyện viên học tập (AI Coach) cho học viên ôn thi Chứng chỉ Nghiệp vụ Hải quan.
Dựa trên số liệu tiến độ học tập ở trên, hãy đưa ra nhận xét cá nhân hóa ngắn gọn, thiết thực và động viên theo đúng 3 phần:

### 1. 🌟 Điểm mạnh nổi bật
(Nêu 1-2 điểm học viên đang làm tốt, chuyên đề có tỷ lệ đúng cao nhất hoặc tiến độ học tập tốt).

### 2. 🎯 Điểm cần cải thiện
(Chỉ ra 1-2 điểm còn yếu, nêu RÕ TÊN CHUYÊN ĐỀ có tỷ lệ đúng thấp hoặc chưa hoàn thành bài giảng).

### 3. 🚀 Đề xuất lộ trình tuần tới
(Đưa ra 2-3 hành động cụ thể: nên ưu tiên học bài giảng chuyên đề nào trước, nên làm thêm bao nhiêu câu ôn luyện hay thi thử chuyên đề nào).

NGUYÊN TẮC:
- Tuyệt đối chỉ dựa vào số liệu và tên chuyên đề được cung cấp, KHÔNG tự bịa tên chuyên đề khác.
- Giọng điệu nhiệt tình, truyền cảm hứng, gạch đầu dòng súc tích, dễ đọc.`;

    // 4. Gọi Cloudflare Workers AI
    const { env } = await getCloudflareContext({ async: true });
    const ai = (env as any)?.AI;

    if (!ai) {
      // Fallback khi chạy ở local environment không có Workers runtime
      return {
        success: true,
        feedback: `### 🌟 Nhận xét sơ bộ từ số liệu thực tế:
- **Tỷ lệ đúng ôn luyện chung:** ${stats.tyLeDungOnLuyenChung}% (${stats.tongSoCauDungOnLuyen}/${stats.tongSoCauOnLuyen} câu).
- **Điểm thi thử trung bình:** ${stats.diemThiThuTrungBinhChung}/10 qua ${stats.tongSoLuotThiThu} lượt thi.
- **Tiến độ học bài giảng:** ${stats.tyLeHocLieuChung}% (${stats.tongBaiHocLieuDaHoc}/${stats.tongBaiHocLieu} bài).
- **Xu hướng:** ${stats.xuHuong7Ngay.moTa}

*(Ghi chú: Lời nhận xét chi tiết bằng trí tuệ nhân tạo sẽ được kích hoạt đầy đủ trên máy chủ Cloudflare Workers)*`,
        generatedAt: new Date().toISOString(),
        stats
      };
    }

    const aiResponse = await ai.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: promptUserData }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    const responseText = aiResponse?.response || (typeof aiResponse === 'string' ? aiResponse : '');

    if (!responseText) {
      return { success: false, error: 'Không thể sinh nhận xét lúc này. Vui lòng thử lại sau!' };
    }

    return {
      success: true,
      feedback: responseText,
      generatedAt: new Date().toISOString(),
      stats
    };

  } catch (error: any) {
    console.error('Lỗi trong Server Action nhanXetHocTapAI:', error);
    return { success: false, error: 'Đã xảy ra lỗi khi xử lý nhận xét: ' + error.message };
  }
}
