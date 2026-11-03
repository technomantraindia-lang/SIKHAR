import https from 'https';

https.get('https://sikharfleet.com', (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    const match = html.match(/assets\/index-[^"']+\.js/);
    if (!match) {
      console.log('No bundle match found in HTML');
      return;
    }
    console.log('Live bundle found:', match[0]);
    https.get('https://sikharfleet.com/' + match[0], (jsRes) => {
      let js = '';
      jsRes.on('data', chunk => js += chunk);
      jsRes.on('end', () => {
        console.log('Moving People in bundle:', js.includes('Moving People'));
        console.log('SMART FLEET MOBILITY SOLUTIONS in bundle:', js.includes('SMART FLEET MOBILITY SOLUTIONS'));
        console.log('Reliable Fleet Solutions in bundle:', js.includes('Reliable Fleet Solutions'));
      });
    });
  });
});

