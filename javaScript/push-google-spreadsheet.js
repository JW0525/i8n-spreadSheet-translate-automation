const { GoogleSpreadsheet } = require("google-spreadsheet");
const secret = require("./secret.json");

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
  const en = fs.readFileSync(`./src/i18n/locales/en/${page}.json`, {
    encoding: "utf8",
    flag: "r",
  });
  //# read /locales/ko/translation.json
  const ko = fs.readFileSync(`./src/i18n/locales/ko/${page}.json`, {
    encoding: "utf8",
    flag: "r",
  });
  //# read /locales/jp/translation.json
  const jp = fs.readFileSync(`./src/i18n/locales/jp/${page}.json`, {
    encoding: "utf8",
    flag: "r",
  });

  const enObj = { label: "", data: JSON.parse(en) };
  const koObj = { label: "", data: JSON.parse(ko) };
  const jpObj = { label: "", data: JSON.parse(jp) };
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
    .catch((err) => console.log("ERROR!!!!", err));
}

