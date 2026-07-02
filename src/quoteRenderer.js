function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatMonthly(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value || 0));
}

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function renderQuoteHtml(lead, loanOptions) {
  const loName = process.env.LO_NAME || "YOUR NAME";
  const loNmls = process.env.LO_NMLS || "YOUR_NMLS";
  const loCompany = process.env.LO_COMPANY || "West Capital Lending";
  const borrowerName = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Prospective Borrower";
  const address = [lead.street, lead.city, lead.state, lead.zip].filter(Boolean).join(", ");

  const optionCards = loanOptions
    .map((option) => {
      return `
        <article class="card" style="border-top-color: ${escapeHtml(option.color)};">
          <div class="tag" style="background: ${escapeHtml(option.color)};">${escapeHtml(option.tag)}</div>
          <div class="rate">${Number(option.rate).toFixed(3)}%</div>
          <div class="subtle">Interest Rate</div>
          <div class="payment">${formatMonthly(option.monthlyPayment)}<span>/mo</span></div>
          <hr />
          <div class="detail-row"><span>Loan Amount</span><strong>${formatCurrency(option.loanAmount)}</strong></div>
          <div class="detail-row"><span>LTV</span><strong>${escapeHtml(option.ltv)}%</strong></div>
          <div class="detail-row"><span>Term</span><strong>${escapeHtml(String(option.termMonths / 12))} Years</strong></div>
          <div class="detail-row"><span>Type</span><strong>${escapeHtml(option.amortizationType)}</strong></div>
          <div class="lender">${escapeHtml(option.lender)}</div>
        </article>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Mortgage Quote</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            background: #eef2f7;
            color: #0f172a;
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
          }
          .sheet {
            width: 1000px;
            margin: 0 auto;
            background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
            border: 1px solid #dbe3ef;
            border-radius: 28px;
            padding: 28px;
            box-shadow: 0 24px 50px rgba(15, 23, 42, 0.08);
          }
          .header {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            padding: 24px;
            background: #ffffff;
            border-radius: 22px;
            border: 1px solid #e2e8f0;
          }
          .header h1 {
            margin: 0 0 14px;
            font-size: 28px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px 18px;
            font-size: 14px;
          }
          .meta-grid span,
          .lo-box span {
            display: block;
            color: #64748b;
            font-size: 12px;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .meta-grid strong,
          .lo-box strong {
            font-size: 15px;
          }
          .lo-box {
            min-width: 250px;
            padding: 18px;
            border-radius: 18px;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
          }
          .status-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin: 18px 0 24px;
            padding: 14px 18px;
            border-radius: 16px;
            background: #dbeafe;
            color: #1e3a8a;
            font-size: 14px;
            font-weight: 600;
          }
          .cards {
            display: flex;
            gap: 18px;
            align-items: stretch;
          }
          .card {
            flex: 1;
            background: #ffffff;
            border-radius: 22px;
            border: 1px solid #e2e8f0;
            border-top: 8px solid #2563eb;
            padding: 20px;
            display: flex;
            flex-direction: column;
            min-height: 360px;
          }
          .tag {
            align-self: flex-start;
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.06em;
            padding: 8px 12px;
            border-radius: 999px;
          }
          .rate {
            margin-top: 18px;
            font-size: 40px;
            font-weight: 800;
            letter-spacing: -0.03em;
          }
          .subtle {
            color: #64748b;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
          }
          .payment {
            margin-top: 20px;
            font-size: 28px;
            font-weight: 700;
          }
          .payment span {
            margin-left: 6px;
            color: #64748b;
            font-size: 14px;
            font-weight: 600;
          }
          hr {
            width: 100%;
            border: 0;
            border-top: 1px solid #e2e8f0;
            margin: 20px 0;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            font-size: 14px;
            margin-bottom: 10px;
          }
          .detail-row span {
            color: #64748b;
          }
          .lender {
            margin-top: auto;
            padding-top: 18px;
            font-size: 13px;
            color: #334155;
            font-weight: 700;
          }
          .footer {
            margin-top: 20px;
            color: #475569;
            font-size: 12px;
            line-height: 1.6;
            padding: 18px 20px 0;
          }
        </style>
      </head>
      <body>
        <main class="sheet">
          <section class="header">
            <div>
              <h1>Mortgage Quote Snapshot</h1>
              <div class="meta-grid">
                <div><span>Lead Name</span><strong>${escapeHtml(borrowerName)}</strong></div>
                <div><span>Credit Score</span><strong>${escapeHtml(String(lead.creditScore || "N/A"))}</strong></div>
                <div><span>Property Address</span><strong>${escapeHtml(address || "Address not provided")}</strong></div>
                <div><span>Property Value</span><strong>${formatCurrency(lead.propertyValue)}</strong></div>
                <div><span>Requested Loan</span><strong>${formatCurrency(lead.loanAmount)}</strong></div>
                <div><span>Purpose</span><strong>${escapeHtml(lead.loanPurpose || "Purchase")}</strong></div>
              </div>
            </div>
            <aside class="lo-box">
              <div style="margin-bottom: 16px;">
                <span>Loan Officer</span>
                <strong>${escapeHtml(loName)}</strong>
              </div>
              <div style="margin-bottom: 16px;">
                <span>NMLS</span>
                <strong>${escapeHtml(loNmls)}</strong>
              </div>
              <div>
                <span>Company</span>
                <strong>${escapeHtml(loCompany)}</strong>
              </div>
            </aside>
          </section>
          <section class="status-row">
            <div>Date: ${escapeHtml(formatDate())}</div>
            <div>Lock Period: 30 days</div>
            <div>Subject to credit approval</div>
          </section>
          <section class="cards">
            ${optionCards}
          </section>
          <footer class="footer">
            Rates shown are based on estimated FICO score, owner occupancy, property type, and current market pricing at the time of quote generation. Final pricing is subject to full credit approval, verified income and assets, occupancy confirmation, appraisal, and program eligibility. This quote is intended for illustration purposes only and is not a commitment to lend.
          </footer>
        </main>
      </body>
    </html>
  `;
}

module.exports = {
  renderQuoteHtml
};
