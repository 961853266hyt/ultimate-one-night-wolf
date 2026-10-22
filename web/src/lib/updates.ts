/**
 * 检查更新：服务器上的 version.json 写着现在是哪个版本、哪次打包，页面里记着自己是哪次打包的。
 * 加到手机主屏幕的网页常常还在跑旧的 JS，对一下就知道要不要重新加载。
 */
import { useCallback, useEffect, useState } from 'react'

export type UpdateStatus =
  | { state: 'checking' }
  | { state: 'latest' }
  | { state: 'available'; version: string }
  | { state: 'failed' }

/** 检查太快的话「正在检查」一闪就没了，至少转这么久。 */
const MIN_CHECK_MS = 600

async function check(): Promise<UpdateStatus> {
  try {
    const response = await fetch('/version.json', { cache: 'no-store' })
    if (!response.ok) return { state: 'failed' }
    const latest = (await response.json()) as { version: string; build: string }
    return latest.build === __BUILD_ID__ ? { state: 'latest' } : { state: 'available', version: latest.version }
  } catch {
    return { state: 'failed' }
  }
}

/** 一打开就检查一次；返回的 recheck 再查一次。 */
export function useUpdateStatus(): [UpdateStatus, () => void] {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'checking' })
  const recheck = useCallback(() => {
    setStatus({ state: 'checking' })
    const wait = new Promise((resolve) => setTimeout(resolve, MIN_CHECK_MS))
    void Promise.all([check(), wait]).then(([next]) => setStatus(next))
  }, [])
  useEffect(recheck, [recheck])
  return [status, recheck]
}

/**
 * 重新加载到最新版本。浏览器可能把 index.html 缓存着，直接刷新拿到的还是旧的，引用的也是旧的 JS：
 * 先绕过缓存把这个地址重新拉一遍（顺便把缓存换成新的），再跳过去。
 */
export async function reloadLatest(path: string) {
  const url = path + location.search
  try {
    await fetch(url, { cache: 'reload' })
  } catch {
    // 连不上服务器也照样刷新，至少重新连一次
  }
  if (url === location.pathname + location.search) location.reload()
  else location.assign(url)
}
