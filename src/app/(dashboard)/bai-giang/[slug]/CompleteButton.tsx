'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { markLessonComplete } from './actions'

interface CompleteButtonProps {
  lessonId: string;
  slug: string;
}

export function CompleteButton({ lessonId, slug }: CompleteButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleComplete = () => {
    startTransition(async () => {
      try {
        await markLessonComplete(lessonId, slug)
      } catch (error) {
        console.error(error)
        alert('Có lỗi xảy ra khi cập nhật tiến độ!')
      }
    })
  }

  return (
    <Button 
      onClick={handleComplete} 
      disabled={isPending}
      className="mt-6 w-full sm:w-auto"
    >
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle2 className="mr-2 h-4 w-4" />
      )}
      Đã đọc xong, tiếp tục
    </Button>
  )
}
