'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ExplanationStyle } from './Settings'
import stylesCss from './ExplainerStyles.module.css'
import FilteredStyleList from './FilteredStyleList'
import styleCategoriesData from '@/data/style-categories.json'

const getPhotoSrc = (value: ExplanationStyle) => {
  if (value === 'william-shakespeare') return '/icon-512x512.png'
  return `/explainer-photos/${value}.jpg`
}

interface ExplainerStylesPageProps {
  selectedStyle: ExplanationStyle
  onStyleChange: (style: ExplanationStyle) => void
}

interface StyleOption {
  value: ExplanationStyle
  name: string
  description: string
  wikipediaUrl?: string
  wikipediaTitle?: string
}

// Function to get style categories from JSON data with descriptions
function getStyleCategories() {
  // Add descriptions to the JSON data (since the JSON only has name and value)
  const descriptions: { [key: string]: string } = {
    'harold-bloom': 'Literary critic style',
    'ts-eliot': 'Modernist and allusive',
    'john-ruskin': 'Victorian art and social critic',
    'samuel-johnson': 'Classical English criticism',
    'christopher-marlowe': 'Dramatic and poetic',
    'ben-jonson': 'Satirical and classical',
    'francis-bacon': 'Philosophical and aphoristic',
    'david-foster-wallace': 'Hyper-detailed and verbose',
    'oscar-wilde': 'Witty and paradoxical',
    'maya-angelou': 'Poetic and profound',
    'douglas-adams': 'Absurdist and witty',
    'terry-pratchett': 'Satirical and insightful',
    'joan-didion': 'Precise and evocative',
    'david-sedaris': 'Self-deprecating and observational',
    'mark-twain': 'Folksy wisdom and satire',
    'rudyard-kipling': 'Imperial and storytelling',
    'tom-wolfe': 'New Journalism and electric prose',
    'flannery-oconnor': 'Gothic and darkly funny',
    'anthony-bourdain': 'Irreverent and worldly',
    'bill-bryson': 'Humorous and informative',
    'stephen-fry': 'Erudite and charming',
    'bernard-henri-levy': 'Intellectual provocateur',
    'michel-houellebecq': 'Nihilistic social critic',
    'christopher-hitchens': 'Contrarian and erudite',
    'charles-dickens': 'Victorian and social realist',
    'cormac-mccarthy': 'Sparse and haunting',
    'stephen-king': 'Lean, vivid, and suspenseful',
    'william-shakespeare': 'Elizabethan drama, metaphor-rich, poetic',
    'dorothy-parker': 'Witty, sharp, and acerbic',
    'ernest-hemingway': 'Sparse, direct, and masculine',
    'james-joyce': 'Stream-of-consciousness, experimental, and linguistically innovative',
    'samuel-beckett': 'Absurdist, minimalist, and existential',
    'kurt-vonnegut': 'Satirical, darkly humorous, and humanistic',
    'bernie-sanders': 'Progressive populist and passionate advocate',
    'martin-luther-king': 'Eloquent, inspiring, and morally grounded',
    'john-f-kennedy': 'Charismatic, optimistic, and forward-looking',
    'james-carville': 'Sharp political strategist and colorful commentator',
    'donald-trump': 'Demented sociopathic narcissist',
    'george-w-bush': 'Down-to-earth and folksy',
    'barack-obama': 'Eloquent, thoughtful, and inspiring',
    'jerry-seinfeld': 'What\'s the deal with...',
    'louis-ck': 'Observational and conversational',
    'dave-chappelle': 'Sharp social commentary',
    'tina-fey': 'Smart and satirical',
    'amy-poehler': 'Energetic and optimistic',
    'ricky-gervais': 'Brutally honest and dry',
    'sarah-silverman': 'Dark humor and irony',
    'john-mulaney': 'Storytelling and precision',
    'ali-wong': 'Raw and unapologetic',
    'bo-burnham': 'Meta and existential',
    'andrew-dice-clay': 'Edgy and brash',
    'anthony-jeselnik': 'Dark and calculated',
    'doug-stanhope': 'Nihilistic and raw',
    'jim-norton': 'Self-loathing and confessional',
    'jim-jefferies': 'Australian and irreverent',
    'daniel-tosh': 'Deadpan and cutting',
    'andy-andrist': 'Midwest deadpan',
    'bill-burr': 'Boston rage and rants',
    'lewis-black': 'Furious and exasperated',
    'george-carlin': 'Philosophical and subversive',
    'sam-kinison': 'Screaming preacher energy',
    'paul-mooney': 'Sharp social commentary',
    'bill-hicks': 'Radical truth-telling',
    'bob-saget': 'Clean vs dirty contrast',
    'norm-macdonald': 'Deadpan anti-comedy genius',
    'oprah-winfrey': 'Empathetic, inspiring, and deeply personal',
    'david-letterman': 'Dry wit and Midwestern charm',
    'conan-obrien': 'Self-deprecating and absurdist',
    'stephen-colbert': 'Satirical and politically sharp',
    'jimmy-fallon': 'Energetic and playful',
    'ellen-degeneres': 'Warm, funny, and uplifting',
    'trevor-noah': 'Global perspective and sharp wit',
    'john-oliver': 'British wit and thorough research',
    'jon-stewart': 'Sharp political commentary and humor',
    'howard-stern': 'Provocative and unfiltered',
    'bill-maher': 'Contrarian and politically incorrect',
    'carl-sagan': 'Scientific wonder and cosmic perspective',
    'neil-degrasse-tyson': 'Scientific enthusiasm and accessibility',
    'humphrey-bogart': 'Cool, understated, and world-weary',
    'marilyn-monroe': 'Vulnerable, charming, and iconic',
    'louis-theroux': 'Curious, empathetic, and gently probing',
    'robin-williams': 'Energetic, improvisational, and heartfelt',
    'aaron-sorkin': 'Rapid-fire dialogue and idealistic politics',
    'woody-allen': 'Neurotic, intellectual, and New York witty'
  }

  const result: { [key: string]: StyleOption[] } = {}
  
  for (const [categoryName, people] of Object.entries(styleCategoriesData)) {
    result[categoryName] = people.map((person: any) => ({
      value: person.value as ExplanationStyle,
      name: person.name,
      description: descriptions[person.value] || 'No description available',
      wikipediaUrl: person.wikipediaUrl,
      wikipediaTitle: person.wikipediaTitle
    }))
  }
  
  return result
}

const ExplainerStylesPage: React.FC<ExplainerStylesPageProps> = ({ 
  selectedStyle, 
  onStyleChange 
}) => {
  const router = useRouter()

  const handleStyleSelect = (style: ExplanationStyle) => {
    console.log('ExplainerStylesPage: Style selected:', style)
    onStyleChange(style)
    // Don't redirect - let user stay on the page to see their selection
  }

  const styleCategories = getStyleCategories()

  // Get the current selected style info
  const allStyles = Object.values(styleCategories).flat()
  const currentStyleData = allStyles.find(s => s.value === selectedStyle)

  return (
    <div className={stylesCss.container}>
      <div className={stylesCss.pageHeader}>
        <h1>Choose Your Explainer Style</h1>
        <p>Select a style to see how different voices would explain your text</p>
      </div>

      {currentStyleData && (
        <div className={stylesCss.selectedStyle}>
          <img 
            src={getPhotoSrc(currentStyleData.value)} 
            alt={currentStyleData.name}
            className={stylesCss.selectedPhoto}
          />
          <div className={stylesCss.selectedText}>
            <h2>{currentStyleData.name}</h2>
            <p>{currentStyleData.description}</p>
          </div>
        </div>
      )}

      {Object.entries(styleCategories).map(([categoryName, styles]) => (
        <div key={categoryName} className={stylesCss.categorySection}>
          <h2 className={stylesCss.categoryTitle}>
            {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
          </h2>
          <FilteredStyleList
            styles={styles}
            selectedStyle={selectedStyle}
            onStyleSelect={handleStyleSelect}
            getPhotoSrc={getPhotoSrc}
            stylesCss={stylesCss}
          />
        </div>
      ))}

    </div>
  )
}

export default ExplainerStylesPage