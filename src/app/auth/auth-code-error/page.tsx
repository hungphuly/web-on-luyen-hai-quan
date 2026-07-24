export default async function AuthCodeErrorPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const params = await searchParams;
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Xác thực thất bại</h1>
      <p className="text-muted-foreground mb-4 max-w-md">
        {params?.message || "Đường dẫn xác thực không hợp lệ hoặc đã hết hạn."}
      </p>
      <p className="text-sm">
        Vui lòng{' '}
        <a href="/login" className="text-blue-600 underline">
          đăng nhập
        </a>{' '}
        hoặc{' '}
        <a href="/register" className="text-blue-600 underline">
          đăng ký lại
        </a>
        .
      </p>
    </div>
  )
}
