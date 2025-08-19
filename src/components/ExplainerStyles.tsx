'use client'

import React, { useState } from 'react'
import { ExplanationStyle } from './Settings'
import stylesCss from './ExplainerStyles.module.css'

interface ExplainerStylesProps {
  isOpen: boolean
  onClose: () => void
  selectedStyle: ExplanationStyle
  onStyleChange: (style: ExplanationStyle) => void
}

interface StyleOption {
  value: ExplanationStyle
  name: string
  description: string
}

const STYLE_CATEGORIES = {
  critics: [
    { value: 'harold-bloom', name: 'Harold Bloom', description: 'Literary critic style' },
    { value: 'ts-eliot', name: 'T.S. Eliot', description: 'Modernist and allusive' },
    { value: 'john-ruskin', name: 'John Ruskin', description: 'Victorian art and social critic' },
    { value: 'samuel-johnson', name: 'Samuel Johnson', description: 'Classical English criticism' },
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
    { value: 'humphrey-bogart', name: 'Humphrey Bogart', description: 'Tough and world-weary' },
  ]
} as const

const ExplainerStyles: React.FC<ExplainerStylesProps> = ({ 
  isOpen, 
  onClose, 
  selectedStyle, 
  onStyleChange 
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  
  if (!isOpen) return null

  const handleStyleSelect = (style: ExplanationStyle) => {
    onStyleChange(style)
    onClose()
  }

  const renderCategory = (categoryName: string, styles: readonly StyleOption[]) => (
    <div key={categoryName} className={`${stylesCss.category}`}>
      <h3 className={stylesCss.categoryTitle}>{categoryName}</h3>
      <div className={stylesCss.styleGrid}>
        {styles.map((style) => (
          <div
            key={style.value}
            className={`${stylesCss.styleOption} ${selectedStyle === style.value ? stylesCss.selected : ''}`}
            onClick={() => handleStyleSelect(style.value)}
          >
            <img 
              src={`/explainer-photos/${style.value}.jpg`}
              alt={style.name}
              className={stylesCss.stylePhoto}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <div className={stylesCss.styleInfo}>
              <div className={stylesCss.styleName}>{style.name}</div>
              <div className={stylesCss.styleDescription}>{style.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'white',
        borderBottom: '1px solid #e0e0e0',
        padding: '8px 12px',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 'bold',
            color: '#333',
            lineHeight: '1.2'
          }}>
            The Explainers
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '11px', 
            color: '#666',
            fontStyle: 'italic',
            lineHeight: '1.2'
          }}>
            understand difficult texts
          </p>
        </div>
        {/* Hamburger menu for all devices */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            style={{
              padding: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
              color: '#333'
            }}
          >
            ☰
          </button>
          
          {showMobileMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              minWidth: '160px',
              zIndex: 1000
            }}>
              <a 
                href="/user-guide.html"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'block',
                  padding: '12px 16px',
                  color: '#333',
                  textDecoration: 'none',
                  borderBottom: '1px solid #f0f0f0'
                }}
                onClick={() => setShowMobileMenu(false)}
              >
                📖 User Guide
              </a>
              <button 
                onClick={() => {
                  window.location.href = '/?library=true'
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                📚 Library
              </button>
              <button 
                onClick={() => setShowMobileMenu(false)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0',
                  color: '#666'
                }}
              >
                🎭 Styles (current)
              </button>
              <button 
                onClick={() => {
                  window.location.href = '/?pricing=true'
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                💳 Credits
              </button>
              <button 
                onClick={() => {
                  window.location.href = '/?profile=true'
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f0f0f0'
                }}
              >
                👤 Profile
              </button>
              <button 
                onClick={() => {
                  window.location.href = '/?settings=true'
                  setShowMobileMenu(false)
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                ⚙️ Settings
              </button>
            </div>
          )}
        </div>
      </header>
    
    <div className={stylesCss.overlay} style={{ position: 'static', background: 'white', padding: '0', marginTop: '50px' }}>
      <div className={stylesCss.container} style={{ maxHeight: 'none', overflow: 'visible', boxShadow: 'none' }}>
        <div className={stylesCss.header}>
          <h2>Choose Your Explainer Style</h2>
        </div>
        
        <div className={stylesCss.content} style={{ maxHeight: 'none', overflow: 'visible' }}>
          <div className={stylesCss.currentSelection}>
            <span>Current: </span>
            <strong>
              {selectedStyle === 'neutral' ? 'Neutral' : 
                Object.values(STYLE_CATEGORIES).flat().find(s => s.value === selectedStyle)?.name || 'Unknown'}
            </strong>
          </div>

          <div 
            className={`${stylesCss.styleOption} ${selectedStyle === 'neutral' ? stylesCss.selected : ''}`}
            onClick={() => handleStyleSelect('neutral')}
          >
            <img 
              src="/explainer-photos/neutral.jpg"
              alt="Neutral"
              className={stylesCss.stylePhoto}
              onError={(e) => { e.currentTarget.style.display = 'none' }}
            />
            <div className={stylesCss.styleInfo}>
              <div className={stylesCss.styleName}>Neutral</div>
              <div className={stylesCss.styleDescription}>Standard explanations</div>
            </div>
          </div>

          {renderCategory('Critics', STYLE_CATEGORIES.critics)}
          {renderCategory('Writers', STYLE_CATEGORIES.writers)}
          {renderCategory('Comedians', STYLE_CATEGORIES.comedians)}
          {renderCategory('Talk Show Hosts', STYLE_CATEGORIES.talkShowHosts)}
          {renderCategory('Other', STYLE_CATEGORIES.other)}
        </div>
      </div>
    </div>
    </div>
  )
}

export default ExplainerStyles