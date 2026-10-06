import { toast } from 'sonner'
import { roomUrl } from '@/api/session'
import { copyText } from '@/lib/clipboard'

/** 邀请朋友：把房间链接复制到剪贴板。 */
export async function inviteFriends(code: string): Promise<void> {
  if (await copyText(roomUrl(code))) {
    toast.success('已复制邀请链接')
  } else {
    toast(`房间号是 ${code}，告诉朋友就能进来`)
  }
}
