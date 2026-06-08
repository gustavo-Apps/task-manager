/**
 * generatePdf(report)
 *
 * Gera um PDF formatado a partir dos dados do relatório semanal.
 * Estratégia: renderiza HTML em um elemento off-screen → html2canvas → jsPDF.
 *
 * Não depende de servidor. Funciona 100% no browser.
 * jsPDF e html2canvas são carregados via dynamic import (lazy) para não inflar o bundle inicial.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function escHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Agrupa tasks por activityType
function groupByType(tasks) {
  const map = new Map();
  for (const t of tasks) {
    const key   = t.activityType?.name ?? "Sem categoria";
    const color = t.activityType?.color ?? "#6b7280";
    if (!map.has(key)) map.set(key, { color, items: [] });
    map.get(key).items.push(t);
  }
  return [...map.entries()].map(([name, v]) => ({ name, ...v }));
}

// ─── Template HTML ────────────────────────────────────────────────────────────

function buildHtml(report) {
  const groups     = groupByType(report.tasks ?? []);
  const statusText = report.status === "closed" ? "Fechado" : "Em andamento";
  const statusColor = report.status === "closed" ? "#22c55e" : "#3b82f6";

  const groupsHtml = groups.map(({ name, color, items }) => {
    const rows = items.map((t) => `
      <tr>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#111827;vertical-align:top;">
          ${escHtml(t.title)}
          ${t.azure_ticket_id
            ? `<span style="margin-left:6px;font-size:10px;color:#2563eb;background:#eff6ff;padding:1px 5px;border-radius:3px;font-family:monospace;">#${t.azure_ticket_id}</span>`
            : ""}
        </td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#374151;white-space:nowrap;vertical-align:top;">
          ${fmt(t.task_date)}${t.task_end_date && t.task_end_date !== t.task_date ? ` &rarr; ${fmt(t.task_end_date)}` : ""}
        </td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#374151;vertical-align:top;">
          ${escHtml(t.taskStatus?.name ?? "—")}
        </td>
        <td style="padding:7px 10px;border-bottom:1px solid #e5e7eb;font-size:11px;color:#374151;vertical-align:top;max-width:220px;">
          ${escHtml(t.description ?? "")}
        </td>
      </tr>`).join("");

    return `
      <div style="margin-bottom:24px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></span>
          <span style="font-size:13px;font-weight:600;color:#1f2937;">${escHtml(name)}</span>
          <span style="font-size:11px;color:#6b7280;">(${items.length})</span>
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:7px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Atividade</th>
              <th style="padding:7px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;white-space:nowrap;">Data</th>
              <th style="padding:7px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Status</th>
              <th style="padding:7px 10px;text-align:left;font-size:11px;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Descricao</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }).join("");

  const emptyState = report.tasks?.length === 0
    ? `<p style="color:#6b7280;font-size:13px;text-align:center;padding:40px 0;">Nenhuma atividade registrada.</p>`
    : "";

  return `
    <div id="pdf-root" style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #ffffff;
      color: #111827;
      padding: 40px 48px;
      width: 794px;
      box-sizing: border-box;
    ">

      <!-- Header -->
      <div style="border-bottom:2px solid #e5e7eb;padding-bottom:20px;margin-bottom:28px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h1 style="margin:0;font-size:22px;font-weight:700;color:#111827;">
              Relatorio Semanal
            </h1>
            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">
              Semana ${escHtml(String(report.week_number))} / ${escHtml(String(report.year))}
              &nbsp;&bull;&nbsp;
              ${fmt(report.start_date)} ate ${fmt(report.end_date)}
            </p>
          </div>
          <span style="
            font-size:11px;font-weight:600;padding:4px 12px;border-radius:20px;
            background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}55;
          ">${statusText}</span>
        </div>

        <!-- Resumo -->
        <div style="display:flex;gap:28px;margin-top:16px;">
          <div>
            <p style="margin:0;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">Total</p>
            <p style="margin:2px 0 0;font-size:18px;font-weight:700;color:#111827;">${report.tasks?.length ?? 0}</p>
          </div>
          ${groups.slice(0,4).map(g => `
          <div>
            <p style="margin:0;font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">${escHtml(g.name)}</p>
            <p style="margin:2px 0 0;font-size:18px;font-weight:700;color:${g.color};">${g.items.length}</p>
          </div>`).join("")}
        </div>
      </div>

      <!-- Atividades -->
      ${emptyState}
      ${groupsHtml}

      <!-- Rodapé -->
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:10px;color:#9ca3af;">Weekly Reports</span>
        <span style="font-size:10px;color:#9ca3af;">Gerado em ${new Date().toLocaleString("pt-BR")}</span>
      </div>
    </div>`;
}

// ─── Export principal ─────────────────────────────────────────────────────────

/**
 * @param {Object} report - objeto completo com tasks, activityType, taskStatus
 * @returns {Promise<void>} - inicia download do PDF automaticamente
 */
export async function generatePdf(report) {
  // Lazy-load para nao inflar o bundle inicial
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import("jspdf"),
    import("html2canvas"),
  ]);

  // Monta container off-screen
  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;z-index:-1;";
  container.innerHTML = buildHtml(report);
  document.body.appendChild(container);

  const root = container.querySelector("#pdf-root");

  try {
    const canvas = await html2canvas(root, {
      scale: 2,           // resolução 2x para texto nítido
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const imgData = canvas.toDataURL("image/png");

    // A4 em pontos: 595 x 842
    const pdf    = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageW  = pdf.internal.pageSize.getWidth();
    const pageH  = pdf.internal.pageSize.getHeight();
    const margin = 24;

    const imgW   = pageW - margin * 2;
    const imgH   = (canvas.height * imgW) / canvas.width;

    // Suporte a múltiplas páginas se o conteúdo for longo
    let yPos     = margin;
    let srcY     = 0;
    const scale  = canvas.width / imgW;

    while (srcY < canvas.height) {
      const sliceH    = Math.min((pageH - margin * 2) * scale, canvas.height - srcY);
      const slicePxH  = sliceH / scale;

      // Cria canvas da fatia
      const sliceCanvas  = document.createElement("canvas");
      sliceCanvas.width  = canvas.width;
      sliceCanvas.height = sliceH;
      const ctx = sliceCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

      const sliceData = sliceCanvas.toDataURL("image/png");
      pdf.addImage(sliceData, "PNG", margin, yPos, imgW, slicePxH);

      srcY += sliceH;
      if (srcY < canvas.height) {
        pdf.addPage();
        yPos = margin;
      }
    }

    const filename = `relatorio-semana${report.week_number}-${report.year}.pdf`;
    pdf.save(filename);
  } finally {
    document.body.removeChild(container);
  }
}
