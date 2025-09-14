#!/usr/bin/env tsx

import { generateCharacterMapForText, logCharacterMap } from '../utils/dynamicCharacterMap'
import fs from 'fs'
import path from 'path'

async function testDynamicCharacterMap() {
  console.log('🎭 Testing Dynamic Character Map Generation')
  console.log('=' .repeat(50))
  
  // Test with a small sample of Twelfth Night
  const sampleText = `
ACT I.
SCENE I. An Apartment in the Duke's Palace.

Enter Orsino, Duke of Illyria, Curio, and other Lords; Musicians

DUKE.
If music be the food of love, play on;
Give me excess of it, that, surfeiting,
The appetite may sicken, and so die.
That strain again! it had a dying fall:
O, it came o'er my ear like the sweet sound,
That breathes upon a bank of violets,
Stealing and giving odour! Enough; no more:
'Tis not so sweet now as it was before.
O spirit of love! how quick and fresh art thou,
That, notwithstanding thy capacity
Receiveth as the sea, nought enters there,
Of what validity and pitch soe'er,
But falls into abatement and low price,
Even in a minute: so full of shapes is fancy
That it alone is high fantastical.

CURIO.
Will you go hunt, my lord?

DUKE.
What, Curio?

CURIO.
The hart.

DUKE.
Why, so I do, the noblest that I have:
O, when mine eyes did see Olivia first,
Methought she purged the air of pestilence!
That instant was I turn'd into a hart;
And my desires, like fell and cruel hounds,
E'er since pursue me. How now! what news from her?

Enter Valentine

VALENTINE.
So please my lord, I might not be admitted;
But from her handmaid do return this answer:
The element itself, till seven years' heat,
Shall not behold her face at ample view;
But, like a cloistress, she will veiled walk
And water once a day her chamber round
With eye-offending brine: all this to season
A brother's dead love, which she would keep fresh
And lasting in her sad remembrance.

DUKE.
O, she that hath a heart of that fine frame
To pay this debt of love but to a brother,
How will she love, when the rich golden shaft
Hath kill'd the flock of all affections else
That live in her; when liver, brain and heart,
These sovereign thrones, are all supplied, and fill'd
Her sweet perfections with one self king!
Away before me to sweet beds of flowers:
Love-thoughts lie rich when canopied with bowers.

[_Exit Curio._]

SCENE II. The sea-coast.

Enter Viola, a Captain and Sailors

VIOLA.
What country, friends, is this?

CAPTAIN.
This is Illyria, lady.

VIOLA.
And what should I do in Illyria?
My brother he is in Elysium.
Perchance he is not drown'd: what think you, sailors?

CAPTAIN.
It is perchance that you yourself were saved.

VIOLA.
O my poor brother! and so perchance may he be.

CAPTAIN.
True, madam: and, to comfort you with chance,
Assure yourself, after our ship did split,
When you and those poor number saved with you
Hung on our driving boat, I saw your brother,
Most provident in peril, bind himself,
Courage and hope both teaching him the practise,
To a strong mast that lived upon the sea;
Where, like Arion on the dolphin's back,
I saw him hold acquaintance with the waves
So long as I could see.

VIOLA.
For saying so, there's gold:
Mine own escape unfoldeth to my hope,
Wherein thy speech serves for authority,
The like of him. Know'st thou this country?

CAPTAIN.
Ay, madam, well; for I was bred and born
Not three hours' travel from this very place.

VIOLA.
Who governs here?

CAPTAIN.
A noble duke, in nature as in name.

VIOLA.
What is the name?

CAPTAIN.
Orsino.

VIOLA.
Orsino! I have heard my father name him:
He was a bachelor then.

CAPTAIN.
And so is now, or was so very late;
For but a month ago I went from hence,
And then 'twas fresh in murmur,--as, you know,
What great ones do the less will prattle of,--
That he did seek the love of fair Olivia.

VIOLA.
What's she?

CAPTAIN.
A virtuous maid, the daughter of a count
That died some twelvemonth since, then leaving her
In the protection of his son, her brother,
Who shortly also died: for whose dear love,
They say, she hath abjured the company
And sight of men.

VIOLA.
O that I served that lady
And might not be delivered to the world,
Till I had made mine own occasion mellow,
What my estate is!

CAPTAIN.
That were hard to compass;
Because she will admit no kind of suit,
No, not the duke's.

VIOLA.
There is a fair behavior in thee, captain;
And though that nature with a beauteous wall
Doth oft close in pollution, yet of thee
I will believe thou hast a mind that suits
With this thy fair and outward character.
I prithee, and I'll pay thee bounteously,
Conceal me what I am, and be my aid
For such disguise as haply shall become
The form of my intent. I'll serve this duke:
Thou shalt present me as an eunuch to him:
It may be worth thy pains; for I can sing
And speak to him in many sorts of music
That will allow me very worth his service.
What else may hap to time I will commit;
Only shape thou thy silence to my wit.

CAPTAIN.
Be you his eunuch, and your mute I'll be:
When my tongue blabs, then let mine eyes not see.

VIOLA.
I thank thee: lead me on.

[_Exit._]
`

  console.log('📖 Sample text loaded, generating character map...')
  
  try {
    const result = generateCharacterMapForText(sampleText)
    
    console.log(`\n✅ Character map generated successfully!`)
    console.log(`📊 Total entries: ${result.entries.length}`)
    
    // Log the character map
    logCharacterMap(result)
    
    // Test a few specific positions
    console.log('\n🔍 Testing character lookup at specific positions:')
    
    // Position 100 (should be in ACT I SCENE I with Duke, Curio, etc.)
    const pos100 = result.entries.find(entry => entry.offset <= 100)
    console.log(`Position 100: ${pos100 ? `[${pos100.characters.join(', ')}]` : 'No characters found'}`)
    
    // Position 500 (should be in ACT I SCENE I with Duke, Curio, Valentine)
    const pos500 = result.entries.find(entry => entry.offset <= 500)
    console.log(`Position 500: ${pos500 ? `[${pos500.characters.join(', ')}]` : 'No characters found'}`)
    
    // Position 1000 (should be in ACT I SCENE II with Viola, Captain, Sailors)
    const pos1000 = result.entries.find(entry => entry.offset <= 1000)
    console.log(`Position 1000: ${pos1000 ? `[${pos1000.characters.join(', ')}]` : 'No characters found'}`)
    
  } catch (error) {
    console.error('❌ Error generating character map:', error)
  }
}

// Run the test
testDynamicCharacterMap().catch(console.error)
