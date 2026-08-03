export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-10 text-center">
        
        <h1 className="text-4xl font-bold text-slate-800 mb-4">
          MBApps Dev
        </h1>

        <h2 className="text-3xl font-semibold text-blue-600 mb-6">
          PresupuestoIA
        </h2>

        <p className="text-gray-600 mb-8">
          Genera presupuestos profesionales en segundos para tu negocio.
        </p>

        <button className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700">
          Crear presupuesto
        </button>

      </div>
    </main>
  );
}