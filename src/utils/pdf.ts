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
  // DETALLE
  // ==========================================

  const yDetalle = yCliente + 38;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text("DETALLE DEL PRESUPUESTO", 20, yDetalle);

  // Encabezado de tabla

  const yTabla = yDetalle + 8;

  doc.setFillColor(30, 64, 175);

  doc.roundedRect(
    20,
    yTabla - 6,
    170,
    10,
    2,
    2,
    "F"
  );

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);

  doc.text("Descripción", 25, yTabla);

  doc.text("Importe", 165, yTabla, {
    align: "right",
  });

  // Contenido de la tabla

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");

  const descripcion = doc.splitTextToSize(
    presupuesto.descripcion,
    125
  );

  const yDescripcion = yTabla + 12;

  // Descripción
  doc.text(
    descripcion,
    25,
    yDescripcion
  );

    // Importe
  const precioFormateado = formatearMoneda(
    presupuesto.precio,
    presupuesto.moneda || "ARS"
  );

  doc.text(
    `${presupuesto.moneda || "ARS"} ${precioFormateado}`,
    165,
    yDescripcion,
    {
      align: "right",
    }
  );

  const altoDescripcion =
    Math.max(descripcion.length, 1) * 6;

  const ySeparador =
    yDescripcion + altoDescripcion + 8;

  doc.line(
    20,
    ySeparador,
    190,
    ySeparador
  );

  // ==========================================
  // TOTAL
  // ==========================================

const yTotal = ySeparador + 15;
  
doc.setFont("helvetica", "bold");
doc.setFontSize(16);

doc.text(
  `${presupuesto.moneda || "ARS"} ${precioFormateado}`,
  165,
  yTotal,
  {
    align: "right",
  }
);

 
  // ==========================================
  // PIE DE PÁGINA
  // ==========================================

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);

  doc.text(
    "Gracias por confiar en PresupuestoIA.",
    105,
    275,
    {
      align: "center",
    }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  doc.text(
    "Documento generado automáticamente.",
    105,
    282,
    {
      align: "center",
    }
  );

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