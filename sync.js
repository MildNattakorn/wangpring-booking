const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SHEET_ID = process.env.SHEET_ID || '1DrzX4RmtY63kVHWUCXwO89Jbcq4zTF2HAdEY-7QKJ6Y';

async function main() {
  // Load OAuth token
  const tokenPath = path.join(__dirname, 'secrets', 'sheets_token.json');
  const token = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
  
  // Load client secrets
  const clientSecretPath = path.join(__dirname, 'secrets', 'client_secret.json');
  const clientSecrets = JSON.parse(fs.readFileSync(clientSecretPath, 'utf8'));
  
  const oauth2Client = new google.auth.OAuth2(
    clientSecrets.installed.client_id,
    clientSecrets.installed.client_secret,
    clientSecrets.installed.redirect_uris[0]
  );
  
  oauth2Client.setCredentials(token);
  
  const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  const allBookings = [];
  
  for (const month of months) {
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${month}!A:H`
      });
      
      const rows = response.data.values || [];
      
      // Skip header
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length >= 8 && row[3] && row[3].trim()) { // Has guest name
          const booking = {
            date: row[1] || '',
            room: row[4] || '',
            name: row[3] || '',
            people: row[5] || '',
            deposit: row[7] || '',
            remark: row[6] || ''
          };
          allBookings.push(booking);
        }
      }
      console.log(`Read ${month}: ${rows.length - 1} rows`);
    } catch (e) {
      console.log(`Error reading ${month}: ${e.message}`);
    }
  }
  
  // Save to JSON
  const dataPath = path.join(__dirname, 'data.json');
  fs.writeFileSync(dataPath, JSON.stringify(allBookings, null, 2), 'utf8');
  
  console.log(`Synced ${allBookings.length} bookings to ${dataPath}`);
}

main().catch(console.error);
