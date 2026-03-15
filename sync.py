#!/usr/bin/env python3
"""
Sync Google Sheets booking data to JSON
"""
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import json
import os

def main():
    # Load credentials from environment variable
    credentials_json = os.environ.get('GOOGLE_SERVICE_ACCOUNT')
    if not credentials_json:
        print("Error: GOOGLE_SERVICE_ACCOUNT not found")
        return 1
    
    # Write credentials to temp file
    with open('credentials.json', 'w') as f:
        f.write(credentials_json)
    
    # Setup Google Sheets API
    scope = [
        'https://spreadsheets.google.com/feeds',
        'https://www.googleapis.com/auth/drive'
    ]
    
    try:
        credentials = ServiceAccountCredentials.from_json_keyfile_name('credentials.json', scope)
        gc = gspread.authorize(credentials)
        
        # Get sheet ID from environment
        sheet_id = os.environ.get('SHEET_ID')
        if not sheet_id:
            print("Error: SHEET_ID not found")
            return 1
        
        # Open spreadsheet
        sh = gc.open_by_key(sheet_id)
        
        # Get all worksheets
        worksheets = sh.worksheets()
        
        all_bookings = []
        
        # Expected headers
        expected_headers = ['Date', 'Name', 'Phone', 'Room', 'People', 'Remark', 'Deposit', 'Status', 'Note1', 'Note2']
        
        # Process each month sheet
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
        
        for worksheet in worksheets:
            sheet_name = worksheet.title
            
            # Check if it's a month sheet
            if sheet_name in month_names:
                print(f"Processing sheet: {sheet_name}")
                
                # Get all records with expected headers
                try:
                    records = worksheet.get_all_records(expected_headers=expected_headers)
                except Exception as e:
                    print(f"Warning: {e}, trying without expected headers")
                    records = worksheet.get_all_records()
                
                for row in records:
                    # Get date and room
                    date = str(row.get('Date', '')).strip() if row.get('Date') else ''
                    room = str(row.get('Room', '')).strip() if row.get('Room') else ''
                    
                    # Only include if both date and room exist
                    if date and room:
                        booking = {
                            'date': date,
                            'room': room,
                            'name': str(row.get('Name', '')).strip() if row.get('Name') else '',
                            'people': str(row.get('People', '')).strip() if row.get('People') else '',
                            'deposit': str(row.get('Deposit', '')).strip() if row.get('Deposit') else '',
                            'remark': str(row.get('Remark', '')).strip() if row.get('Remark') else ''
                        }
                        all_bookings.append(booking)
        
        # Write to JSON file
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(all_bookings, f, ensure_ascii=False, indent=2)
        
        print(f"Synced {len(all_bookings)} bookings")
        return 0
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    exit(main())
