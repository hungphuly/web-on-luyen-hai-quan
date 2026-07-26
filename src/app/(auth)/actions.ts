'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/shared/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    ho_ten: formData.get('ho_ten') as string,
  }

  // Next.js requires origin for email redirect link
  // In a real app we might pass the origin properly, but for this project we'll rely on the default redirect url in Supabase config
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        ho_ten: data.ho_ten, // Pass this to raw_user_meta_data so our Postgres trigger can catch it
      },
    },
  })

  if (error) {
    redirect('/register?error=' + encodeURIComponent(error.message))
  }

  redirect('/verify-email-notice')
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  
  // Note: Since this is executed on the server, headers().get('origin') could be used to construct the URL,
  // but we can just use the path relative to the site url configured in Supabase.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  })

  if (error) {
    redirect('/quen-mat-khau?error=' + encodeURIComponent(error.message))
  }

  redirect('/quen-mat-khau?message=' + encodeURIComponent('Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư của bạn.'))
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    redirect('/reset-password?error=' + encodeURIComponent(error.message))
  }

  redirect('/login?message=' + encodeURIComponent('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.'))
}
