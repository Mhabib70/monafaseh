// Analyze the user's mobile screenshot
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
            text: 'این اسکرین‌شات از صفحه موبایل کاربر است که می‌گوید جلسه تصویری بالا نمی‌آید. لطفاً با دقت دقیقاً بگو: ۱) متن‌های فارسی که روی صفحه نوشته شده را دقیق رونویسی کن (هرچه را می‌بینی). ۲) آیا دکمه‌ای با نام «شروع محفل تصویری» دیده می‌شود؟ ۳) آیا پیام خطا یا loading overlay با متن «در حال درخواست دوربین...» دیده می‌شود؟ ۴) آیا تصویر/ویدیو live ای از کاربر دیده می‌شود؟ ۵) وضعیت کلی صفحه چیست؟',
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
