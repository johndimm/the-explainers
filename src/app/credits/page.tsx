'use client'

import Pricing from '@/components/Pricing'
import { useRouter } from 'next/navigation'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'

function CreditsContent() {
  const router = useRouter()

  return (
    <Pricing
      isOpen={true}
      onClose={() => router.push('/reader')}
      bookTitle=""
      author=""
    />
  )
}

export default function CreditsPage() {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <CreditsContent />
      </SettingsProvider>
    </ProfileProvider>
  )
}