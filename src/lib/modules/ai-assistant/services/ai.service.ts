import { createClient, createAdminClient } from '@/lib/shared/utils/supabase/server';

export async function searchContext(query: string): Promise<string> {
  const supabase = await createClient();
  const searchTerms = query
    .toLowerCase()
    .replace(/[^\w\s\u00C0-\u1EF9]/g, '')
    .split(' ')
    .filter(word => word.length > 2)
    .slice(0, 3); // Lấy tối đa 3 từ khóa chính để tìm

  if (searchTerms.length === 0) {
    return '';
  }

  let contextBlocks: string[] = [];

  // 1. Tìm trong Bài giảng lý thuyết
  let lyThuyetQuery = supabase.from('bai_giang_ly_thuyet').select('tieu_de, noi_dung_markdown').limit(2);
  let lyThuyetFilters: string[] = [];
  searchTerms.forEach(term => {
    lyThuyetFilters.push(`noi_dung_markdown.ilike.%${term}%`);
    lyThuyetFilters.push(`tieu_de.ilike.%${term}%`);
  });
  lyThuyetQuery = lyThuyetQuery.or(lyThuyetFilters.join(','));

  const { data: lyThuyetData } = await lyThuyetQuery;

  if (lyThuyetData && lyThuyetData.length > 0) {
    lyThuyetData.forEach(item => {
      const snippet = item.noi_dung_markdown.substring(0, 500);
      contextBlocks.push(`[Bài giảng: ${item.tieu_de}]: ${snippet}...`);
    });
  }
  
  // 2. Tìm trong bảng cau_hoi (bằng Admin Client)
  const supabaseAdmin = await createAdminClient();
  let cauHoiQuery = supabaseAdmin.from('cau_hoi').select('noi_dung, can_cu_phap_ly').limit(3);
  let cauHoiFilters: string[] = [];
  searchTerms.forEach(term => {
    cauHoiFilters.push(`noi_dung.ilike.%${term}%`);
    cauHoiFilters.push(`can_cu_phap_ly.ilike.%${term}%`);
  });
  cauHoiQuery = cauHoiQuery.or(cauHoiFilters.join(','));
  
  const { data: cauHoiData } = await cauHoiQuery;
  
  if (cauHoiData && cauHoiData.length > 0) {
    cauHoiData.forEach(item => {
      contextBlocks.push(`[Câu hỏi trắc nghiệm: ${item.noi_dung}] - Căn cứ pháp lý: ${item.can_cu_phap_ly}`);
    });
  }

  return contextBlocks.join('\n\n');
}
