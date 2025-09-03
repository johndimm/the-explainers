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

export const convertToHTML = (data: any) => {
  const messagesHTML = data.messages.map((message: any) => {
    const time = formatTimeOnly(message.timestamp);
    
    if (message.role === 'user') {
      return `
      <div class="message user">
          <div class="message-bubble">${message.content}</div>
          <div class="message-meta">
              <span class="timestamp">${time}</span>
          </div>
      </div>`;
    } else {
      const providerClass = message.provider ? message.provider.toLowerCase() : '';
      const providerName = message.provider ? message.provider.toUpperCase() : 'Assistant';
      
      if (message.videoId) {
        return `
        <div class="message assistant">
            <div class="message-bubble">
                🎬 <a href="https://www.youtube.com/watch?v=${message.videoId}" target="_blank" style="color: #1976d2; text-decoration: underline;">${message.videoTitle}</a>
            </div>
            <div class="message-meta">
                <span class="provider-badge ${providerClass}">${providerName}</span>
                <span class="timestamp">${time}</span>
            </div>
        </div>`;
      } else {
        return `
        <div class="message assistant">
            <div class="message-bubble">${message.content}</div>
            <div class="message-meta">
                <span class="provider-badge ${providerClass}">${providerName}</span>
                <span class="timestamp">${time}</span>
            </div>
        </div>`;
      }
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

        ${data.selectedText ? `
        <div class="context-section">
            <div class="context-title">📖 Selected Text</div>
            <div class="selected-text">"${data.selectedText}"</div>
            
            ${data.contextInfo ? `
            <div class="context-info">
                ${data.contextInfo.act ? `<div class="context-item"><span class="context-label">Act:</span>${data.contextInfo.act}</div>` : ''}
                ${data.contextInfo.scene ? `<div class="context-item"><span class="context-label">Scene:</span>${data.contextInfo.scene}</div>` : ''}
                ${data.contextInfo.speaker ? `<div class="context-item"><span class="context-label">Speaker:</span>${data.contextInfo.speaker}</div>` : ''}
                ${data.contextInfo.chapter ? `<div class="context-item"><span class="context-label">Chapter:</span>${data.contextInfo.chapter}</div>` : ''}
            </div>
            ` : ''}
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
    if (data.contextInfo.act) markdown += `- Act: ${data.contextInfo.act}\n`;
    if (data.contextInfo.scene) markdown += `- Scene: ${data.contextInfo.scene}\n`;
    if (data.contextInfo.speaker) markdown += `- Speaker: ${data.contextInfo.speaker}\n`;
    if (data.contextInfo.chapter) markdown += `- Chapter: ${data.contextInfo.chapter}\n`;
    markdown += `\n`;
  }

  // Messages
  markdown += `## Conversation\n\n`;
  
  data.messages.forEach((message: any) => {
    const time = formatTimeOnly(message.timestamp);
    
    if (message.role === 'user') {
      markdown += `### 👤 User (${time})\n\n`;
      markdown += `${message.content}\n\n`;
    } else {
      const provider = message.provider ? ` - ${message.provider.toUpperCase()}` : '';
      markdown += `### 🤖 Assistant${provider} (${time})\n\n`;
      
      if (message.videoId) {
        markdown += `🎬 **Found related video**\n\n`;
        markdown += `[${message.videoTitle}](https://www.youtube.com/watch?v=${message.videoId})\n\n`;
      } else {
        markdown += `${message.content}\n\n`;
      }
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
    if (data.contextInfo.act) text += `Act: ${data.contextInfo.act}\n`;
    if (data.contextInfo.scene) text += `Scene: ${data.contextInfo.scene}\n`;
    if (data.contextInfo.speaker) text += `Speaker: ${data.contextInfo.speaker}\n`;
    if (data.contextInfo.chapter) text += `Chapter: ${data.contextInfo.chapter}\n`;
    text += `\n`;
  }

  // Messages
  text += `CONVERSATION:\n`;
  text += `${'-'.repeat(30)}\n\n`;
  
  data.messages.forEach((message: any) => {
    const time = formatTimeOnly(message.timestamp);
    
    if (message.role === 'user') {
      text += `[${time}] USER:\n`;
      text += `${message.content}\n\n`;
    } else {
      const provider = message.provider ? ` (${message.provider.toUpperCase()})` : '';
      text += `[${time}] ASSISTANT${provider}:\n`;
      
      if (message.videoId) {
        text += `🎬 Found related video: ${message.videoTitle}\n`;
        text += `URL: https://www.youtube.com/watch?v=${message.videoId}\n\n`;
      } else {
        text += `${message.content}\n\n`;
      }
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
