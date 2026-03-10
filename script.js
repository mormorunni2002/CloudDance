const formatCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const formatPercent = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

const elements = {
  participationRange: document.getElementById("participationRange"),
  participationValue: document.getElementById("participationValue"),
  premiumPlaced: document.getElementById("premiumPlaced"),
  lossRatio: document.getElementById("lossRatio"),
  riskRetained: document.getElementById("riskRetained"),
  riskCeded: document.getElementById("riskCeded"),
  retainedPremium: document.getElementById("retainedPremium"),
  cededPremium: document.getElementById("cededPremium"),
  cellRevenue: document.getElementById("cellRevenue"),
  cellProfit: document.getElementById("cellProfit"),
  expectedLosses: document.getElementById("expectedLosses"),
  summaryText: document.getElementById("summaryText"),
};

/**
 * Calculation settings.
 *
 * If you want revenue to equal 100% of premium placed in the cell,
 * change `revenueMode` to "placed-premium".
 */
const settings = {
  revenueMode: "retained-premium", // "retained-premium" | "placed-premium"
};

function parseNonNegativeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildSummary({
  participation,
  retainedPremium,
  cededPremium,
  revenue,
  expectedLosses,
  profit,
  lossRatio,
}) {
  return `At ${formatPercent.format(participation)}% participation, the cell retains ${formatCurrency.format(
    retainedPremium
  )} of premium and cedes ${formatCurrency.format(
    cededPremium
  )}. Using a ${formatPercent.format(
    lossRatio
  )}% loss ratio, projected cell revenue is ${formatCurrency.format(
    revenue
  )} and projected cell profit is ${formatCurrency.format(profit)}.`;
}

function calculate({ participation, premiumPlaced, lossRatio }) {
  const retainedRisk = participation;
  const cededRisk = 100 - participation;

  const retainedPremium = premiumPlaced * (retainedRisk / 100);
  const cededPremium = premiumPlaced * (cededRisk / 100);

  const revenue =
    settings.revenueMode === "placed-premium" ? premiumPlaced : retainedPremium;

  const expectedLosses = revenue * (lossRatio / 100);
  const profit = revenue - expectedLosses;

  return {
    retainedRisk,
    cededRisk,
    retainedPremium,
    cededPremium,
    revenue,
    expectedLosses,
    profit,
  };
}

function render() {
  const participation = clamp(
    parseNonNegativeNumber(elements.participationRange.value),
    0,
    100
  );
  const premiumPlaced = parseNonNegativeNumber(elements.premiumPlaced.value);
  const lossRatio = parseNonNegativeNumber(elements.lossRatio.value);

  const results = calculate({ participation, premiumPlaced, lossRatio });

  elements.participationValue.textContent = `${formatPercent.format(participation)}%`;

  elements.riskRetained.textContent = `${formatPercent.format(
    results.retainedRisk
  )}%`;
  elements.riskCeded.textContent = `${formatPercent.format(results.cededRisk)}%`;

  elements.retainedPremium.textContent = `Retained premium: ${formatCurrency.format(
    results.retainedPremium
  )}`;
  elements.cededPremium.textContent = `Ceded premium: ${formatCurrency.format(
    results.cededPremium
  )}`;

  elements.cellRevenue.textContent = formatCurrency.format(results.revenue);
  elements.cellProfit.textContent = formatCurrency.format(results.profit);
  elements.expectedLosses.textContent = `Expected losses: ${formatCurrency.format(
    results.expectedLosses
  )}`;

  elements.summaryText.textContent = buildSummary({
    participation,
    retainedPremium: results.retainedPremium,
    cededPremium: results.cededPremium,
    revenue: results.revenue,
    expectedLosses: results.expectedLosses,
    profit: results.profit,
    lossRatio,
  });

  notifyParentOfHeight();
}

function notifyParentOfHeight() {
  if (window.parent === window) return;

  window.parent.postMessage(
    {
      type: "cloud-dance-revenue-calculator:height",
      height: Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ),
    },
    "*"
  );
}

for (const input of [
  elements.participationRange,
  elements.premiumPlaced,
  elements.lossRatio,
]) {
  input.addEventListener("input", render);
  input.addEventListener("change", render);
}

if ("ResizeObserver" in window) {
  const resizeObserver = new ResizeObserver(() => notifyParentOfHeight());
  resizeObserver.observe(document.body);
}

window.addEventListener("load", render);
window.addEventListener("resize", notifyParentOfHeight);

render();
