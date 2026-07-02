require("dotenv").config();

const express = require("express");
const { generateQuote } = require("./src/rateEngine");
const { renderQuoteHtml } = require("./src/quoteRenderer");
const { htmlToImage } = require("./src/imageGenerator");
const { uploadImage } = require("./src/imageUpload");
const { writeBackToGHL } = require("./src/ghl");

const app = express();
app.use(express.json({ limit: "2mb" }));

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getCustomFields(payload) {
  return payload?.customFields || payload?.contact?.customFields || [];
}

function getFieldValue(customFields, fieldId) {
  if (!fieldId) {
    return undefined;
  }

  const match = customFields.find((field) => String(field.id) === String(fieldId));
  return match ? match.value : undefined;
}

function extractLeadData(payload = {}) {
  const contact = payload.contact || payload;
  const customFields = getCustomFields(payload);

  return {
    contactId: contact.id || payload.contactId || payload.contact_id || "",
    firstName: contact.firstName || contact.first_name || "Sample",
    lastName: contact.lastName || contact.last_name || "Lead",
    email: contact.email || "",
    phone: contact.phone || "",
    street: contact.address1 || contact.street || "",
    city: contact.city || "",
    state: getFieldValue(customFields, process.env.GHL_FIELD_STATE) || contact.state || "CA",
    zip: contact.postalCode || contact.zip || "",
    loanAmount: toNumber(getFieldValue(customFields, process.env.GHL_FIELD_LOAN_AMOUNT), 300000),
    propertyValue: toNumber(getFieldValue(customFields, process.env.GHL_FIELD_PROPERTY_VALUE), 400000),
    creditScore: Math.round(toNumber(getFieldValue(customFields, process.env.GHL_FIELD_CREDIT_SCORE), 740)),
    loanPurpose: getFieldValue(customFields, process.env.GHL_FIELD_LOAN_PURPOSE) || "Purchase",
    propertyType: getFieldValue(customFields, process.env.GHL_FIELD_PROPERTY_TYPE) || "Single Family",
    occupancy: getFieldValue(customFields, process.env.GHL_FIELD_OCCUPANCY) || "Primary"
  };
}

async function processQuote(lead, shouldWriteBack = false) {
  console.log("[Quote] Starting quote generation for contact:", lead.contactId || "test");

  console.log("[Quote] Loading rates and generating loan scenarios...");
  const loanOptions = await generateQuote(lead);

  if (loanOptions.length === 0) {
    throw new Error("No eligible loan options found for this lead.");
  }

  console.log("[Quote] Rendering HTML quote card...");
  const html = renderQuoteHtml(lead, loanOptions);

  console.log("[Quote] Converting HTML to PNG...");
  const imageBuffer = await htmlToImage(html);

  console.log("[Quote] Uploading PNG to Cloudflare R2...");
  const uploadResult = await uploadImage(imageBuffer, lead);

  if (shouldWriteBack) {
    console.log("[Quote] Writing image URLs back to GHL...");
    await writeBackToGHL(lead.contactId, uploadResult.imageUrl, uploadResult.quotePageUrl);
  }

  console.log("[Quote] Quote flow complete.");
  return uploadResult;
}

app.get("/", (_req, res) => {
  res.json({ status: "Quote Engine running" });
});

app.get("/preview", async (_req, res) => {
  try {
    console.log("[Preview] Rendering sample quote preview.");

    const lead = {
      contactId: "preview-contact",
      firstName: "Sample",
      lastName: "Borrower",
      email: "sample@example.com",
      phone: "555-555-5555",
      street: "123 Main St",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      loanAmount: 300000,
      propertyValue: 400000,
      creditScore: 740,
      loanPurpose: "Purchase",
      propertyType: "Single Family",
      occupancy: "Primary"
    };

    const loanOptions = await generateQuote(lead);
    const html = renderQuoteHtml(lead, loanOptions);
    res.type("html").send(html);
  } catch (error) {
    console.error("[Preview] Failed to render preview:", error);
    res.status(500).send(error.message);
  }
});

app.post("/webhook/generate-quote", (req, res) => {
  res.json({ received: true });

  setImmediate(async () => {
    try {
      console.log("[Webhook] Received GHL quote request.");
      const lead = extractLeadData(req.body);
      await processQuote(lead, true);
    } catch (error) {
      console.error("[Webhook] Quote generation failed:", error);
    }
  });
});

app.post("/test", async (_req, res) => {
  try {
    console.log("[Test] Running sample quote generation.");

    const lead = {
      contactId: "test-contact",
      firstName: "Sample",
      lastName: "Borrower",
      email: "sample@example.com",
      phone: "555-555-5555",
      street: "123 Main St",
      city: "Los Angeles",
      state: "CA",
      zip: "90001",
      loanAmount: 300000,
      propertyValue: 400000,
      creditScore: 740,
      loanPurpose: "Purchase",
      propertyType: "Single Family",
      occupancy: "Primary"
    };

    const { imageUrl } = await processQuote(lead, false);
    res.json({ imageUrl });
  } catch (error) {
    console.error("[Test] Test quote generation failed:", error);
    res.status(500).json({ error: error.message });
  }
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`[Server] Quote Engine listening on port ${port}`);
});
