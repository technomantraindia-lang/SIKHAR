const rawOcr = `U4 TRA TET EB
Parekh Dhruv
fecal Rakeshbhai
fe] DOB: 09/04/2007 —
| =F |MALE SARIN uw
Mobile No: 9428424115 i ods
B= Pa
“43639 7365 6509 ex
VID : VID : 9114 8076 1415 1588 cotmbimss
HRL AUR, HIF QUO`;

function testParseAadhaar(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  
  // 1. Identify and completely eliminate any line or token related to VID
  // VID line can contain 'VID', 'Virtual', or 16-digit sequences
  const linesWithoutVid = lines.filter(line => {
    const up = line.toUpperCase();
    if (up.includes('VID') || up.includes('VIRTUAL')) return false;
    // Check if line contains a 16-digit sequence (4 groups of 4 digits)
    if (/\b\d{4}[\s-]+\d{4}[\s-]+\d{4}[\s-]+\d{4}\b/.test(line)) return false;
    return true;
  });

  console.log('Lines after removing VID lines:');
  console.log(linesWithoutVid);

  // 2. Search for Aadhaar number
  // An Aadhaar number is 12 digits: XXXX XXXX XXXX
  // Often on cards with noisy OCR, there might be quotes or OCR noise: “43639 7365 6509 ex
  // Let's inspect candidate lines:
  let detectedAadhaar = '';

  for (const line of linesWithoutVid) {
    // Strip common leading/trailing OCR junk like quotes, brackets, bullet, dashes
    const _cleanLine = line.replace(/^[“"‘'|\\/()[\]\s#*–—\d]*?(?=[2-9]\d{3}\s)/, '');
    
    // Test for standard 12-digit pattern: 4 digits, space, 4 digits, space, 4 digits
    const m1 = line.match(/(?<!\d)([2-9]\d{3})[\s-]+(\d{4})[\s-]+(\d{4})(?!\d)/);
    if (m1) {
      detectedAadhaar = `${m1[1]} ${m1[2]} ${m1[3]}`;
      break;
    }

    // If there was a leading stray char or digit joined (like “43639 7365 6509):
    // Notice two 4-digit blocks at end: (\d{4})[\s-](\d{4})
    // And before it: (\d{4}) ending right before the space
    const m2 = line.match(/(\d{4})[\s-]+(\d{4})[\s-]+(\d{4})/);
    if (m2) {
      // If first group has 5 digits or preceded by noise, take the 4 digits before space:
      detectedAadhaar = `${m2[1]} ${m2[2]} ${m2[3]}`;
      break;
    }

    // Check with regex looking for 4 digits followed by 4 digits followed by 4 digits
    const m3 = line.match(/([2-9]\d{3})\s+(\d{4})\s+(\d{4})/);
    if (m3) {
      detectedAadhaar = `${m3[1]} ${m3[2]} ${m3[3]}`;
      break;
    }
  }

  // 3. Name extraction
  // On this card:
  // Line 1: 'Parekh Dhruv'
  // Line 2: 'fecal Rakeshbhai'
  // Notice 'fecal' is OCR misreading of Gujarati header/emblem or symbol, followed by 'Rakeshbhai'.
  // Let's see how name lines work:
  let extractedName = '';
  const dobIdx = lines.findIndex(l => /DOB|Date of Birth|जन्म/i.test(l));
  console.log('DOB line idx:', dobIdx);
  if (dobIdx > 0) {
    const candidateLines = [];
    for (let i = dobIdx - 1; i >= 0 && candidateLines.length < 3; i--) {
      const l = lines[i];
      // Clean up symbols and noisy tokens
      const cleanedWords = l
        .replace(/[^A-Za-z\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length >= 2 && !/^(fecal|fe|TRA|TET|EB|U4|GOVT|INDIA|BHARAT|MALE|FEMALE|DOB)$/i.test(w));
      if (cleanedWords.length > 0) {
        candidateLines.unshift(cleanedWords.join(' '));
      }
    }
    extractedName = candidateLines.join(' ');
  }

  console.log('Result:');
  console.log('Aadhaar:', detectedAadhaar);
  console.log('Name:', extractedName);
}

testParseAadhaar(rawOcr);

console.log('\n--- Testing Address Parsing ---');
const backText = `Address:
S/O: Parekh Rakeshbhai, A/12, manish appartment, santoshi nagar ni andar, near nanubhai tower, new sama road, Vemali, Vadodara, Gujarat - 390008
Unique Identification Authority of India
Help: 1947 help@uidai.gov.in www.uidai.gov.in`;

import { cleanIndianOcrAddress } from '../src/components/common/DocumentOcrScannerModal.jsx';
console.log(cleanIndianOcrAddress(backText));
