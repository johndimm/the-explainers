# Single Play Mode

This document explains how to configure The Explainers app for single-play mode, where the app focuses on a single Shakespeare play or literary work.

## Overview

Single Play Mode transforms the full library app into a focused, premium experience for a single play. Each play gets its own:
- Custom theme (tragedy, comedy, history, romance)
- Custom branding and colors
- Simplified navigation (no library)
- Play-specific content and examples

## Environment Variables

### Core Configuration
```bash
# Enable single play mode
SINGLE_PLAY_MODE=true

# Play information
PLAY_TITLE="Romeo and Juliet"
PLAY_AUTHOR="William Shakespeare"
PLAY_FILENAME="romeo-and-juliet.txt"
IS_SHAKESPEARE=true
```

### Theme Configuration
```bash
# Theme type (tragedy, comedy, history, romance)
THEME_TYPE="tragedy"

# App branding
APP_NAME="Romeo and Juliet Explained"
APP_DESCRIPTION="Understand Romeo and Juliet with AI-powered explanations"
APP_URL="romeo-and-juliet-explained.vercel.app"
APP_ICON_TEXT="R&J"
```

### User Guide Customization
```bash
GUIDE_TITLE="Understanding Romeo and Juliet"
GUIDE_SUBTITLE="Your guide to Shakespeare's timeless tragedy"
```

## Theme Types

### Tragedy (Purple Theme)
- **Color**: Deep purple (#8B5CF6)
- **Icon Style**: Crown
- **Mood**: Dramatic
- **Examples**: Romeo & Juliet, Hamlet, Macbeth, Othello, King Lear

### Comedy (Green Theme)
- **Color**: Emerald green (#10B981)
- **Icon Style**: Comedy mask
- **Mood**: Playful
- **Examples**: A Midsummer Night's Dream, Much Ado About Nothing, Twelfth Night

### History (Red Theme)
- **Color**: Deep red (#DC2626)
- **Icon Style**: Scroll
- **Mood**: Epic
- **Examples**: Henry V, Richard III, Julius Caesar

### Romance (Violet Theme)
- **Color**: Violet (#7C3AED)
- **Icon Style**: Heart
- **Mood**: Mystical
- **Examples**: The Tempest, Winter's Tale, Cymbeline

## File Structure

```
public/
  plays/
    romeo-and-juliet.txt
    midsummer-nights-dream.txt
    hamlet.txt
    henry-v.txt
    # ... other play files
```

## Deployment

### Vercel Configuration
1. Create a new Vercel project for each play
2. Set the environment variables
3. Deploy with the play-specific configuration

### Example Deployments
- `romeo-and-juliet-explained.vercel.app`
- `midsummer-explained.vercel.app`
- `hamlet-explained.vercel.app`
- `henry-v-explained.vercel.app`

## App Store Strategy

### Individual Apps ($5 each)
- Each play as a separate app
- Custom icons with play abbreviations
- Theme-specific colors and branding
- Play-specific screenshots and descriptions

### Collection Strategy
- "Shakespeare Tragedies Collection"
- "Shakespeare Comedies Collection"
- "Complete Shakespeare Collection"

## Technical Implementation

### Conditional Rendering
```typescript
const { isSinglePlay, playTitle, themeColor } = useTheme()

// Hide library in single play mode
{!isSinglePlay && (
  <button onClick={() => router.push('/library')}>
    📚 Library
  </button>
)}
```

### Dynamic Theming
```typescript
const theme = getCurrentTheme()
// Returns: { type: 'tragedy', color: '#8B5CF6', iconStyle: 'crown', ... }
```

### Single Play Loading
```typescript
const playText = await loadSinglePlayText(config)
// Loads from /plays/{PLAY_FILENAME}
```

## Revenue Potential

- **Individual Plays**: $5 × 10,000 downloads = $50,000 per play
- **37 Shakespeare Plays**: Massive potential
- **Classic Literature**: Even more opportunities
- **Premium Experience**: Focused, specialized apps

## Benefits

1. **Focused Experience**: Users get a specialized app for their specific play
2. **Premium Feel**: Each app feels uniquely crafted
3. **Simplified Navigation**: No library clutter, just the play
4. **Theme Consistency**: Visual identity matches the play's genre
5. **App Store Optimization**: Targeted keywords and descriptions
6. **Collection Appeal**: Users can "complete the set"

## Example Configurations

### Romeo and Juliet (Tragedy)
```bash
SINGLE_PLAY_MODE=true
PLAY_TITLE="Romeo and Juliet"
PLAY_AUTHOR="William Shakespeare"
PLAY_FILENAME="romeo-and-juliet.txt"
IS_SHAKESPEARE=true
THEME_TYPE="tragedy"
APP_NAME="Romeo and Juliet Explained"
APP_ICON_TEXT="R&J"
```

### A Midsummer Night's Dream (Comedy)
```bash
SINGLE_PLAY_MODE=true
PLAY_TITLE="A Midsummer Night's Dream"
PLAY_AUTHOR="William Shakespeare"
PLAY_FILENAME="midsummer-nights-dream.txt"
IS_SHAKESPEARE=true
THEME_TYPE="comedy"
APP_NAME="A Midsummer Night's Dream Explained"
APP_ICON_TEXT="MSND"
```

### Henry V (History)
```bash
SINGLE_PLAY_MODE=true
PLAY_TITLE="Henry V"
PLAY_AUTHOR="William Shakespeare"
PLAY_FILENAME="henry-v.txt"
IS_SHAKESPEARE=true
THEME_TYPE="history"
APP_NAME="Henry V Explained"
APP_ICON_TEXT="H5"
```