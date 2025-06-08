# CallScout

Live Earnings Call Insight — Real-time annotated transcript analysis

## Features

- **Live Audio Streaming**: Real-time HLS audio playback with synchronized transcript
- **Dynamic Transcription**: Word-by-word transcript display with timing synchronization
- **AI-Powered Insights**: Automatic generation of insights as the call progresses
- **Smart Scrolling**: Auto-scroll with user control and "jump to live" functionality
- **Responsive Design**: Modern UI with dark/light mode support

## New: AI Insight API

CallScout now includes an AI-powered insight system that automatically analyzes completed sentences and generates relevant insights.

### API Endpoint

**POST** `/api/generate-insight`

**Request Body:**
```json
{
  "conversationHistory": "Everything said before the current segment",
  "currentSentence": "The complete segment text that was just spoken", 
  "timestamp": "12:30",
  "segmentId": "seg_123",
  "sentenceStartTime": 750.5,
  "sentenceEndTime": 753.2
}
```

**Response:**
```json
{
  "insight": {
    "id": "insight_1749382488495_kbhfxydjb",
    "startTime": "12:30",
    "endTime": "12:37",
    "text": "Cash flow improvements suggest better working capital management.",
    "segmentId": "seg_123",
    "createdAt": "2025-06-08T11:34:48.495Z"
  },
  "meta": {
    "processingTimeMs": 0,
    "timestamp": "2025-06-08T11:34:48.496Z"
  }
}
```

### Insight Types

AI generates contextual insights covering various topics including financial metrics, strategic initiatives, market analysis, operational updates, and management commentary.

### How It Works

1. **Real-time Analysis**: As the audio plays and transcript appears word by word
2. **Segment Completion Detection**: System identifies when a transcript segment is fully completed
3. **Post-Segment Processing**: Calls insight API once per segment after completion
4. **Dual Context**: API receives both:
   - **Current Segment**: The complete segment text with exact timing
   - **Conversation History**: Everything said before this segment
5. **Accurate Timing**: Insights use segment start/end times from audio
6. **One Insight Per Segment**: Each segment can have at most one insight
7. **Live Insights**: 50% chance of generating insights that appear immediately

### Segment-Based Insight Strategy

**Approach**: One insight per completed segment for clean, predictable UX.

#### 🔍 **Segment Completion Processing**
- Wait for transcript segments to be fully completed (2 seconds after last word)
- Process each segment once with its complete content
- Generate at most one insight per segment

#### 🎯 **Simple Visual Design**
- **Clean Indicators**: Single AI badge per segment when insight exists
- **Inline Display**: Insights appear directly below their segment
- **Consistent Layout**: No complex counting or grouping needed

#### 📊 **UI Elements**

**In Transcript Segments:**
```
🔴 [Live indicator] 🤖 AI ← Simple indicator when insight exists
```

**Insight Display:**
```
[Segment content...]
┌─ 🤖 AI insight
└─ "Revenue growth signals positive market positioning."
```

#### 🚀 **Benefits**
- **Predictable UX**: Always 0 or 1 insight per segment
- **Complete Context**: API receives full segment content for better analysis
- **Simple State Management**: No complex counting or throttling logic
- **Clean Visual Design**: Straightforward insight display

### Features

- **Intelligent Analysis**: AI generates contextual insights based on conversation content
- **Logging**: Comprehensive request/response logging for debugging
- **Clean UI**: Simplified insight display without visual clutter
- **Visual Indicators**: AI-generated insights are clearly marked
- **Real-time Integration**: Seamless integration with live transcript flow

## Testing the API

```bash
# Health check
curl -X GET http://localhost:3000/api/generate-insight

# Generate segment-based insight
curl -X POST http://localhost:3000/api/generate-insight \
  -H "Content-Type: application/json" \
  -d '{
    "conversationHistory": "Tesla Q1 2025 earnings call discussion about performance",
    "currentSentence": "Revenue increased significantly with strong profit margins this quarter due to improved operational efficiency",
    "timestamp": "12:30",
    "segmentId": "seg_test_1",
    "sentenceStartTime": 750.5,
    "sentenceEndTime": 753.2
  }'
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

The CallScout interface will load with:
- Live audio player for Tesla Q1 2025 earnings call
- Real-time transcript with word-level timing
- Insight sidebar showing both static and AI-generated insights
- Smart scrolling controls for following live content

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
