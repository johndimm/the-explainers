'use client'

import Profile from '@/components/Profile'
import { useProfile } from '@/contexts/ProfileContext'
import { useRouter } from 'next/navigation'
import { SettingsProvider } from '@/contexts/SettingsContext'

function ProfileContent() {
  const { profile, updateProfile } = useProfile()
  const router = useRouter()

  return (
    <Profile
      isOpen={true}
      onClose={() => router.push('/library')}
      profile={profile}
      onProfileChange={(newProfile) => {
        updateProfile(newProfile)
      }}
    />
  )
}

export default function ProfilePage() {
  return (
    <SettingsProvider>
      <ProfileContent />
    </SettingsProvider>
  )
}