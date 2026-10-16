import { toast } from 'sonner'
import { roomUrl } from '@/api/session'
import { copyText } from '@/lib/clipboard'
import { t } from '@/i18n'

/** 邀请朋友：把房间链接复制到剪贴板。 */
export async function inviteFriends(code: string): Promise<void> {
  if (await copyText(roomUrl(code))) {
    toast.success(t().room.inviteCopied)
  } else {
    toast(t().room.inviteFallback(code))
  }
}
