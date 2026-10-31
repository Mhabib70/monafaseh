// Analyze the error screenshot
const ZAI = require('z-ai-web-dev-sdk').default;
const fs = require('fs');

async function main() {
  const zai = await ZAI.create();
  const imagePath = '/home/z/my-project/upload/Untitledطططییبقلقل.jpg';
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'This is a screenshot showing an error. Please tell me:\n\n1. What is the EXACT error message text shown? Transcribe it character by character.\n\n2. Is this a Next.js error page? Does it say "Application error" or "client-side exception"?\n\n3. Is there any stack trace or error details visible?\n\n4. What URL is shown in the address bar?\n\n5. Is there a "Try again" or "Refresh" button visible?',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    thinking: { type: 'disabled' },
  });

  console.log('=== RESPONSE ===');
  console.log(response.choices[0]?.message?.content);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
