'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './ChatInterface.module.css'
import { SettingsData, LLMProvider, ResponseLength, ExplanationStyle } from './Settings'
import { ProfileData } from './Profile'
import { useProfile } from '../contexts/ProfileContext'
import { STYLE_CATEGORIES } from './ExplainerStyles'
import { log } from '../utils/log'

interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  provider?: LLMProvider | 'youtube'
  style?: ExplanationStyle
  videoId?: string
  videoTitle?: string
  rating?: 'good' | 'bad' | null
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
  isPageMode?: boolean
}

// Generate ordered list of all styles
const getAllStyles = () => {
  const allStyles: { value: ExplanationStyle, name: string }[] = [
    { value: 'neutral', name: 'Neutral' }
  ]
  
  // Add all categories in the same order as ExplainerStyles page
  Object.values(STYLE_CATEGORIES).flat().forEach(style => {
    allStyles.push({ value: style.value as ExplanationStyle, name: style.name })
  })
  
  return allStyles
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ selectedText, contextInfo, settings, profile, onClose, onSettingsChange, bookTitle, author, isPageMode = false }) => {
  log('ChatInterface: Received settings:', settings)
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>(settings.llmProvider)
  const [currentStyle, setCurrentStyle] = useState<ExplanationStyle>(settings.explanationStyle)
  const [currentResponseLength, setCurrentResponseLength] = useState<ResponseLength>(settings.responseLength)
  const [hasChanges, setHasChanges] = useState(false)
  const [showFullHistory, setShowFullHistory] = useState(false)
  const [originalSelectedText, setOriginalSelectedText] = useState("")
  const [showStyleMenu, setShowStyleMenu] = useState(false)
  const [showHelpPopup, setShowHelpPopup] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareFormData, setShareFormData] = useState<{ title: string; content: string } | null>(null)
  const latestResponseRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const styleMenuRef = useRef<HTMLDivElement>(null)
  const initializedRef = useRef(false)
  const { canUseExplanation, useExplanation, getBookExplanationsUsed } = useProfile()

  const scrollToLatestResponse = () => {
    latestResponseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const saveChatHistory = () => {
    if (messages.length === 0) return
    
    const chatData = {
      bookTitle,
      author,
      selectedText: originalSelectedText,
      contextInfo,
      messages,
      settings: {
        provider: selectedProvider,
        style: currentStyle,
        responseLength: currentResponseLength
      },
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(chatData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-history-${bookTitle.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const shareToGitHub = () => {
    if (!messages.length) return

    // Find the last AI response (excluding YouTube video messages)
    const lastAiMessage = [...messages].reverse().find(msg => 
      msg.role === 'assistant' && 
      !msg.content.includes('YouTube video') && 
      !msg.content.includes('🎬 Found related video') &&
      msg.content.length > 50  // Ensure it's a substantial response, not just a short message
    )

    if (!lastAiMessage) {
      alert('No AI response found to share.')
      return
    }

    // Build comprehensive content including the quote and context
    let content = ''
    
    // Find the selected text quote - try multiple sources
    let quoteText = ''
    if (selectedText && selectedText.trim()) {
      quoteText = selectedText.trim()
    } else if (originalSelectedText && originalSelectedText.trim()) {
      quoteText = originalSelectedText.trim()
    } else {
      // Look for the first user message in chat history as fallback
      const firstUserMessage = messages.find(msg => msg.role === 'user')
      if (firstUserMessage && firstUserMessage.content.trim()) {
        quoteText = firstUserMessage.content.trim()
      }
    }
    
    // Start with the selected text quote at the top
    if (quoteText) {
      content += `## Selected Text\n\n> ${quoteText}\n\n`
    }
    
    // Add the AI response
    content += `## AI Response\n\n${lastAiMessage.content}\n\n`
    
    // Add book context if available
    if (bookTitle || author) {
      content += `## Source\n\n`
      if (bookTitle) content += `**Book:** ${bookTitle}\n`
      if (author) content += `**Author:** ${author}\n`
      content += `\n`
    }
    
    // Add context info if available
    if (contextInfo) {
      content += `## Context\n\n`
      if (contextInfo.act) content += `**Act:** ${contextInfo.act}\n`
      if (contextInfo.scene) content += `**Scene:** ${contextInfo.scene}\n`
      if (contextInfo.speaker) content += `**Speaker:** ${contextInfo.speaker}\n`
      if (contextInfo.charactersOnStage && contextInfo.charactersOnStage.length > 0) {
        content += `**Characters on Stage:** ${contextInfo.charactersOnStage.join(', ')}\n`
      }
      content += `\n`
    }
    
    content += `---\n*Shared from The Explainers App*`

    const title = `AI Explanation: ${bookTitle || 'Text Passage'}`
    setShareFormData({ title, content })
    setShowShareModal(true)
  }

  const rateResponse = (messageId: string, rating: 'good' | 'bad') => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, rating } : msg
    ))
  }

  const getRatingIcon = (rating: 'good' | 'bad' | null | undefined) => {
    if (rating === 'good') return '👍'
    if (rating === 'bad') return '👎'
    return null
  }

  const getDisplayedMessages = () => {
    if (showFullHistory) {
      return messages
    }
    
    if (messages.length <= 2) {
      return messages
    }
    
    // Find the index of the last user message (most recent quote)
    let lastUserMessageIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMessageIndex = i
        break
      }
    }
    
    // If we found a user message, show it and all assistant messages that follow
    // This allows multiple re-explanations of the same quote to all be visible
    if (lastUserMessageIndex >= 0) {
      return messages.slice(lastUserMessageIndex)
    }
    
    // Fallback to showing all messages if no user message found
    return messages
  }

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
      // Only scroll when a new assistant message is added
      setTimeout(() => scrollToLatestResponse(), 100)
    }
  }, [messages])

  // Load chat history from sessionStorage
  useEffect(() => {
    const savedMessages = sessionStorage.getItem('chatHistory')
    if (savedMessages && isPageMode) {
      try {
        const parsedMessages = JSON.parse(savedMessages)
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })))
      } catch (error) {
        console.error('Error loading chat history:', error)
      }
    }
  }, [isPageMode])

  // Save chat history to sessionStorage
  useEffect(() => {
    if (isPageMode && messages.length > 0) {
      sessionStorage.setItem('chatHistory', JSON.stringify(messages))
    }
  }, [messages, isPageMode])

  useEffect(() => {
    if (selectedText && !initializedRef.current) {
      setOriginalSelectedText(selectedText)
      initializedRef.current = true
      handleExplainText(selectedText)
    }
  }, [selectedText])

  // Set original selected text when it becomes available
  useEffect(() => {
    log('ChatInterface: selectedText changed:', selectedText)
    log('ChatInterface: current originalSelectedText:', originalSelectedText)
    
    if (selectedText) {
      // Always update originalSelectedText when selectedText changes
      if (selectedText !== originalSelectedText) {
        log('ChatInterface: Updating originalSelectedText from selectedText:', selectedText)
        setOriginalSelectedText(selectedText)
      }
    }
  }, [selectedText, originalSelectedText])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Update current time every minute for countdown display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const hasProviderChange = selectedProvider !== settings.llmProvider
    const hasStyleChange = currentStyle !== settings.explanationStyle
    const hasLengthChange = currentResponseLength !== settings.responseLength
    const newHasChanges = hasProviderChange || hasStyleChange || hasLengthChange
    console.log('hasChanges calculation:', { hasProviderChange, hasStyleChange, hasLengthChange, newHasChanges, selectedProvider, currentStyle, currentResponseLength, settingsProvider: settings.llmProvider, settingsStyle: settings.explanationStyle, settingsLength: settings.responseLength })
    setHasChanges(newHasChanges)
  }, [selectedProvider, currentStyle, currentResponseLength, settings.llmProvider, settings.explanationStyle, settings.responseLength])

  // Keep local chat controls in sync with global settings unless user changes them here
  useEffect(() => {
    log('ChatInterface: settings.llmProvider changed to:', settings.llmProvider)
    setSelectedProvider(settings.llmProvider)
  }, [settings.llmProvider])

  useEffect(() => {
    log('ChatInterface: settings.explanationStyle changed to:', settings.explanationStyle)
    setCurrentStyle(settings.explanationStyle)
  }, [settings.explanationStyle])

  useEffect(() => {
    log('ChatInterface: settings.responseLength changed to:', settings.responseLength)
    setCurrentResponseLength(settings.responseLength)
  }, [settings.responseLength])

  // Close custom style menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(event.target as Node)) {
        setShowStyleMenu(false)
      }
    }
    if (showStyleMenu) {
      document.addEventListener('mousedown', handleClickOutside as EventListener)
      document.addEventListener('touchstart', handleClickOutside as EventListener, { passive: true })
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside as EventListener)
      document.removeEventListener('touchstart', handleClickOutside as EventListener)
    }
  }, [showStyleMenu])

  // Don't auto-save immediately - let user see changes and use re-explain button
  // Settings will be saved when re-explain is used or when component unmounts


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
      case 'bernard-henri-levy':
        return 'Respond in the style of Bernard-Henri Lévy - intellectual provocateur and public intellectual. Use his characteristic blend of philosophical depth and media savvy, his gift for connecting literary analysis to contemporary politics and culture, and his ability to make grand pronouncements about civilization while remaining deeply engaged with specific texts.'
      case 'michel-houellebecq':
        return 'Respond in the style of Michel Houellebecq - nihilistic social critic and novelist. Use his characteristic cynical worldview, his gift for finding existential emptiness in human relationships and modern society, and his ability to combine literary analysis with bleak observations about contemporary life and sexual politics.'
      case 'bill-maher':
        return 'Respond in the style of Bill Maher - political satirist and contrarian talk show host. Use his characteristic blend of liberal politics with contrarian viewpoints, his gift for making provocative observations about society and politics, and his ability to challenge conventional wisdom with sharp wit and irreverent commentary.'
      case 'john-ruskin':
        return 'Respond in the style of John Ruskin - Victorian art and social critic. Use his characteristic moral passion about art and society, his gift for connecting aesthetic beauty to social justice, and his ability to see art as a reflection of the moral health of civilization.'
      case 'samuel-johnson':
        return 'Respond in the style of Samuel Johnson - classical English critic and moralist. Use his characteristic authoritative pronouncements, his gift for memorable aphorisms and moral instruction, and his ability to combine learning with practical wisdom about human nature.'
      case 'christopher-hitchens':
        return 'Respond in the style of Christopher Hitchens - contrarian intellectual and polemicist. Use his characteristic erudition combined with irreverence, his gift for devastating wit and classical references, and his ability to challenge orthodox thinking with fearless intellectual honesty.'
      case 'christopher-marlowe':
        return 'Respond in the style of Christopher Marlowe - dramatic and poetic with Renaissance flair. Use his characteristic passion for grand themes, his gift for ambitious characters and cosmic questions, and his ability to blend classical learning with theatrical power and Elizabethan vigor.'
      case 'ben-jonson':
        return 'Respond in the style of Ben Jonson - satirical and classical with moral purpose. Use his characteristic wit in exposing human folly, his gift for social satire and classical allusions, and his ability to combine learning with sharp observation of contemporary manners and morals.'
      case 'francis-bacon':
        return 'Respond in the style of Francis Bacon - philosophical and aphoristic with scientific method. Use his characteristic precise reasoning, his gift for memorable maxims and systematic thinking, and his ability to combine empirical observation with moral wisdom and practical judgment.'
      case 'charles-dickens':
        return 'Respond in the style of Charles Dickens - Victorian social realist with humanitarian passion. Use his characteristic concern for the poor and oppressed, his gift for vivid character portraits and social criticism, and his ability to combine melodrama with moral purpose and reformist zeal.'
      case 'cormac-mccarthy':
        return 'Respond in the style of Cormac McCarthy - sparse and haunting with biblical undertones. Use his characteristic stripped-down prose, his gift for finding beauty in desolation, and his ability to explore profound themes of violence, survival, and human nature with minimal but powerful language.'
      case 'stephen-king':
        return 'Respond in the style of Stephen King – lean, vivid, and conversational. Use concrete sensory detail, plainspoken clarity, and momentum-building sentences. Favor active voice, steady rising tension, and character-centric insight. Keep explanations accessible and gripping, like storytelling that moves.'
      case 'william-shakespeare':
        return 'Respond in the style of William Shakespeare: poetic, metaphor-rich, and iambic where fitting. Favor vivid imagery, antithesis, and rhetorical flourish. You may use Early Modern idiom sparingly for flavor (e.g., thee/thou), but ensure the meaning remains clear to modern readers. When explaining, frame the sense plainly after a brief poetic gloss.'
      case 'donald-trump':
        return 'Respond in the style of Donald Trump - lying sociopathic narcissistic demented monster. Use his characteristic repetitive phrases, superlatives ("tremendous", "huge", "the best"), his tendency to make grand claims, his simple vocabulary, his love of nicknames and branding, and his signature "weave" - jumping between topics, circling back to previous points, and creating a stream-of-consciousness flow that never connects everything together. Be confident, direct, and use his characteristic speech rhythms and topic transitions.'
      case 'george-w-bush':
        return 'Respond in the style of George W. Bush - folksy, direct, and sometimes awkwardly charming. Use his characteristic Texas drawl expressions, his tendency to create memorable phrases, his simple but earnest communication style, his occasional verbal gaffes that somehow work, and his ability to connect with people through down-to-earth language and genuine emotion.'
      case 'barack-obama':
        return 'Respond in the style of Barack Obama - eloquent, measured, and inspiring. Use his characteristic thoughtful pauses, his gift for connecting personal stories to larger themes, his measured and precise language, his ability to find hope in difficult situations, and his talent for making complex ideas accessible through clear, compelling narratives.'
      case 'dorothy-parker':
        return 'Respond in the style of Dorothy Parker - sharp, witty, and acerbic. Use her characteristic biting humor, her gift for devastating one-liners, her cynical but insightful observations about human nature, her love of wordplay and clever turns of phrase, and her ability to find humor in the darkest situations.'
      case 'ernest-hemingway':
        return 'Respond in the style of Ernest Hemingway - direct, spare, and powerful. Use his characteristic short, declarative sentences, his preference for concrete nouns and active verbs, his understated but profound observations, his love of simple, clear language that carries deep meaning, and his ability to convey emotion through restraint rather than elaboration.'
      case 'james-joyce':
        return 'Respond in the style of James Joyce - stream-of-consciousness, experimental, and linguistically innovative. Use his characteristic dense, allusive prose, his gift for capturing the flow of human thought, his love of wordplay and linguistic experimentation, his ability to blend high and low culture, and his talent for finding profound meaning in everyday moments through innovative narrative techniques.'
      case 'samuel-beckett':
        return 'Respond in the style of Samuel Beckett - absurdist, minimalist, and existential. Use his characteristic spare, precise language, his gift for finding humor in despair, his ability to explore profound questions through seemingly simple dialogue, his love of repetition and circular reasoning, and his talent for making the mundane seem both tragic and comic through existential absurdity.'
      case 'marilyn-monroe':
        return 'Respond in the style of Marilyn Monroe - glamorous, vulnerable, and deeply human. Use her characteristic mix of beauty and fragility, her ability to find wisdom in simplicity, her gentle humor and self-awareness, her gift for connecting with people through genuine emotion, and her talent for revealing the deeper truths behind glamorous appearances. Be both charming and insightful, combining Hollywood allure with authentic human warmth.'
      case 'louis-theroux':
        return 'Respond in the style of Louis Theroux - curious, empathetic, and gently probing. Use his characteristic thoughtful approach to complex subjects, his ability to ask insightful questions that reveal deeper truths, his gentle but persistent interviewing style, his genuine curiosity about human nature and unusual situations, his talent for finding the humanity in even the most challenging topics, and his measured, non-judgmental way of exploring controversial or difficult subjects. Be inquisitive, compassionate, and always willing to look deeper.'
      default:
        return ''
    }
  }

  const createContextualPrompt = (text: string, context: ContextInfo | null): string => {
    log('ChatInterface: Profile data:', profile)
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
    log('ChatInterface: Profile language check:', profile.language, profile.language !== 'english')
    if (profile.age || profile.language !== 'english' || profile.educationLevel) {
      prompt += `\n\nUser Profile:`
      if (profile.age) prompt += `\nAge: ${profile.age}`
      if (profile.language !== 'english') {
        log('ChatInterface: Adding language instruction:', profile.language)
        prompt += `\nPreferred Language: Please respond in ${profile.language}`
      }
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
    prompt += `\n- Explain references that contemporary audiences would understand`
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

  const searchAndEmbedVideo = async (text: string) => {
    log('Automatically searching for video with quote:', text)
    log('Using context info:', contextInfo)
    
    try {
      // Build a richer search query using context information
      let searchTerms = [`"${text}"`] // Start with the exact quote
      
      // Add book and author
      if (bookTitle) searchTerms.push(bookTitle)
      if (author) searchTerms.push(author)
      
      // Add speaker information if available
      if (contextInfo?.speaker) {
        searchTerms.push(contextInfo.speaker)
      }
      
      // Add act/scene information for plays
      if (contextInfo?.act && contextInfo?.scene) {
        searchTerms.push(`Act ${contextInfo.act}`)
        searchTerms.push(`Scene ${contextInfo.scene}`)
      }
      
      // Add performance/scene keywords
      searchTerms.push('performance', 'scene')
      
      const searchQuery = searchTerms.join(' ').trim()
      log('Enhanced YouTube search query:', searchQuery)
      
      const response = await fetch('/api/youtube-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: searchQuery,
          bookTitle,
          author 
        })
      })
      
      if (!response.ok) {
        log('YouTube search failed, skipping video')
        return // Silently fail - no video embedded
      }
      
      const data = await response.json()
      log('Auto YouTube search results:', data)
      
      if (data.videos && data.videos.length > 0) {
        // Add video message to chat automatically
        const videoMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `🎬 Found related video`,
          role: 'assistant',
          timestamp: new Date(),
          provider: 'youtube',
          style: 'neutral',
          videoId: data.videos[0].id,
          videoTitle: data.videos[0].title
        }
        setMessages(prev => [...prev, videoMessage])
      }
      // If no videos found, do nothing (no error message)
      
    } catch (error) {
      console.error('Auto video search error (ignored):', error)
      // Silently ignore errors - don't interrupt the user experience
    }
  }

  // Build external Playphrase link for the currently selected/original quote
  const playphraseUrl = (() => {
    if (!originalSelectedText) return null
    // Normalize: trim, collapse whitespace, strip surrounding quotes/newlines
    const normalized = originalSelectedText
      .replace(/\s+/g, ' ')
      .replace(/^\s*["]|[\"]\s*$/g, '')
      .trim()
    const encoded = encodeURIComponent(normalized)
    return `https://www.playphrase.me/#/search?q=${encoded}&pos=0&language=en`
  })()


  const handleReExplain = async (text: string) => {
    const useCustomLLM = selectedProvider === 'custom'
    
    log('ChatInterface: handleReExplain called')
    log('ChatInterface: current profile state:', profile)
    
    // Fallback: if no text provided, try to get it from the first user message
    if (!text && messages.length > 0) {
      const firstUserMessage = messages.find(m => m.role === 'user')
      if (firstUserMessage) {
        text = firstUserMessage.content.replace(/^"|"$/g, '') // Remove quotes
        log('ChatInterface: Using fallback text from first user message:', text)
      }
    }
    
    if (!text) {
      log('ChatInterface: No text available for re-explain')
      return
    }
    
    // Check if user can use explanation
    if (!canUseExplanation(bookTitle, author, useCustomLLM)) {
      log('ChatInterface: canUseExplanation returned false, redirecting to credits')
      router.push('/credits')
      return
    }
    
    log('ChatInterface: canUseExplanation returned true, proceeding with re-explanation')

    const promptText = createContextualPrompt(text, contextInfo)
    
    // CURSOR HELPER: Log the full prompt being sent to the LLM for re-explain
    console.log('🔄 RE-EXPLAIN PROMPT SENT TO LLM 🔄')
    console.log('='.repeat(80))
    console.log(promptText)
    console.log('='.repeat(80))
    console.log('Context info:', contextInfo)
    
    log('Re-explain prompt sent to LLM:')
    log('Profile language in re-explain:', profile.language)
    log('Prompt text:', promptText)
    log('Context info:', contextInfo)

    // For re-explain, we don't add a user message, just get a new assistant response
    const llmMessage: Message = {
      id: 'llm-prompt-reexplain',
      role: 'user',
      content: promptText,
      timestamp: new Date()
    }

    setIsLoading(true)

    try {
      // Use the explanation (deduct credits if needed)
      const success = useExplanation(bookTitle, author, useCustomLLM)
      if (!success) {
        router.push('/credits')
        setIsLoading(false)
        return
      }

      const response = await callLLM([llmMessage])
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        provider: selectedProvider,
        style: currentStyle
      }
      setMessages(prev => [...prev, assistantMessage])
      
      // Also automatically search for video after re-explain (but only if there's no video already for this quote)
      setTimeout(() => {
        const hasVideoForThisQuote = messages.some(msg => msg.videoId && msg.provider === 'youtube')
        if (!hasVideoForThisQuote) {
          searchAndEmbedVideo(text)
        }
      }, 500)
      
    } catch (error) {
      console.error('Error calling LLM:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while trying to re-explain this text. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        provider: selectedProvider,
        style: currentStyle
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
      
      // Save settings after successful re-explain
      if (hasChanges) {
        const updatedSettings: SettingsData = {
          ...settings,
          llmProvider: selectedProvider,
          explanationStyle: currentStyle,
          responseLength: currentResponseLength
        }
        onSettingsChange(updatedSettings)
        setHasChanges(false)
      }
    }
  }

  const handleExplainText = async (text: string) => {
    const useCustomLLM = selectedProvider === 'custom'
    
    log('ChatInterface: handleExplainText called')
    log('ChatInterface: current profile state:', profile)
    log('ChatInterface: bookTitle:', bookTitle, 'author:', author)
    log('ChatInterface: useCustomLLM:', useCustomLLM)
    
    // Check if user can use explanation
    if (!canUseExplanation(bookTitle, author, useCustomLLM)) {
      log('ChatInterface: canUseExplanation returned false, redirecting to credits')
      router.push('/credits')
      return
    }
    
    log('ChatInterface: canUseExplanation returned true, proceeding with explanation')

    const promptText = createContextualPrompt(text, contextInfo)
    
    // CURSOR HELPER: Log the full prompt being sent to the LLM
    console.log('🚀 FULL PROMPT SENT TO LLM 🚀')
    console.log('='.repeat(80))
    console.log(promptText)
    console.log('='.repeat(80))
    console.log('Context info:', contextInfo)
    
    log('Full prompt sent to LLM:')
    log('Profile language in sendMessage:', profile.language)
    log('Prompt text:', promptText)
    log('Context info:', contextInfo)
    
    // Display only the selected text to the user, not the full prompt
    const userMessage: Message = {
      id: Date.now().toString(),
      content: `"${text}"`,
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

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    try {
      // Use the explanation (deduct credits if needed)
      const success = useExplanation(bookTitle, author, useCustomLLM)
      if (!success) {
        router.push('/credits')
        setIsLoading(false)
        return
      }

      const response = await callLLM([llmMessage])
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
        provider: selectedProvider,
        style: currentStyle
      }
      setMessages(prev => [...prev, assistantMessage])
      
      // Automatically search for video after getting explanation
      setTimeout(() => {
        searchAndEmbedVideo(text)
      }, 500) // Small delay to let the explanation render first
    } catch (error) {
      console.error('Error calling LLM:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while trying to explain this text. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        provider: selectedProvider,
        style: currentStyle
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
        timestamp: new Date(),
        provider: selectedProvider,
        style: currentStyle
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error calling LLM:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        provider: selectedProvider,
        style: currentStyle
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

  const getHelpPopupTitle = () => {
    switch (showHelpPopup) {
      case 'ai-model':
        return 'AI Model Selection'
      case 'style':
        return 'Explanation Style'
      case 'length':
        return 'Response Length'
      default:
        return 'Help'
    }
  }

  const getHelpPopupContent = () => {
    switch (showHelpPopup) {
      case 'ai-model':
        return (
          <div>
            <p><strong>Claude 3.5 Sonnet:</strong> Excellent for literature, poetry, and nuanced text analysis. Often provides the most thoughtful and context-aware explanations.</p>
            <p><strong>GPT-4 (OpenAI):</strong> Great for technical texts, academic writing, and comprehensive analysis. Very strong at breaking down complex concepts.</p>
            <p><strong>DeepSeek Chat:</strong> Creative and engaging explanations, good for making difficult texts accessible and interesting.</p>
            <p><strong>Gemini 2.5 Flash:</strong> Fast responses, good for quick explanations and straightforward text interpretation.</p>
          </div>
        )
      case 'style':
        return (
          <div>
            <p><strong>Neutral:</strong> Clear, academic explanations without personality.</p>
            <p><strong>William Shakespeare:</strong> The Bard himself explains his plays with dramatic context and performance insights.</p>
            <p><strong>Stephen King:</strong> Lean, vivid explanations with suspenseful storytelling.</p>
            <p><strong>David Foster Wallace:</strong> Hyper-detailed, verbose analysis with deep intellectual exploration.</p>
            <p><strong>Oscar Wilde:</strong> Witty, paradoxical explanations with clever wordplay.</p>
            <p><strong>Carl Sagan:</strong> Cosmic wonder and curiosity in explaining any text.</p>
            <p>And many more! Choose from critics, writers, comedians, and talk show hosts - each offers a unique approach to understanding difficult texts.</p>
          </div>
        )
      case 'length':
        return (
          <div>
            <p><strong>Brief:</strong> 2-3 sentences maximum. Perfect for quick understanding when you just need the key point.</p>
            <p><strong>Medium:</strong> 1-2 paragraphs. Balanced explanation with context but not overwhelming.</p>
            <p><strong>Long:</strong> Comprehensive analysis with full context, historical background, and detailed interpretation.</p>
          </div>
        )
      default:
        return <p>Help information not available.</p>
    }
  }

  const shareSpecificResponse = (message: Message) => {
    // Check if this is a substantial AI response (not a YouTube video message)
    if (message.content.includes('🎬 Found related video') || message.content.length < 50) {
      alert('This message cannot be shared. Please select a substantial AI response.')
      return
    }

    // Find the user message that preceded this AI response
    const messageIndex = messages.findIndex(msg => msg.id === message.id)
    let quoteText = ''
    
    // Look for the user message before this AI response
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        quoteText = messages[i].content.trim()
        break
      }
    }
    
    // If no user message found, try to get from selectedText or originalSelectedText
    if (!quoteText) {
      if (selectedText && selectedText.trim()) {
        quoteText = selectedText.trim()
      } else if (originalSelectedText && originalSelectedText.trim()) {
        quoteText = originalSelectedText.trim()
      }
    }

    // Build content for this specific response
    let content = ''
    
    // Start with the selected text quote if available
    if (quoteText) {
      content += `## Selected Text\n\n> ${quoteText}\n\n`
    }
    
    // Add the specific AI response
    content += `## AI Response\n\n${message.content}\n\n`
    
    // Add book context if available
    if (bookTitle || author) {
      content += `## Source\n\n`
      if (bookTitle) content += `**Book:** ${bookTitle}\n`
      if (author) content += `**Author:** ${author}\n`
      content += `\n`
    }
    
    // Add context info if available
    if (contextInfo) {
      content += `## Context\n\n`
      if (contextInfo.act) content += `**Act:** ${contextInfo.act}\n`
      if (contextInfo.scene) content += `**Scene:** ${contextInfo.scene}\n`
      if (contextInfo.speaker) content += `**Speaker:** ${contextInfo.speaker}\n`
      if (contextInfo.charactersOnStage && contextInfo.charactersOnStage.length > 0) {
        content += `**Characters on Stage:** ${contextInfo.charactersOnStage.join(', ')}\n`
      }
      content += `\n`
    }
    
    content += `---\n*Shared from The Explainers App*`

    const title = `AI Explanation: ${bookTitle || 'Text Passage'}`
    setShareFormData({ title, content })
    setShowShareModal(true)
  }

  return (
    <div className={isPageMode ? '' : styles.chatOverlay}>
      <div className={isPageMode ? '' : styles.chatContainer} style={isPageMode ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
        <div className={styles.chatHeader}>
          <div>
            <h3>Text Explanation</h3>
            <div style={{ fontSize: '13px', color: '#8b5cf6', marginTop: '4px', fontWeight: '500' }}>
              {(() => {
                const useCustomLLM = selectedProvider === 'custom'
                const bookExplanationsUsed = getBookExplanationsUsed(bookTitle, author)
                const bookKey = `${bookTitle}-${author}`.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                const isBookPurchased = profile.purchasedBooks?.includes(bookKey)
                const hasUnlimited = profile.hasUnlimitedAccess && profile.unlimitedAccessExpiry && new Date() < new Date(profile.unlimitedAccessExpiry)
                
                if (useCustomLLM) return 'Free with your own LLM'
                if (hasUnlimited) {
                  const expiry = new Date(profile.unlimitedAccessExpiry!)
                  const msRemaining = expiry.getTime() - currentTime.getTime()
                  const minutesRemaining = Math.ceil(msRemaining / (1000 * 60))
                  
                  if (minutesRemaining > 60) {
                    const hoursRemaining = Math.ceil(minutesRemaining / 60)
                    return `Unlimited access: ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''} left`
                  } else {
                    return `Unlimited access: ${minutesRemaining} minute${minutesRemaining !== 1 ? 's' : ''} left`
                  }
                }
                if (isBookPurchased) return 'Book purchased - unlimited explanations'
                if (bookExplanationsUsed < 3) return `${3 - bookExplanationsUsed} free explanations left for this book`
                return `${profile.availableCredits || 0} credits remaining`
              })()}
            </div>
          </div>
          <div className={styles.headerControls}>
            <div className={styles.providerSelector}>
              <div className={styles.dropdownLabel}>
                <span>AI Model</span>
                <span 
                  className={styles.helpIcon} 
                  onClick={() => setShowHelpPopup('ai-model')}
                  title="Click for more info"
                >?</span>
              </div>
              <select 
                value={selectedProvider} 
                onChange={(e) => setSelectedProvider(e.target.value as LLMProvider)}
                className={styles.providerSelect}
                disabled={isLoading}
              >
                <option value="anthropic">Claude 3.5 Sonnet</option>
                <option value="openai">GPT-4 (OpenAI)</option>
                <option value="deepseek">DeepSeek Chat</option>
                <option value="gemini">Gemini 2.5 Flash</option>
              </select>
            </div>
            <div className={styles.styleSelector}>
              <div className={styles.dropdownLabel}>
                <span>Explanation Style</span>
                <span 
                  className={styles.helpIcon} 
                  onClick={() => setShowHelpPopup('style')}
                  title="Click for more info"
                >?</span>
              </div>
              <div 
                ref={styleMenuRef}
                className={`${styles.customSelect} ${isLoading ? styles.disabled : ''}`}
                onClick={() => { if (!isLoading) setShowStyleMenu(!showStyleMenu) }}
                role="button"
                aria-haspopup="listbox"
                aria-expanded={showStyleMenu}
                tabIndex={0}
                onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !isLoading) { e.preventDefault(); setShowStyleMenu(!showStyleMenu) } }}
              >
                <span className={styles.customSelectLabel}>{getAllStyles().find(s => s.value === currentStyle)?.name || 'Neutral'}</span>
                <span className={styles.customSelectCaret}>▾</span>
                {showStyleMenu && (
                  <div className={styles.customMenu} role="listbox">
                    {getAllStyles().map((style) => (
                      <div
                        key={style.value}
                        role="option"
                        aria-selected={currentStyle === style.value}
                        className={`${styles.customOption} ${currentStyle === style.value ? styles.selectedOption : ''}`}
                        onClick={(e) => { e.stopPropagation(); setCurrentStyle(style.value as ExplanationStyle); setShowStyleMenu(false) }}
                      >
                        {style.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.lengthSelector}>
              <div className={styles.dropdownLabel}>
                <span>Response Length</span>
                <span 
                  className={styles.helpIcon} 
                  onClick={() => setShowHelpPopup('length')}
                  title="Click for more info"
                >?</span>
              </div>
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
              onClick={() => handleReExplain(originalSelectedText || selectedText)}
              disabled={isLoading || (!originalSelectedText && !selectedText && !hasChanges)}
              className={styles.reexplainButton}
              title={`Re-explain in selected style${(!originalSelectedText && !selectedText && !hasChanges) ? ' (no text available)' : ''}${hasChanges ? ' (settings changed)' : ''}`}
            >
              Re-explain{hasChanges ? ' *' : ''}
            </button>
            <button 
              onClick={saveChatHistory}
              disabled={messages.length === 0}
              className={styles.saveButton}
              title="Save chat history to file (includes book context, AI responses, and settings)"
            >
              💾 Save Chat
            </button>
            {/* Share button moved to inline with each response */}
            {/* Debug info for re-explain button */}
            {process.env.NODE_ENV === 'development' && (
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Debug: originalSelectedText: {originalSelectedText?.length || 0}, selectedText: {selectedText?.length || 0}, hasChanges: {hasChanges ? 'true' : 'false'}, disabled: {(isLoading || (!originalSelectedText && !selectedText && !hasChanges)) ? 'true' : 'false'}
              </div>
            )}
          </div>
{!isPageMode && <button onClick={onClose} className={styles.closeButton}>×</button>}
        </div>
        
        <div className={styles.messagesContainer}>
          {!showFullHistory && messages.length > 2 && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button 
                onClick={() => setShowFullHistory(true)}
                className={styles.historyToggle}
                title="Show full conversation history"
              >
                Show Chat History ({messages.length - 2} earlier messages)
              </button>
            </div>
          )}
          {showFullHistory && messages.length > 2 && (
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <button 
                onClick={() => setShowFullHistory(false)}
                className={styles.historyToggle}
                title="Show only current exchange"
              >
                Hide Chat History
              </button>
            </div>
          )}
          {getDisplayedMessages().map((message, index) => {
            const isLatestAssistantMessage = message.role === 'assistant' && index === getDisplayedMessages().length - 1
            return (
            <div 
              key={message.id} 
              className={`${styles.message} ${styles[message.role]}`}
              ref={isLatestAssistantMessage ? latestResponseRef : null}
            >
              {message.role === 'assistant' && message.provider && (
                <div className={styles.messageInfo}>
                  <span className={styles.providerBadge}>
                    {message.provider === 'openai' ? 'GPT-4 (OpenAI)' : 
                     message.provider === 'anthropic' ? 'Claude 3.5 Sonnet' :
                     message.provider === 'deepseek' ? 'DeepSeek Chat' :
                     message.provider === 'gemini' ? 'Gemini 2.5 Flash' :
                     message.provider === 'youtube' ? '🎬 YouTube' :
                     message.provider}
                  </span>
                  {message.style && message.style !== 'neutral' && (
                    <span className={styles.styleBadge}>
                      in the style of {
                        message.style === 'harold-bloom' ? 'Harold Bloom' :
                        message.style === 'jerry-seinfeld' ? 'Jerry Seinfeld' :
                        message.style === 'david-foster-wallace' ? 'David Foster Wallace' :
                        message.style === 'oscar-wilde' ? 'Oscar Wilde' :
                        message.style === 'maya-angelou' ? 'Maya Angelou' :
                        message.style === 'douglas-adams' ? 'Douglas Adams' :
                        message.style === 'terry-pratchett' ? 'Terry Pratchett' :
                        message.style === 'joan-didion' ? 'Joan Didion' :
                        message.style === 'david-sedaris' ? 'David Sedaris' :
                        message.style === 'mark-twain' ? 'Mark Twain' :
                        message.style === 'james-joyce' ? 'James Joyce' :
                        message.style === 'samuel-beckett' ? 'Samuel Beckett' :
                        message.style === 'marilyn-monroe' ? 'Marilyn Monroe' :
                        message.style === 'louis-theroux' ? 'Louis Theroux' :
                        // Add more style mappings as needed
                        message.style.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                      }
                    </span>
                  )}
                </div>
              )}
              <div className={styles.messageContent}>
                {message.videoId ? (
                  <div>
                    <div style={{ marginBottom: '12px' }}>
                      <pre 
                        className={styles.messageText}
                        style={{ fontFamily: settings.chatFont }}
                      >
                        {message.content}
                      </pre>
                    </div>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', maxWidth: '100%', background: '#000' }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${message.videoId}`}
                        title={message.videoTitle || 'YouTube video'}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%'
                        }}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                    {message.videoTitle && (
                      <div style={{ marginTop: '8px', fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                        {message.videoTitle}
                      </div>
                    )}
                    {playphraseUrl && (
                      <div style={{ marginTop: '10px' }}>
                        <a
                          href={playphraseUrl}
                          target="playphrase"
                          rel="noopener noreferrer"
                          className={styles.reexplainButton}
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Open this quote on Playphrase"
                        >
                          Is this quote in the movies?
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <pre 
                    className={styles.messageText}
                    style={{ fontFamily: settings.chatFont }}
                  >
                    {message.content}
                  </pre>
                )}
              </div>
              {message.role === 'assistant' && (
                <div className={styles.messageActions}>
                  <div className={styles.ratingButtons}>
                    <button
                      onClick={() => rateResponse(message.id, 'good')}
                      className={`${styles.ratingButton} ${styles.goodRating} ${message.rating === 'good' ? styles.active : ''}`}
                      title="Mark as good response"
                    >
                      👍 Good
                    </button>
                    <button
                      onClick={() => rateResponse(message.id, 'bad')}
                      className={`${styles.ratingButton} ${styles.badRating} ${message.rating === 'bad' ? styles.active : ''}`}
                      title="Mark as bad response"
                    >
                      👎 Bad
                    </button>
                    <button
                      onClick={() => shareSpecificResponse(message)}
                      className={styles.shareResponseButton}
                      title="Share this response to GitHub"
                    >
                      🐙 Share
                    </button>
                  </div>
                  {message.rating && (
                    <span className={styles.ratingStatus}>
                      {getRatingIcon(message.rating)} Rated as {message.rating}
                    </span>
                  )}
                </div>
              )}
              <div className={styles.messageTime}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          )})}
          
          {isLoading && (
            <div className={`${styles.message} ${styles.assistant}`}>
              <div className={styles.messageContent}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                  <span style={{ fontSize: '14px' }}>AI is thinking</span>
                  <div className={styles.loadingDots}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
      
      {/* GitHub Sharing Modal */}
      {showShareModal && (
        <div className={styles.shareModalOverlay}>
          <div className={styles.shareModal}>
            <div className={styles.shareModalHeader}>
              <h3>🐙 Share to GitHub</h3>
              <button 
                onClick={() => setShowShareModal(false)}
                className={styles.shareModalClose}
              >
                ×
              </button>
            </div>
            
            <div className={styles.shareModalContent}>
              <div className={styles.shareHelp}>
                <p>📋 <strong>How it works:</strong></p>
                <ol>
                  <li>Edit your title and content below</li>
                  <li>Click "Create GitHub Issue" - content will be copied to clipboard</li>
                  <li>GitHub will open in a new tab</li>
                  <li>Paste your content (Ctrl+V/Cmd+V) into the issue description</li>
                  <li>Add appropriate labels and submit</li>
                </ol>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="reddit-title">Issue Title:</label>
                <input
                  id="reddit-title"
                  type="text"
                  className={styles.redditInput}
                  value={shareFormData?.title || ''}
                  onChange={(e) => setShareFormData(prev => prev ? { ...prev, title: e.target.value } : null)}
                  placeholder="Enter your GitHub issue title..."
                  maxLength={300}
                />
                <span className={styles.charCount}>
                  {shareFormData?.title?.length || 0}/300
                </span>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="reddit-content">Issue Description:</label>
                <textarea
                  id="reddit-content"
                  className={styles.redditTextarea}
                  value={shareFormData?.content || ''}
                  onChange={(e) => setShareFormData(prev => prev ? { ...prev, content: e.target.value } : null)}
                  placeholder="Your content will appear here..."
                  maxLength={40000}
                />
                <span className={styles.charCount}>
                  {shareFormData?.content?.length || 0}/40,000
                </span>
              </div>

              <div className={styles.redditActions}>
                <button
                  onClick={() => {
                    if (!shareFormData) return
                    
                    // GitHub approach: Copy to clipboard + open GitHub new issue
                    const encodedTitle = encodeURIComponent(shareFormData.title)
                    const encodedBody = encodeURIComponent(shareFormData.content)
                    const githubUrl = `https://github.com/johndimm/the-explainers/issues/new?title=${encodedTitle}&body=${encodedBody}&labels=ai-response,shared`
                    
                    // Step 1: Copy content to clipboard with enhanced feedback
                    navigator.clipboard.writeText(shareFormData.content).then(() => {
                      // Step 2: Show success message with clear next steps
                      const successMessage = `✅ Content copied to clipboard!\n\n📋 Next steps:\n1. GitHub will open in a new tab\n2. The title and description should be pre-filled\n3. Review and edit if needed\n4. Add appropriate labels and submit\n\n💡 Tip: Keep this tab open until you've reviewed the issue!`
                      
                      alert(successMessage)
                      
                      // Step 3: Open GitHub with a slight delay for better UX
                      setTimeout(() => {
                        window.open(githubUrl, '_blank')
                        setShowShareModal(false)
                      }, 500)
                    }).catch(() => {
                      // Enhanced fallback with clear instructions
                      const fallbackMessage = `⚠️ Clipboard access failed\n\n📋 Manual copy method:\n1. Select the content above (Ctrl+A)\n2. Copy it (Ctrl+C)\n3. Open GitHub in a new tab\n4. Paste the content into the issue description`
                      
                      alert(fallbackMessage)
                      
                      // Still open GitHub for manual process
                      setTimeout(() => {
                        window.open(githubUrl, '_blank')
                        setShowShareModal(false)
                      }, 500)
                    })
                  }}
                  className={styles.redditSubmitButton}
                >
                  🐙 Create GitHub Issue
                </button>
                
                <button
                  onClick={() => {
                    if (!shareFormData) return
                    
                    navigator.clipboard.writeText(shareFormData.content).then(() => {
                      alert('✅ Content copied to clipboard! You can now paste it anywhere.')
                    }).catch(() => {
                      alert('⚠️ Clipboard access failed. Please manually select and copy the content.')
                    })
                  }}
                  className={styles.redditCopyButton}
                >
                  📋 Copy Content
                </button>
                
                <button
                  onClick={() => setShowShareModal(false)}
                  className={styles.redditCancelButton}
                >
                  Cancel
                </button>
              </div>

              <div className={styles.shareTips}>
                <p>💡 <strong>Pro Tips:</strong></p>
                <ul>
                  <li>GitHub will pre-fill both title and description (much more reliable than Reddit!)</li>
                  <li>The selected text quote and context are automatically included</li>
                  <li>Use Ctrl+V (Windows) or Cmd+V (Mac) to paste if needed</li>
                  <li>Add relevant labels like "ai-response", "discussion", or "question"</li>
                  <li>Consider adding context about what you found interesting</li>
                  <li>GitHub issues support full markdown formatting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Popup */}
      {showHelpPopup && (
        <div className={styles.helpPopupOverlay} onClick={() => setShowHelpPopup(null)}>
          <div className={styles.helpPopup} onClick={(e) => e.stopPropagation()}>
            <div className={styles.helpPopupHeader}>
              <h4>{getHelpPopupTitle()}</h4>
              <button 
                className={styles.helpPopupClose}
                onClick={() => setShowHelpPopup(null)}
              >×</button>
            </div>
            <div className={styles.helpPopupContent}>
              {getHelpPopupContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatInterface