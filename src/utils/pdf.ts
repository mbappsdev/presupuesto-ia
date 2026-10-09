import { jsPDF } from "jspdf";
import { formatearMoneda } from "@/utils/moneda";

async function cargarImagenComoDataURL(url: string): Promise<string> {
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar el logo");
  }

  const blob = await respuesta.blob();

  return new Promise((resolve, reject) => {
    const lector = new FileReader();

    lector.onloadend = () => {
      resolve(lector.result as string);
    };

    lector.onerror = reject;

    lector.readAsDataURL(blob);
  });
}

export async function generarPDF(presupuesto: {
  numero: number;
  cliente: string;
  empresa: string;
  descripcion: string;
  precio: number;
  moneda?: string;

  empresaDatos?: {
    nombre?: string;
    cuit?: string;
    direccion?: string;
    ciudad?: string;
    telefono?: string;
    email?: string;
    sitio_web?: string;
    logo_url?: string;
  } | null;
}) {
  const doc = new jsPDF();

  const hoy = new Date();

  const fecha = hoy.toLocaleDateString("es-AR");

  const validez = new Date(hoy);
  validez.setDate(validez.getDate() + 30);

  const fechaValidez = validez.toLocaleDateString("es-AR");

  const numero = String(presupuesto.numero).padStart(6, "0");

  const empresaDatos = presupuesto.empresaDatos;
  const logoUrl = empresaDatos?.logo_url;

  let logoData: string | null = null;

  if (logoUrl) {
    try {
      logoData = await cargarImagenComoDataURL(logoUrl);
    } catch (error) {
      console.error("No se pudo cargar el logo:", error);
    }
  }

  // ==========================================
  // ENCABEZADO
  // ==========================================

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);

  if (logoData) {
    doc.addImage(
      logoData,
      "JPEG",
      20,
      12,
      30,
      30
    );

    doc.text("PresupuestoIA", 55, 22);
  } else {
    doc.text("PresupuestoIA", 20, 22);
  }

  doc.setFontSize(14);

  if (empresaDatos?.nombre) {
    doc.text(empresaDatos.nombre, 55, 32);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  let yEmpresa = 39;

  if (empresaDatos?.cuit) {
    doc.text(`CUIT: ${empresaDatos.cuit}`, 55, yEmpresa);
    yEmpresa += 5;
  }

  if (empresaDatos?.direccion || empresaDatos?.ciudad) {
    const ubicacion = [
      empresaDatos.direccion,
      empresaDatos.ciudad,
    ]
      .filter(Boolean)
      .join(" - ");

    doc.text(ubicacion, 55, yEmpresa);
    yEmpresa += 5;
  }

  if (empresaDatos?.telefono) {
    doc.text(`Tel: ${empresaDatos.telefono}`, 55, yEmpresa);
    yEmpresa += 5;
  }

  if (empresaDatos?.email) {
    doc.text(`Email: ${empresaDatos.email}`, 55, yEmpresa);
    yEmpresa += 5;
  }
  
  if (empresaDatos?.sitio_web) {
    doc.text(`Web: ${empresaDatos.sitio_web}`, 55, yEmpresa);
    yEmpresa += 5;
  }

  // Línea del encabezado

  const lineaEncabezado = Math.max(yEmpresa + 5, 55);

  doc.line(20, lineaEncabezado, 190, lineaEncabezado);

  // ==========================================
  // TITULO DEL PRESUPUESTO
  // ==========================================

  const yTitulo = lineaEncabezado + 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);

  doc.text(
    `PRESUPUESTO Nº ${numero}`,
    105,
    yTitulo,
    {
      align: "center",
    }
  );

  // ==========================================
  // FECHAS
  // ==========================================

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    `Fecha de emisión: ${fecha}`,
    20,
    yTitulo + 12
  );

  doc.text(
    `Válido hasta: ${fechaValidez}`,
    120,
    yTitulo + 12
  );

  // ==========================================
  // DATOS DEL CLIENTE
  // ==========================================

  const yCliente = yTitulo + 28;

  doc.setFillColor(245, 247, 250);
  doc.roundedRect(
    20,
    yCliente - 7,
    170,
    28,
    3,
    3,
    "F"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text("DATOS DEL CLIENTE", 25, yCliente);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    `Cliente: ${presupuesto.cliente}`,
    25,
    yCliente + 8
  );

  doc.text(
    `Empresa: ${presupuesto.empresa}`,
    25,
    yCliente + 15
  );

  // ==========================================
  // DETALLE DEL PRESUPUESTO: ÍTEMS E IMPORTES
  // ==========================================

  const margenIzquierdo = 20;
  const margenDerecho = 190;
  const anchoDescripcion = 118;
  const anchoImporte = 45;
  const limiteInferior = 258;
  let y = yCliente + 38;

  // Los ítems se guardan en la descripción con este marcador.
  // Separamos el texto introductorio de las líneas que contienen cada ítem.
  const descripcionGuardada = presupuesto.descripcion || "";
  const marcador = "Detalle de ítems:";
  const indiceMarcador = descripcionGuardada.indexOf(marcador);
  const textoGeneral = indiceMarcador >= 0
    ? descripcionGuardada.slice(0, indiceMarcador).trim()
    : "";
  const textoItems = indiceMarcador >= 0
    ? descripcionGuardada.slice(indiceMarcador + marcador.length).trim()
    : "";

  const items = textoItems
    .split("\n")
    .map((linea) => {
      const match = linea.match(/^\d+\.\s*(.*?)\s+—\s*([A-Z]{3})\s+([\d.,]+)\s*$/);
      if (!match) return null;
      const importe = Number(match[3].replace(/\./g, "").replace(",", "."));
      if (!Number.isFinite(importe)) return null;
      return { descripcion: match[1].trim(), moneda: match[2], importe };
    })
    .filter((item): item is { descripcion: string; moneda: string; importe: number } => item !== null);

  // Compatibilidad con presupuestos anteriores que todavía no tenían ítems.
  const filas = items.length > 0
    ? items
    : [{
        descripcion: descripcionGuardada.replace(/\s*Detalle de ítems:[\s\S]*$/i, "").trim() || descripcionGuardada,
        moneda: presupuesto.moneda || "ARS",
        importe: presupuesto.precio,
      }];

  function dibujarEncabezadoTabla(yEncabezado: number) {
    doc.setFillColor(30, 64, 175);
    doc.roundedRect(margenIzquierdo, yEncabezado - 6, 170, 10, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Descripción", 25, yEncabezado);
    doc.text("Importe", 185, yEncabezado, { align: "right" });
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DETALLE DEL PRESUPUESTO", margenIzquierdo, y);
  y += 8;

  if (textoGeneral) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lineasGenerales = doc.splitTextToSize(textoGeneral, 165);
    const altoGeneral = lineasGenerales.length * 4.5;
    if (y + altoGeneral + 16 > limiteInferior) {
      doc.addPage();
      y = 22;
    }
    doc.text(lineasGenerales, margenIzquierdo, y);
    y += altoGeneral + 7;
  }

  dibujarEncabezadoTabla(y);
  y += 12;

  filas.forEach((item) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const lineasDescripcion = doc.splitTextToSize(item.descripcion, anchoDescripcion);
    const altoFila = Math.max(lineasDescripcion.length * 5, 6);
    if (y + altoFila + 12 > limiteInferior) {
      doc.addPage();
      y = 22;
      dibujarEncabezadoTabla(y);
      y += 12;
    }

    doc.text(lineasDescripcion, 25, y);
    const importeFormateado = formatearMoneda(item.importe, item.moneda || presupuesto.moneda || "ARS");
    doc.text(`${item.moneda || presupuesto.moneda || "ARS"} ${importeFormateado}`, margenDerecho - 5, y, { align: "right" });
    y += altoFila + 5;
    doc.setDrawColor(220, 225, 232);
    doc.line(margenIzquierdo, y - 2, margenDerecho, y - 2);
  });

  // El total siempre se dibuja después del último ítem. Si no entra,
  // se pasa a una página nueva para que no quede cortado ni fuera del papel.
  if (y + 22 > limiteInferior) {
    doc.addPage();
    y = 25;
  } else {
    y += 5;
  }

  const totalFormateado = formatearMoneda(
    presupuesto.precio,
    presupuesto.moneda || "ARS"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TOTAL", 125, y + 5, { align: "right" });
  doc.setFontSize(16);
  doc.text(`${presupuesto.moneda || "ARS"} ${totalFormateado}`, margenDerecho, y + 5, { align: "right" });

  // Pie de página en todas las páginas.
  const cantidadPaginas = doc.getNumberOfPages();
  for (let pagina = 1; pagina <= cantidadPaginas; pagina++) {
    doc.setPage(pagina);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text("Gracias por confiar en PresupuestoIA.", 105, 275, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Documento generado automáticamente.", 105, 282, { align: "center" });
  }

  // ==========================================
  // NOMBRE DEL ARCHIVO
  // ==========================================

  const cliente = presupuesto.cliente
    .trim()
    .replace(/\s+/g, "-");

  const anio = hoy.getFullYear();

  doc.save(
    `PresupuestoIA-${anio}-${numero}-${cliente}.pdf`
  );
}
