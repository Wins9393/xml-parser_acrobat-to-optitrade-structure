import fs from "fs";
import jstoxml from "jstoxml";
import xml2js from "xml2js";

let tabClientsNumber = [
  { "VAN LEEUWEN OPTICIENS": 4061 },
  { "VAN LEEUWEN OPTICIENS GRAVENZANDE": 4063 },
  { "REMCO OPTIEK": 1305 },
  { "THIJSSEN OPTIEK VOF": 6820 },
  { "DOESBURG OPTIEK": 1357 },
  // { "EYECARE BRILSERVICE BV": 1599 },
  { "OVERMARS OPTICIENS": 6675 },
  { "VALENTIJN OPTICIENS B.V": 7568 },
  { OOGDALEM: 1419 },
  { "OOGMERK TUNDERMAN": 1073 },
  { "'T BRILLENHUYS": 6115 },
  { "VON OY": 6650 },
  { "PETER KUIPER OPTIEK": 7548 },
];

const { toXML } = jstoxml;
const xmlConfig = { indent: "  " };
const parser = new xml2js.Parser();

const dateNow = new Date();

const convertDateFormat = (date) => {
  const year = date.slice(0, 4);
  const month = date.slice(4, 6);
  const day = date.slice(6, 8);
  return `${year}-${month}-${day}`;
};

// Formatter en fonction de dateNow
const formatDateString = (date) => {
  console.log("DATE: ", date);
  console.log(date.getFullYear(), date.getMonth(), date.getDay());

  return new Date(date).toISOString();
};

const getClientNumber = (clientName) => {
  let client = tabClientsNumber.find(
    (client) => Object.keys(client)[0] === clientName
  );
  return client ? client[clientName] : undefined;
};

const formatJson = async (json) => {
  let formatedJson = [];

  json.map((string) => {
    formatedJson.push(JSON.parse(string));
  });

  console.log("FORMATEDJSON", formatedJson);

  const fileNumber = formatedJson[
    formatedJson.length - 1
  ]?.inputFileNumber?.padStart(5, "0");
  const testProduction = formatedJson[formatedJson.length - 1]?.testProduction;

  console.log("test production: ", testProduction);
  console.log(
    "test production formmatedJson: ",
    formatedJson[formatedJson.length - 1]
  );

  let docDate;
  const supplierNumber = 11859;
  let debtorName;
  let debtorNumber;
  let invoiceAmountHT;
  let invoiceNumber;
  let invoiceLines;
  let chargeTotalAmount;
  let invoiceLineChargeAmount;
  // let invoiceLineDiscountPercentage;
  let invoicesTab = [];

  const createInvoiceLine = (invoiceLines) => {
    let tabInvoiceLines = [];

    invoiceLines.map((line) => {
      let invoicelineAmount =
        line?.["ram:SpecifiedLineTradeAgreement"][0][
          "ram:NetPriceProductTradePrice"
        ][0]["ram:ChargeAmount"][0];

      tabInvoiceLines.push({
        invoiceline: {
          invoiceline_articlecode_org:
            line?.["ram:SpecifiedTradeProduct"][0]["ram:SellerAssignedID"][0],
          invoiceline_amount_ex_VAT: `${
            invoiceNumber && invoiceNumber.slice(0, 2) === "AV"
              ? `-${invoicelineAmount}`
              : invoicelineAmount
          }`,
          // invoiceline_discount_percentage:
          //   line?.["ram:SpecifiedLineTradeSettlement"][0][
          //     "ram:SpecifiedTradeAllowanceCharge"
          //   ][0]["ram:CalculationPercent"][0] || 0,
          invoiceline_VAT: {
            invoiceline_VAT_percentage: 0,
            invoiceline_VAT_amount: 0,
          },
          // invoiceline_quantity:
          //   line?.["ram:SpecifiedLineTradeAgreement"][0][
          //     "ram:NetPriceProductTradePrice"
          //   ][0]["ram:BasisQuantity"][0],
          invoiceline_quantity:
            line?.["ram:SpecifiedLineTradeDelivery"][0][
              "ram:BilledQuantity"
            ][0],
        },
      });
    });
    tabInvoiceLines.push({ ...invoiceLineChargeAmount });
    return tabInvoiceLines;
  };

  const createInvoice = (tab) => {
    let invoice = {
      invoice: {
        invoice_debtor: `${debtorNumber}`,
        invoice_amount_ex_VAT: `${
          invoiceNumber && invoiceNumber.slice(0, 2) === "AV"
            ? `-${invoiceAmountHT}`
            : invoiceAmountHT
        }`,
        invoice_VAT_amounts: {
          invoice_VAT: {
            invoice_VAT_percentage: 0,
            invoice_VAT_amount: 0,
          },
        },
        invoice_number: `${invoiceNumber}`,
        invoice_date: convertDateFormat(docDate),
        invoicelines: createInvoiceLine(invoiceLines),
      },
    };

    tab.push(invoice);
  };

  for (let i = 0; i < formatedJson.length - 1; i++) {
    console.log("FACTURE EN COURS: ", formatedJson[i]);

    docDate =
      formatedJson[i]["rsm:CrossIndustryInvoice"][
        "rsm:SupplyChainTradeTransaction"
      ][0]["ram:ApplicableHeaderTradeDelivery"][0][
        "ram:ActualDeliverySupplyChainEvent"
      ][0]["ram:OccurrenceDateTime"][0]["udt:DateTimeString"][0]["_"];

    debtorName =
      formatedJson[i]["rsm:CrossIndustryInvoice"][
        "rsm:SupplyChainTradeTransaction"
      ][0]["ram:ApplicableHeaderTradeAgreement"][0]["ram:BuyerTradeParty"][0][
        "ram:Name"
      ][0];

    debtorNumber = getClientNumber(debtorName);

    invoiceAmountHT =
      formatedJson[i]["rsm:CrossIndustryInvoice"][
        "rsm:SupplyChainTradeTransaction"
      ][0]["ram:ApplicableHeaderTradeSettlement"][0][
        "ram:SpecifiedTradeSettlementHeaderMonetarySummation"
      ][0]["ram:LineTotalAmount"][0];

    // invoiceAmountHT =
    //   formatedJson[i]["rsm:CrossIndustryInvoice"][
    //     "rsm:SupplyChainTradeTransaction"
    //   ][0]["ram:ApplicableHeaderTradeSettlement"][0][
    //     "ram:ApplicableTradeTax"
    //   ][0]["ram:BasisAmount"][0];

    invoiceNumber =
      formatedJson[i]["rsm:CrossIndustryInvoice"]["rsm:ExchangedDocument"][0][
        "ram:ID"
      ][0];

    chargeTotalAmount =
      formatedJson[i]["rsm:CrossIndustryInvoice"][
        "rsm:SupplyChainTradeTransaction"
      ][0]["ram:ApplicableHeaderTradeSettlement"][0][
        "ram:SpecifiedTradeSettlementHeaderMonetarySummation"
      ][0]["ram:ChargeTotalAmount"][0];

    invoiceLineChargeAmount = {
      invoiceline: {
        invoiceline_articlecode_org: "900",
        invoiceline_amount_ex_VAT: `${chargeTotalAmount}`,
        invoiceline_VAT: {
          invoiceline_VAT_percentage: 0,
          invoiceline_VAT_amount: 0,
        },
        invoiceline_quantity: 1,
      },
    };

    invoiceLines =
      formatedJson[i]["rsm:CrossIndustryInvoice"][
        "rsm:SupplyChainTradeTransaction"
      ][0]["ram:IncludedSupplyChainTradeLineItem"];

    createInvoice(invoicesTab);
  }

  // Header
  let newXmlFileName = `${dateNow.getFullYear()}_${supplierNumber}${fileNumber}`;

  const supplierName =
    formatedJson[0]["rsm:CrossIndustryInvoice"][
      "rsm:SupplyChainTradeTransaction"
    ][0]["ram:ApplicableHeaderTradeAgreement"][0]["ram:SellerTradeParty"][0][
      "ram:Name"
    ][0];

  const supplierAddress =
    formatedJson[0]["rsm:CrossIndustryInvoice"][
      "rsm:SupplyChainTradeTransaction"
    ][0]["ram:ApplicableHeaderTradeAgreement"][0]["ram:SellerTradeParty"][0][
      "ram:PostalTradeAddress"
    ][0]["ram:LineOne"][0];

  const supplierZipcode =
    formatedJson[0]["rsm:CrossIndustryInvoice"][
      "rsm:SupplyChainTradeTransaction"
    ][0]["ram:ApplicableHeaderTradeAgreement"][0]["ram:SellerTradeParty"][0][
      "ram:PostalTradeAddress"
    ][0]["ram:PostcodeCode"][0];

  const supplierCity =
    formatedJson[0]["rsm:CrossIndustryInvoice"][
      "rsm:SupplyChainTradeTransaction"
    ][0]["ram:ApplicableHeaderTradeAgreement"][0]["ram:SellerTradeParty"][0][
      "ram:PostalTradeAddress"
    ][0]["ram:CityName"][0];

  const supplierCountry =
    formatedJson[0]["rsm:CrossIndustryInvoice"][
      "rsm:SupplyChainTradeTransaction"
    ][0]["ram:ApplicableHeaderTradeAgreement"][0]["ram:SellerTradeParty"][0][
      "ram:PostalTradeAddress"
    ][0]["ram:CountryID"][0];

  const header = {
    statement_information: {
      statement_filename: `${newXmlFileName}.xml`,
      statement_number: `${supplierNumber}${fileNumber}`,
      statement_creationdatetime: formatDateString(dateNow),
      statement_test_production: `${testProduction.slice(0, 1).toUpperCase()}`,
      statement_year: `${dateNow.getFullYear()}`,
      statement_month: `${dateNow.getMonth().toString().padStart(2, "0")}`,
    },
    supplier: {
      supplier_number: `${supplierNumber}`,
      supplier_name: `${supplierName}`,
      supplier_address: `${supplierAddress}`,
      supplier_postal_code: `${supplierZipcode}`,
      supplier_city: `${supplierCity}`,
      supplier_country: `${supplierCountry}`,
    },
  };

  const content = {
    statement: {
      ...header,
      invoices: invoicesTab,
    },
  };

  return { content, newXmlFileName };
};

const writeFormatXml = async (data) => {
  try {
    const jsonFormated = await formatJson(data);

    console.log("data write format xml: ", data);
    console.log("jsonFormated write format xml: ", jsonFormated);

    /** Pour debug */
    // fs.promises.writeFile("./jsons/test.json", jsonFormated);
    /** Pour debug */

    const xmlFormated = toXML(jsonFormated.content, xmlConfig);

    const filePath = "./xmltmp/combined-optitrade.xml";
    try {
      await fs.promises.writeFile(filePath, "", "utf8");
    } catch (error) {}
    await fs.promises.appendFile(filePath, xmlFormated, "utf8");

    console.log("Xml file written successfully");

    return { filePath, newXmlFileName: jsonFormated.newXmlFileName };
  } catch (err) {
    console.log("Error writing xml file: ", err);
  }
};

const processOptitradeData = async (req, res) => {
  let jsonFiles = [];
  let fields;

  try {
    const parts = req.parts();

    for await (const part of parts) {
      if (part.fieldname === "files") {
        fields = {
          inputFileNumber: part?.fields?.inputFileNumber?.value,
          testProduction: part?.fields?.testProduction?.value,
        };

        const fileContent = await part.toBuffer();
        const parsedData = await parser.parseStringPromise(
          fileContent.toString()
        );

        const stringifiedData = JSON.stringify(parsedData);

        jsonFiles.push(stringifiedData);
      }
    }

    /** Pour debug */
    // fs.promises.writeFile("./jsons/test.json", jsonFiles);
    /** Pour debug */

    jsonFiles.push(JSON.stringify(fields));

    const { filePath, newXmlFileName } = await writeFormatXml(jsonFiles);

    const fileData = await fs.promises.readFile(filePath, "utf8");

    res.header("Content-Type", "text/xml");
    res.header("Content-Disposition", `attachment; filename=${newXmlFileName}`);

    res.send(fileData);
  } catch (err) {
    console.error("Failed to read file", err);
    res.code(500).send("Erreur, veuillez rééssayer !");
  }
};

export { processOptitradeData };
