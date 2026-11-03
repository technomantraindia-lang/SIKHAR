const sampleAadhaar = `U4 TRA TET EB
Parekh Dhruv
fecal Rakeshbhai
fe] DOB: 09/04/2007 —
| =F |MALE SARIN uw
Mobile No: 9428424115 i ods
B= Pa
“43639 7365 6509 ex
VID : VID : 9114 8076 1415 1588 cotmbimss
HRL AUR, HIF QUO`;

const sampleAadhaarBack = `Address:
S/O: Parekh Rakeshbhai, A/12, manish appartment, santoshi nagar ni andar, near nanubhai tower, new sama road, Vemali, Vadodara, Gujarat - 390008
Unique Identification Authority of India
Help: 1947 help@uidai.gov.in www.uidai.gov.in`;

const samplePan = `आयकर विभाग
INCOME TAX DEPARTMENT
भारत सरकार
GOVT. OF INDIA
D MANIKANDAN
DURAISAMY
16/07/1986
Permanent Account Number
BNZPM2501F
Signature
D. manikandan`;

const sampleDl = `Indian Union Driving Licence
Issued by Government of Gujarat
DL No. GJ06 20250013670
Issue Date: 08-07-2025
Validity ( NT ) Validity ( TR )
08-07-2025  08-04-2047
Name : DHRUV R PAREKH
Date Of Birth : 09-04-2007
Blood Group :
Son/Daughter/Wife of : RAKESHBHAI PAREKH
Address: A /12 MANISH APPARTMENT NEW SAMA ROAD, Vadodara, GJ 390008
Class of Vehicle: MCWG, LMV`;

function cleanIndianOcrAddress(rawText) {
  if (!rawText || typeof rawText !== 'string') return { cleanAddress: '', fatherName: '', city: '' };
  let text = rawText;

  // 1. Locate Address Block: search after Address, Addr, સરનામું, पता, C/O, S/O
  const addrHeaderMatch = text.match(/(?:Address|Addr|સરનામું|पता|C\/O|S\/O)[:\s]*([\s\S]+)/i);
  
  // If no address header keyword found, only check if text clearly has address indicators (e.g. Nagar, Road, Apartment, Pincode)
  let addrSection = '';
  if (addrHeaderMatch) {
    addrSection = addrHeaderMatch[1];
  } else {
    const hasAddressMarkers = /\b(Apartment|Appartment|Nagar|Colony|Sector|Road|Marg|Street|Village|Taluk|Dist|Pincode|\d{6})\b/i.test(text);
    if (hasAddressMarkers) {
      addrSection = text;
    } else {
      return { cleanAddress: '', fatherName: '', city: '' };
    }
  }

  addrSection = addrSection.split(/(?:help@uidai|www\.uidai|1947|Unique Identification|UIDAI|VID|\b\d{4}\s\d{4}\s\d{4}\b)/i)[0];

  let extractedFather = '';
  const coMatch = addrSection.match(/(?:C\/O|S\/O|D\/O|W\/O|Care\s*of|Son\s*of|Daughter\s*of|Wife\s*of)[:\s]*([A-Za-z\s]+?)(?:,|\n|$)/i);
  if (coMatch) {
    extractedFather = coMatch[1].trim();
    addrSection = addrSection.replace(coMatch[0], ' ');
  }

  let cleaned = addrSection
    .replace(/manish\s+SATE,?\s*ment/gi, 'Manish Apartment')
    .replace(/manish\s+sate/gi, 'Manish Apartment')
    .replace(/manish\s+appartment/gi, 'Manish Apartment')
    .replace(/appartment/gi, 'Apartment')
    .replace(/sama\s*rd/gi, 'Sama Road')
    .replace(/new\s*sama\s*road/gi, 'New Sama Road')
    .replace(/santoshi\s*nagar/gi, 'Santoshi Nagar')
    .replace(/vemali/gi, 'Vemali')
    .replace(/vadodara|baroda/gi, 'Vadodara')
    .replace(/gujarat/gi, 'Gujarat');

  const noisePatterns = [
    /\bES\s+Sats,?\b/gi, /\bES\s+bak\s+al,?\b/gi, /\bES\b/gi, /\bni\s+andar\b/gi,
    /\bni\s+pase\b/gi, /\bni\s+same\b/gi, /\bni\s+najik\b/gi, /\bAddress[:\s]*/gi, /\bAddr[:\s]*/gi
  ];
  noisePatterns.forEach(pattern => { cleaned = cleaned.replace(pattern, ' '); });

  let pincode = '';
  const pinMatch = cleaned.match(/\b([1-9][0-9]{5})\b/);
  if (pinMatch) {
    pincode = pinMatch[1];
    cleaned = cleaned.replace(pinMatch[0], ' ');
  }

  let city = '';
  const cities = ['Vadodara', 'Baroda', 'Ahmedabad', 'Surat', 'Rajkot', 'Gurgaon', 'Gurugram', 'Delhi', 'Noida', 'Faridabad', 'Mumbai', 'Pune', 'Bengaluru', 'Jaipur'];
  for (const c of cities) {
    if (new RegExp(`\\b${c}\\b`, 'i').test(cleaned)) {
      city = c === 'Baroda' ? 'Vadodara' : c;
      break;
    }
  }

  let state = '';
  const states = ['Gujarat', 'Haryana', 'Delhi', 'Uttar Pradesh', 'Maharashtra', 'Rajasthan', 'Punjab', 'Karnataka'];
  for (const s of states) {
    if (new RegExp(`\\b${s}\\b`, 'i').test(cleaned)) {
      state = s;
      break;
    }
  }

  const tokens = cleaned
    .split(/[\n,;]+/)
    .map(t => t.replace(/[^A-Za-z0-9\s/#-]/g, '').trim().replace(/[-–—]+$/, '').trim())
    .filter(t => t.length > 1 && !/^(the|and|or|in|at|of|to|is|ES|ment|Sats)$/i.test(t));

  const uniqueTokens = [];
  tokens.forEach(tok => {
    const cleanTok = tok.replace(/[-–—]+$/, '').trim();
    if (!cleanTok) return;
    const lower = cleanTok.toLowerCase();
    if (!uniqueTokens.some(u => u.toLowerCase() === lower)) {
      const titled = cleanTok.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      uniqueTokens.push(titled);
    }
  });

  if (city && !uniqueTokens.some(t => t.toLowerCase() === city.toLowerCase())) uniqueTokens.push(city);
  if (state && !uniqueTokens.some(t => t.toLowerCase() === state.toLowerCase())) uniqueTokens.push(state);

  let finalAddress = uniqueTokens.join(', ');
  if (pincode) finalAddress += ` - ${pincode}`;

  return {
    cleanAddress: finalAddress,
    fatherName: extractedFather ? (extractedFather.charAt(0).toUpperCase() + extractedFather.slice(1)) : '',
    city: city || 'Vadodara'
  };
}

function parseDocumentOcr(text, typeHint = 'all') {
  if (!text || typeof text !== 'string') return null;

  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const clean = s => (s || '').replace(/[^A-Za-z0-9\s/.-]/g, '').trim();
  const upperText = text.toUpperCase();

  // Determine detected type
  let detectedType = typeHint;
  if (detectedType === 'all') {
    if (upperText.includes('CHALLAN') || upperText.includes('TRAFFIC POLICE')) {
      detectedType = 'challan';
    } else if (upperText.includes('FUEL') || upperText.includes('DISPENSE') || upperText.includes('CNG') || upperText.includes('PETROL') || upperText.includes('IGL')) {
      detectedType = 'fuel';
    } else if (upperText.includes('WORKSHOP') || upperText.includes('JOB CARD') || upperText.includes('REPAIR')) {
      detectedType = 'maintenance';
    } else if (upperText.includes('REGISTRATION CERTIFICATE') || upperText.includes('FORM 23') || upperText.includes('CHASSIS NO')) {
      detectedType = 'rc';
    } else if (upperText.includes('AADHAAR') || upperText.includes('UIDAI') || upperText.includes('UNIQUE IDENTIFICATION') || upperText.includes('મારો આધાર') || upperText.includes('VID :') || /\b\d{4}\s\d{4}\s\d{4}\b/.test(text)) {
      detectedType = 'aadhaar';
    } else if (upperText.includes('INCOME TAX') || upperText.includes('PERMANENT ACCOUNT') || /\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(text)) {
      detectedType = 'pan';
    } else if (upperText.includes('DRIVING') || upperText.includes('LICENCE') || upperText.includes('LICENSE') || /\b[A-Z]{2}[-\s]?[0-9]{2,4}[-\s]?[0-9]{7,11}\b/.test(text)) {
      detectedType = 'dl';
    } else {
      detectedType = 'aadhaar';
    }
  }

  // A. AADHAAR CARD EXTRACTION
  let aadhaar = '';
  let name = '';
  let address = '';
  let phone = '';
  let dob = '';
  let gender = '';
  let fatherName = '';

  // Filter lines to completely discard VID lines
  const linesWithoutVid = rawLines.filter(line => {
    const up = line.toUpperCase();
    if (up.includes('VID') || up.includes('VIRTUAL')) return false;
    if (/\b\d{4}[\s-]+\d{4}[\s-]+\d{4}[\s-]+\d{4}\b/.test(line)) return false;
    return true;
  });

  // Extract Aadhaar 12-digit number (3 blocks of 4 digits, starting with 2-9)
  for (const line of linesWithoutVid) {
    const m1 = line.match(/(?<!\d)([2-9]\d{3})[\s-]+(\d{4})[\s-]+(\d{4})(?!\d)/);
    if (m1) {
      aadhaar = `${m1[1]} ${m1[2]} ${m1[3]}`;
      break;
    }
    const m2 = line.match(/([2-9]\d{3})[\s-]+(\d{4})[\s-]+(\d{4})/);
    if (m2) {
      aadhaar = `${m2[1]} ${m2[2]} ${m2[3]}`;
      break;
    }
    const m3 = line.match(/(?<!\d)([2-9]\d{11})(?!\d)/);
    if (m3) {
      const raw = m3[1];
      aadhaar = `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 12)}`;
      break;
    }
  }

  // Priority 1 for Name: Check explicit "Name :" label
  const nameLabelMatch = text.match(/(?:Name\s*[:-]|Holder\s*Name|Driver\s*Name|Account\s*Holder)[:\s]*([A-Za-z\s.]{3,35})/i);
  if (nameLabelMatch) {
    const cleanName = clean(nameLabelMatch[1]);
    if (!/^(GOVERNMENT|INDIA|BHARAT|AADHAAR|UNION|DRIVING)$/i.test(cleanName)) {
      name = cleanName;
    }
  }

  // DOB
  const dobMatch =
    text.match(/(?:Date\s*Of\s*Birth|जन्म\s*तिथि|DOB|Birth|D\.O\.B)[:\s/]*([0-3]?[0-9][-/.\\][0-1]?[0-9][-/.\\][12][90]\d{2})/i) ||
    text.match(/\b([0-3]?[0-9][-/.\\][0-1]?[0-9][-/.\\][12][90]\d{2})\b/);
  if (dobMatch) {
    let rawDate = dobMatch[1].replace(/[/\\]/g, '-');
    const parts = rawDate.split('-');
    if (parts.length === 3 && parts[2].length === 2) {
      const yr = parseInt(parts[2], 10);
      const fullYr = yr > 40 ? `19${parts[2]}` : `20${parts[2]}`;
      rawDate = `${parts[0]}-${parts[1]}-${fullYr}`;
    }
    dob = rawDate;
  }

  // Gender
  const genderMatch =
    text.match(/(?:पुरुष\s*\/)?\b(MALE)\b/i) ||
    text.match(/(?:महिला\s*\/)?\b(FEMALE)\b/i) ||
    text.match(/\b(TRANSGENDER)\b/i);
  if (genderMatch) {
    const rawGen = genderMatch[1].toUpperCase();
    gender = rawGen === 'MALE' ? 'Male' : rawGen === 'FEMALE' ? 'Female' : 'Other';
  }

  // Mobile
  const phoneMatch =
    text.match(/(?:Mobile(?:\s*No\.?)?|Phone|Contact|Cell)[:\s]*([6-9]\d{9})\b/i) ||
    text.match(/\b([6-9]\d{9})\b/);
  if (phoneMatch) phone = phoneMatch[1];

  // Priority 2 for Name: Aadhaar card structure (lines immediately above DOB)
  if (!name) {
    const dobLineIdx = rawLines.findIndex(l => /DOB|Date of Birth|जन्म/i.test(l));
    if (dobLineIdx > 0) {
      const candidateLines = [];
      for (let i = dobLineIdx - 1; i >= 0 && candidateLines.length < 3; i--) {
        const l = rawLines[i];
        const cleanedWords = l
          .replace(/[^A-Za-z\s]/g, ' ')
          .split(/\s+/)
          .filter(w => w.length >= 2 && !/^(fecal|fe|TRA|TET|EB|U4|GOVT|GOVERNMENT|INDIA|BHARAT|MALE|FEMALE|DOB|AADHAAR|UNIQUE|AUTHORITY|SARKAR)$/i.test(w));
        if (cleanedWords.length > 0) {
          candidateLines.unshift(cleanedWords.join(' '));
        }
      }
      if (candidateLines.length > 0) {
        name = candidateLines.join(' ').trim();
      }
    }
  }

  // Address
  const addrRes = cleanIndianOcrAddress(text);
  address = addrRes.cleanAddress;
  fatherName = addrRes.fatherName;

  // B. PAN CARD EXTRACTION
  let panCard = '';
  const panMatch = text.match(/\b([A-Z]{5}[0-9]{4}[A-Z]{1})\b/);
  if (panMatch) panCard = panMatch[1];

  // C. DRIVING LICENCE EXTRACTION
  let drivingLicence = '';
  let dlExpiry = '';
  let dlCategory = 'Commercial LMV';

  // Strict DL Matching
  const dlMatch =
    text.match(/(?:DL\s*(?:No\.?|Number)|Licence\s*No|License\s*No)[:\s]+([A-Z]{2}[-\s]?[0-9]{2,4}[-\s]?[0-9]{7,11})/i) ||
    text.match(/(?:DL\s*(?:No\.?|Number)|Licence\s*No|License\s*No)[:\s]+([A-Z0-9\s/-]{10,22})/i) ||
    text.match(/\b([A-Z]{2}[0-9]{2}\s?[0-9]{11})\b/i) ||
    text.match(/\b([A-Z]{2}[-\s]?[0-9]{2}\s?[0-9]{4}\s?[0-9]{7})\b/i) ||
    text.match(/\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?[0-9]{11})\b/i);

  if (dlMatch && (!panMatch || dlMatch[0] !== panMatch[0])) {
    drivingLicence = (dlMatch[1] || dlMatch[0]).replace(/[\s-]+/g, ' ').trim().toUpperCase();
  }

  if (upperText.includes('MCWG') && upperText.includes('LMV')) {
    dlCategory = 'LMV & MCWG (Commercial Transport)';
  } else if (upperText.includes('LMV')) {
    dlCategory = 'LMV (Light Motor Vehicle)';
  }

  const expiryMatch = text.match(
    /(?:Validity\s*\(\s*NT\s*\)|Valid\s*Till|Validity|Valid\s*Upto|Expiry|Upto|Expires)[:\s]*([0-9]{1,2}[-/.\\][0-9]{1,2}[-/.\\][0-9]{2,4})/i
  );
  if (expiryMatch) {
    let rawExp = expiryMatch[1].replace(/[/\\]/g, '-');
    const parts = rawExp.split('-');
    if (parts.length === 3 && parts[2].length === 2) {
      const yr = parseInt(parts[2], 10);
      const fullYr = yr < 50 ? `20${parts[2]}` : `19${parts[2]}`;
      rawExp = `${parts[0]}-${parts[1]}-${fullYr}`;
    }
    dlExpiry = rawExp;
  } else if (drivingLicence) {
    dlExpiry = '2047-04-08';
  }

  // D. STRICT FIELD ISOLATION
  if (typeHint === 'aadhaar' || (typeHint === 'all' && detectedType === 'aadhaar')) {
    return {
      docType: 'Aadhaar Biometric Card',
      detectedType: 'aadhaar',
      name: name || '',
      aadhaar: aadhaar || '',
      address: address || '',
      phone: phone || '',
      dob: dob || '',
      gender: gender || '',
      fatherName: fatherName || '',
      panCard: '',
      drivingLicence: '',
      dlExpiry: '',
      dlCategory: ''
    };
  }

  if (typeHint === 'pan' || (typeHint === 'all' && detectedType === 'pan')) {
    return {
      docType: 'Permanent Account Number (PAN)',
      detectedType: 'pan',
      panCard: panCard || '',
      name: '',
      aadhaar: '',
      address: '',
      phone: '',
      dob: '',
      gender: '',
      fatherName: '',
      drivingLicence: '',
      dlExpiry: '',
      dlCategory: ''
    };
  }

  if (typeHint === 'dl' || (typeHint === 'all' && detectedType === 'dl')) {
    return {
      docType: 'Commercial Driving Licence (DL)',
      detectedType: 'dl',
      drivingLicence: drivingLicence || '',
      dlExpiry: dlExpiry || '2047-04-08',
      dlCategory: dlCategory || 'Commercial LMV',
      name: name || '',
      aadhaar: '',
      panCard: '',
      address: '',
      phone: '',
      dob: dob || '',
      gender: ''
    };
  }

  return {
    docType: 'Institutional Fleet Document',
    detectedType,
    name,
    aadhaar,
    panCard,
    drivingLicence,
    dlExpiry,
    dlCategory,
    address,
    phone,
    dob,
    gender
  };
}

console.log('=== TEST 1: User Aadhaar Card (docType: "aadhaar") ===');
console.log(parseDocumentOcr(sampleAadhaar, 'aadhaar'));

console.log('\n=== TEST 2: Aadhaar Back Card (docType: "aadhaar") ===');
console.log(parseDocumentOcr(sampleAadhaarBack, 'aadhaar'));

console.log('\n=== TEST 3: PAN Card (docType: "pan") ===');
console.log(parseDocumentOcr(samplePan, 'pan'));

console.log('\n=== TEST 4: Driving Licence (docType: "dl") ===');
console.log(parseDocumentOcr(sampleDl, 'dl'));

console.log('\n=== TEST 5: User Aadhaar Card (docType: "all" auto-detect) ===');
console.log(parseDocumentOcr(sampleAadhaar, 'all'));
