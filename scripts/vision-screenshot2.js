// More careful screenshot analysis
const ZAI = require('z-ai-web-dev-sdk').default;
const fs = require('fs');

async function main() {
  const zai = await ZAI.create();
  const imagePath = '/home/z/my-project/upload/Screenshot_۲۰۲۶-۰۹-۱۱-۱۱-۵۱-۲۸-۹۹۰_com.android.chrome.jpg';
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Look at this mobile screenshot carefully. I see a dark page with a yellow video camera icon in the middle. Please tell me:\n\n1. Is there a yellow or colored button visible anywhere on the page? If yes, where is it (top/middle/bottom) and what does the text on it say?\n\n2. What text is shown above/below the yellow camera icon?\n\n3. Is there ANY visible camera preview, video feed, or live image of a person? Or is it just an icon?\n\n4. Are there any visible error messages, alerts, or warning icons?\n\n5. Is there a chat input box visible at the bottom? What color is the send button?\n\nAnswer briefly and clearly.',
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
