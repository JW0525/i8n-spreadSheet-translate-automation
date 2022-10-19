# i18n 자동화 가이드

<aside>
💡 **Google Spreadsheet** 와  **i18next 를 사용하는 리액트 프로젝**트를 연동합니다.
Google 스프레드시트 와 JSON 파일간의 번역을 자동으로 동기화하는 스크립트를 작성하였습니다.

</aside>

1. 스캔한 `key` 값을 Google Spreadsheet 에 업로드하고
2. 빌드시 Google Spread sheet 에서 번역된 문자열을 자동으로 다운로드할 수 있습니다.

---

## **Step 1  i18next 및 react-i18next 라이브러리 설치 및 구성**

```tsx
npm install i18next react-i18next i18next-browser-languagedetector i18next-http-backend
```

```jsx
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpApi from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

const fallbackLng = ["en"];
const availableLanguages = ["en", "jp", "ko"];

i18next
  .use(HttpApi) // load translations using http (default public/locals/en/translations)
  .use(LanguageDetector) // detect user language
  .use(initReactI18next) // passes i18n down to react-i18next
  .init({
    resources: {
      ko,
      en,
      jp
    },
    lng: UrlQuery.lang, // if you're using a language detector, do not define the lng option
    fallbackLng: "en",
    // ns:['page'],
    interpolation: {
      escapeValue: false
    },
    react: {
      useSuspense: false,
    },
    debug: false
  });

export default i18next
```

**오라운드 편집기** 에서는, 각 언어별 json 파일을 **src/i18n/locales** 구조로 나눠서 관리하고 있습니다.

```jsx
├── src/
│   ├── i18n/
│      ├── locales/
│         ├── en/
|            ├── translation.json
│         ├── jp
|            ├── translation.json
│         ├── ko
|            ├── translation.json
```

---

## **Step 2  Google Spreadsheet 설정**

다음의 구조로 google SpreadSheet 를 만듭니다.

![2022-10-13_18-18-49.png](i18n%20%E1%84%8C%E1%85%A1%E1%84%83%E1%85%A9%E1%86%BC%E1%84%92%E1%85%AA%20%E1%84%80%E1%85%A1%E1%84%8B%E1%85%B5%E1%84%83%E1%85%B3%203659d46e004444d2987c6de8ab74165b/2022-10-13_18-18-49.png)

1. json 파일명에 해당하는 시트들을 만듭니다.
2. 각 시트의 첫 행은 key, 각 언어명 으로 기록합니다. 오라운드 편집기에서는 `en`,`jp`, `ko` 의 세 언어를 사용하고 있습니다. (첫 행은 시트 생성시 우선적으로 작성해야 합니다.)

Spreadsheet 주소의 `spreadsheets/` 이후 부분에 ID 가 기록되어 있습니다. 이 ID 로 어떤 문서인지를 판단하므로 복사하여 **Step 3** 의 spreadSheet ID 부분에 대입합니다.

![2022-10-13_18-26-37.png](i18n%20%E1%84%8C%E1%85%A1%E1%84%83%E1%85%A9%E1%86%BC%E1%84%92%E1%85%AA%20%E1%84%80%E1%85%A1%E1%84%8B%E1%85%B5%E1%84%83%E1%85%B3%203659d46e004444d2987c6de8ab74165b/2022-10-13_18-26-37.png)

### **Google Spreadshee**API 인증

**Google Spreadsheet** 를 이용하기 위해서는, v4 Google 시트 API 인증을 처리해야 합니다.

[Google Cloud](https://console.developers.google.com/) 로 이동하여 콘솔에 로그인합니다. 프로젝트 생성법은 다음을 참고합니다.

[서비스 계정 만들기](https://support.google.com/a/answer/7378726?hl=ko)

왼쪽 사이드바에서 **API 및 서비스 > 사용자 인증 정보** 를 선택합니다.

**+ 사용자 인증 정보 만들기** 를 클릭하고, 서비스 계정 옵션을 선택합니다.

![2022-10-13_18-43-15.png](i18n%20%E1%84%8C%E1%85%A1%E1%84%83%E1%85%A9%E1%86%BC%E1%84%92%E1%85%AA%20%E1%84%80%E1%85%A1%E1%84%8B%E1%85%B5%E1%84%83%E1%85%B3%203659d46e004444d2987c6de8ab74165b/2022-10-13_18-43-15.png)

이름, 설명을 입력하고 **서비스 계정** 을 생성합니다. 생성한 계정의 **서비스 계정 세부정보 > 키** 항목을 클릭합니다.

![2022-10-13_18-49-32.png](i18n%20%E1%84%8C%E1%85%A1%E1%84%83%E1%85%A9%E1%86%BC%E1%84%92%E1%85%AA%20%E1%84%80%E1%85%A1%E1%84%8B%E1%85%B5%E1%84%83%E1%85%B3%203659d46e004444d2987c6de8ab74165b/2022-10-13_18-49-32.png)

세부정보 의 키 탭 에서 **키 추가** > **JSON 키** 유형을 선택하면, JSON 키 파일이 생성됩니다.

![2022-10-13_18-44-32.png](i18n%20%E1%84%8C%E1%85%A1%E1%84%83%E1%85%A9%E1%86%BC%E1%84%92%E1%85%AA%20%E1%84%80%E1%85%A1%E1%84%8B%E1%85%B5%E1%84%83%E1%85%B3%203659d46e004444d2987c6de8ab74165b/2022-10-13_18-44-32.png)

다운로드 받은 JSON 파일을 프로젝트의 i18n 폴더에  **secret.json** 으로 수정해서 넣어줍니다.
해당 파일은 git 에 업로드되면 안되므로 **`.gitignore`** 에 **secret.json** 을 추가합니다.

다운 받은 **secret.json**을 열어 `client_email` 값을 구글 스프레드 시트 화면의 상단에 있는 공유 버튼을 눌러 다음과 같은 화면에서 사용자 및 그룹추가 부분에 해당 값을 추가 후 완료를 누릅니다. 액세스 권한이 필요한 사용자들 역시 추가합니다.

![Untitled](i18n%20%E1%84%8C%E1%85%A1%E1%84%83%E1%85%A9%E1%86%BC%E1%84%92%E1%85%AA%20%E1%84%80%E1%85%A1%E1%84%8B%E1%85%B5%E1%84%83%E1%85%B3%203659d46e004444d2987c6de8ab74165b/Untitled.png)

## **Step 3  Spreadsheet 와 JSON 파일 간 번역을 동기화하는 스크립트 작성**

**google-spreadsheet** 는 **Google Sheets API** 를 사용할 수 있게 해주는 라이브러리입니다. 새 시트를 만들거나 셀과 행을 읽고, 쓰고, 관리하는 데 사용할 수 있습니다.

```jsx
npm i google-spreadsheet
```

`src/i18n/locales` 루트에 다음 두 개의 파일을 추가합니다.

```jsx
// fetch-google-spreadsheet.js

const { GoogleSpreadsheet } = require("google-spreadsheet");
const secret = require("./secret.json");

constfs= require("fs");

//# Initialize the sheet
const doc = new GoogleSpreadsheet(
  "1uIQkJsXxGnluoJg4UyYuiovu6CoPQSOWtWOay9x3W0E"
); //# spreadsheet ID 입니다. url 에서 복사해서 붙여 넣습니다.

//# Initialize Auth
const init = async () => {
  await doc.useServiceAccountAuth({
    client_email: secret.client_email,
    private_key: secret.private_key,
  });
  await doc.loadInfo(); //# loads document properties and worksheets
};

const read = async (page) => {
  const sheet = doc.sheetsByTitle[`${page}`];
  await sheet.loadHeaderRow(); //# loads the header row (first row) of the sheet
  const colTitles = sheet.headerValues; //# array of strings from cell values in the first row

  const rows = await sheet.getRows({ limit: sheet.rowCount }); //# fetch rows from the sheet (limited to row count)
  let result = {};
  //# map rows values and create an object with keys as columns titles starting from the second column (languages names) and values as an object with key value pairs, where the key is a key of translation, and value is a translation in a respective language
  // eslint-disable-next-line array-callback-return
  rows.map((row) => {
    colTitles.slice(1).forEach((title) => {
      result[title] = result[title] || [];
      const key = row[colTitles[0]];
      result = {
        ...result,
        [title]: {
          ...result[title],
          [key]: row[title] !== "" ? row[title] : undefined,
        },
      };
    });
  });
  return result;
};

function parseDotNotation(str, val, obj) {
  let currentObj = obj;
  const keys = str.split(".");
  let i;
  const l =Math.max(1, keys.length - 1);
  let key;

  for (i = 0; i < l; ++i) {
    key = keys[i];
    currentObj[key] = currentObj[key] || {};
    currentObj = currentObj[key];
  }

  currentObj[keys[i]] = val;
  delete obj[str];
}

Object.expand = function (obj) {
  for (const key in obj) {
    if (key.indexOf(".") !== -1) {
      parseDotNotation(key, obj[key], obj);
    }
  }
  return obj;
};

const write = (data, page) => {
Object.keys(data).forEach((key) => {
    const tempObject =Object.expand(data[key]);
fs.writeFile(
        `./src/i18n/locales/${key}/${page}.json`,
JSON.stringify(tempObject, null, 2),
      (err) => {
        if (err) {
console.error(err);
        }
      }
    );
  });
};

const list = ['common', 'contents', 'detail', 'error', 'footer', 'header', 'modal', 'pdf', 'tutorial']

for (const i in list) {
  init()
    .then(() => read(list[i]))
    .then((data) => write(data, list[i]))
    .catch((err) =>console.log("ERROR!!!!", err));
}
```

```jsx
// push-google-spreadsheet.js

const { GoogleSpreadsheet } = require("google-spreadsheet");
const secret = require("./secret.json");

constfs= require("fs");

//# Initialize the sheet
const doc = new GoogleSpreadsheet(
  "1uIQkJsXxGnluoJg4UyYuiovu6CoPQSOWtWOay9x3W0E"
); //# spreadsheet ID

//# Initialize Auth
const init = async () => {
  await doc.useServiceAccountAuth({
    client_email: secret.client_email,
    private_key: secret.private_key,
  });
};

const traverse = function (enObj, koObj, jpObj, arr) {
  const enObjData = enObj.data;
  const koObjData = koObj.data;
  const jpObjData = jpObj.data;
  for (const i in enObjData) {
    if (enObjData[i] !== null && typeof enObjData[i] == "object") {
      //# going one step down in the object tree!!
      const label = enObj.label !== "" ? `${enObj.label}.${i}` : `${i}`;
      const childEn = { label: label, data: enObjData[i] };
      const childKo = { label: label, data: koObjData[i] };
      const childJp = { label: label, data: jpObjData[i] };

      traverse(childEn, childKo, childJp, arr);
    } else {
      arr.push({
        key: enObj.label !== "" ? `${enObj.label}.${i}` : `${i}`,
        en: enObjData[i],
        ko: koObjData[i],
        jp: jpObjData[i],
      });
    }
  }
  return arr;
};

const read = async (page) => {
  await doc.loadInfo(); //# loads document properties and worksheets
  const sheet = doc.sheetsByTitle[`${page}`];

  const rows = await sheet.getRows({ limit: sheet.rowCount }); //# fetch rows from the sheet (limited to row count)
  //# read /locales/en/translation.json
  const en =fs.readFileSync(`./src/i18n/locales/en/${page}.json`, {
    encoding: "utf8",
    flag: "r",
  });
  //# read /locales/ko/translation.json
  const ko =fs.readFileSync(`./src/i18n/locales/ko/${page}.json`, {
    encoding: "utf8",
    flag: "r",
  });
  //# read /locales/jp/translation.json
  const jp =fs.readFileSync(`./src/i18n/locales/jp/${page}.json`, {
    encoding: "utf8",
    flag: "r",
  });

  const enObj = { label: "", data:JSON.parse(en) };
  const koObj = { label: "", data:JSON.parse(ko) };
  const jpObj = { label: "", data:JSON.parse(jp) };
  //# loop over JSON object and create new array
  // eslint-disable-next-line no-undef
  const result = traverse(enObj, koObj, jpObj, (arr = []));
  //# difference between google-spreadsheet rows and newly created array
  const el = result.filter(
    ({ key: id1 }) => !rows.some(({ key: id2 }) => id2 === id1)
  );
  return el;
};

const append = async (data, page) => {
  await doc.loadInfo(); //# loads document properties and worksheets

  const sheet = doc.sheetsByTitle[`${page}`]; //# get the sheet by title, I left the default title name. If you changed it, then you should use the name of your sheet
  if (!sheet) return null;
  await sheet.addRows(data); //# append rows
};

const list = ['common', 'contents', 'detail', 'error', 'footer', 'header', 'modal', 'pdf', 'tutorial']

for (const i in list) {
  init()
    .then(() => read(list[i]))
    .then((data) => append(data, list[i]))
    .catch((err) =>console.log("ERROR!!!!", err));
}
```

사용 용도에 따라서 json 파일을 분류한 관계로, json 파일별로 Spreadsheet 에 추가되도록 코드가 작성되어 있습니다. json 파일이 추가되는 경우, list 에 json 파일명을 추가해주셔야 합니다.

pack.json 에 다음 스크립트들을 추가합니다.

```jsx
{
  "push:i18n": "node push-google-spreadsheet.js",
  "fetch:i18n": "node fetch-google-spreadsheet.js"
}
```

1. `npm run push:i18n` 입력 후, 기획 등에 번역을 요청합니다.
2. spreadsheet 에 번역이 작성된 경우, `npm run fetch:i18n` 으로 최근 번역을 받아옵니다.  `npm start / npm build` 에 `npm run fetch:i18n`  스크립트를 추가하여, 실행시 최근 번역이 빌드에 자동으로 적용되도록 할 수도 있습니다.