// Analyze the user's new screenshot
const ZAI = require('z-ai-web-dev-sdk').default;
const fs = require('fs');

async function main() {
  const zai = await ZAI.create();
  const imagePath = '/home/z/my-project/upload/Screenshot_۲۰۲۶-۰۹-۱۱-۱۳-۰۷-۲۷-۷۰۰_com.android.chrome.jpg';
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const response = await zai.chat.completions.createVision({
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'این اسکرین‌شات از یک صفحه موبایل است. کاربر می‌گوید «چرا خطا میده؟». لطفاً با دقت توصیف کن:\n\n۱) آیا پیام خطا (error message) روی صفحه دیده می‌شود؟ اگر بله، متن دقیق خطا را به فارسی رونویسی کن (هر چه را می‌بینی).\n\n۲) آیا آیکون هشدار قرمز یا نارنجی دیده می‌شود؟ چه شکلی است؟\n\n۳) در کدام صفحه از برنامه است (تشکیل محفل، لیست محافل، صفحه محفل، صفحه لاگین، صفحه نتایج، ...)؟\n\n۴) آیا دکمه «تلاش مجدد» یا «بازگشت» دیده می‌شود؟\n\n۵) وضعیت کلی صفحه را توصیف کن (سبک تیره، با چه المان‌هایی).',
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
