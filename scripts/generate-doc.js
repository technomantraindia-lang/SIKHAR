import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  WidthType,
  ShadingType
} from 'docx';
import fs from 'fs';
import path from 'path';

console.log('Generating Rapido Integration Details Word Document...');

const primaryColor = '0284C7';
const darkNavy = '0F172A';
const grayBg = 'F8FAFC';
const borderColor = 'CBD5E1';

function createHeading(text, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text,
    heading: level,
    spacing: { before: 280, after: 120 }
  });
}

function createParagraph(text, bold = false) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        bold,
        size: 22,
        font: 'Segoe UI'
      })
    ],
    spacing: { after: 100 }
  });
}

function createCodeBlock(lines) {
  return lines.map(line => new Paragraph({
    children: [
      new TextRun({
        text: line,
        font: 'Consolas',
        size: 19,
        color: '0F172A'
      })
    ],
    shading: {
      type: ShadingType.CLEAR,
      fill: 'F1F5F9'
    },
    spacing: { before: 40, after: 40 }
  }));
}

function createStyledTable(headers, rows) {
  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: headers.map(h => new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: h,
                bold: true,
                color: 'FFFFFF',
                font: 'Segoe UI',
                size: 20
              })
            ]
          })
        ],
        shading: {
          type: ShadingType.CLEAR,
          fill: darkNavy
        },
        margins: { top: 120, bottom: 120, left: 140, right: 140 }
      }))
    }),
    ...rows.map((row, idx) => new TableRow({
      children: row.map(cell => new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: cell,
                font: 'Segoe UI',
                size: 20,
                color: '334155'
              })
            ]
          })
        ],
        shading: {
          type: ShadingType.CLEAR,
          fill: idx % 2 === 0 ? 'FFFFFF' : grayBg
        },
        margins: { top: 100, bottom: 100, left: 140, right: 140 }
      }))
    }))
  ];

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
      left: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
      right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: borderColor }
    }
  });
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 }
        }
      },
      children: [
        // Title Banner
        new Paragraph({
          children: [
            new TextRun({
              text: 'RAPIDO - SIKHAR FLEET API INTEGRATION SPECIFICATION',
              bold: true,
              size: 32,
              color: primaryColor,
              font: 'Segoe UI'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 }
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: 'Technical Whitelisting Parameters, Credentials & cURL Contracts (v1.0)',
              italics: true,
              size: 22,
              color: '64748B',
              font: 'Segoe UI'
            })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 }
        }),

        // Section 1: Fleet Whitelisting & Network Parameters
        createHeading('1. Fleet Identification & Whitelisting Parameters', HeadingLevel.HEADING_2),
        createStyledTable(
          ['Parameter', 'Integration Value', 'Notes / Security Rule'],
          [
            ['Fleet Name', 'Sikhar Fleet Technologies Pvt. Ltd.', 'Registered Commercial Passenger Fleet Entity'],
            ['Primary Hostname', 'https://sikharfleet.com', 'Production HTTPS Gateway with SSL/TLS 1.3'],
            ['Server IP for Whitelisting', '147.93.101.51', 'Single Dedicated IP Address to whitelist on Rapido Firewall'],
            ['Fleet Callback Endpoint', 'PUT https://sikharfleet.com/api/v1/fleet/on_order_status/{orderId}', 'Active endpoint handling real-time ride status transitions'],
            ['Authentication Header', 'apiKey: {{client-api-key}}', 'Alphanumeric 32-character key format']
          ]
        ),
        new Paragraph({ spacing: { after: 200 } }),

        // Section 2: Environment API Keys
        createHeading('2. API Keys & Environment Configuration', HeadingLevel.HEADING_2),
        createStyledTable(
          ['Environment', 'Target Endpoint', 'Configured API Key'],
          [
            ['Production', 'https://sikharfleet.com/api/v1/fleet/on_order_status/{orderId}', 'AGVvQ0JAWYCIThN7N4JFRbJcm9oDOSc3'],
            ['Staging / Pre-Prod', 'https://sikharfleet.com/api/v1/fleet/on_order_status/{orderId}', 'STAGE_9CGUxCY9v8Q4tEsSrG3cF0XRPX3']
          ]
        ),
        new Paragraph({ spacing: { after: 200 } }),

        // Section 3: Data Dictionary
        createHeading('3. Order Status Callback Data Contract (Rapido -> Sikhar)', HeadingLevel.HEADING_2),
        createParagraph('Whenever an order status changes on the Rapido platform, Rapido triggers a PUT request to the Fleet Callback Endpoint with the following payload structure:'),
        createStyledTable(
          ['Parameter', 'Type', 'Mandatory', 'Description / Example'],
          [
            ['phone', 'String', 'Yes', 'Registered mobile number of driver (e.g. "9428424115")'],
            ['pickupLocation', 'Object', 'Yes', 'Latitude and Longitude: {"lat": "12.91195", "lng": "77.64711"}'],
            ['dropLocation', 'Object', 'Yes', 'Latitude and Longitude: {"lat": "12.91195", "lng": "77.64711"}'],
            ['estimatedDistance', 'Integer', 'Yes', 'Estimated distance to destination in meters (e.g. 4000)'],
            ['estimatedTimeToDrop', 'String', 'Yes', 'Epoch timestamp of expected drop time (e.g. "1732528675")'],
            ['status', 'String', 'Yes', 'Status: accepted, arrived, started, dropped, customerCancelled, riderCancelled, aborted, reassigned, completed'],
            ['orderId', 'String', 'Yes', 'Unique identifier for the order (e.g. "RD123456")'],
            ['tripFare', 'Double', 'No', 'Gross trip fare in INR (sent on dropped and completed events)'],
            ['reason', 'String', 'No', 'Reason for cancellation, abort, or driver reassignment']
          ]
        ),
        new Paragraph({ spacing: { after: 200 } }),

        // Section 4: Settlement Data
        createHeading('4. Post-Drop Settlement & Earnings Breakdown (status: "completed")', HeadingLevel.HEADING_2),
        createStyledTable(
          ['Parameter', 'Type', 'Mandatory', 'Description / Sample Value'],
          [
            ['captainEarnings', 'Float', 'Yes', 'Total net earnings credited to the captain (e.g. 42.938)'],
            ['waitingCharges', 'Float', 'No', 'Passenger wait time charges (sent if non-zero, e.g. 8.05)'],
            ['parkingCharges', 'Float', 'No', 'Parking fee incurred during trip (e.g. 7.01)'],
            ['nightCharges', 'Float', 'No', 'Night-time surcharge fee (e.g. 9.02)'],
            ['tollCharges', 'Float', 'No', 'Highway or municipal toll pass-through charges (e.g. 5.02)']
          ]
        ),
        new Paragraph({ spacing: { after: 200 } }),

        // Section 5: cURL Examples
        createHeading('5. Verified cURL Request Examples', HeadingLevel.HEADING_2),

        createParagraph('A. Staging Environment - Order Status Update (Ride Started):', true),
        ...createCodeBlock([
          'curl --location --request PUT \\',
          '  "https://gateway-stage.rapido.bike/api/v1/fleet/on_order_status/RD123456" \\',
          '  --header "apiKey: STAGE_9CGUxCY9v8Q4tEsSrG3cF0XRPX3" \\',
          '  --header "Content-Type: application/json" \\',
          '  --data \'{',
          '    "phone": "9428424115",',
          '    "pickupLocation": { "lat": "12.91195", "lng": "77.64711" },',
          '    "dropLocation": { "lat": "12.91195", "lng": "77.64711" },',
          '    "estimatedDistance": 4000,',
          '    "estimatedTimeToDrop": "1732528675",',
          '    "status": "started",',
          '    "orderId": "RD123456",',
          '    "tripFare": 250.98,',
          '    "reason": "vehicle issue"',
          '  }\''
        ]),
        new Paragraph({ spacing: { after: 150 } }),

        createParagraph('B. Production Environment - Order Status Update (Ride Started):', true),
        ...createCodeBlock([
          'curl --location --request PUT \\',
          '  "https://gateway.rapido.bike/api/v1/fleet/on_order_status/RD123456" \\',
          '  --header "apiKey: AGVvQ0JAWYCIThN7N4JFRbJcm9oDOSc3" \\',
          '  --header "Content-Type: application/json" \\',
          '  --data \'{',
          '    "phone": "9428424115",',
          '    "pickupLocation": { "lat": "12.91195", "lng": "77.64711" },',
          '    "dropLocation": { "lat": "12.91195", "lng": "77.64711" },',
          '    "estimatedDistance": 4000,',
          '    "estimatedTimeToDrop": "1732528675",',
          '    "status": "started",',
          '    "orderId": "RD123456",',
          '    "tripFare": 250.98,',
          '    "reason": "vehicle issue"',
          '  }\''
        ]),
        new Paragraph({ spacing: { after: 150 } }),

        createParagraph('C. Production Environment - Final Completed Order with Earnings Breakdown:', true),
        ...createCodeBlock([
          'curl --location --request PUT \\',
          '  "https://gateway.rapido.bike/api/v1/fleet/on_order_status/RD123456" \\',
          '  --header "apiKey: AGVvQ0JAWYCIThN7N4JFRbJcm9oDOSc3" \\',
          '  --header "Content-Type: application/json" \\',
          '  --data \'{',
          '    "phone": "9428424115",',
          '    "pickupLocation": { "lat": "12.91195", "lng": "77.64711" },',
          '    "dropLocation": { "lat": "12.91195", "lng": "77.64711" },',
          '    "estimatedDistance": 4000,',
          '    "estimatedTimeToDrop": "1732528675",',
          '    "status": "completed",',
          '    "orderId": "RD123456",',
          '    "tripFare": 250.98,',
          '    "captainEarnings": 42.938,',
          '    "waitingCharges": 8.05,',
          '    "parkingCharges": 7.01,',
          '    "nightCharges": 9.02,',
          '    "tollCharges": 5.02',
          '  }\''
        ]),
        new Paragraph({ spacing: { after: 200 } }),

        // Section 6: Administrative Credentials
        createHeading('6. Sikhar Fleet Management Portal & Admin Credentials', HeadingLevel.HEADING_2),
        createStyledTable(
          ['Parameter', 'Access Detail'],
          [
            ['Live Management Portal URL', 'https://sikharfleet.com'],
            ['Administrative Login Email', 'admin@sikharfleet.com'],
            ['Administrative Password', 'admin123'],
            ['Role / Access Level', 'Master Fleet Administrator (Full Access)'],
            ['Live Operations Hub', 'Gurgaon Central Fleet Hub & Vadodara Terminal']
          ]
        )
      ]
    }
  ]
});

Packer.toBuffer(doc).then(buffer => {
  const outputPath = path.resolve('Rapido_Fleet_API_Integration_Details_SikharFleet.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log('✅ Word document created successfully at:', outputPath);

  // Also copy to user desktop for convenience
  const desktopPath = path.resolve('c:/Users/arjun/Desktop/Rapido_Fleet_API_Integration_Details_SikharFleet.docx');
  try {
    fs.writeFileSync(desktopPath, buffer);
    console.log('✅ Also copied to User Desktop at:', desktopPath);
  } catch (err) {
    console.warn('Could not copy to desktop directly:', err.message);
  }
});

