import fs from 'fs';
import Tesseract from 'tesseract.js';

async function testOcr() {
  const imagePath = 'C:/Users/arjun/.gemini/antigravity/brain/bfda99cd-ec24-4a2f-b419-9ec1ce60d72c/.user_uploaded/media_1793279619925_1047d4fe.jpg';
  console.log('Testing image:', imagePath);
  console.log('File exists?', fs.existsSync(imagePath));

  const result = await Tesseract.recognize(imagePath, 'eng', {
    logger: m => {
      if (m.status === 'recognizing text') console.log(`Progress: ${Math.round(m.progress * 100)}%`);
    }
  });

  console.log('=== RAW TESSERACT OCR OUTPUT ===');
  console.log(result.data.text);
  console.log('================================');
}

testOcr().catch(console.error);

