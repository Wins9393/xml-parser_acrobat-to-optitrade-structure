import fs from "fs";
import Fastify from "fastify";
import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";

import jstoxml from "jstoxml";
import xml2js from "xml2js";

const fastify = Fastify({
	logger: true,
});

fastify.register(fastifyMultipart);

await fastify.register(cors, {
	origin: ["http://localhost:3000"],
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	allowedHeaders: ["Content-Type", "x-requested-with"],
	preflightContinue: true,
});

const PORT = 5555;
const { toXML } = jstoxml;
const xmlConfig = { indent: "  " };
const jsonFile = "./jsons/test.json";
const parser = new xml2js.Parser();

const convertDateFormat = (date) => {
	const year = date.slice(0, 4);
	const month = date.slice(4, 6);
	const day = date.slice(6, 8);
	return `${year}-${month}-${day}`;
};

const formatDateString = (date) => {
	const year = date.substring(0, 4);
	const month = date.substring(4, 6);
	const day = date.substring(6, 8);

	const dateObject = new Date(year, month - 1, day);

	return dateObject.toISOString();
};

const formatJson = async (json, fields) => {
	let parsedJson = JSON.parse(json);

	const fileNumber = fields.inputFileNumber.value.padStart(5, "0");
	const testProduction = fields.testProduction.value;

	const supplierNumber = 11859;
	const dateNow = new Date();
	const dateISO = dateNow.toISOString().slice(0, 19);
	// const dateYear = dateNow.getFullYear();
	// const dateMonth = (dateNow.getMonth() + 1).toString();

	let tabInvoiceLines = [];

	const docDate =
		parsedJson?.["rsm:CrossIndustryInvoice"][
			"rsm:SupplyChainTradeTransaction"
		][0]["ram:ApplicableHeaderTradeDelivery"][0][
			"ram:ActualDeliverySupplyChainEvent"
		][0]["ram:OccurrenceDateTime"][0]["udt:DateTimeString"][0]["_"];

	const dateYear = docDate.slice(0, 4);
	const dateMonth = docDate.slice(4, 6);

	let newXmlFileName = `${dateYear}_${supplierNumber}${fileNumber}`;

	const supplierName =
		parsedJson?.["rsm:CrossIndustryInvoice"][
			"rsm:SupplyChainTradeTransaction"
		][0]["ram:ApplicableHeaderTradeAgreement"][0]["ram:SellerTradeParty"][0][
			"ram:Name"
		][0];

	const supplierAddress =
		parsedJson?.["rsm:CrossIndustryInvoice"][
			"rsm:SupplyChainTradeTransaction"
		][0]["ram:ApplicableHeaderTradeAgreement"][0]["ram:SellerTradeParty"][0][
			"ram:PostalTradeAddress"
		][0]["ram:LineOne"][0];

	const supplierZipcode =
		parsedJson?.["rsm:CrossIndustryInvoice"][
			"rsm:SupplyChainTradeTransaction"
		][0]["ram:ApplicableHeaderTradeAgreement"][0]["ram:SellerTradeParty"][0][
			"ram:PostalTradeAddress"
		][0]["ram:PostcodeCode"][0];

	const supplierCity =
		parsedJson?.["rsm:CrossIndustryInvoice"][
			"rsm:SupplyChainTradeTransaction"
		][0]["ram:ApplicableHeaderTradeAgreement"][0]["ram:SellerTradeParty"][0][
			"ram:PostalTradeAddress"
		][0]["ram:CityName"][0];

	const supplierCountry =
		parsedJson?.["rsm:CrossIndustryInvoice"][
			"rsm:SupplyChainTradeTransaction"
		][0]["ram:ApplicableHeaderTradeAgreement"][0]["ram:SellerTradeParty"][0][
			"ram:PostalTradeAddress"
		][0]["ram:CountryID"][0];

	const debtorNumber =
		parsedJson?.["rsm:CrossIndustryInvoice"][
			"rsm:SupplyChainTradeTransaction"
		][0]["ram:ApplicableHeaderTradeAgreement"][0]["ram:BuyerTradeParty"][0][
			"ram:DefinedTradeContact"
		][0]["ram:PersonName"][0];

	const invoiceAmountHT =
		parsedJson?.["rsm:CrossIndustryInvoice"][
			"rsm:SupplyChainTradeTransaction"
		][0]["ram:ApplicableHeaderTradeSettlement"][0]["ram:ApplicableTradeTax"][0][
			"ram:BasisAmount"
		][0];

	const invoiceNumber =
		parsedJson?.["rsm:CrossIndustryInvoice"]["rsm:ExchangedDocument"][0][
			"ram:ID"
		][0];

	const invoiceLines =
		parsedJson?.["rsm:CrossIndustryInvoice"][
			"rsm:SupplyChainTradeTransaction"
		][0]["ram:IncludedSupplyChainTradeLineItem"];

	const createInvoiceLine = (invoiceLines) => {
		return invoiceLines.map((line) => {
			return {
				invoiceline: {
					invoiceline_articlecode_org:
						line?.["ram:SpecifiedTradeProduct"][0]["ram:Name"][0],
					invoiceline_amount_ex_VAT:
						line?.["ram:SpecifiedLineTradeAgreement"][0][
							"ram:GrossPriceProductTradePrice"
						][0]["ram:ChargeAmount"][0],
					invoiceline_VAT: {
						invoiceline_VAT_percentage: 0,
						invoiceline_VAT_amount: 0,
					},
					invoiceline_quantity:
						line?.["ram:SpecifiedLineTradeAgreement"][0][
							"ram:NetPriceProductTradePrice"
						][0]["ram:BasisQuantity"][0],
				},
			};
		});
	};

	const content = {
		statement: {
			statement_information: {
				statement_filename: `${newXmlFileName}.xml`,
				statement_number: `${supplierNumber}${fileNumber}`,
				statement_creationdatetime: formatDateString(docDate),
				statement_test_production: `${testProduction
					.slice(0, 1)
					.toUpperCase()}`,
				statement_year: `${dateYear}`,
				statement_month: `${dateMonth.padStart(2, "0")}`,
			},
			supplier: {
				supplier_number: `${supplierNumber}`,
				supplier_name: `${supplierName}`,
				supplier_address: `${supplierAddress}`,
				supplier_postal_code: `${supplierZipcode}`,
				supplier_city: `${supplierCity}`,
				supplier_country: `${supplierCountry}`,
			},
			invoices: {
				invoice: {
					invoice_debtor: `${debtorNumber}`,
					invoice_amount_ex_VAT: `${invoiceAmountHT}`,
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
			},
		},
	};

	return content;
};

const writeFormatJson = async (data) => {
	try {
		const jsonFormated = JSON.stringify(data);
		await fs.promises.writeFile(jsonFile, jsonFormated);
		console.log("Json file written successfully");

		return jsonFormated;
	} catch (err) {
		console.log("Error writing json file: ", err);
	}
};

const writeFormatXml = async (data, fields) => {
	try {
		// console.log("data: ", data);
		const jsonFormated = await formatJson(data, fields);
		const xmlFormated = toXML(jsonFormated, xmlConfig);

		console.log("Xml file written successfully");

		return xmlFormated;
	} catch (err) {
		console.log("Error writing xml file: ", err);
	}
};

const processData = async (req, res) => {
	try {
		const file = await req.file();
		const fields = await file.fields;

		const fileContent = await file.toBuffer();
		const parsedData = await parser.parseStringPromise(fileContent.toString());
		const jsonData = await writeFormatJson(parsedData);
		const xmlData = await writeFormatXml(jsonData, fields);

		// const readable = Readable.from([xmlData]);

		res.header("Content-Type", "text/xml");
		res.header("Content-Disposition", `attachment; filename=facture.xml`);

		res.send(xmlData);
	} catch (err) {
		console.error("Failed to read file", err);
		res.code(500).send("Erreur, veuillez rééssayer !");
	}
};

fastify.post("/api/structure-xml", processData);

const start = async (PORT) => {
	try {
		await fastify.listen({ port: PORT });
		console.log(`back is running on port ${PORT}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};
start(PORT);