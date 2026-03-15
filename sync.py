import gspread
from oauth2client.service_account import ServiceAccountCredentials
import json
import os

# Load credentials from environment variable
credentials_json = os.environ.get('GOOGLE_SERVICE_ACCOUNT')
credentials_dict = json.loads(credentials_json)

# Google Sheet ID
SHEET_ID = os.environ.get('SHEET_ID', '1DrzX4RmtY63kVHWUCXwO89Jbcq4zTF2HAdEY-7QKJ6Y')

# Setup credentials
scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
creds = ServiceAccountCredentials.from_json_keyfile_dict(credentials_dict, scope)
client = gspread.authorize(creds)

# Open spreadsheet
spreadsheet = client.open_by_key(SHEET_ID)

# Get all bookings
all_bookings = []
months = ['Jan', 'Feb', 'Mar', 'Apr', 'May']

for month in months:
    try:
        sheet = spreadsheet.worksheet(month)
        rows = sheet.get_all_values()
        
        # Skip header
        for row in rows[1:]:
            if len(row) >= 8 and row[3].strip():  # Has guest name
                booking = {
                    'date': row[1] if len(row) > 1 else '',
                    'room': row[4] if len(row) > 4 else '',
                    'name': row[3] if len(row) > 3 else '',
                    'people': row[5] if len(row) > 5 else '',
                    'deposit': row[7] if len(row) > 7 else '',
                    'remark': row[6] if len(row) > 6 else ''
                }
                all_bookings.append(booking)
    except Exception as e:
        print(f"Error reading {month}: {e}")

# Save to JSON
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(all_bookings, f, ensure_ascii=False, indent=2)

print(f"Synced {len(all_bookings)} bookings")
