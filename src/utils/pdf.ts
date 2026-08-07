import { jsPDF } from "jspdf";

export function generarPDF(presupuesto: {
  numero: number;
  cliente: string;
  empresa: string;
  descripcion: string;
  precio: number;
}) {
  const doc = new jsPDF();

  const hoy = new Date();

  const fecha = hoy.toLocaleDateString("es-AR");

  const validez = new Date(hoy);
  validez.setDate(validez.getDate() + 30);

  const fechaValidez = validez.toLocaleDateString("es-AR");

  const numero = String(presupuesto.numero).padStart(6, "0");

  // Título
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("PresupuestoIA", 105, 20, { align: "center" });

  doc.setFontSize(16);
  doc.text(`PRESUPUESTO Nº ${numero}`, 105, 32, {
    align: "center",
  });

  // Fechas
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.text(`Fecha de emisión: ${fecha}`, 20, 50);
  doc.text(`Válido hasta: ${fechaValidez}`, 20, 58);

  // Línea
  doc.line(20, 64, 190, 64);

  // Datos
  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", 20, 76);

  doc.setFont("helvetica", "normal");
  doc.text(presupuesto.cliente, 45, 76);

  doc.setFont("helvetica", "bold");
  doc.text("Empresa:", 20, 86);

  doc.setFont("helvetica", "normal");
  doc.text(presupuesto.empresa, 45, 86);

  doc.line(20, 94, 190, 94);

  // Descripción
  doc.setFont("helvetica", "bold");
  doc.text("Descripción", 20, 108);

  doc.setFont("helvetica", "normal");

  const descripcion = doc.splitTextToSize(
    presupuesto.descripcion,
    170
  );

  doc.text(descripcion, 20, 118);

  doc.line(20, 145, 190, 145);

  // Total
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);

  doc.text(
    `TOTAL: $${Number(presupuesto.precio).toLocaleString("es-AR")}`,
    20,
    160
  );

  doc.setFontSize(11);
  doc.setFont("helvetica", "italic");

  doc.text(
    "Gracias por confiar en PresupuestoIA.",
    105,
    280,
    {
      align: "center",
    }
  );

  const cliente = presupuesto.cliente
    .trim()
    .replace(/\s+/g, "-");

  const anio = hoy.getFullYear();

  doc.save(
    `PresupuestoIA-${anio}-${numero}-${cliente}.pdf`
  );
}