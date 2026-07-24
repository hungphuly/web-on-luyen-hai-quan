-- Function: handle_new_user
-- Tự động tạo bản ghi trong bảng hoc_vien khi có user mới đăng ký qua auth.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.hoc_vien (id, email, ho_ten)
  values (
    new.id,
    new.email,
    -- Lấy ho_ten từ raw_user_meta_data, nếu không có thì dùng 'Học viên ẩn danh'
    coalesce(new.raw_user_meta_data->>'ho_ten', 'Học viên ẩn danh')
  );
  return new;
end;
$$;

-- Trigger: on_auth_user_created
-- Lắng nghe sự kiện insert trên bảng auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
