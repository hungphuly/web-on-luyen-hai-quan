import { createClient, createAdminClient } from '@/lib/shared/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Users, FileText, CheckCircle, MessageSquare } from 'lucide-react';

export default async function AdminBaoCaoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('hoc_vien')
    .select('loai_tai_khoan')
    .eq('id', user.id)
    .single();

  if (profile?.loai_tai_khoan !== 'admin') {
    redirect('/');
  }

  // Use Admin Client to bypass RLS for aggregate counts
  const supabaseAdmin = await createAdminClient();

  const [
    { count: usersCount },
    { count: questionsCount },
    { count: mockExamsCount },
    { count: aiQueriesCount },
    { count: donateCount }
  ] = await Promise.all([
    supabaseAdmin.from('hoc_vien').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('cau_hoi').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('ket_qua_thi').select('*', { count: 'exact', head: true }).eq('loai_bai', 'thi_thu'),
    supabaseAdmin.from('ai_luot_hoi').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('ung_ho').select('*', { count: 'exact', head: true }).eq('trang_thai', 'thanh_cong')
  ]);

  const stats = [
    { label: 'Tổng Học viên', value: usersCount || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Tổng Câu hỏi', value: questionsCount || 0, icon: FileText, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Lượt Thi thử', value: mockExamsCount || 0, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'Lượt hỏi AI', value: aiQueriesCount || 0, icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
        <p className="text-gray-500 text-sm">Tổng hợp số liệu hoạt động của hệ thống.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-xl border p-6 shadow-sm flex items-center gap-4">
              <div className={`p-4 rounded-full ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Additional sections for future detailed reports */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Hoạt động Ủng hộ</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <span className="text-gray-600 font-medium">Lượt donate thành công</span>
            <span className="text-xl font-bold text-green-600">{donateCount || 0}</span>
          </div>
          <p className="text-xs text-gray-400 mt-4 italic">* Tính năng đối soát doanh thu chi tiết sẽ được bổ sung sau.</p>
        </div>
      </div>
    </div>
  );
}
