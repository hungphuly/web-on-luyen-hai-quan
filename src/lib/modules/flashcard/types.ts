export interface Flashcard {
  id: string;
  chuyen_de_id: string;
  mat_truoc: string;
  mat_sau: string;
  created_at?: string;
}

export interface FlashcardTienDo {
  id: string;
  hoc_vien_id: string;
  flashcard_id: string;
  hop_so: number;
  ngay_on_lai_tiep_theo: string;
}
