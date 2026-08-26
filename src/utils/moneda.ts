export function formatearMoneda(
  precio: number,
  moneda: string = "ARS"
) {
  const monedasConDecimales = ["USD", "EUR", "BRL"];

  const decimales = monedasConDecimales.includes(moneda)
    ? 2
    : 0;

  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(Number(precio));
}