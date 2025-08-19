'use client'

import Profile from '@/components/Profile'
import { useProfile } from '@/contexts/ProfileContext'
import { useRouter } from 'next/navigation'
import { SettingsProvider } from '@/contexts/SettingsContext'
import { ProfileProvider } from '@/contexts/ProfileContext'

function ProfileContent() {
  const { profile, updateProfile } = useProfile()
  const router = useRouter()

  return (
    <Profile
      isOpen={true}
      onClose={() => router.push('/reader')}
      profile={profile}
      onProfileChange={(newProfile) => {
        updateProfile(newProfile)
        router.push('/reader')
      }}
    />
  )
}

export default function ProfilePage() {
  return (
    <ProfileProvider>
      <SettingsProvider>
        <ProfileContent />
      </SettingsProvider>
    </ProfileProvider>
  )
}