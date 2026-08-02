'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, Compass, CheckCircle, TrendingUp, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { nhanXetHocTapAI, AICoachResponse } from '@/lib/modules/ai-coach/actions/ai-coach.actions';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AICoachCardProps {
  userId: string;
}

export function AICoachCard({ userId }: AICoachCardProps) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `ai_coach_feedback_${userId}`;

  // Kiểm tra cache trong localStorage khi load component
  useEffect(() => {
    try {
      const saved = localStorage.getItem(cacheKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const todayStr = new Date().toISOString().split('T')[0];
        // Nếu đã có nhận xét trong ngày hôm nay, nạp từ cache
        if (parsed && parsed.dateStr === todayStr && parsed.feedback) {
          setFeedback(parsed.feedback);
          setGeneratedAt(parsed.generatedAt);
          setStats(parsed.stats || null);
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc cache AI Coach từ localStorage:', e);
    }
  }, [cacheKey]);

  const handleFetchFeedback = async (isRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res: AICoachResponse = await nhanXetHocTapAI();
      if (res.success && res.feedback) {
        setFeedback(res.feedback);
        setGeneratedAt(res.generatedAt || new Date().toISOString());
        setStats(res.stats || null);

        // Lưu vào localStorage
        try {
          const todayStr = new Date().toISOString().split('T')[0];
          localStorage.setItem(
            cacheKey,
            JSON.stringify({
              feedback: res.feedback,
              generatedAt: res.generatedAt || new Date().toISOString(),
              dateStr: todayStr,
              stats: res.stats
            })
          );
        } catch (e) {
          console.warn('Lỗi lưu cache AI Coach vào localStorage:', e);
        }
      } else {
        setError(res.error || 'Không thể lấy nhận xét từ AI Coach lúc này.');
      }
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  // Helper render các đoạn Markdown đơn giản đẹp mắt
  const renderFormattedFeedback = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1" />;

          // Header 3 (###)
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-base font-bold text-gray-900 mt-4 first:mt-0 flex items-center gap-2 border-b pb-1.5">
                {trimmed.replace('### ', '')}
              </h4>
            );
          }

          // Header 2 (##)
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-lg font-extrabold text-primary mt-4 first:mt-0">
                {trimmed.replace('## ', '')}
              </h3>
            );
          }

          // Bullet points (- hoặc *)
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const content = trimmed.substring(2);
            return (
              <div key={idx} className="flex items-start gap-2 pl-1">
                <span className="text-primary font-bold mt-0.5">•</span>
                <div>{renderInlineBold(content)}</div>
              </div>
            );
          }

          // Đoạn văn thường
          return <p key={idx}>{renderInlineBold(trimmed)}</p>;
        })}
      </div>
    );
  };

  // Render text có định dạng **bold** hoặc *italic*
  const renderInlineBold = (str: string) => {
    const parts = str.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="italic text-gray-800">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-amber-50/30 rounded-3xl border border-emerald-100 shadow-sm p-6 sm:p-8 transition-all hover:shadow-md">
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-emerald-200/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-amber-200/20 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-primary to-emerald-700 text-white rounded-2xl shadow-sm shadow-emerald-900/10">
            <Sparkles className="w-6 h-6 text-accent animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-gray-900">AI Coach — Huấn Luyện Viên Cá Nhân</h3>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Workers AI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Phân tích số liệu thực tế, chỉ rõ điểm mạnh, điểm yếu và gợi ý lộ trình bứt phá điểm số
            </p>
          </div>
        </div>

        {/* Action Button when feedback exists */}
        {feedback && !loading && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFetchFeedback(true)}
            className="text-xs h-9 rounded-xl border-emerald-200 hover:bg-emerald-50 text-emerald-900 gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-primary" />
            Làm mới phân tích
          </Button>
        )}
      </div>

      {/* Body Content */}
      <div className="relative z-10 mt-5">
        {/* State 1: Chưa bấm xem nhận xét */}
        {!feedback && !loading && !error && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
            <div className="space-y-2 text-center sm:text-left">
              <p className="text-sm text-gray-700">
                AI Coach sẽ tự động tổng hợp toàn bộ kết quả ôn luyện, điểm thi thử và tiến độ học bài giảng của riêng bạn để đưa ra lời khuyên tối ưu nhất cho tuần tới.
              </p>
              <div className="flex flex-wrap gap-2 pt-1 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 font-medium">
                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Đúng trọng tâm
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 font-medium">
                  <TrendingUp className="w-3 h-3 text-amber-600" /> Bám sát chuyên đề
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 font-medium">
                  <Compass className="w-3 h-3 text-blue-600" /> Lộ trình rõ ràng
                </span>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => handleFetchFeedback(false)}
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-6 py-3 rounded-2xl shadow-md gap-2 shrink-0 w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 text-accent" />
              Xem nhận xét từ AI Coach
            </Button>
          </div>
        )}

        {/* State 2: Đang tải */}
        {loading && (
          <div className="py-8 text-center space-y-4">
            <div className="inline-flex p-3 rounded-full bg-emerald-50 border border-emerald-100 animate-spin">
              <RefreshCw className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">AI Coach đang phân tích số liệu học tập của bạn...</p>
              <p className="text-xs text-muted-foreground mt-1">Đang đánh giá tỷ lệ ôn luyện, bài thi thử và tiến độ học liệu</p>
            </div>
          </div>
        )}

        {/* State 3: Lỗi */}
        {error && !loading && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
            <div className="space-y-2">
              <p className="font-semibold">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFetchFeedback(true)}
                className="text-xs bg-white border-red-200 text-red-700 hover:bg-red-50"
              >
                Thử lại
              </Button>
            </div>
          </div>
        )}

        {/* State 4: Đã có kết quả nhận xét */}
        {feedback && !loading && (
          <div className="space-y-4">
            {/* Quick Stats pill bar if stats exist */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-white/80 border border-gray-100">
                <div className="text-center p-2 rounded-xl bg-emerald-50/50">
                  <p className="text-xs text-muted-foreground font-medium">Ôn luyện đúng</p>
                  <p className="text-lg font-black text-emerald-800">{stats.tyLeDungOnLuyenChung}%</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-blue-50/50">
                  <p className="text-xs text-muted-foreground font-medium">Điểm TB thi thử</p>
                  <p className="text-lg font-black text-blue-800">{stats.diemThiThuTrungBinhChung}/10</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-amber-50/50">
                  <p className="text-xs text-muted-foreground font-medium">Tiến độ bài giảng</p>
                  <p className="text-lg font-black text-amber-800">{stats.tyLeHocLieuChung}%</p>
                </div>
                <div className="text-center p-2 rounded-xl bg-purple-50/50">
                  <p className="text-xs text-muted-foreground font-medium">Xu hướng 7 ngày</p>
                  <p className="text-xs font-bold text-purple-800 mt-1 line-clamp-1 truncate" title={stats.xuHuong7Ngay.moTa}>
                    {stats.xuHuong7Ngay.trangThai === 'tien_bo' ? '📈 Tiến bộ' : stats.xuHuong7Ngay.trangThai === 'giam_sut' ? '📉 Cần cải thiện' : '📊 Ổn định'}
                  </p>
                </div>
              </div>
            )}

            {/* Markdown feedback block */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-emerald-100/70 shadow-sm">
              {renderFormattedFeedback(feedback)}
            </div>

            {/* Footer with generation timestamp */}
            {generatedAt && (
              <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground pt-1 px-1 gap-2">
                <span>
                  🕒 Đã cập nhật: {format(new Date(generatedAt), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                </span>
                <span className="italic text-gray-400">
                  * Kết quả được lưu tạm trong ngày để tối ưu tốc độ & tài nguyên.
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
