/**
 * 角色卡图（可选，只在本地有）。
 *
 * 图放在 src/assets/role-art/<角色 id>.webp，那个目录被 git 忽略，见目录里的 README。
 * 构建时扫描一遍：有图的角色用图，没有的退回 catalog.ts 里的线条图标。
 */
import type { RoleId } from '@/api/types'

const files = import.meta.glob<string>('/src/assets/role-art/*.{webp,png,jpg,jpeg}', {
  eager: true,
  import: 'default',
})

const ART: ReadonlyMap<string, string> = new Map(
  Object.entries(files).map(([path, url]) => [fileStem(path), url]),
)

export function roleArt(role: RoleId): string | undefined {
  return ART.get(role)
}

/** '/src/assets/role-art/seer.webp' → 'seer' */
function fileStem(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1, path.lastIndexOf('.'))
}
