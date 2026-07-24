export default function VerifyEmailNotice() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Vui lòng xác thực email</h1>
      <p className="text-muted-foreground mb-4 max-w-md">
        Bạn cần xác thực địa chỉ email để truy cập vào các tính năng ôn luyện.
        Chúng tôi đã gửi một email xác nhận đến địa chỉ của bạn.
      </p>
      <p className="text-sm">
        Sau khi xác nhận, hãy{' '}
        <a href="/login" className="text-blue-600 underline">
          đăng nhập lại
        </a>
      </p>
    </div>
  )
}
