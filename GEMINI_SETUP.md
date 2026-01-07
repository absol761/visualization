# Gemini AI Integration Setup

This app includes a lightweight Gemini AI integration for intelligent note processing with minimal token usage.

## Setup Instructions

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure the API Key

Create a `.env` file in the root of your project:

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

**Important:** Never commit your `.env` file to git! It's already in `.gitignore`.

### 3. Restart Your Dev Server

After adding the API key, restart your development server:

```bash
npm run dev
```

## Features

The AI assistant provides these token-efficient features:

- **📝 Summarize** - Get a concise summary of your note
- **🏷️ Generate Title** - Auto-generate a title for your note
- **💡 Related Ideas** - Get related ideas and connections
- **✅ Extract Tasks** - Extract actionable tasks from your note
- **📖 Expand** - Expand on an idea with more detail
- **💭 Suggest** - Get actionable next steps

## Token Usage Optimization

The integration is designed to minimize token usage:

1. **Response Caching** - Identical requests are cached for 5 minutes
2. **Token Limits** - Responses are limited (50-500 tokens depending on action)
3. **Input Truncation** - Long inputs are truncated to prevent excessive token usage
4. **Efficient Prompts** - Prompts are optimized for minimal token consumption

## Usage

1. Open a note in Focus Mode or the Note Panel
2. Click the "🤖 AI" button
3. Select an action from the menu
4. The AI will process your note content and return results

Results are automatically integrated:
- **Title** - Updates the note title
- **Tasks** - Appends tasks to the note
- **Expand** - Appends expanded content to the note
- **Other actions** - Show results in a dialog

## API Costs

Using Gemini 1.5 Flash (the default model):
- **Free tier**: 15 requests per minute
- **Paid tier**: Very affordable pricing
- **Token usage**: Typically 100-500 tokens per request

The integration uses caching to reduce duplicate API calls and minimize costs.

## Troubleshooting

**Error: "Gemini API key not configured"**
- Make sure you created a `.env` file with `VITE_GEMINI_API_KEY`
- Restart your dev server after adding the key

**Error: "API quota exceeded"**
- You've hit the free tier rate limit (15 requests/minute)
- Wait a minute or upgrade to paid tier

**No response from AI**
- Check your internet connection
- Verify your API key is correct
- Check the browser console for error messages

