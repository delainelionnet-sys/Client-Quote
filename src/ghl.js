const axios = require("axios");

async function writeBackToGHL(contactId, imageUrl, quotePageUrl) {
  if (!contactId) {
    console.log("[GHL] No contact ID present. Skipping write-back.");
    return;
  }

  const customFields = [
    {
      id: process.env.GHL_FIELD_QUOTE_IMAGE_URL,
      value: imageUrl
    },
    {
      id: process.env.GHL_FIELD_QUOTE_LINK,
      value: quotePageUrl
    }
  ].filter((field) => field.id);

  if (customFields.length === 0) {
    console.log("[GHL] Quote field IDs are not configured. Skipping write-back.");
    return;
  }

  await axios.put(
    `https://services.leadconnectorhq.com/contacts/${contactId}`,
    { customFields },
    {
      headers: {
        Authorization: `Bearer ${process.env.GHL_API_KEY}`,
        Version: "2021-07-28",
        "Content-Type": "application/json"
      }
    }
  );
}

module.exports = {
  writeBackToGHL
};
