const fs = require('fs');
const { google } = require('googleapis');

const creds = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));

async function createNotesSheet() {
    const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const spreadsheetId = '1DrzX4RmtY63kVHWUCXwO89Jbcq4zTF2HAdEY-7QKJ6Y';

    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const hasNotes = meta.data.sheets.some(s => s.properties.title === 'Notes');

    if (!hasNotes) {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests: [{ addSheet: { properties: { title: 'Notes' } } }]
            }
        });

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Notes!A1',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [['วันที่', 'ห้อง', 'โน๊ต']] }
        });

        console.log('Created Notes sheet');
    } else {
        console.log('Notes sheet already exists');
    }
}

createNotesSheet().catch(console.error);
