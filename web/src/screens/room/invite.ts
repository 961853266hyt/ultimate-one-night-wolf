import { toast } from 'sonner'
import { roomUrl } from '@/api/session'
import { copyText } from '@/lib/clipboard'

/** 邀请朋友：能用系统分享就弹分享面板，不能就复制链接。 */
export async function inviteFriends(code: string): Promise<void> {
  const url = roomUrl(code)

  if (navigator.share) {
    try {
      await navigator.share({ title: '一夜狼', text: `来玩一夜狼，房间号 ${code}`, url })
      return
    } catch (error) {
      // 自己关掉了分享面板就算了；其他失败退回去复制链接
      if (error instanceof DOMException && error.name === 'AbortError') return
    }
  }

  if (await copyText(url)) {
    toast.success('邀请链接已复制，发给朋友吧')
  } else {
    toast(`房间号是 ${code}，告诉朋友就能进来`)
  }
}
