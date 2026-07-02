const fs = require("fs/promises");
const path = require("path");

const RATES_FILE = path.join(__dirname, "..", "rates.json");

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function calculateMonthlyPayment(principal, annualRate, termMonths) {
  if (principal <= 0 || termMonths <= 0) {
    return 0;
  }

  const monthlyRate = annualRate / 100 / 12;

  if (monthlyRate === 0) {
    return principal / termMonths;
  }

  const factor = Math.pow(1 + monthlyRate, termMonths);
  return principal * ((monthlyRate * factor) / (factor - 1));
}

function formatLtv(loanAmount, propertyValue) {
  if (propertyValue <= 0) {
    return "0.0";
  }

  return ((loanAmount / propertyValue) * 100).toFixed(1);
}

async function loadRates() {
  const raw = await fs.readFile(RATES_FILE, "utf8");
  return JSON.parse(raw);
}

function selectBestTier(product, lead) {
  const propertyValue = toNumber(lead.propertyValue);
  const firstLoanAmount = toNumber(lead.loanAmount);
  const fico = toNumber(lead.creditScore);
  const isSecondLien = product.tag === "HELOC" || product.tag === "HELOAN";

  const candidates = product.tiers
    .filter((tier) => fico >= toNumber(tier.minFico))
    .map((tier) => {
      if (isSecondLien) {
        const loanAmount = propertyValue * (toNumber(tier.maxLtv) / 100) - firstLoanAmount;

        if (loanAmount <= 0) {
          return null;
        }

        return {
          tier,
          loanAmount,
          ltv: toNumber(tier.maxLtv)
        };
      }

      const ltv = propertyValue > 0 ? (firstLoanAmount / propertyValue) * 100 : 0;

      if (ltv > toNumber(tier.maxLtv)) {
        return null;
      }

      return {
        tier,
        loanAmount: firstLoanAmount,
        ltv
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.tier.rate !== b.tier.rate) {
        return a.tier.rate - b.tier.rate;
      }

      return b.loanAmount - a.loanAmount;
    });

  return candidates[0] || null;
}

async function generateQuote(lead) {
  const rates = await loadRates();

  return rates
    .map((product) => {
      const match = selectBestTier(product, lead);

      if (!match) {
        return null;
      }

      const rate = toNumber(match.tier.rate);
      const loanAmount = Number(match.loanAmount.toFixed(2));
      const monthlyPayment = calculateMonthlyPayment(loanAmount, rate, product.termMonths);

      return {
        label: product.label,
        tag: product.tag,
        color: product.color,
        amortizationType: product.amortizationType,
        rate,
        monthlyPayment: Number(monthlyPayment.toFixed(2)),
        loanAmount,
        ltv: formatLtv(match.loanAmount, toNumber(lead.propertyValue)),
        lender: product.lender,
        termMonths: product.termMonths
      };
    })
    .filter(Boolean);
}

module.exports = {
  generateQuote
};
