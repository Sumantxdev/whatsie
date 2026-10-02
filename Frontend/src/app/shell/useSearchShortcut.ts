import { useEffect } from 'react'

export function useSearchShortcut(onOpen: () => void): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const mod = e.metaKey || e.ctrlKey
      if ((mod && e.key.toLowerCase() === 'k') || e.key === '/') {
        const target = e.target as HTMLElement | null
        const typing =
          target &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        if (e.key === '/' && typing) return
        e.preventDefault()
        onOpen()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onOpen])
}
