import { getLichSuOnLuyen } from '@/lib/modules/on-luyen/services/on-luyen.service';
import { getLichSuThiThu } from '@/lib/modules/thi-thu/services/thi-thu.service';
import { LichSuTabs } from './LichSuTabs';

export const metadata = {
  title: 'Lịch sử học tập - Ôn Luyện Hải Quan',
};

export default async function LichSuPage() {
  const lichSuOnLuyen = await getLichSuOnLuyen();
  const lichSuThiThu = await getLichSuThiThu();

  // Gom nhóm ôn luyện theo phien_id
  const groupedOnLuyen: Record<string, any[]> = {};
  lichSuOnLuyen.forEach((ls: any) => {
    const phienId = ls.phien_id || 'phien-cu';
    if (!groupedOnLuyen[phienId]) {
      groupedOnLuyen[phienId] = [];
    }
    groupedOnLuyen[phienId].push(ls);
  });

  const phienOnLuyenKeys = Object.keys(groupedOnLuyen).sort((a, b) => {
    const timeA = new Date(groupedOnLuyen[a][0].ngay_lam).getTime();
    const timeB = new Date(groupedOnLuyen[b][0].ngay_lam).getTime();
    return timeB - timeA;
  });

  // Gom nhóm thi thử theo id
  const groupedThiThu: Record<string, any> = {};
  lichSuThiThu.forEach((ls: any) => {
    groupedThiThu[ls.id] = ls;
  });
  
  const thiThuKeys = Object.keys(groupedThiThu).sort((a, b) => {
    const timeA = new Date(groupedThiThu[a].ngay_thi).getTime();
    const timeB = new Date(groupedThiThu[b].ngay_thi).getTime();
    return timeB - timeA;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-sans font-bold text-primary tracking-tight">Lịch sử học tập</h1>
        <p className="text-sm text-muted-foreground mt-2">Xem lại kết quả các bài thi thử và ôn luyện gần đây.</p>
      </div>

      <LichSuTabs 
        groupedOnLuyen={groupedOnLuyen} 
        groupedThiThu={groupedThiThu}
        phienOnLuyenKeys={phienOnLuyenKeys}
        thiThuKeys={thiThuKeys}
      />
    </div>
  );
}
