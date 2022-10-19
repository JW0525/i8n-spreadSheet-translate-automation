const { GoogleSpreadsheet } = require("google-spreadsheet");
const secret = require("../../oround-editor7/src/i18n/secret.json");

const fs = require("fs");

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
  const l = Math.max(1, keys.length - 1);
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
    const tempObject = Object.expand(data[key]);
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
    .catch((err) => console.log("ERROR!!!!", err));
}