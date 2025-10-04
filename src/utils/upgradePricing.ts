export interface PlayOwnership {
  playId: string
  playTitle: string
  purchaseDate: string
}

export interface UpgradePricing {
  ownedPlays: number
  totalSpent: number
  upgradePrice: number
  totalCost: number
  savings: number
}

const INDIVIDUAL_PLAY_PRICE = 5
const COMPLETE_COLLECTION_PRICE = 20

/**
 * Calculate upgrade pricing based on owned plays
 */
export function calculateUpgradePricing(ownedPlays: PlayOwnership[]): UpgradePricing {
  const ownedCount = ownedPlays.length
  const totalSpent = ownedCount * INDIVIDUAL_PLAY_PRICE
  const upgradePrice = COMPLETE_COLLECTION_PRICE - totalSpent
  const totalCost = COMPLETE_COLLECTION_PRICE
  const savings = Math.max(0, totalSpent - COMPLETE_COLLECTION_PRICE)

  return {
    ownedPlays: ownedCount,
    totalSpent,
    upgradePrice: Math.max(0, upgradePrice), // Can't be negative
    totalCost,
    savings
  }
}

/**
 * Check if user is eligible for upgrade
 */
export function isEligibleForUpgrade(ownedPlays: PlayOwnership[]): boolean {
  const pricing = calculateUpgradePricing(ownedPlays)
  return pricing.ownedPlays > 0 && pricing.upgradePrice > 0 && pricing.upgradePrice < COMPLETE_COLLECTION_PRICE
}

/**
 * Get upgrade pricing display text
 */
export function getUpgradePricingText(ownedPlays: PlayOwnership[]): string {
  const pricing = calculateUpgradePricing(ownedPlays)
  
  if (pricing.ownedPlays === 0) {
    return "Complete Shakespeare Collection - $20"
  }
  
  if (pricing.upgradePrice === 0) {
    return "You already have the Complete Collection!"
  }
  
  return `You own ${pricing.ownedPlays} play${pricing.ownedPlays > 1 ? 's' : ''} ($${pricing.totalSpent}). Upgrade to Complete Collection for just $${pricing.upgradePrice} more!`
}

/**
 * Get upgrade savings text
 */
export function getUpgradeSavingsText(ownedPlays: PlayOwnership[]): string {
  const pricing = calculateUpgradePricing(ownedPlays)
  
  if (pricing.savings > 0) {
    return `Save $${pricing.savings} by upgrading!`
  }
  
  return ""
}