import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { upgradeType, userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    if (upgradeType !== 'complete_collection') {
      return NextResponse.json({ error: 'Invalid upgrade type' }, { status: 400 })
    }

    // In this simplified version, we just return success
    // No actual payment processing or database operations needed
    const allShakespearePlays = [
      'romeo-and-juliet',
      'hamlet',
      'macbeth',
      'othello',
      'king-lear',
      'julius-caesar',
      'a-midsummer-nights-dream',
      'much-ado-about-nothing',
      'twelfth-night',
      'as-you-like-it',
      'the-merchant-of-venice',
      'the-taming-of-the-shrew',
      'all-well-that-ends-well',
      'measure-for-measure',
      'the-comedy-of-errors',
      'love-labours-lost',
      'the-two-gentlemen-of-verona',
      'henry-v',
      'richard-iii',
      'henry-iv-part-1',
      'henry-iv-part-2',
      'henry-vi-part-1',
      'henry-vi-part-2',
      'henry-vi-part-3',
      'richard-ii',
      'king-john',
      'henry-viii',
      'the-tempest',
      'the-winters-tale',
      'cymbeline',
      'pericles',
      'the-two-noble-kinsmen',
      'titus-andronicus',
      'timon-of-athens',
      'coriolanus',
      'antony-and-cleopatra',
      'troilus-and-cressida'
    ]

    return NextResponse.json({
      success: true,
      message: 'Upgrade successful! You now have access to all Shakespeare plays.',
      ownedPlays: allShakespearePlays,
      user_id: userId
    })

  } catch (error) {
    console.error('Upgrade error:', error)
    return NextResponse.json({ error: 'Upgrade failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    // Return mock ownership data (no authentication required)
    const mockOwnedPlays = [
      { playId: 'romeo-and-juliet', playTitle: 'Romeo and Juliet', purchaseDate: '2024-01-01' },
      { playId: 'hamlet', playTitle: 'Hamlet', purchaseDate: '2024-01-02' }
    ]

    return NextResponse.json({
      ownedPlays: mockOwnedPlays,
      user_id: userId
    })

  } catch (error) {
    console.error('Get ownership error:', error)
    return NextResponse.json({ error: 'Failed to get ownership' }, { status: 500 })
  }
}