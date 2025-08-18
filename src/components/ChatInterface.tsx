'use client'

import React, { useState, useRef, useEffect } from 'react'
import styles from './ChatInterface.module.css'
import { SettingsData, LLMProvider, ResponseLength, ExplanationStyle } from './Settings'
import { ProfileData } from './Profile'
import { useProfile } from '../contexts/ProfileContext'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
}

interface ContextInfo {
  bookTitle: string
  author: string
  act: string | null
  scene: string | null
  speaker: string | null
  charactersOnStage: string[]
  selectedText: string
  beforeContext: string
  afterContext: string
}

interface ChatInterfaceProps {
  selectedText: string
  contextInfo: ContextInfo | null
  settings: SettingsData
  profile: ProfileData
  onClose: () => void
  onSettingsChange: (settings: SettingsData) => void
  bookTitle: string
  author: string
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedText, contextInfo, settings, profile, onClose, onSettingsChange, bookTitle, author }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(settings.llmProvider)
  const [currentStyle, setCurrentStyle] = useState<ExplanationStyle>(settings.explanationStyle)
  const [currentResponseLength, setCurrentResponseLength] = useState<ResponseLength>(settings.responseLength)
  const [hasChanges, setHasChanges] = useState(false)
  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const initializedRef = useRef(false)
  const { canUseExplanation, useExplanation, getBookExplanationsUsed } = useProfile()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (selectedText && !initializedRef.current) {
      initializedRef.current = true
      handleExplainText(selectedText)
    }
  }, [selectedText])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const hasProviderChange = selectedProvider !== settings.llmProvider
    const hasStyleChange = currentStyle !== settings.explanationStyle
    const hasLengthChange = currentResponseLength !== settings.responseLength
    setHasChanges(hasProviderChange || hasStyleChange || hasLengthChange)
  }, [selectedProvider, currentStyle, currentResponseLength, settings])

  const handleUpdateDefaults = () => {
    const updatedSettings: SettingsData = {
      ...settings,
      llmProvider: selectedProvider,
      explanationStyle: currentStyle,
      responseLength: currentResponseLength
    }
    onSettingsChange(updatedSettings)
    setHasChanges(false)
  }

  const callLLM = async (messages: Message[]): Promise<string> => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        provider: selectedProvider,
        responseLength: currentResponseLength,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.message
  }

  const getStylePersona = (style: ExplanationStyle): string => {
    switch (style) {
      case 'harold-bloom':
        return 'Respond in the style of Harold Bloom, the renowned literary critic. Use his characteristic passionate, erudite tone with deep literary analysis, references to the Western canon, and his concept of "the anxiety of influence." Be scholarly but accessible, with Bloom\'s distinctive voice and literary insights.'
      case 'carl-sagan':
        return 'Respond in the style of Carl Sagan, with his sense of cosmic wonder, scientific curiosity, and poetic language. Use his characteristic way of connecting human experiences to the vastness of the universe, his gentle but authoritative tone, and his gift for making complex ideas accessible and inspiring.'
      case 'louis-ck':
        return 'Respond in the style of Louis C.K.\'s observational comedy - conversational, self-deprecating, and finding the absurd in everyday situations. Use his characteristic "you know what I mean?" approach, honest observations about human nature, and ability to find humor in uncomfortable truths.'
      case 'david-foster-wallace':
        return 'Respond in the style of David Foster Wallace - hyper-detailed, intellectually rigorous, with extensive footnote-like asides and his characteristic way of examining the minutiae of human experience. Use his verbose, precise language and tendency to explore tangential but illuminating thoughts.'
      case 'neil-degrasse-tyson':
        return 'Respond in the style of Neil deGrasse Tyson - scientifically informed, accessible, and enthusiastic about connecting scientific principles to everyday life. Use his characteristic blend of authority and approachability, with his gift for making science relevant and exciting.'
      case 'oscar-wilde':
        return 'Respond in the style of Oscar Wilde - witty, paradoxical, and brilliantly quotable. Use his characteristic epigrams, dandyish observations about society, and his gift for turning conventional wisdom on its head with elegant prose and devastating wit.'
      case 'stephen-fry':
        return 'Respond in the style of Stephen Fry - erudite, charming, and delightfully verbose. Use his characteristic blend of vast knowledge, self-deprecating humor, and genuine enthusiasm for language, literature, and human curiosity. Include his tendency toward fascinating tangents.'
      case 'bill-bryson':
        return 'Respond in the style of Bill Bryson - humorous, informative, and gently self-mocking. Use his characteristic way of finding wonder in ordinary things, his dry observational humor, and his gift for making complex topics accessible through personal anecdotes and wit.'
      case 'maya-angelou':
        return 'Respond in the style of Maya Angelou - poetic, profound, and deeply humanistic. Use her characteristic lyrical language, wisdom drawn from lived experience, and her gift for finding universal truths in personal stories. Speak with warmth, dignity, and spiritual insight.'
      case 'anthony-bourdain':
        return 'Respond in the style of Anthony Bourdain - irreverent, worldly, and refreshingly honest. Use his characteristic blend of cynicism and genuine appreciation, his travel-worn perspective, and his ability to cut through pretense with sharp wit and authentic observation.'
      case 'douglas-adams':
        return 'Respond in the style of Douglas Adams - absurdist, witty, and delightfully tangential. Use his characteristic way of finding the ridiculous in the mundane, his love of elaborate metaphors, and his gift for making profound observations through comic absurdity.'
      case 'terry-pratchett':
        return 'Respond in the style of Terry Pratchett - satirical, insightful, and warmly humanistic. Use his characteristic footnote-heavy style, his ability to examine serious topics through humor, and his gift for finding profound truths in seemingly silly observations.'
      case 'joan-didion':
        return 'Respond in the style of Joan Didion - precise, evocative, and psychologically penetrating. Use her characteristic spare prose, her ability to capture the mood of a moment, and her gift for finding larger meanings in specific details and personal observations.'
      case 'jerry-seinfeld':
        return 'Respond in the style of Jerry Seinfeld - observational, questioning everything with "What\'s the deal with..." energy. Use his characteristic way of finding the absurd in everyday situations, his animated curiosity about human behavior, and his gift for making the mundane seem ridiculous.'
      case 'andrew-dice-clay':
        return 'Respond in the style of Andrew Dice Clay - edgy, brash, and unapologetically direct. Use his characteristic Brooklyn swagger, his no-nonsense attitude, and his ability to cut through pretense with blunt, streetwise observations.'
      case 'howard-stern':
        return 'Respond in the style of Howard Stern - provocative, unfiltered, and psychologically probing. Use his characteristic way of asking uncomfortable questions, his stream-of-consciousness style, and his gift for getting to the raw truth behind appearances.'
      case 'tina-fey':
        return 'Respond in the style of Tina Fey - smart, satirical, and self-aware. Use her characteristic wit, her ability to skewer targets with precision, and her gift for finding humor in workplace dynamics and social situations.'
      case 'dave-chappelle':
        return 'Respond in the style of Dave Chappelle - sharp social commentary with fearless honesty. Use his characteristic way of addressing difficult topics with humor, his masterful storytelling, and his gift for finding truth in controversial subjects.'
      case 'amy-poehler':
        return 'Respond in the style of Amy Poehler - energetic, optimistic, and empowering. Use her characteristic enthusiasm, her collaborative spirit, and her gift for finding the positive angle while still being hilariously honest.'
      case 'ricky-gervais':
        return 'Respond in the style of Ricky Gervais - brutally honest, dry, and irreverent. Use his characteristic British wit, his disdain for pretension, and his gift for saying what everyone thinks but is afraid to say.'
      case 'sarah-silverman':
        return 'Respond in the style of Sarah Silverman - dark humor mixed with unexpected innocence. Use her characteristic way of delivering shocking observations with a sweet smile, her subversive wit, and her gift for finding comedy in taboo subjects.'
      case 'john-mulaney':
        return 'Respond in the style of John Mulaney - precise storytelling with neurotic charm. Use his characteristic attention to detail, his self-deprecating observations about adulthood, and his gift for turning personal anxiety into universal comedy.'
      case 'ali-wong':
        return 'Respond in the style of Ali Wong - raw, unapologetic, and fiercely honest. Use her characteristic directness about life\'s realities, her fearless approach to uncomfortable topics, and her gift for finding strength in vulnerability.'
      case 'bo-burnham':
        return 'Respond in the style of Bo Burnham - meta, existential, and deeply self-aware. Use his characteristic way of questioning performance itself, his anxiety about modern life, and his gift for finding profound meaning in the absurdity of existence.'
      case 'oprah-winfrey':
        return 'Respond in the style of Oprah Winfrey - inspiring, empathetic, and transformational. Use her characteristic warmth, her ability to find the deeper meaning in everything, and her gift for making people feel seen and understood while empowering them to grow.'
      case 'david-letterman':
        return 'Respond in the style of David Letterman - ironic, self-deprecating, and delightfully awkward. Use his characteristic midwestern sensibility, his love of the absurd, and his gift for finding humor in his own discomfort and social situations.'
      case 'conan-obrien':
        return 'Respond in the style of Conan O\'Brien - absurdist, Harvard-educated smart, and gleefully ridiculous. Use his characteristic blend of high intellect and low comedy, his self-aware pomposity, and his gift for escalating situations to beautiful absurdity.'
      case 'stephen-colbert':
        return 'Respond in the style of Stephen Colbert - satirical, theatrical, and wickedly intelligent. Use his characteristic blend of political insight and character work, his love of wordplay, and his gift for skewering targets through exaggerated sincerity.'
      case 'jimmy-fallon':
        return 'Respond in the style of Jimmy Fallon - enthusiastic, playful, and genuinely delighted by everything. Use his characteristic boyish energy, his love of games and impressions, and his gift for finding joy and excitement in the smallest details.'
      case 'ellen-degeneres':
        return 'Respond in the style of Ellen DeGeneres - kind, conversational, and gently mischievous. Use her characteristic warmth, her ability to make everyone feel comfortable, and her gift for finding the fun and human connection in any situation.'
      case 'trevor-noah':
        return 'Respond in the style of Trevor Noah - globally aware, charming, and insightfully funny. Use his characteristic ability to bridge cultures, his gift for finding universal truths in specific experiences, and his warm, inclusive humor.'
      case 'john-oliver':
        return 'Respond in the style of John Oliver - British wit combined with obsessive research and righteous indignation. Use his characteristic way of diving deep into topics, his love of ridiculous tangents, and his gift for making serious points through elaborate comedic builds.'
      case 'jon-stewart':
        return 'Respond in the style of Jon Stewart - sharp political insight with exasperated humor. Use his characteristic way of cutting through BS, his genuine outrage at injustice tempered by comedy, and his gift for finding the human absurdity in serious situations.'
      case 'david-sedaris':
        return 'Respond in the style of David Sedaris - self-deprecating, observational, and deeply personal. Use his characteristic way of finding humor in family dysfunction and personal embarrassment, his gift for turning mundane experiences into hilarious stories, and his neurotic but lovable perspective.'
      case 'mark-twain':
        return 'Respond in the style of Mark Twain - folksy wisdom mixed with sharp social satire. Use his characteristic vernacular voice, his gift for exposing human folly through humor, and his ability to package profound insights in down-home common sense.'
      case 'ts-eliot':
        return 'Respond in the style of T.S. Eliot - modernist, allusive, and intellectually dense. Use his characteristic layering of literary references, his precise and sometimes fragmented language, and his gift for capturing the spiritual emptiness and complexity of modern life.'
      case 'rudyard-kipling':
        return 'Respond in the style of Rudyard Kipling - imperial storyteller with rhythmic prose. Use his characteristic adventure narrative voice, his gift for capturing the clash of cultures and the burden of empire, and his ability to find moral lessons in exotic tales.'
      case 'tom-wolfe':
        return 'Respond in the style of Tom Wolfe - New Journalism with electric, punctuation-heavy prose. Use his characteristic exclamatory style, his love of social status details, and his gift for capturing the manic energy and absurdity of American culture through vivid, stream-of-consciousness observations.'
      case 'flannery-oconnor':
        return 'Respond in the style of Flannery O\'Connor - Gothic Southern with dark humor and spiritual undertones. Use her characteristic way of finding grace in grotesque situations, her gift for exposing human pride and folly, and her ability to blend the sacred and profane in disturbing but illuminating ways.'
      case 'humphrey-bogart':
        return 'Respond in the style of Humphrey Bogart - tough, world-weary, and laconic. Use his characteristic film noir voice, his gift for cutting through sentiment with hard-boiled wisdom, and his ability to find truth in cynicism while maintaining a code of honor.'
      case 'anthony-jeselnik':
        return 'Respond in the style of Anthony Jeselnik - dark, calculated, and precisely cruel. Use his characteristic deadpan delivery, his gift for finding the darkest possible angle, and his ability to make shocking observations seem almost reasonable through perfect timing.'
      case 'doug-stanhope':
        return 'Respond in the style of Doug Stanhope - nihilistic, raw, and brutally honest about life\'s meaninglessness. Use his characteristic drunken philosopher approach, his gift for finding absurdity in tragedy, and his ability to make despair somehow funny.'
      case 'jim-norton':
        return 'Respond in the style of Jim Norton - self-loathing, confessional, and uncomfortably honest. Use his characteristic way of oversharing personal failures, his gift for making his own inadequacies universal, and his ability to find humor in self-destruction.'
      case 'jim-jefferies':
        return 'Respond in the style of Jim Jefferies - Australian, irreverent, and cheerfully offensive. Use his characteristic accent and bluntness, his gift for casual profanity, and his ability to make controversial points through disarming charm and logic.'
      case 'daniel-tosh':
        return 'Respond in the style of Daniel Tosh - deadpan, cutting, and deliberately offensive. Use his characteristic monotone delivery, his gift for finding the meanest possible observation, and his ability to make cruelty seem almost clinical.'
      case 'andy-andrist':
        return 'Respond in the style of Andy Andrist - Midwest deadpan with working-class sensibility. Use his characteristic understated delivery, his gift for finding humor in everyday frustrations, and his ability to make ordinary situations seem absurd through timing.'
      case 'bill-burr':
        return 'Respond in the style of Bill Burr - Boston rage, working-class rants, and furious honesty. Use his characteristic anger at everything, his gift for turning personal grievances into universal truths, and his ability to make fury both hilarious and cathartic.'
      case 'lewis-black':
        return 'Respond in the style of Lewis Black - furious, exasperated, and perpetually outraged. Use his characteristic finger-pointing fury, his gift for finding the stupidity in everything, and his ability to make anger seem both justified and ridiculous.'
      case 'george-carlin':
        return 'Respond in the style of George Carlin - philosophical, subversive, and systematically skeptical. Use his characteristic way of questioning everything, his gift for linguistic precision, and his ability to find profound social criticism in wordplay and observation.'
      case 'sam-kinison':
        return 'Respond in the style of Sam Kinison - screaming preacher energy with ex-evangelist rage. Use his characteristic LOUD delivery, his gift for turning personal pain into universal fury, and his ability to make religious references both sacred and profane.'
      case 'paul-mooney':
        return 'Respond in the style of Paul Mooney - sharp social commentary with fearless racial humor. Use his characteristic way of addressing uncomfortable truths, his gift for exposing hypocrisy, and his ability to make serious points through provocative comedy.'
      case 'bill-hicks':
        return 'Respond in the style of Bill Hicks - radical truth-telling with spiritual anger. Use his characteristic way of challenging everything, his gift for seeing through commercial BS, and his ability to make righteous fury both funny and enlightening.'
      case 'bob-saget':
        return 'Respond in the style of Bob Saget - the contrast between wholesome TV dad and filthy comedian. Use his characteristic way of subverting expectations, his gift for shocking through persona contrast, and his ability to be both sweet and dirty simultaneously.'
      case 'norm-macdonald':
        return 'Respond in the style of Norm MacDonald - deadpan anti-comedy genius with a love of subverting expectations. Use his characteristic way of telling jokes that aren\'t quite jokes, his gift for making the audience uncomfortable through timing and misdirection, and his ability to find humor in the spaces between punchlines.'
      default:
        return ''
    }
  }

  const createContextualPrompt = (text: string, context: ContextInfo | null): string => {
    let prompt = `Please explain this text: "${text}"`
    
    if (context) {
      prompt += `\n\nContext Information:`
      prompt += `\nBook: ${context.bookTitle} by ${context.author}`
      
      if (context.act) prompt += `\nAct: ${context.act}`
      if (context.scene) prompt += `\nScene: ${context.scene}`
      if (context.speaker) prompt += `\nSpeaker: ${context.speaker}`
      if (context.charactersOnStage.length > 0) {
        prompt += `\nCharacters on stage: ${context.charactersOnStage.join(', ')}`
      }
    }

    // Add user profile information
    if (profile.age || profile.language !== 'english' || profile.educationLevel) {
      prompt += `\n\nUser Profile:`
      if (profile.age) prompt += `\nAge: ${profile.age}`
      if (profile.language !== 'english') prompt += `\nLanguage: ${profile.language}`
      prompt += `\nEducation Level: ${profile.educationLevel}`
    }
    
    // Add style persona if not neutral
    const stylePersona = getStylePersona(currentStyle)
    if (stylePersona) {
      prompt += `\n\nStyle Instructions:\n${stylePersona}`
    }

    prompt += `\n\nInstructions:`
    
    // Add length-specific instructions
    if (currentResponseLength === 'brief') {
      prompt += `\n- KEEP IT VERY SHORT: Maximum 2-3 sentences. One screen of text only.`
      prompt += `\n- Be concise and direct. Focus on the most essential point only.`
    } else if (currentResponseLength === 'medium') {
      prompt += `\n- Keep response moderate length: 1-2 short paragraphs maximum.`
    } else {
      prompt += `\n- Provide a detailed explanation with full context and analysis.`
    }
    
    prompt += `\n- Explain unfamiliar terms and words used in unfamiliar ways`
    prompt += `\n- Explain why the character is saying this and what is happening at this moment`
    if (profile.language !== 'english') {
      prompt += `\n- Respond in ${profile.language}`
    }
    if (profile.age) {
      prompt += `\n- Use age-appropriate vocabulary for a ${profile.age}-year-old`
    }
    prompt += `\n- Use vocabulary appropriate for ${profile.educationLevel} level`
    prompt += `\n- Use clear, accessible language in your explanation`
    prompt += `\n- Format your response as a flowing narrative, not as answers to specific questions`
    
    return prompt
  }

  const handleExplainText = async (text: string) => {
    const useCustomLLM = selectedProvider === 'custom'
    
    // Check if user can use explanation
    if (!canUseExplanation(bookTitle, author, useCustomLLM)) {
      setShowPaymentPrompt(true)
      return
    }

    const promptText = createContextualPrompt(text, contextInfo)
    
    console.log('Full prompt sent to LLM:')
    console.log(promptText)
    console.log('Context info:', contextInfo)
    
    // Display only the selected text to the user, not the full prompt
    const userMessage: Message = {
      id: Date.now().toString(),
      content: `Please explain this text: "${text}"`,
      role: 'user',
      timestamp: new Date()
    }

    // But send the full contextual prompt to the LLM
    const llmMessage: Message = {
      id: 'llm-prompt',
      role: 'user',
      content: promptText,
      timestamp: new Date()
    }

    setMessages([userMessage])
    setIsLoading(true)

    try {
      // Use the explanation (deduct credits if needed)
      const success = useExplanation(bookTitle, author, useCustomLLM)
      if (!success) {
        setShowPaymentPrompt(true)
        setIsLoading(false)
        return
      }

      const response = await callLLM([llmMessage])
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error calling LLM:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while trying to explain this text. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    }

    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInputValue('')
    setIsLoading(true)

    try {
      const response = await callLLM(newMessages)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error calling LLM:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={styles.chatOverlay}>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <div>
            <h3>Text Explanation</h3>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
              {(() => {
                const useCustomLLM = selectedProvider === 'custom'
                const bookExplanationsUsed = getBookExplanationsUsed(bookTitle, author)
                const bookKey = `${bookTitle}-${author}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                const isBookPurchased = profile.purchasedBooks?.includes(bookKey)
                const hasUnlimited = profile.hasUnlimitedAccess && profile.unlimitedAccessExpiry && new Date() < new Date(profile.unlimitedAccessExpiry)
                
                if (useCustomLLM) return 'Free with your own LLM'
                if (hasUnlimited) return 'Unlimited access active'
                if (isBookPurchased) return 'Book purchased - unlimited explanations'
                if (bookExplanationsUsed < 3) return `${3 - bookExplanationsUsed} free explanations left for this book`
                return `${profile.availableCredits || 0} credits remaining`
              })()}
            </div>
          </div>
          <div className={styles.headerControls}>
            <div className={styles.providerSelector}>
              <select 
                value={selectedProvider} 
                onChange={(e) => setSelectedProvider(e.target.value as LLMProvider)}
                className={styles.providerSelect}
                disabled={isLoading}
              >
                <option value="anthropic">Claude (Anthropic)</option>
                <option value="openai">GPT-4 (OpenAI)</option>
                <option value="deepseek">DeepSeek</option>
                <option value="gemini">Gemini</option>
              </select>
            </div>
            <div className={styles.styleSelector}>
              <select 
                value={currentStyle} 
                onChange={(e) => setCurrentStyle(e.target.value as ExplanationStyle)}
                className={styles.styleSelect}
                disabled={isLoading}
              >
                <option value="neutral">Neutral</option>
                <option value="harold-bloom">Harold Bloom</option>
                <option value="carl-sagan">Carl Sagan</option>
                <option value="louis-ck">Louis C.K.</option>
                <option value="david-foster-wallace">David Foster Wallace</option>
                <option value="neil-degrasse-tyson">Neil deGrasse Tyson</option>
                <option value="oscar-wilde">Oscar Wilde</option>
                <option value="stephen-fry">Stephen Fry</option>
                <option value="bill-bryson">Bill Bryson</option>
                <option value="maya-angelou">Maya Angelou</option>
                <option value="anthony-bourdain">Anthony Bourdain</option>
                <option value="douglas-adams">Douglas Adams</option>
                <option value="terry-pratchett">Terry Pratchett</option>
                <option value="joan-didion">Joan Didion</option>
                <option value="jerry-seinfeld">Jerry Seinfeld</option>
                <option value="andrew-dice-clay">Andrew Dice Clay</option>
                <option value="howard-stern">Howard Stern</option>
                <option value="tina-fey">Tina Fey</option>
                <option value="dave-chappelle">Dave Chappelle</option>
                <option value="amy-poehler">Amy Poehler</option>
                <option value="ricky-gervais">Ricky Gervais</option>
                <option value="sarah-silverman">Sarah Silverman</option>
                <option value="john-mulaney">John Mulaney</option>
                <option value="ali-wong">Ali Wong</option>
                <option value="bo-burnham">Bo Burnham</option>
                <option value="oprah-winfrey">Oprah Winfrey</option>
                <option value="david-letterman">David Letterman</option>
                <option value="conan-obrien">Conan O'Brien</option>
                <option value="stephen-colbert">Stephen Colbert</option>
                <option value="jimmy-fallon">Jimmy Fallon</option>
                <option value="ellen-degeneres">Ellen DeGeneres</option>
                <option value="trevor-noah">Trevor Noah</option>
                <option value="john-oliver">John Oliver</option>
                <option value="jon-stewart">Jon Stewart</option>
                <option value="david-sedaris">David Sedaris</option>
                <option value="mark-twain">Mark Twain</option>
                <option value="ts-eliot">T.S. Eliot</option>
                <option value="rudyard-kipling">Rudyard Kipling</option>
                <option value="tom-wolfe">Tom Wolfe</option>
                <option value="flannery-oconnor">Flannery O'Connor</option>
                <option value="humphrey-bogart">Humphrey Bogart</option>
                <option value="anthony-jeselnik">Anthony Jeselnik</option>
                <option value="doug-stanhope">Doug Stanhope</option>
                <option value="jim-norton">Jim Norton</option>
                <option value="jim-jefferies">Jim Jefferies</option>
                <option value="daniel-tosh">Daniel Tosh</option>
                <option value="andy-andrist">Andy Andrist</option>
                <option value="bill-burr">Bill Burr</option>
                <option value="lewis-black">Lewis Black</option>
                <option value="george-carlin">George Carlin</option>
                <option value="sam-kinison">Sam Kinison</option>
                <option value="paul-mooney">Paul Mooney</option>
                <option value="bill-hicks">Bill Hicks</option>
                <option value="bob-saget">Bob Saget</option>
                <option value="norm-macdonald">Norm MacDonald</option>
              </select>
            </div>
            <div className={styles.lengthSelector}>
              <select 
                value={currentResponseLength} 
                onChange={(e) => setCurrentResponseLength(e.target.value as ResponseLength)}
                className={styles.lengthSelect}
                disabled={isLoading}
              >
                <option value="brief">Brief</option>
                <option value="medium">Medium</option>
                <option value="long">Long</option>
              </select>
            </div>
            <button 
              onClick={() => handleExplainText(selectedText)}
              disabled={isLoading}
              className={styles.reexplainButton}
              title="Re-explain in selected style"
            >
              Re-explain
            </button>
            {hasChanges && (
              <button 
                onClick={handleUpdateDefaults}
                className={styles.updateDefaultsButton}
                title="Save these settings as defaults"
              >
                Update Defaults
              </button>
            )}
          </div>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        
        <div className={styles.messagesContainer}>
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`${styles.message} ${styles[message.role]}`}
            >
              <div className={styles.messageContent}>
                <pre 
                  className={styles.messageText}
                  style={{ fontFamily: settings.chatFont }}
                >
                  {message.content}
                </pre>
              </div>
              <div className={styles.messageTime}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <div className={styles.messageContent}>
                <div className={styles.loadingDots}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className={styles.inputContainer}>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a follow-up question..."
            className={styles.messageInput}
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className={styles.sendButton}
          >
            Send
          </button>
        </div>
      </div>
      
      {showPaymentPrompt && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          border: '2px solid #8b5cf6',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
          zIndex: 3000,
          maxWidth: '400px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#8b5cf6' }}>More Explanations Available</h3>
          <p style={{ margin: '0 0 20px 0', lineHeight: '1.5' }}>
            You've used your free explanations for this book. Choose an option to continue:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
            <div style={{ 
              background: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px',
              border: '2px solid #10b981'
            }}>
              <strong style={{ color: '#10b981' }}>Unlimited Book Access - $5</strong>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                All explanations for "{bookTitle}" forever
              </div>
            </div>
            
            <div style={{ 
              background: '#f8f9fa', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #ddd'
            }}>
              <strong>100 Credits - $5</strong>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                Use across any books (1 credit per explanation)
              </div>
            </div>
            
            <div style={{ 
              background: '#fff3cd', 
              padding: '16px', 
              borderRadius: '8px',
              border: '1px solid #ffeaa7'
            }}>
              <strong>Bring Your Own LLM - Free!</strong>
              <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                Use your own API key in Settings
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button 
              onClick={() => setShowPaymentPrompt(false)}
              style={{
                padding: '10px 20px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              Maybe Later
            </button>
            <button 
              onClick={() => {
                setShowPaymentPrompt(false)
                alert('Payment processing coming soon! For now, try using your own LLM in Settings.')
              }}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                background: '#8b5cf6',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Get More Access
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatInterface