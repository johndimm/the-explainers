'use client'

import Profile from '@/components/Profile'
import { useAuthenticatedProfile, AuthenticatedProfileProvider } from '@/contexts/AuthenticatedProfileContext'
import { useRouter } from 'next/navigation'

function ProfileContent() {
  const { profile, updateProfile } = useAuthenticatedProfile()
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
    <AuthenticatedProfileProvider>
      <ProfileContent />
    </AuthenticatedProfileProvider>
  )
}