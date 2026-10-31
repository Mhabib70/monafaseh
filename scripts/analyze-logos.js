// Analyze the uploaded logo images
const ZAI = require('z-ai-web-dev-sdk').default;
const fs = require('fs');

async function main() {
  const zai = await ZAI.create();
  const files = [
    { path: '/home/z/my-project/upload/images.png', name: 'images.png (probably bale)' },
    { path: '/home/z/my-project/upload/im2ages.png', name: 'im2ages.png (probably eitaa)' },
    { path: '/home/z/my-project/upload/rubika-1744719896.jpg', name: 'rubika.jpg' },
  ];

  for (const f of files) {
    const imageBuffer = fs.readFileSync(f.path);
    const base64Image = imageBuffer.toString('base64');
    const response = await zai.chat.completions.createVision({
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `What is this image? Is it a logo? What platform does it represent? Describe the colors and shape briefly.` },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Image}` } }
        ]
      }],
      thinking: { type: 'disabled' },
    });
    console.log(`=== ${f.name} ===`);
    console.log(response.choices[0]?.message?.content);
    console.log('');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
