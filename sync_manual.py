#!/usr/bin/env python3
"""
Sync script - Run this to update data.json from Google Sheets
"""
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import json
import os

def main():
    # Use the JSON file you downloaded from Google Cloud
    SERVICE_ACCOUNT_FILE = 'service-account.json'  # <-- ใส่ไฟล์ที่ดาวน์โหลด
    SPREADSHEET_ID = '1DrzX4RmtY63kVHWUCXwO89Jbcq4zTF2HAdEY-7QKJ6Y'
    
    if not os.path.exists(SERVICE_ACCOUNT_FILE):
        print(f"Error: ไม่พบไฟล์ {SERVICE_ACCOUNT_FILE}")
        print("ดาวน์โหลนไฟล์ JSON จาก Google Cloud Console > Service Account > Keys")
        return 1
    
    try:
        gc = gspread.service_account(filename=SERVICE_ACCOUNT_FILE)
        sh = gc.open_by_key(SPREADSHEET_ID)
        
        worksheets = sh.worksheets()
        all_bookings = []
        month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May']
        
        for worksheet in worksheets:
            sheet_name = worksheet.title
            
            if sheet_name in month_names:
                print(f"กำลังโหลด: {sheet_name}...")
                records = worksheet.get_all_records()
                
                for row in records:
                    date = str(row.get('Date', '')).strip() if row.get('Date') else ''
                    room = str(row.get('Room', '')).strip() if row.get('Room') else ''
                    
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
        
        with open('data.json', 'w', encoding='utf-8') as f:
            json.dump(all_bookings, f, ensure_ascii=False, indent=2)
        
        print(f"สำเร็จ! บันทึก {len(all_bookings)} รายการ")
        print("ตอนนี้ต้อง commit และ push ไฟล์ data.json ไป GitHub")
        return 0
        
    except Exception as e:
        print(f"Error: {e}")
        return 1

if __name__ == '__main__':
    exit(main())
