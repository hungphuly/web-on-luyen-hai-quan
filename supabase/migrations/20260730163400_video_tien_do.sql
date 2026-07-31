create table if not exists public.video_tien_do (
  id uuid default gen_random_uuid() primary key,
  hoc_vien_id uuid references auth.users(id) on delete cascade not null,
  bai_giang_video_id uuid references public.bai_giang_video(id) on delete cascade not null,
  phan_tram_da_xem numeric default 0,
  da_hoan_thanh boolean default false,
  unique(hoc_vien_id, bai_giang_video_id)
);

alter table public.video_tien_do enable row level security;

do $$
begin
  create policy "Học viên xem tiến độ video của mình"
    on public.video_tien_do for select
    using (auth.uid() = hoc_vien_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Học viên tạo tiến độ video của mình"
    on public.video_tien_do for insert
    with check (auth.uid() = hoc_vien_id);
exception when duplicate_object then null;
end $$;

do $$
begin
  create policy "Học viên cập nhật tiến độ video của mình"
    on public.video_tien_do for update
    using (auth.uid() = hoc_vien_id)
    with check (auth.uid() = hoc_vien_id);
exception when duplicate_object then null;
end $$;
