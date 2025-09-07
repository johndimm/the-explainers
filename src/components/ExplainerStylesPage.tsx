'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ExplanationStyle } from './Settings'
import stylesCss from './ExplainerStyles.module.css'
import WikipediaLink from './WikipediaLink'
import { getPersonWikipediaSearchTerm } from '@/utils/wikipedia'
import FilteredStyleList from './FilteredStyleList'

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
}

export const STYLE_CATEGORIES = {
  critics: [
    { value: 'harold-bloom', name: 'Harold Bloom', description: 'Literary critic style' },
    { value: 'ts-eliot', name: 'T.S. Eliot', description: 'Modernist and allusive' },
    { value: 'john-ruskin', name: 'John Ruskin', description: 'Victorian art and social critic' },
    { value: 'samuel-johnson', name: 'Samuel Johnson', description: 'Classical English criticism' },
    { value: 'christopher-marlowe', name: 'Christopher Marlowe', description: 'Dramatic and poetic' },
    { value: 'ben-jonson', name: 'Ben Jonson', description: 'Satirical and classical' },
    { value: 'francis-bacon', name: 'Francis Bacon', description: 'Philosophical and aphoristic' },
  ],
  writers: [
    { value: 'david-foster-wallace', name: 'David Foster Wallace', description: 'Hyper-detailed and verbose' },
    { value: 'oscar-wilde', name: 'Oscar Wilde', description: 'Witty and paradoxical' },
    { value: 'maya-angelou', name: 'Maya Angelou', description: 'Poetic and profound' },
    { value: 'douglas-adams', name: 'Douglas Adams', description: 'Absurdist and witty' },
    { value: 'terry-pratchett', name: 'Terry Pratchett', description: 'Satirical and insightful' },
    { value: 'joan-didion', name: 'Joan Didion', description: 'Precise and evocative' },
    { value: 'david-sedaris', name: 'David Sedaris', description: 'Self-deprecating and observational' },
    { value: 'mark-twain', name: 'Mark Twain', description: 'Folksy wisdom and satire' },
    { value: 'rudyard-kipling', name: 'Rudyard Kipling', description: 'Imperial and storytelling' },
    { value: 'tom-wolfe', name: 'Tom Wolfe', description: 'New Journalism and electric prose' },
    { value: 'flannery-oconnor', name: 'Flannery O\'Connor', description: 'Gothic and darkly funny' },
    { value: 'anthony-bourdain', name: 'Anthony Bourdain', description: 'Irreverent and worldly' },
    { value: 'bill-bryson', name: 'Bill Bryson', description: 'Humorous and informative' },
    { value: 'stephen-fry', name: 'Stephen Fry', description: 'Erudite and charming' },
    { value: 'bernard-henri-levy', name: 'Bernard-Henri Lévy', description: 'Intellectual provocateur' },
    { value: 'michel-houellebecq', name: 'Michel Houellebecq', description: 'Nihilistic social critic' },
    { value: 'christopher-hitchens', name: 'Christopher Hitchens', description: 'Contrarian and erudite' },
    { value: 'charles-dickens', name: 'Charles Dickens', description: 'Victorian and social realist' },
    { value: 'cormac-mccarthy', name: 'Cormac McCarthy', description: 'Sparse and haunting' },
    { value: 'stephen-king', name: 'Stephen King', description: 'Lean, vivid, and suspenseful' },
    { value: 'william-shakespeare', name: 'William Shakespeare', description: 'Elizabethan drama, metaphor-rich, poetic' },
    { value: 'dorothy-parker', name: 'Dorothy Parker', description: 'Witty, sharp, and acerbic' },
    { value: 'ernest-hemingway', name: 'Ernest Hemingway', description: 'Sparse, direct, and masculine' },
    { value: 'james-joyce', name: 'James Joyce', description: 'Stream-of-consciousness, experimental, and linguistically innovative' },
    { value: 'samuel-beckett', name: 'Samuel Beckett', description: 'Absurdist, minimalist, and existential' },
    { value: 'kurt-vonnegut', name: 'Kurt Vonnegut', description: 'Satirical, darkly humorous, and humanistic' },
  ],
  politics: [
      { value: 'bernie-sanders', name: 'Bernie Sanders', description: 'Progressive populist and passionate advocate' },
      { value: 'martin-luther-king', name: 'Martin Luther King', description: 'Eloquent, inspiring, and morally grounded' },
      { value: 'john-f-kennedy', name: 'John F. Kennedy', description: 'Charismatic, optimistic, and forward-looking' },
      { value: 'james-carville', name: 'James Carville', description: 'Sharp political strategist and colorful commentator' },
      { value: 'donald-trump', name: 'Donald Trump', description: 'Demented sociopathic narcissist' },
      { value: 'george-w-bush', name: 'George W. Bush', description: 'Down-to-earth and folksy' },
      { value: 'barack-obama', name: 'Barack Obama', description: 'Eloquent, thoughtful, and inspiring' },
    ],
    comedians: [
    { value: 'jerry-seinfeld', name: 'Jerry Seinfeld', description: 'What\'s the deal with...' },
    { value: 'louis-ck', name: 'Louis C.K.', description: 'Observational and conversational' },
    { value: 'dave-chappelle', name: 'Dave Chappelle', description: 'Sharp social commentary' },
    { value: 'tina-fey', name: 'Tina Fey', description: 'Smart and satirical' },
    { value: 'amy-poehler', name: 'Amy Poehler', description: 'Energetic and optimistic' },
    { value: 'ricky-gervais', name: 'Ricky Gervais', description: 'Brutally honest and dry' },
    { value: 'sarah-silverman', name: 'Sarah Silverman', description: 'Dark humor and irony' },
    { value: 'john-mulaney', name: 'John Mulaney', description: 'Storytelling and precision' },
    { value: 'ali-wong', name: 'Ali Wong', description: 'Raw and unapologetic' },
    { value: 'bo-burnham', name: 'Bo Burnham', description: 'Meta and existential' },
    { value: 'andrew-dice-clay', name: 'Andrew Dice Clay', description: 'Edgy and brash' },
    { value: 'anthony-jeselnik', name: 'Anthony Jeselnik', description: 'Dark and calculated' },
    { value: 'doug-stanhope', name: 'Doug Stanhope', description: 'Nihilistic and raw' },
    { value: 'jim-norton', name: 'Jim Norton', description: 'Self-loathing and confessional' },
    { value: 'jim-jefferies', name: 'Jim Jefferies', description: 'Australian and irreverent' },
    { value: 'daniel-tosh', name: 'Daniel Tosh', description: 'Deadpan and cutting' },
    { value: 'andy-andrist', name: 'Andy Andrist', description: 'Midwest deadpan' },
    { value: 'bill-burr', name: 'Bill Burr', description: 'Boston rage and rants' },
    { value: 'lewis-black', name: 'Lewis Black', description: 'Furious and exasperated' },
    { value: 'george-carlin', name: 'George Carlin', description: 'Philosophical and subversive' },
    { value: 'sam-kinison', name: 'Sam Kinison', description: 'Screaming preacher energy' },
    { value: 'paul-mooney', name: 'Paul Mooney', description: 'Sharp social commentary' },
    { value: 'bill-hicks', name: 'Bill Hicks', description: 'Radical truth-telling' },
    { value: 'bob-saget', name: 'Bob Saget', description: 'Clean vs dirty contrast' },
    { value: 'norm-macdonald', name: 'Norm MacDonald', description: 'Deadpan anti-comedy genius' },
  ],
  talkShowHosts: [
    { value: 'oprah-winfrey', name: 'Oprah Winfrey', description: 'Inspiring and empathetic' },
    { value: 'david-letterman', name: 'David Letterman', description: 'Ironic and gap-toothed' },
    { value: 'conan-obrien', name: 'Conan O\'Brien', description: 'Absurdist and Harvard smart' },
    { value: 'stephen-colbert', name: 'Stephen Colbert', description: 'Satirical and theatrical' },
    { value: 'jimmy-fallon', name: 'Jimmy Fallon', description: 'Enthusiastic and playful' },
    { value: 'ellen-degeneres', name: 'Ellen DeGeneres', description: 'Kind and conversational' },
    { value: 'trevor-noah', name: 'Trevor Noah', description: 'Global perspective and charm' },
    { value: 'john-oliver', name: 'John Oliver', description: 'British wit and deep dives' },
    { value: 'jon-stewart', name: 'Jon Stewart', description: 'Sharp political insight' },
    { value: 'howard-stern', name: 'Howard Stern', description: 'Provocative and unfiltered' },
    { value: 'bill-maher', name: 'Bill Maher', description: 'Political satirist and contrarian' },
  ],
  other: [
    { value: 'carl-sagan', name: 'Carl Sagan', description: 'Cosmic wonder and curiosity' },
    { value: 'neil-degrasse-tyson', name: 'Neil deGrasse Tyson', description: 'Scientific and accessible' },
    { value: 'humphrey-bogart', name: 'Humphrey Bogart', description: 'Philip Marlowe hard-boiled detective' },
    { value: 'marilyn-monroe', name: 'Marilyn Monroe', description: 'Glamorous and vulnerable' },
    { value: 'louis-theroux', name: 'Louis Theroux', description: 'Curious, empathetic, and gently probing' },
    { value: 'robin-williams', name: 'Robin Williams', description: 'Energetic, improvisational, and heartfelt' },
    { value: 'aaron-sorkin', name: 'Aaron Sorkin', description: 'Rapid-fire dialogue and idealistic politics' },
    { value: 'woody-allen', name: 'Woody Allen', description: 'Neurotic, intellectual, and New York witty' },
  ]
} as const

const ExplainerStylesPage: React.FC<ExplainerStylesPageProps> = ({ 
  selectedStyle, 
  onStyleChange 
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedStyleName, setSelectedStyleName] = useState('')
  const router = useRouter()

  const handleStyleSelect = (style: ExplanationStyle) => {
    onStyleChange(style)
    // Get the style name for the confirmation modal
    const styleName = style === 'neutral' ? 'Neutral' : 
      Object.values(STYLE_CATEGORIES).flat().find(s => s.value === style)?.name || 'Unknown'
    setSelectedStyleName(styleName)
    setShowConfirmModal(true)
  }

  const handleConfirmReturn = () => {
    setShowConfirmModal(false)
    router.push('/reader')
  }

  const handleStayOnPage = () => {
    setShowConfirmModal(false)
  }

  const renderCategory = (categoryName: string, styles: readonly StyleOption[]) => (
    <div key={categoryName} className={`${stylesCss.category}`}>
      <h3 className={stylesCss.categoryTitle}>{categoryName}</h3>
      <FilteredStyleList
        styles={styles}
        selectedStyle={selectedStyle}
        onStyleSelect={handleStyleSelect}
        getPhotoSrc={getPhotoSrc}
        stylesCss={stylesCss}
      />
    </div>
  )

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '24px 16px',
      background: 'white',
      minHeight: '100vh'
    }}>
      <div style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold', 
            color: '#333', 
            margin: '0 0 8px 0',
            textAlign: 'center'
          }}>
            Choose Your Explainer
          </h2>
          <p style={{ 
            fontSize: '16px', 
            color: '#666', 
            margin: '0 0 24px 0',
            textAlign: 'center'
          }}>
            Select an explainer style to personalize your reading experience
          </p>
        </div>
        
        <div style={{ marginBottom: '32px' }}>
          {selectedStyle !== 'neutral' && (() => {
            const selected = Object.values(STYLE_CATEGORIES).flat().find(s => s.value === selectedStyle)
            if (!selected) return null
            return (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px', 
                margin: '16px 0',
                background: '#f8f9fa',
                border: '1px solid #e9ecef',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <img 
                  src={getPhotoSrc(selected.value)}
                  alt={selected.name}
                  style={{ 
                    width: '80px',
                    height: '80px',
                    objectFit: 'cover',
                    borderRadius: '50%',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                  }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 600, fontSize: '18px' }}>{selected.name}</div>
                    <WikipediaLink 
                      searchTerm={getPersonWikipediaSearchTerm(selected.name)}
                      style={{ 
                        fontSize: '14px'
                      }}
                    />
                  </div>
                  <div style={{ color: '#666', fontSize: '14px' }}>{selected.description}</div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Neutral Option */}
        <div style={{ marginBottom: '32px' }}>
          <div
            className={`${stylesCss.styleOption} ${selectedStyle === 'neutral' ? stylesCss.selected : ''}`}
            onClick={() => handleStyleSelect('neutral')}
            style={{ 
              position: 'relative',
              maxWidth: '400px',
              margin: '0 auto'
            }}
          >
            <div className={stylesCss.neutralIcon}>
              ⚖️
            </div>
            <div className={stylesCss.styleInfo}>
              <div className={stylesCss.styleName}>
                Neutral
              </div>
              <div className={stylesCss.styleDescription}>Standard explanations</div>
            </div>
          </div>
        </div>

        {/* Style Categories */}
        <div>
          {renderCategory('Critics', STYLE_CATEGORIES.critics)}
          {renderCategory('Writers', STYLE_CATEGORIES.writers)}
          {renderCategory('Politics', STYLE_CATEGORIES.politics)}
          {renderCategory('Comedians', STYLE_CATEGORIES.comedians)}
          {renderCategory('Talk Show Hosts', STYLE_CATEGORIES.talkShowHosts)}
          {renderCategory('Other', STYLE_CATEGORIES.other)}
        </div>
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>✅</div>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '20px',
              fontWeight: '600',
              color: '#1a1a1a'
            }}>
              Explainer Updated!
            </h3>
            <p style={{
              margin: '0 0 24px 0',
              color: '#666',
              fontSize: '16px',
              lineHeight: '1.5'
            }}>
              Your explainer has been changed to <strong>{selectedStyleName}</strong>. 
              Would you like to return to the reader now?
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                onClick={handleStayOnPage}
                style={{
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#e5e7eb'}
                onMouseOut={(e) => e.currentTarget.style.background = '#f3f4f6'}
              >
                Stay Here
              </button>
              <button
                onClick={handleConfirmReturn}
                style={{
                  background: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#7c3aed'}
                onMouseOut={(e) => e.currentTarget.style.background = '#8b5cf6'}
              >
                Go to Reader
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExplainerStylesPage
