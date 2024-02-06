import fs from "fs";
import jstoxml from "jstoxml";
import xml2js from "xml2js";

const { toXML } = jstoxml;
const xmlConfig = { indent: "  " };
const parser = new xml2js.Parser();

const dateNow = new Date();
const idDoc = new Date().getTime();

let tabClientsNumber = [
  { "BRIL 62 BAARN": 112100 },
  { "MAX VOOR OGEN": 151700 },
  { "OPTIEK FREIBERGER": 163351 },
  { "TEMPEL OPTIEK": 178300 },
  { "VAN KOUWEN UW OPTICIEN": 143300 },
  { "VAN NES OPTIEK B.V": 175000 },
  { "VAN RIJT OPTIEK": 164000 },
  { "VS OPTIEK": 146800 },
  { "BAS OPTIEK": 183300 },
  { "HUSMANN OPTIEK": 139700 },
  { "JANSEN EN HERMANS OPTIEK": 140500 },
  { "LOMAN & VAN DE WEERD": 150000 },
  { "OPTICIEN KUIPERS": 146500 },
  { "OPTIEK JANSSEN": 141500 },
  { "OPTOMETRISH CENTRUM OUD GELEEN": 162900 },
];

const convertDateFormat = (date) => {
  console.log("DATE: ", date);
  console.log(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const formatedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
  return formatedDate;
};

// const formatDateString = (date) => {
//   console.log("DATE: ", date);
//   console.log(date.getFullYear(), date.getMonth(), date.getDay());

//   return new Date(date).toISOString();
// };

const getClientNumber = (clientName) => {
  let client = tabClientsNumber.find((client) => Object.keys(client)[0] === clientName);
  return client ? client[clientName] : undefined;
};

const createInvoiceLine = (invoiceLines) => {
  let tabInvoiceLines = [];

  invoiceLines.forEach((line, index) => {
    const isCharge =
      line?.["ram:SpecifiedLineTradeSettlement"]?.[0]?.["ram:SpecifiedTradeAllowanceCharge"]?.[0]?.[
        "ram:ChargeIndicator"
      ]?.[0]?.["udt:Indicator"]?.[0];

    const discountReason =
      line?.["ram:SpecifiedLineTradeSettlement"]?.[0]?.["ram:SpecifiedTradeAllowanceCharge"]?.[0]?.[
        "ram:Reason"
      ]?.[0];

    const discountPercent =
      line?.["ram:SpecifiedLineTradeSettlement"]?.[0]?.["ram:SpecifiedTradeAllowanceCharge"]?.[0]?.[
        "ram:CalculationPercent"
      ]?.[0];

    const itemQuantity =
      line?.["ram:SpecifiedLineTradeAgreement"][0]["ram:NetPriceProductTradePrice"][0][
        "ram:BasisQuantity"
      ][0];

    const lineTotalAmount =
      line?.["ram:SpecifiedLineTradeSettlement"][0][
        "ram:SpecifiedTradeSettlementLineMonetarySummation"
      ][0]["ram:LineTotalAmount"][0];

    const itemBasePrice =
      line?.["ram:SpecifiedLineTradeAgreement"][0]["ram:GrossPriceProductTradePrice"][0][
        "ram:ChargeAmount"
      ][0];

    const itemDescription = line?.["ram:SpecifiedTradeProduct"][0]["ram:Name"][0];

    const itemReference = line?.["ram:SpecifiedTradeProduct"][0]["ram:SellerAssignedID"][0];

    const discountAmount = (itemBasePrice * discountPercent) / 100;

    let invoiceLine = {
      "cac:InvoiceLine": [
        { "cbc:ID": index },
        {
          _name: "cbc:InvoicedQuantity",
          _attrs: { unitCode: "ZZ" },
          _content: itemQuantity,
        },
        {
          _name: "cbc:LineExtensionAmount",
          _attrs: { currencyID: "EUR" },
          _content: lineTotalAmount,
        },
        {
          "cac:Item": {
            "cbc:Description": itemDescription,
            "cbc:Name": itemDescription,
            "cac:SellersItemIdentification": {
              "cbc:ID": itemReference,
            },
            "cac:ClassifiedTaxCategory": {
              "cbc:ID": "Z",
              "cbc:Percent": 0,
              "cac:TaxScheme": {
                "cbc:ID": "VAT",
              },
            },
          },
        },
        {
          "cac:Price": [
            {
              _name: "cbc:PriceAmount",
              _attrs: {
                currencyID: "EUR",
              },
              _content: itemBasePrice,
            },
            {
              _name: "cbc:BaseQuantity",
              _attrs: {
                unitCode: "ZZ",
              },
              _content: itemQuantity,
            },
          ],
        },
      ],
    };

    if (isCharge === "false") {
      invoiceLine["cac:InvoiceLine"].push({
        "cac:AllowanceCharge": [
          {
            _name: "cbc:ChargeIndicator",
            _content: isCharge,
          },
          {
            _name: "cbc:AllowanceChargeReason",
            _content: discountReason,
          },
          {
            _name: "cbc:MultiplierFactorNumeric",
            _content: discountPercent,
          },
          {
            _name: "cbc:Amount",
            _attrs: {
              currencyID: "EUR",
            },
            _content: discountAmount,
          },
          {
            _name: "cbc:BaseAmount",
            _attrs: {
              currencyID: "EUR",
            },
            _content: itemBasePrice,
          },
        ],
      });
    }

    tabInvoiceLines.push(invoiceLine);
  });
  return tabInvoiceLines;
};

const formatJson = async (json) => {
  let formatedJson = [];

  json.map((string) => {
    formatedJson.push(JSON.parse(string));
  });

  /** Nouveau code */
  console.log("FORMATED JSON 138: ", formatedJson);

  /** Ancien code */
  const fileNumber = formatedJson[formatedJson.length - 1]?.inputFileNumber?.padStart(5, "0");
  const testProduction = formatedJson[formatedJson.length - 1].testProduction;

  const supplierNumber = 11859;

  // Header
  let newXmlFileName = `${dateNow.getFullYear()}_${supplierNumber}${fileNumber}`;

  /** Nouveau code */
  const invoiceCurrencyCode =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeSettlement"
    ][0]["ram:InvoiceCurrencyCode"][0];

  // Numéro de document
  const numeroDoc =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:ExchangedDocument"][0]["ram:ID"][0];

  // Supplier infos
  const supplierName =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:SellerTradeParty"][0]["ram:Name"][0];

  const supplierAddress =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:SellerTradeParty"][0]["ram:PostalTradeAddress"][0]["ram:LineOne"][0];

  const supplierZipcode =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:SellerTradeParty"][0]["ram:PostalTradeAddress"][0]["ram:PostcodeCode"][0];

  const supplierCity =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:SellerTradeParty"][0]["ram:PostalTradeAddress"][0]["ram:CityName"][0];

  const supplierCountry =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:SellerTradeParty"][0]["ram:PostalTradeAddress"][0]["ram:CountryID"][0];

  const supplierCompanyId =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:SellerTradeParty"][0]["ram:SpecifiedTaxRegistration"][0]["ram:ID"][0]._;

  // Debtor infos
  const debtorName =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:BuyerTradeParty"][0]["ram:Name"][0];

  const debtorNumberCentrop = getClientNumber(debtorName);

  const debtorStreet =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:BuyerTradeParty"][0]["ram:PostalTradeAddress"][0]["ram:LineOne"][0];

  const debtorCity =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:BuyerTradeParty"][0]["ram:PostalTradeAddress"][0]["ram:CityName"][0];

  const debtorPostalZone =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:BuyerTradeParty"][0]["ram:PostalTradeAddress"][0]["ram:PostcodeCode"][0];

  const debtorCountryId =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:BuyerTradeParty"][0]["ram:PostalTradeAddress"][0]["ram:CountryID"][0];

  const debtorCompanyId =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:BuyerTradeParty"][0]["ram:SpecifiedTaxRegistration"][0]["ram:ID"][0]._;

  const debtorPhoneNumber =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeAgreement"
    ][0]["ram:BuyerTradeParty"][0]["ram:DefinedTradeContact"][0][
      "ram:TelephoneUniversalCommunication"
    ][0]["ram:CompleteNumber"][0];

  const debtorEmail =
    formatedJson[0]?.["rsm:CrossIndustryInvoice"]?.["rsm:SupplyChainTradeTransaction"]?.[0]?.[
      "ram:ApplicableHeaderTradeAgreement"
    ]?.[0]?.["ram:BuyerTradeParty"]?.[0]?.["ram:DefinedTradeContact"]?.[0]?.[
      "ram:EmailURIUniversalCommunication"
    ]?.[0]?.["ram:URIID"]?.[0];

  /** Payement method */
  const payementMeansCode =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeSettlement"
    ][0]["ram:SpecifiedTradeSettlementPaymentMeans"][0]["ram:TypeCode"][0];

  const payementTerms =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeSettlement"
    ][0]["ram:SpecifiedTradeSettlementPaymentMeans"][0]["ram:Information"][0];

  const chargeReasonTransport =
    formatedJson[0]?.["rsm:CrossIndustryInvoice"]?.["rsm:SupplyChainTradeTransaction"]?.[0]?.[
      "ram:ApplicableHeaderTradeSettlement"
    ]?.[0]?.["ram:SpecifiedTradeAllowanceCharge"]?.[0]?.["ram:Reason"]?.[0] || 0;

  const chargeAmount =
    formatedJson[0]?.["rsm:CrossIndustryInvoice"]?.["rsm:SupplyChainTradeTransaction"]?.[0]?.[
      "ram:ApplicableHeaderTradeSettlement"
    ]?.[0]?.["ram:SpecifiedTradeAllowanceCharge"]?.[1]?.["ram:ActualAmount"]?.[0] || 0;

  const chargeAmountTransport =
    formatedJson[0]?.["rsm:CrossIndustryInvoice"]?.["rsm:SupplyChainTradeTransaction"]?.[0]?.[
      "ram:ApplicableHeaderTradeSettlement"
    ]?.[0]?.["ram:SpecifiedTradeAllowanceCharge"]?.[0]?.["ram:ActualAmount"]?.[0] || 0;

  const chargePercent =
    formatedJson[0]?.["rsm:CrossIndustryInvoice"]?.["rsm:SupplyChainTradeTransaction"]?.[0]?.[
      "ram:ApplicableHeaderTradeSettlement"
    ]?.[0]?.["ram:SpecifiedTradeAllowanceCharge"]?.[1]?.["ram:CalculationPercent"]?.[0] || 0;

  const lineTotalAmount =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeSettlement"
    ][0]["ram:SpecifiedTradeSettlementHeaderMonetarySummation"][0]["ram:LineTotalAmount"][0];

  const taxBasisTotalAmount =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeSettlement"
    ][0]["ram:SpecifiedTradeSettlementHeaderMonetarySummation"][0]["ram:TaxBasisTotalAmount"][0];

  const allowanceTotalAmount =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeSettlement"
    ][0]["ram:SpecifiedTradeSettlementHeaderMonetarySummation"][0]["ram:AllowanceTotalAmount"][0];

  const chargeTotalAmount =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeSettlement"
    ][0]["ram:SpecifiedTradeSettlementHeaderMonetarySummation"][0]["ram:ChargeTotalAmount"][0];

  const grandTotalAmount =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeSettlement"
    ][0]["ram:SpecifiedTradeSettlementHeaderMonetarySummation"][0]["ram:GrandTotalAmount"][0];

  const prepaidAmount =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeSettlement"
    ][0]["ram:SpecifiedTradeSettlementHeaderMonetarySummation"][0]["ram:TotalPrepaidAmount"][0] ||
    0;

  // let payableAmount = grandTotalAmount - prepaidAmount;

  const payableAmount =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:ApplicableHeaderTradeSettlement"
    ][0]["ram:SpecifiedTradeSettlementHeaderMonetarySummation"][0]["ram:DuePayableAmount"][0];

  const invoiceLines =
    formatedJson[0]["rsm:CrossIndustryInvoice"]["rsm:SupplyChainTradeTransaction"][0][
      "ram:IncludedSupplyChainTradeLineItem"
    ];

  const content = {
    _name: "Invoice",
    _attrs: {
      xmlns: "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
      "xmlns:cac": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
      "xmlns:cbc": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
      "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
      "xsi:schemaLocation":
        "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2 https://docs.oasis-open.org/ubl/os-UBL-2.1/xsd/maindoc/UBL-Invoice-2.1.xsd",
    },
    _content: [
      {
        "cbc:CustomizationID": "urn:cen.eu:en16931:2017#compliant#urn:fdc:nen.nl:nlcius:v1.0",
      },
      {
        "cbc:ProfileID": "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0",
      },
      {
        // "cbc:ID": new Date().getTime(),
        "cbc:ID": numeroDoc,
      },
      {
        "cbc:IssueDate": convertDateFormat(dateNow),
      },
      {
        "cbc:DueDate": convertDateFormat(dateNow),
      },
      {
        "cbc:InvoiceTypeCode": 380,
      },
      {
        "cbc:DocumentCurrencyCode": invoiceCurrencyCode,
      },
      {
        "cbc:BuyerReference": debtorNumberCentrop, // a changer par le nom ou numéro de client chez centrop
      },
      {
        "cac:AccountingSupplierParty": {
          "cac:Party": {
            "cac:PartyName": {
              "cbc:Name": supplierName,
            },
            "cac:PostalAddress": [
              {
                "cbc:StreetName": supplierAddress,
              },
              {
                "cbc:CityName": supplierCity,
              },
              {
                "cbc:PostalZone": supplierZipcode,
              },
              {
                "cac:Country": {
                  "cbc:IdentificationCode": supplierCountry,
                },
              },
            ],
            "cac:PartyTaxScheme": {
              "cbc:CompanyID": supplierCompanyId,
              "cac:TaxScheme": {
                "cbc:ID": "VAT",
              },
            },
            "cac:PartyLegalEntity": [
              {
                _name: "cbc:RegistrationName",
                _content: supplierName,
              },
              {
                _name: "cbc:CompanyID",
                _attrs: {
                  schemeID: "0106",
                },
                _content: supplierCompanyId,
              },
            ],
            "cac:Contact": {
              // "cbc:Telephone": "",
              "cbc:ElectronicMail": "contact@nathalieblancparis.fr",
            },
          },
        },
        "cac:AccountingCustomerParty": {
          "cac:Party": {
            "cac:PartyName": {
              "cbc:Name": debtorName,
            },
            "cac:PostalAddress": [
              {
                "cbc:StreetName": debtorStreet,
              },
              {
                "cbc:CityName": debtorCity,
              },
              {
                "cbc:PostalZone": debtorPostalZone,
              },
              {
                "cac:Country": {
                  "cbc:IdentificationCode": debtorCountryId,
                },
              },
            ],
            "cac:PartyTaxScheme": {
              "cbc:CompanyID": debtorCompanyId,
              "cac:TaxScheme": {
                "cbc:ID": "VAT",
              },
            },
            "cac:PartyLegalEntity": [
              {
                _name: "cbc:RegistrationName",
                _content: debtorName,
              },
              {
                _name: "cbc:CompanyID",
                _attrs: {
                  schemeID: "0106",
                },
                _content: debtorCompanyId,
              },
            ],

            "cac:Contact": {
              "cbc:Telephone": debtorPhoneNumber ?? "",
              "cbc:ElectronicMail": debtorEmail,
            },
          },
        },
        "cac:PaymentMeans": {
          "cbc:PaymentMeansCode": payementMeansCode,
          "cac:PayeeFinancialAccount": {
            "cbc:ID": debtorCompanyId,
            // "cac:FinancialInstitutionBranch": {
            //   "cbc:ID": "",
            // },
          },
        },
        "cac:PaymentTerms": {
          "cbc:Note": payementTerms,
        },
        // "cac:AllowanceCharge": [
        //   { "cbc:ChargeIndicator": true },
        //   { "cbc:AllowanceChargeReason": chargeReason },
        //   {
        //     _name: "cbc:Amount",
        //     _attrs: { currencyID: "EUR" },
        //     _content: chargeAmount,
        //   },
        //   {
        //     "cac:TaxCategory": {
        //       "cbc:ID": "Z",
        //       "cbc:Percent": chargePercent,
        //       "cac:TaxScheme": {
        //         "cbc:ID": "VAT",
        //       },
        //     },
        //   },
        // ],
        "cac:AllowanceCharge": [
          { "cbc:ChargeIndicator": true },
          { "cbc:AllowanceChargeReason": chargeReasonTransport },
          {
            _name: "cbc:Amount",
            _attrs: { currencyID: "EUR" },
            _content: chargeAmountTransport,
          },
          {
            "cac:TaxCategory": {
              "cbc:ID": "Z",
              "cbc:Percent": chargePercent,
              "cac:TaxScheme": {
                "cbc:ID": "VAT",
              },
            },
          },
        ],
        "cac:TaxTotal": [
          {
            _name: "cbc:TaxAmount",
            _attrs: {
              currencyID: "EUR",
            },
            _content: chargeAmount,
          },
          {
            "cac:TaxSubtotal": [
              {
                _name: "cbc:TaxableAmount",
                _attrs: {
                  currencyID: "EUR",
                },
                // _content: chargeTotalAmount,
                _content: taxBasisTotalAmount,
              },
              {
                _name: "cbc:TaxAmount",
                _attrs: {
                  currencyID: "EUR",
                },
                _content: chargeAmount,
              },
              {
                "cac:TaxCategory": {
                  "cbc:ID": "Z",
                  "cbc:Percent": chargePercent,
                  "cac:TaxScheme": {
                    "cbc:ID": "VAT",
                  },
                },
              },
            ],
          },
        ],
        "cac:LegalMonetaryTotal": [
          {
            _name: "cbc:LineExtensionAmount",
            _attrs: {
              currencyID: "EUR",
            },
            _content: lineTotalAmount,
          },
          {
            _name: "cbc:TaxExclusiveAmount",
            _attrs: {
              currencyID: "EUR",
            },
            _content: taxBasisTotalAmount,
          },
          {
            _name: "cbc:TaxInclusiveAmount",
            _attrs: {
              currencyID: "EUR",
            },
            _content: taxBasisTotalAmount,
          },
          {
            _name: "cbc:AllowanceTotalAmount",
            _attrs: {
              currencyID: "EUR",
            },
            _content: allowanceTotalAmount,
          },
          {
            _name: "cbc:ChargeTotalAmount",
            _attrs: {
              currencyID: "EUR",
            },
            _content: chargeTotalAmount,
          },
          {
            _name: "cbc:PrepaidAmount",
            _attrs: {
              currencyID: "EUR",
            },
            _content: prepaidAmount,
          },
          {
            _name: "cbc:PayableAmount",
            _attrs: {
              currencyID: "EUR",
            },
            _content: payableAmount,
          },
        ],
      },
      createInvoiceLine(invoiceLines),
    ],
  };

  // const header = {
  //   statement_information: {
  //     statement_filename: `${newXmlFileName}.xml`,
  //     statement_number: `${supplierNumber}${fileNumber}`,
  //     statement_creationdatetime: formatDateString(dateNow),
  //     statement_test_production: `${testProduction.slice(0, 1).toUpperCase()}`,
  //     statement_year: `${dateNow.getFullYear()}`,
  //     statement_month: `${dateNow.getMonth().toString().padStart(2, "0")}`,
  //   },
  //   supplier: {
  //     supplier_number: `${supplierNumber}`,
  //     supplier_name: `${supplierName}`,
  //     supplier_address: `${supplierAddress}`,
  //     supplier_postal_code: `${supplierZipcode}`,
  //     supplier_city: `${supplierCity}`,
  //     supplier_country: `${supplierCountry}`,
  //   },
  // };

  // const content = {
  //   statement: {
  //     ...header,
  //     invoices: invoicesTab,
  //   },
  // };

  return { content, newXmlFileName };
};

const writeFormatXml = async (data) => {
  try {
    const jsonFormated = await formatJson(data);
    // console.log("JSON FORMATED: ", jsonFormated);

    const xmlFormated = toXML(jsonFormated.content, xmlConfig);

    const filePath = "./xmltmp/combined-centrop.xml";
    try {
      await fs.promises.writeFile(filePath, "", "utf8");
    } catch (error) {}
    await fs.promises.appendFile(filePath, xmlFormated, "utf8");

    console.log("Xml file written successfully");

    console.log("FilePath: ", filePath);

    return { filePath, newXmlFileName: jsonFormated.newXmlFileName };
  } catch (err) {
    console.log("Error writing xml file: ", err);
  }
};

const processCentropData = async (req, res) => {
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
        const parsedData = await parser.parseStringPromise(fileContent.toString());

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

export { processCentropData };
