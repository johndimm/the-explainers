'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

function HomeContent() {
  const router = useRouter()

  useEffect(() => {
    // Always redirect to library - current book is managed by database
    router.push('/library')
  }, [router])

  return (
    <div>
      {/* PWA disabled */}
    </div>
  )
}

export default function Home() {
  return <HomeContent />
}