import express from 'express';

const router = express.Router();

/**
 * Clean and extract base64 data and mime type from data URL
 */
function extractBase64(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (match) {
    return {
      mimeType: match[1],
      data: match[2]
    };
  }
  return {
    mimeType: 'image/jpeg',
    data: dataUrl
  };
}

/**
 * POST /api/ocr/gemini
 * Multimodal AI OCR Engine powered by Google Gemini Vision
 */
router.post('/gemini', async (req, res) => {
  try {
    const { image, docType = 'all' } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_KEY')) {
      return res.status(400).json({
        success: false,
        error: 'NO_API_KEY',
        message: 'GEMINI_API_KEY is not configured in the backend .env file. Please paste your Google Gemini API key into .env.'
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided for OCR analysis.'
      });
    }

    const imgParts = extractBase64(image);
    if (!imgParts || !imgParts.data) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format provided. Expected base64 or DataURL.'
      });
    }

    const requestedTypeInstruction = docType === 'pan'
      ? 'This is a PAN upload. Extract ONLY the PAN number. Do not copy a name, date of birth, address, phone, or any other field.'
      : docType === 'aadhaar'
      ? 'This is an Aadhaar upload. Extract the Aadhaar number and the holder name. You may also return other clearly printed Aadhaar fields, but never invent PAN or Driving Licence data. Ignore any VID number.'
      : docType === 'dl'
      ? 'This is a Driving Licence upload. Extract ONLY the licence number, validity/expiry date, and licence category/class. Do not copy PAN, Aadhaar, phone, or unrelated identity fields.'
      : 'Identify the document type first, then return only fields that belong to that document type.';

    const systemPrompt = `You are an expert Indian Government Document OCR extraction system for commercial fleet driver onboarding and vehicle compliance.
Carefully examine this document image (it could be an Indian Driving Licence, Aadhaar Card Front/Back, PAN Card, Vehicle Registration Certificate RC, Traffic Challan, Fuel Receipt, or Workshop Bill).

${requestedTypeInstruction}

Extract all visible identity, licensing, and vehicle information with extreme precision.
Pay special attention to Indian documents:
- DL Number: e.g. GJ06 20250013670, MH14 20190088123, DL04 2020...
- Aadhaar Number: 12 digits formatted as XXXX XXXX XXXX (e.g. 3639 7365 6509). Ignore VID numbers.
- Mobile No: e.g. 9428424115 if printed on the card (common on newer Aadhaar cards).
- Full Name: Full personal name in English (e.g. DHRUV R PAREKH or Parekh Dhruv Rakeshbhai).
- Father's Name: Son/Daughter/Wife of or S/O line (e.g. RAKESHBHAI PAREKH or Parekh Rakeshbhai).
- Date of Birth (DOB): DD-MM-YYYY format (e.g. 09-04-2007).
- Gender: Male, Female, or Other.
- Driving Licence Expiry: Look for 'Validity (NT)' or 'Valid Till' date (e.g. 08-04-2047).
- DL Category: e.g. 'LMV & MCWG (Commercial Transport)' or 'Commercial LMV'.
- Address: Complete clean street, colony, locality, taluka/district, state, and 6-digit pincode without newline linebreaks.

Return ONLY a valid JSON object matching this exact structure:
{
  "detectedType": "aadhaar" | "dl" | "pan" | "rc" | "challan" | "fuel" | "maintenance" | "other",
  "docType": "Descriptive title (e.g. Gujarat Commercial Driving Licence, UIDAI Aadhaar Card)",
  "name": "",
  "phone": "",
  "dob": "",
  "gender": "",
  "fatherName": "",
  "drivingLicence": "",
  "dlExpiry": "",
  "dlCategory": "",
  "aadhaar": "",
  "panCard": "",
  "address": "",
  "registration": "",
  "model": "",
  "fuelType": "",
  "challanNumber": "",
  "amount": "",
  "policeVerification": "Verified (Clear)"
}`;

    // Call Google Gemini API (gemini-1.5-flash or gemini-2.0-flash)
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

    const requestPayload = {
      contents: [
        {
          parts: [
            { text: systemPrompt },
            {
              inline_data: {
                mime_type: imgParts.mimeType,
                data: imgParts.data
              }
            }
          ]
        }
      ],
      generationConfig: {
        response_mime_type: 'application/json',
        temperature: 0.1
      }
    };

    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error Response:', response.status, errText);
      return res.status(response.status).json({
        success: false,
        error: 'GEMINI_API_ERROR',
        message: `Gemini API returned status ${response.status}: ${errText}`
      });
    }

    const geminiData = await response.json();
    const candidateText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return res.status(500).json({
        success: false,
        message: 'Gemini did not return any OCR content.'
      });
    }

    let parsedResult = {};
    try {
      parsedResult = JSON.parse(candidateText);
    } catch {
      // Fallback clean markdown codeblocks if any
      const cleaned = candidateText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    // Enforce strict field isolation by document category
    const isAadhaar = docType === 'aadhaar' || (docType === 'all' && parsedResult.detectedType === 'aadhaar');
    const isPan = docType === 'pan' || (docType === 'all' && parsedResult.detectedType === 'pan');
    const isDl = docType === 'dl' || (docType === 'all' && parsedResult.detectedType === 'dl');

    if (isAadhaar) {
      parsedResult.panCard = '';
      parsedResult.drivingLicence = '';
      parsedResult.dlExpiry = '';
      parsedResult.dlCategory = '';
      parsedResult.detectedType = 'aadhaar';
    } else if (isPan) {
      parsedResult.aadhaar = '';
      parsedResult.drivingLicence = '';
      parsedResult.dlExpiry = '';
      parsedResult.dlCategory = '';
      parsedResult.address = '';
      parsedResult.name = '';
      parsedResult.phone = '';
      parsedResult.dob = '';
      parsedResult.gender = '';
      parsedResult.fatherName = '';
      parsedResult.detectedType = 'pan';
    } else if (isDl) {
      parsedResult.aadhaar = '';
      parsedResult.panCard = '';
      parsedResult.address = '';
      parsedResult.phone = '';
      parsedResult.name = '';
      parsedResult.dob = '';
      parsedResult.gender = '';
      parsedResult.fatherName = '';
      parsedResult.detectedType = 'dl';
    }

    return res.json({
      success: true,
      engine: 'Google Gemini 1.5 Flash Vision',
      data: parsedResult
    });
  } catch (err) {
    console.error('Gemini OCR Handler Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal error while processing Gemini OCR'
    });
  }
});

/**
 * GET /api/ocr/status
 * Check if Gemini Vision OCR is configured on the backend
 */
router.get('/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const isConfigured = !!(apiKey && apiKey.trim() !== '' && !apiKey.includes('YOUR_KEY'));
  res.json({
    configured: isConfigured,
    model: 'gemini-1.5-flash',
    engine: 'Google Multimodal Vision AI'
  });
});

export default router;
