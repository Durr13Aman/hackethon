# Course Planning Assistant - Chrome Extension

An AI-powered Chrome extension designed to help UW-Madison students with course planning directly on the enrollment website.

## Features

- **Side Panel Interface**: Opens alongside enroll.wisc.edu for seamless assistance
- **Screenshot Mode**: Automatically captures screenshots every 5 seconds for visual AI analysis
- **AI Vision Analysis**: Uses GPT-4o vision capabilities to extract course information from screenshots
- **AI Chat Assistant**: Ask questions about courses, scheduling, and planning
- **OpenAI Integration**: Powered by GPT-4o for intelligent, vision-enabled responses
- **Persistent Conversations**: Your chat history is saved and restored
- **Flexible Data Extraction**: Works with any page layout without needing specific DOM selectors

## Installation

### 1. Get an OpenAI API Key

You'll need an OpenAI API key to use this extension:

1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy and save your API key securely

### 2. Install the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right corner)
3. Click "Load unpacked"
4. Select the folder containing this extension
5. The extension should now appear in your extensions list

### 3. Add Icons (Optional)

The extension requires icon files. You can either:

- Create your own 16x16, 48x48, and 128x128 PNG icons and place them in the `icons/` folder, or
- Use online tools to generate icons from text/images

Name them as:
- `icons/icon16.png`
- `icons/icon48.png`
- `icons/icon128.png`

For now, the extension will work without icons but may show a placeholder.

## Usage

### First Time Setup

1. Navigate to [enroll.wisc.edu](https://enroll.wisc.edu)
2. Click the extension icon in your Chrome toolbar
3. The side panel will open
4. Enter your OpenAI API key in the input field at the top
5. Click "Save"

### Using the Assistant

1. **Enable Screenshot Mode** (Recommended):
   - Click the "Enable Screenshots" button in the side panel
   - The extension will capture screenshots of the page every 5 seconds
   - The AI will analyze these screenshots to understand what you're viewing
   - This works with any page layout on enroll.wisc.edu

2. **Browse Courses**: Navigate to any course page on enroll.wisc.edu

3. **Ask Questions**: Type questions in the chat interface like:
   - "What courses are shown on this page?"
   - "What are the prerequisites for this course?"
   - "Help me plan my schedule for next semester"
   - "What times are available for this course?"
   - "Is this course right for my major?"

### Features

- **Screenshot Capture**: Enable/disable automatic screenshot capture (every 5 seconds)
- **Visual AI Analysis**: GPT-4o analyzes screenshots to extract course information accurately
- **Context-Aware**: The AI sees exactly what you see on the page
- **Conversation History**: Your conversations are saved and persist across sessions
- **No DOM Dependencies**: Works regardless of page structure changes

## File Structure

```
course-planning-assistant/
├── manifest.json           # Extension configuration
├── sidepanel.html         # Side panel UI
├── sidepanel.js           # Side panel logic and OpenAI integration
├── styles.css             # Styling
├── content.js             # Course data extraction
├── background.js          # Service worker
├── icons/                 # Extension icons (create these)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Customization

### Adjusting Screenshot Interval

In `background.js`, you can change the screenshot capture interval (default is 5000ms = 5 seconds):

```javascript
startScreenshotCapture(message.interval || 5000);  // Change 5000 to your preferred interval
```

### Changing AI Model

The extension uses GPT-4o for vision capabilities. In `sidepanel.js`, you can change the model if needed:

```javascript
model: 'gpt-4o',  // This model supports vision
```

**Note**: Vision capabilities require GPT-4o or GPT-4o-mini models.

### Adjusting Context Window

The extension keeps the last 10 messages for context. Adjust in `sidepanel.js`:

```javascript
...conversationHistory.slice(-10)  // Change -10 to -20 for more context
```

### Screenshot Quality

In `background.js`, you can adjust screenshot quality by modifying the capture options:

```javascript
const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {
  format: 'png',  // Can use 'jpeg' for smaller file size
  quality: 90     // For jpeg only: 0-100
});
```

## Privacy & Security

- **API Key Storage**: Your OpenAI API key is stored locally in Chrome's storage
- **No External Servers**: The extension only communicates with OpenAI's API
- **Local Data**: Conversation history is stored locally on your device
- **Permissions**: The extension only has access to enroll.wisc.edu pages

## Troubleshooting

### Extension Not Loading
- Make sure all files are in the same directory
- Check that manifest.json is valid
- Reload the extension from chrome://extensions

### Screenshots Not Capturing
- Make sure you clicked "Enable Screenshots" in the side panel
- Ensure you're on an enroll.wisc.edu page
- Check the browser console for errors (F12 → Console)
- The button should turn red and say "Stop Screenshots" when active

### API Errors
- Verify your OpenAI API key is correct
- Check you have credits in your OpenAI account
- Check browser console for error messages (F12 → Console)

### Side Panel Not Opening
- Make sure you're on enroll.wisc.edu
- Try clicking the extension icon again
- Check that side panel is enabled in extension settings

## Development

To modify the extension:

1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Test your changes

## Cost Considerations

This extension uses OpenAI's API which has associated costs:
- GPT-4o costs approximately $2.50 per 1M input tokens and $10.00 per 1M output tokens
- Vision API (processing screenshots) has additional costs based on image size
- A typical conversation with screenshots might cost $0.05-$0.10
- Screenshots are captured every 5 seconds only when enabled
- **Tip**: Only enable screenshots when actively using the assistant to minimize costs
- Monitor usage at [OpenAI Platform](https://platform.openai.com/usage)

**Cost Saving Tips:**
- Disable screenshots when not actively chatting
- Use shorter conversations
- Consider switching to gpt-4o-mini for lower costs (update in sidepanel.js)

## Future Enhancements

Potential features to add:
- Schedule conflict detection
- Course prerequisite tracking
- Export schedules to Google Calendar
- Save favorite courses
- Multi-semester planning
- Course ratings integration
- Degree requirement tracking

## License

This is a personal/educational project. Feel free to modify and enhance!

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Review Chrome DevTools console for errors
3. Verify all files are present and correctly named

---

Built with Chrome Extensions Manifest V3, OpenAI API, and designed for UW-Madison students.