import { log } from './log'

export const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export const formatTimeOnly = (timestamp: string) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

const formatStyleName = (style: string): string => {
  const styleMap: { [key: string]: string } = {
    'harold-bloom': 'Harold Bloom',
    'jerry-seinfeld': 'Jerry Seinfeld',
    'david-foster-wallace': 'David Foster Wallace',
    'oscar-wilde': 'Oscar Wilde',
    'maya-angelou': 'Maya Angelou',
    'douglas-adams': 'Douglas Adams',
    'terry-pratchett': 'Terry Pratchett',
    'joan-didion': 'Joan Didion',
    'david-sedaris': 'David Sedaris',
    'mark-twain': 'Mark Twain',
    'james-joyce': 'James Joyce',
    'samuel-beckett': 'Samuel Beckett',
    'marilyn-monroe': 'Marilyn Monroe',
    'louis-theroux': 'Louis Theroux',
    'robin-williams': 'Robin Williams',
    'kurt-vonnegut': 'Kurt Vonnegut',
    'carl-sagan': 'Carl Sagan',
    'louis-ck': 'Louis C.K.',
    'neil-degrasse-tyson': 'Neil deGrasse Tyson',
    'stephen-fry': 'Stephen Fry',
    'bill-bryson': 'Bill Bryson',
    'anthony-bourdain': 'Anthony Bourdain',
    'andrew-dice-clay': 'Andrew Dice Clay',
    'howard-stern': 'Howard Stern',
    'tina-fey': 'Tina Fey',
    'dave-chappelle': 'Dave Chappelle',
    'amy-poehler': 'Amy Poehler',
    'ricky-gervais': 'Ricky Gervais',
    'sarah-silverman': 'Sarah Silverman',
    'john-mulaney': 'John Mulaney',
    'ali-wong': 'Ali Wong',
    'bo-burnham': 'Bo Burnham',
    'oprah-winfrey': 'Oprah Winfrey',
    'david-letterman': 'David Letterman',
    'conan-obrien': 'Conan O\'Brien',
    'stephen-colbert': 'Stephen Colbert',
    'jimmy-fallon': 'Jimmy Fallon',
    'ellen-degeneres': 'Ellen DeGeneres',
    'trevor-noah': 'Trevor Noah',
    'john-oliver': 'John Oliver',
    'jon-stewart': 'Jon Stewart',
    'ts-eliot': 'T.S. Eliot',
    'rudyard-kipling': 'Rudyard Kipling',
    'tom-wolfe': 'Tom Wolfe',
    'stephen-king': 'Stephen King',
    'william-shakespeare': 'William Shakespeare',
    'bernie-sanders': 'Bernie Sanders',
    'martin-luther-king': 'Martin Luther King',
    'john-f-kennedy': 'John F. Kennedy',
    'james-carville': 'James Carville',
    'donald-trump': 'Donald Trump',
    'george-w-bush': 'George W. Bush',
    'barack-obama': 'Barack Obama',
    'dorothy-parker': 'Dorothy Parker',
    'ernest-hemingway': 'Ernest Hemingway',
    'flannery-oconnor': 'Flannery O\'Connor',
    'humphrey-bogart': 'Humphrey Bogart',
    'anthony-jeselnik': 'Anthony Jeselnik',
    'doug-stanhope': 'Doug Stanhope',
    'jim-norton': 'Jim Norton',
    'aaron-sorkin': 'Aaron Sorkin',
    'woody-allen': 'Woody Allen',
    'jim-jefferies': 'Jim Jefferies',
    'daniel-tosh': 'Daniel Tosh',
    'andy-andrist': 'Andy Andrist',
    'bill-burr': 'Bill Burr',
    'lewis-black': 'Lewis Black',
    'george-carlin': 'George Carlin',
    'sam-kinison': 'Sam Kinison',
    'paul-mooney': 'Paul Mooney',
    'bill-hicks': 'Bill Hicks',
    'bob-saget': 'Bob Saget',
    'norm-macdonald': 'Norm Macdonald',
    'bernard-henri-levy': 'Bernard-Henri Lévy',
    'michel-houellebecq': 'Michel Houellebecq',
    'bill-maher': 'Bill Maher',
    'john-ruskin': 'John Ruskin',
    'samuel-johnson': 'Samuel Johnson',
    'christopher-hitchens': 'Christopher Hitchens',
    'christopher-marlowe': 'Christopher Marlowe',
    'ben-jonson': 'Ben Jonson',
    'francis-bacon': 'Francis Bacon',
    'charles-dickens': 'Charles Dickens',
    'cormac-mccarthy': 'Cormac McCarthy',
    'quine': 'W.V.O. Quine',
    'putnam': 'Hilary Putnam',
    'kripke': 'Saul Kripke',
    'michael-dummett': 'Michael Dummett',
    'thomas-nagel': 'Thomas Nagel',
    'david-lewis': 'David Lewis'
  };
  
  return styleMap[style] || style.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export const convertToHTML = (data: any) => {
  // Filter out video messages from chat history
  const filteredMessages = data.messages.filter((message: any) => !message.videoId);
  const messagesHTML = filteredMessages.map((message: any) => {
    const time = formatTimeOnly(message.timestamp);
    
    if (message.role === 'user') {
      // Check if this is a selected text message (quoted) or a follow-up question
      const quoteMatch = message.content.match(/"([^"]+)"/);
      
      if (quoteMatch) {
        // This is a selected text message - extract the quoted text
        const selectedText = quoteMatch[1];
        return `
        <div class="message user">
            <div class="message-bubble">
                <div class="selected-quote">"${selectedText}"</div>
            </div>
            <div class="message-meta">
                <span class="timestamp">${time}</span>
            </div>
        </div>`;
      } else {
        // This is a follow-up question - display the full content
        return `
        <div class="message user">
            <div class="message-bubble">
                ${message.content}
            </div>
            <div class="message-meta">
                <span class="timestamp">${time}</span>
            </div>
        </div>`;
      }
    } else {
      const providerClass = message.provider ? message.provider.toLowerCase() : '';
      const providerName = message.provider ? message.provider.toUpperCase() : 'Assistant';
      const modelName = message.model || '';
      const styleName = message.style || '';
      
      // Build explainer info
      let explainerInfo = providerName;
      if (modelName) explainerInfo += ` (${modelName})`;
      if (styleName && styleName !== 'neutral') explainerInfo += ` - in the style of ${formatStyleName(styleName)}`;
      
      return `
      <div class="message assistant">
          <div class="message-bubble">${message.content}</div>
          <div class="message-meta">
              <span class="provider-badge ${providerClass}">${explainerInfo}</span>
              <span class="timestamp">${time}</span>
          </div>
      </div>`;
    }
  }).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chat History: ${data.bookTitle}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .chat-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            overflow: hidden;
        }
        .chat-header {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        .chat-title { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        .chat-subtitle { font-size: 14px; opacity: 0.9; }
        .context-section {
            background: #f8f9fa;
            padding: 20px;
            border-bottom: 1px solid #e9ecef;
        }
        .context-title { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #495057; }
        .selected-text {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
            padding: 12px 16px;
            margin-bottom: 16px;
            border-radius: 4px;
            font-style: italic;
            color: #1976d2;
            white-space: pre-wrap;
        }
        .context-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            font-size: 14px;
        }
        .context-item {
            background: white;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1px solid #dee2e6;
        }
        .context-label { font-weight: 600; color: #6c757d; margin-right: 8px; }
        .chat-messages { padding: 20px; max-height: 600px; overflow-y: auto; }
        .message { margin-bottom: 20px; display: flex; flex-direction: column; }
        .message.user { align-items: flex-end; }
        .message.assistant { align-items: flex-start; }
        .message-bubble {
            max-width: 70%;
            padding: 12px 16px;
            border-radius: 18px;
            word-wrap: break-word;
            white-space: pre-wrap;
        }
        .message.user .message-bubble {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-bottom-right-radius: 4px;
        }
        .message.assistant .message-bubble {
            background: #f1f3f4;
            color: #202124;
            border-bottom-left-radius: 4px;
        }
        .selected-quote {
            font-style: italic;
            background: rgba(255, 255, 255, 0.2);
            padding: 8px 12px;
            border-radius: 8px;
            margin-bottom: 8px;
        }
        .message-meta {
            font-size: 11px;
            color: #6c757d;
            margin-top: 4px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .message.user .message-meta { justify-content: flex-end; }
        .provider-badge {
            background: #e9ecef;
            color: #495057;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 10px;
            font-weight: 500;
        }
        .provider-badge.openai { background: #10a37f; color: white; }
        .provider-badge.gemini { background: #4285f4; color: white; }
        .provider-badge.youtube { background: #ff0000; color: white; }
        .video-message { background: #fff3e0 !important; border: 1px solid #ffb74d; }
        .video-link {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: #f57c00;
            text-decoration: none;
            font-weight: 500;
        }
        .video-link:hover { text-decoration: underline; }
        .settings-footer {
            background: #f8f9fa;
            padding: 16px 20px;
            border-top: 1px solid #e9ecef;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }
        .settings-item { display: inline-block; margin: 0 12px; }
        .settings-label { font-weight: 600; margin-right: 4px; }
        @media (max-width: 600px) {
            .message-bubble { max-width: 85%; }
            .context-info { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <div class="chat-title">${data.bookTitle} Discussion</div>
            <div class="chat-subtitle">${formatTimestamp(data.timestamp)} • ${data.author}</div>
        </div>

        ${data.contextInfo ? `
        <div class="context-section">
            <div class="context-title">📖 Context</div>
            <div class="context-info">
                ${(() => {
                  // Debug: Log the context info to see what we're working with
log('debug','🔍 HTML CONVERTER - Full Context Info:', JSON.stringify(data.contextInfo, null, 2));
log('debug','🔍 HTML CONVERTER - Act:', data.contextInfo.act);
log('debug','🔍 HTML CONVERTER - Scene:', data.contextInfo.scene);
log('debug','🔍 HTML CONVERTER - Speaker:', data.contextInfo.speaker);
log('debug','🔍 HTML CONVERTER - Characters on Stage:', data.contextInfo.charactersOnStage);
log('debug','🔍 HTML CONVERTER - Chapter:', data.contextInfo.chapter);
log('debug','🔍 HTML CONVERTER - Book Title:', data.bookTitle);
log('debug','🔍 HTML CONVERTER - Author:', data.author);
                  
                  // Check if this is Shakespeare content by author or book title
                  const isShakespeare = data.author?.toLowerCase().includes('shakespeare') || 
                                      data.bookTitle?.toLowerCase().includes('shakespeare') ||
                                      (data.contextInfo.act && data.contextInfo.scene);
                  
                  // Check if this is Bible content
                  const isBible = data.author?.toLowerCase().includes('bible') || 
                                 data.bookTitle?.toLowerCase().includes('bible') ||
                                 data.bookTitle?.toLowerCase().includes('king james');
                  
log('debug','🔍 HTML CONVERTER - Is Shakespeare:', isShakespeare);
log('debug','🔍 HTML CONVERTER - Is Bible:', isBible);
                  
                  if (isShakespeare) {
                    // For Shakespeare: Act, Scene, Speaker, Characters on Stage
                    return `
                        ${data.contextInfo.act ? `<div class="context-item"><span class="context-label">Act:</span>${data.contextInfo.act}</div>` : ''}
                        ${data.contextInfo.scene ? `<div class="context-item"><span class="context-label">Scene:</span>${data.contextInfo.scene}</div>` : ''}
                        ${data.contextInfo.speaker ? `<div class="context-item"><span class="context-label">Speaker:</span>${data.contextInfo.speaker}</div>` : ''}
                        ${data.contextInfo.charactersOnStage && data.contextInfo.charactersOnStage.length > 0 ? `<div class="context-item"><span class="context-label">Characters on Stage:</span>${data.contextInfo.charactersOnStage.join(', ')}</div>` : ''}
                    `;
                  } else if (isBible) {
                    // For Bible: Book, Verse
                    return `
                        ${data.contextInfo.bibleBook ? `<div class="context-item"><span class="context-label">Book:</span>${data.contextInfo.bibleBook}</div>` : ''}
                        ${data.contextInfo.bibleVerse ? `<div class="context-item"><span class="context-label">Verse:</span>${data.contextInfo.bibleVerse}</div>` : ''}
                    `;
                  } else {
                    // For other content: Chapter, Speaker (or other relevant fields)
                    return `
                        ${data.contextInfo.chapter ? `<div class="context-item"><span class="context-label">Chapter:</span>${data.contextInfo.chapter}</div>` : ''}
                        ${data.contextInfo.section ? `<div class="context-item"><span class="context-label">Section:</span>${data.contextInfo.section}</div>` : ''}
                        ${data.contextInfo.part ? `<div class="context-item"><span class="context-label">Part:</span>${data.contextInfo.part}</div>` : ''}
                        ${data.contextInfo.book ? `<div class="context-item"><span class="context-label">Book:</span>${data.contextInfo.book}</div>` : ''}
                        ${data.contextInfo.speaker ? `<div class="context-item"><span class="context-label">Speaker:</span>${data.contextInfo.speaker}</div>` : ''}
                    `;
                  }
                })()}
            </div>
        </div>
        ` : ''}

        <div class="chat-messages">
            ${messagesHTML}
        </div>

        ${data.settings ? `
        <div class="settings-footer">
            <span class="settings-item"><span class="settings-label">Provider:</span>${data.settings.provider}</span>
            <span class="settings-item"><span class="settings-label">Style:</span>${data.settings.style}</span>
            <span class="settings-item"><span class="settings-label">Length:</span>${data.settings.responseLength}</span>
            <span class="settings-item"><span class="settings-label">Saved:</span>${formatTimestamp(data.timestamp)}</span>
        </div>
        ` : ''}
    </div>
</body>
</html>`;
}

export const convertToMarkdown = (data: any) => {
  let markdown = `# Chat History: ${data.bookTitle}\n\n`;
  markdown += `**Author:** ${data.author}  \n`;
  markdown += `**Date:** ${formatTimestamp(data.timestamp)}  \n\n`;

  // Context section
  if (data.selectedText) {
    markdown += `## Selected Text\n\n`;
    markdown += `> ${data.selectedText.replace(/\r?\n/g, '  \n> ')}\n\n`;
  }

  if (data.contextInfo) {
    markdown += `**Context:**\n`;
    
    // Debug: Log the context info to see what we're working with
log('debug','🔍 MARKDOWN CONVERTER - Context Info:', data.contextInfo);
log('debug','🔍 MARKDOWN CONVERTER - Act:', data.contextInfo.act);
log('debug','🔍 MARKDOWN CONVERTER - Scene:', data.contextInfo.scene);
log('debug','🔍 MARKDOWN CONVERTER - Chapter:', data.contextInfo.chapter);
log('debug','🔍 MARKDOWN CONVERTER - Book Title:', data.bookTitle);
log('debug','🔍 MARKDOWN CONVERTER - Author:', data.author);
    
    // Check if this is Shakespeare content by author or book title
    const isShakespeare = data.author?.toLowerCase().includes('shakespeare') || 
                        data.bookTitle?.toLowerCase().includes('shakespeare') ||
                        (data.contextInfo.act && data.contextInfo.scene);
    
    // Check if this is Bible content
    const isBible = data.author?.toLowerCase().includes('bible') || 
                   data.bookTitle?.toLowerCase().includes('bible') ||
                   data.bookTitle?.toLowerCase().includes('king james');
    
log('debug','🔍 MARKDOWN CONVERTER - Is Shakespeare:', isShakespeare);
log('debug','🔍 MARKDOWN CONVERTER - Is Bible:', isBible);
    
    if (isShakespeare) {
      // For Shakespeare: Act, Scene, Speaker, Characters on Stage
      if (data.contextInfo.act) markdown += `- Act: ${data.contextInfo.act}\n`;
      if (data.contextInfo.scene) markdown += `- Scene: ${data.contextInfo.scene}\n`;
      if (data.contextInfo.speaker) markdown += `- Speaker: ${data.contextInfo.speaker}\n`;
      if (data.contextInfo.charactersOnStage && data.contextInfo.charactersOnStage.length > 0) {
        markdown += `- Characters on Stage: ${data.contextInfo.charactersOnStage.join(', ')}\n`;
      }
    } else if (isBible) {
      // For Bible: Book, Verse
      if (data.contextInfo.bibleBook) markdown += `- Book: ${data.contextInfo.bibleBook}\n`;
      if (data.contextInfo.bibleVerse) markdown += `- Verse: ${data.contextInfo.bibleVerse}\n`;
    } else {
      // For other content: Chapter, Speaker (or other relevant fields)
      if (data.contextInfo.chapter) markdown += `- Chapter: ${data.contextInfo.chapter}\n`;
      if (data.contextInfo.section) markdown += `- Section: ${data.contextInfo.section}\n`;
      if (data.contextInfo.part) markdown += `- Part: ${data.contextInfo.part}\n`;
      if (data.contextInfo.book) markdown += `- Book: ${data.contextInfo.book}\n`;
      if (data.contextInfo.speaker) markdown += `- Speaker: ${data.contextInfo.speaker}\n`;
    }
    markdown += `\n`;
  }

  // Messages
  markdown += `## Conversation\n\n`;
  
  // Filter out video messages from chat history
  const filteredMessages = data.messages.filter((message: any) => !message.videoId);
  filteredMessages.forEach((message: any) => {
    const time = formatTimeOnly(message.timestamp);
    
    if (message.role === 'user') {
      markdown += `### 👤 User (${time})\n\n`;
      
      // Check if this is a selected text message (quoted) or a follow-up question
      const quoteMatch = message.content.match(/"([^"]+)"/);
      
      if (quoteMatch) {
        // This is a selected text message - extract the quoted text
        const selectedText = quoteMatch[1];
        markdown += `> "${selectedText}"\n\n`;
      } else {
        // This is a follow-up question - display the full content
        markdown += `${message.content}\n\n`;
      }
    } else {
      const provider = message.provider ? message.provider.toUpperCase() : 'Assistant';
      const model = message.model || '';
      const style = message.style || '';
      
      // Build explainer info
      let explainerInfo = `🤖 ${provider}`;
      if (model) explainerInfo += ` (${model})`;
      if (style && style !== 'neutral') explainerInfo += ` - in the style of ${formatStyleName(style)}`;
      
      markdown += `### ${explainerInfo} (${time})\n\n`;
      markdown += `${message.content}\n\n`;
    }
  });

  // Settings
  if (data.settings) {
    markdown += `## Settings\n\n`;
    markdown += `- **Provider:** ${data.settings.provider}\n`;
    markdown += `- **Style:** ${data.settings.style}\n`;
    markdown += `- **Response Length:** ${data.settings.responseLength}\n`;
  }

  return markdown;
}

export const convertToPlainText = (data: any) => {
  let text = `CHAT HISTORY: ${data.bookTitle.toUpperCase()}\n`;
  text += `${'='.repeat(50)}\n\n`;
  text += `Author: ${data.author}\n`;
  text += `Date: ${formatTimestamp(data.timestamp)}\n\n`;

  // Context section
  if (data.selectedText) {
    text += `SELECTED TEXT:\n`;
    text += `${'-'.repeat(20)}\n`;
    text += `"${data.selectedText}"\n\n`;
  }

  if (data.contextInfo) {
    text += `CONTEXT:\n`;
    
    // Debug: Log the context info to see what we're working with
log('debug','🔍 TEXT CONVERTER - Context Info:', data.contextInfo);
log('debug','🔍 TEXT CONVERTER - Act:', data.contextInfo.act);
log('debug','🔍 TEXT CONVERTER - Scene:', data.contextInfo.scene);
log('debug','🔍 TEXT CONVERTER - Chapter:', data.contextInfo.chapter);
log('debug','🔍 TEXT CONVERTER - Book Title:', data.bookTitle);
log('debug','🔍 TEXT CONVERTER - Author:', data.author);
    
    // Check if this is Shakespeare content by author or book title
    const isShakespeare = data.author?.toLowerCase().includes('shakespeare') || 
                        data.bookTitle?.toLowerCase().includes('shakespeare') ||
                        (data.contextInfo.act && data.contextInfo.scene);
    
    // Check if this is Bible content
    const isBible = data.author?.toLowerCase().includes('bible') || 
                   data.bookTitle?.toLowerCase().includes('bible') ||
                   data.bookTitle?.toLowerCase().includes('king james');
    
log('debug','🔍 TEXT CONVERTER - Is Shakespeare:', isShakespeare);
log('debug','🔍 TEXT CONVERTER - Is Bible:', isBible);
    
    if (isShakespeare) {
      // For Shakespeare: Act, Scene, Speaker, Characters on Stage
      if (data.contextInfo.act) text += `Act: ${data.contextInfo.act}\n`;
      if (data.contextInfo.scene) text += `Scene: ${data.contextInfo.scene}\n`;
      if (data.contextInfo.speaker) text += `Speaker: ${data.contextInfo.speaker}\n`;
      if (data.contextInfo.charactersOnStage && data.contextInfo.charactersOnStage.length > 0) {
        text += `Characters on Stage: ${data.contextInfo.charactersOnStage.join(', ')}\n`;
      }
    } else if (isBible) {
      // For Bible: Book, Verse
      if (data.contextInfo.bibleBook) text += `Book: ${data.contextInfo.bibleBook}\n`;
      if (data.contextInfo.bibleVerse) text += `Verse: ${data.contextInfo.bibleVerse}\n`;
    } else {
      // For other content: Chapter, Speaker (or other relevant fields)
      if (data.contextInfo.chapter) text += `Chapter: ${data.contextInfo.chapter}\n`;
      if (data.contextInfo.section) text += `Section: ${data.contextInfo.section}\n`;
      if (data.contextInfo.part) text += `Part: ${data.contextInfo.part}\n`;
      if (data.contextInfo.book) text += `Book: ${data.contextInfo.book}\n`;
      if (data.contextInfo.speaker) text += `Speaker: ${data.contextInfo.speaker}\n`;
    }
    text += `\n`;
  }

  // Messages
  text += `CONVERSATION:\n`;
  text += `${'-'.repeat(30)}\n\n`;
  
  // Filter out video messages from chat history
  const filteredMessages = data.messages.filter((message: any) => !message.videoId);
  filteredMessages.forEach((message: any) => {
    const time = formatTimeOnly(message.timestamp);
    
    if (message.role === 'user') {
      text += `[${time}] USER:\n`;
      
      // Check if this is a selected text message (quoted) or a follow-up question
      const quoteMatch = message.content.match(/"([^"]+)"/);
      
      if (quoteMatch) {
        // This is a selected text message - extract the quoted text
        const selectedText = quoteMatch[1];
        text += `"${selectedText}"\n\n`;
      } else {
        // This is a follow-up question - display the full content
        text += `${message.content}\n\n`;
      }
    } else {
      const provider = message.provider ? message.provider.toUpperCase() : 'Assistant';
      const model = message.model || '';
      const style = message.style || '';
      
      // Build explainer info
      let explainerInfo = `ASSISTANT (${provider})`;
      if (model) explainerInfo += ` - ${model}`;
      if (style && style !== 'neutral') explainerInfo += ` - in the style of ${formatStyleName(style)}`;
      
      text += `[${time}] ${explainerInfo}:\n`;
      text += `${message.content}\n\n`;
    }
  });

  // Settings
  if (data.settings) {
    text += `SETTINGS:\n`;
    text += `${'-'.repeat(20)}\n`;
    text += `Provider: ${data.settings.provider}\n`;
    text += `Style: ${data.settings.style}\n`;
    text += `Response Length: ${data.settings.responseLength}\n`;
  }

  return text;
}
