import Link from 'next/link'
import { connection } from 'next/server'
import { api } from '@/lib/api'

export default async function Home() {
  await connection()
  const health = await api.health.$get().then((r) => r.json()).catch(() => ({ ok: false }))
  return (
    <main className="p-6 space-y-2">
      <h1 className="text-xl font-bold">เรือนไฟ</h1>
      <p>api: {health.ok ? 'ok' : 'down'}</p>
      <nav className="flex gap-4 underline">
        <Link href="/m">แม่</Link>
        <Link href="/provider">หน่วยบริการ</Link>
        <Link href="/dtam">กรมฯ</Link>
      </nav>
    </main>
  )
}
