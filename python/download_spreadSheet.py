# import openpyxl module
import openpyxl

# -*- coding: utf-8 -*-
#!/usr/local/bin/python3.7
from __future__ import print_function
from googleapiclient.discovery import build
from httplib2 import Http
from oauth2client import file, client, tools
from apiclient.http import MediaIoBaseDownload
from apiclient import discovery
import io
import datetime
import httplib2

# If modifying these scopes, delete the file token.json.
# 다운 받을 권한 범위
SCOPES = ['https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/spreadsheets']
SCOPES_SHEET = 'https://www.googleapis.com/auth/spreadsheets'

# SCOPES = 'https://www.googleapis.com/auth/drive.file'

def main():
    """Shows basic usage of the Drive v3 API.
    Prints the names and ids of the first 10 files the user has access to.
    """
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.

    #google drive service
    #구글 로그인 페이지 창일 뜰 것이다. 로그인 완료하면 token.json이라는 파일이 생긴다.
    store = file.Storage('token.json')
    creds = store.get()

    #아까 다운 받은 client_secret.json파일
    if not creds or creds.invalid:
        flow = client.flow_from_clientsecrets('client_secret.json', SCOPES)
        creds = tools.run_flow(flow, store)
    service = build('drive', 'v3', http=creds.authorize(Http()))


	#스프레트 시트를 접근/수정 할 수 있는 객체를 생성한다.
    #spread sheet service
    store_sheet = file.Storage('token.json')
    creds_sheet = store_sheet.get()
    service_sheet = build('sheets', 'v4', http=creds_sheet.authorize(Http()))

    # Call the Drive v3 API
    page_token = None
    while True:

        #오늘 변경 된 파일만 다운 받도록 설정했다.
        dt = datetime.datetime.utcnow()
        dt2 = datetime.datetime(dt.year, dt.month, dt.day-1 if dt.day-1 != 0 else 1 , 0, 0, 0)


        dt_str = "\'" + dt2.strftime("%Y-%m-%dT%H:00:00") + "\'"
        # print(u'{0}'.format(dt))
        # print(u'{0}'.format(dt_str))
        response = service.files().list(q="parents='1HDajAZaUEmC9tsc47BCT0ZM8Z97t-aCv' "
                                          "and mimeType='application/vnd.google-apps.spreadsheet' "
                                          "and trashed=false "
                                          "and modifiedTime > "+dt_str).execute()

        #다운 받을 목록
        for item in response.get('files', []):
            # Process change
            print(u'{0} ({1})'.format(item['name'], item['id']))


            #스프레드 시트에 version이라는 탭이 있고,  거기서 id 값을 하나씩 올려준다. #이부분은 무시해도 된다.
            # read version
            read_result = service_sheet.spreadsheets().values().get(spreadsheetId=item['id'],
                                                              range='version!A2').execute()
            print(u'{0}'.format(read_result))
            version = int(read_result.get('values')[0][0])

            new_version = version + 1

            #이부분은 무시해도 된다.
            #version 탭에 A2위치 값을 변경해 준다.
            # write version
            values = [
                [
                    new_version
                ]
            ]
            body = {
                'values': values
            }
            write_result = service_sheet.spreadsheets().values().update(spreadsheetId=item['id'],
                                                                  range='version!A2',
                                                                  valueInputOption='USER_ENTERED',
                                                                  body=body).execute()

            #다운받는 코드
            #download files
            request = service.files().export_media(fileId=item['id'],
                                                   mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            write_file = open("./"+item['name']+".xlsx", 'wb')
            downloader = MediaIoBaseDownload(write_file, request)

            done = False
            while done is False:
                status, done = downloader.next_chunk()

            write_file.close()


        page_token = response.get('nextPageToken', None)
        if page_token is None:
            break

if __name__ == '__main__':
    main()