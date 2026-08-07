import { jsPDF } from "jspdf";

export function generarPDF(presupuesto: {
  cliente: string;
  empresa: string;
  descripcion: string;
  precio: number;
}) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text("PresupuestoIA", 20, 20);

  doc.setFontSize(14);
  doc.text(`Cliente: ${presupuesto.cliente}`, 20, 40);
  doc.text(`Empresa: ${presupuesto.empresa}`, 20, 50);

  doc.text("Descripción:", 20, 70);
  doc.text(presupuesto.descripcion, 20, 80);

  doc.setFontSize(16);
  doc.text(
    `Total: $${Number(presupuesto.precio).toLocaleString("es-AR")}`,
    20,
    110
  );

  doc.save(`Presupuesto-${presupuesto.cliente}.pdf`);
}