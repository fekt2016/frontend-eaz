/**
 * Opens a thermal POS receipt (80mm paper) in a new window and triggers print.
 * Works with any USB/Bluetooth/Network thermal printer set as default in the browser.
 */
export function printRepairReceipt(job, payments = []) {
  const totalParts  = job.parts?.reduce((s, p) => s + (p.priceAtTime || 0) * (p.quantity || 1), 0) || 0;
  const totalAmount = (job.diagnosisFee || 0) + (job.laborCost || 0) + totalParts;
  const totalPaid   = payments.reduce((s, p) => s + p.amount, 0);
  const balance     = Math.max(0, totalAmount - totalPaid);

  const fmt  = (n) => `GH₵${Number(n || 0).toFixed(2)}`;
  const date = new Date().toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" });
  const line = "--------------------------------";
  const dline= "================================";

  const partsRows = (job.parts || []).map(p =>
    `<tr>
      <td>${escHtml(p.name)} x${p.quantity}</td>
      <td class="r">${fmt((p.priceAtTime || 0) * p.quantity)}</td>
    </tr>`
  ).join("");

  const paymentsRows = payments.map(p =>
    `<tr>
      <td class="cap">${escHtml(p.method)} ${p.reference ? `<span class="dim">(${escHtml(p.reference)})</span>` : ""}</td>
      <td class="r">${fmt(p.amount)}</td>
    </tr>`
  ).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Receipt ${escHtml(job.jobNumber)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 12px;
    width: 80mm;
    padding: 4mm 3mm;
    color: #000;
    background: #fff;
  }
  .center  { text-align: center; }
  .r       { text-align: right; }
  .bold    { font-weight: bold; }
  .lg      { font-size: 15px; }
  .xl      { font-size: 18px; }
  .dim     { color: #555; font-size: 10px; }
  .cap     { text-transform: capitalize; }
  .line    { border-top: 1px dashed #000; margin: 4px 0; }
  .dline   { border-top: 2px solid #000; margin: 4px 0; }
  table    { width: 100%; border-collapse: collapse; }
  td       { padding: 1.5px 0; vertical-align: top; }
  td:last-child { white-space: nowrap; padding-left: 4px; }
  .total-row td { font-weight: bold; font-size: 13px; padding-top: 3px; }
  .balance-row td { font-weight: bold; font-size: 14px; padding-top: 4px; }
  .balance-row td:last-child { font-size: 16px; }
  .paid-row td { color: #1a7a3a; font-weight: bold; }
  .status-badge {
    display: inline-block;
    border: 1px solid #000;
    padding: 1px 6px;
    font-size: 11px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  @media print {
    @page { size: 80mm auto; margin: 0; }
    body  { padding: 2mm; }
  }
</style>
</head>
<body>
  <div class="center">
    <p class="bold xl">EAZWORLD</p>
    <p class="dim">Repair Shop</p>
    <p class="dim">Tel: 0244388190</p>
  </div>

  <div class="dline"></div>

  <table>
    <tr><td class="bold">Job #</td><td class="r bold">${escHtml(job.jobNumber)}</td></tr>
    <tr><td class="dim">Date</td><td class="r dim">${date}</td></tr>
    ${job.customer?.phone ? `<tr><td class="dim">Customer</td><td class="r dim">${escHtml(job.customer.phone)}</td></tr>` : ""}
    ${job.customer?.name  ? `<tr><td></td><td class="r dim">${escHtml(job.customer.name)}</td></tr>` : ""}
  </table>

  <div class="line"></div>

  <table>
    <tr><td class="bold">Device</td><td class="r">${escHtml([job.deviceBrand, job.deviceModel].filter(Boolean).join(" ") || "—")}</td></tr>
    ${job.deviceType ? `<tr><td></td><td class="r dim cap">${escHtml(job.deviceType)}</td></tr>` : ""}
    ${job.imei  ? `<tr><td class="dim">IMEI</td><td class="r dim">${escHtml(job.imei)}</td></tr>` : ""}
    ${job.color ? `<tr><td class="dim">Color</td><td class="r dim cap">${escHtml(job.color)}</td></tr>` : ""}
  </table>

  <div class="line"></div>

  <p class="bold" style="margin-bottom:3px">Fault:</p>
  <p class="dim" style="word-break:break-word">${escHtml(job.faultDescription)}</p>

  ${job.repairWork ? `
  <div class="line"></div>
  <p class="bold" style="margin-bottom:3px">Repair done:</p>
  <p class="dim" style="word-break:break-word">${escHtml(job.repairWork)}</p>
  ` : ""}

  <div class="dline"></div>
  <p class="bold" style="margin-bottom:4px">CHARGES</p>

  <table>
    ${job.requiresDiagnosis && job.diagnosisFee ? `
    <tr>
      <td>Diagnosis fee</td>
      <td class="r">${fmt(job.diagnosisFee)}</td>
    </tr>` : ""}
    ${partsRows}
    ${job.laborCost ? `
    <tr>
      <td>Labour</td>
      <td class="r">${fmt(job.laborCost)}</td>
    </tr>` : ""}
  </table>

  <div class="dline"></div>

  <table>
    <tr class="total-row">
      <td>TOTAL</td>
      <td class="r">${fmt(totalAmount)}</td>
    </tr>
    ${paymentsRows ? `
    <tr><td colspan="2"><div class="line"></div></td></tr>
    ${paymentsRows}
    <tr class="paid-row">
      <td>PAID</td>
      <td class="r">${fmt(totalPaid)}</td>
    </tr>` : ""}
    <tr><td colspan="2"><div class="dline"></div></td></tr>
    <tr class="balance-row">
      <td>BALANCE DUE</td>
      <td class="r">${fmt(balance)}</td>
    </tr>
  </table>

  <div class="dline"></div>

  <div class="center" style="margin-top:6px">
    <span class="status-badge">${escHtml(job.status?.toUpperCase().replace(/_/g, " ") || "")}</span>
  </div>

  ${job.estimatedCompletion ? `
  <div class="center" style="margin-top:5px">
    <p class="dim">Est. completion:</p>
    <p class="bold">${new Date(job.estimatedCompletion).toLocaleString("en-GH", { dateStyle: "medium", timeStyle: "short" })}</p>
  </div>` : ""}

  <div class="line" style="margin-top:8px"></div>
  <div class="center" style="margin-top:4px">
    <p class="dim">Thank you for choosing EazWorld!</p>
    <p class="dim" style="margin-top:2px">Keep this receipt for warranty claims.</p>
  </div>
  <div style="height:8mm"></div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=340,height=600,toolbar=0,menubar=0,scrollbars=1");
  if (!win) { alert("Please allow pop-ups to print receipts."); return; }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 300);
}

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
