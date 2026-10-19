/** 角色、房间、设置这类标签页的顶栏：只有标题。 */
export function TabHeader({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-15 items-center bg-background/95 px-5 backdrop-blur">
      <h1 className="text-[17px] font-semibold">{title}</h1>
    </header>
  )
}
