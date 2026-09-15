import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex justify-center">
          <BrandLogo className="h-auto w-full max-w-[300px]" priority />
        </div>

        <h1 className="text-3xl font-bold">Términos y condiciones</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: 14 de septiembre de 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 sm:text-base">
          <section>
            <h2 className="text-lg font-bold">1. Sobre PresupuestoIA</h2>
            <p className="mt-2">
              PresupuestoIA es una herramienta digital para crear, editar, guardar y descargar
              presupuestos comerciales. Algunas funciones pueden utilizar inteligencia artificial
              para asistir en la redacción de descripciones.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">2. Registro y cuenta</h2>
            <p className="mt-2">
              Para utilizar determinadas funciones es necesario crear una cuenta. El usuario es
              responsable de mantener la confidencialidad de sus datos de acceso y de la actividad
              realizada desde su cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">3. Uso de la plataforma</h2>
            <p className="mt-2">
              El usuario se compromete a utilizar PresupuestoIA de forma lícita y a no emplear la
              plataforma para actividades fraudulentas, abusivas o que vulneren derechos de terceros.
              El contenido de cada presupuesto, sus importes, condiciones y datos comerciales son
              responsabilidad del usuario que los carga o genera.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">4. Inteligencia artificial</h2>
            <p className="mt-2">
              Las sugerencias generadas con inteligencia artificial son una ayuda de redacción y
              pueden contener errores o requerir ajustes. El usuario debe revisar el contenido antes
              de enviarlo a sus clientes. PresupuestoIA no sustituye asesoramiento profesional,
              contable, impositivo, legal o técnico.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">5. Planes y suscripciones</h2>
            <p className="mt-2">
              PresupuestoIA puede ofrecer un plan gratuito y planes pagos con diferentes límites y
              funcionalidades. Los precios y condiciones vigentes se muestran antes de confirmar la
              contratación.
            </p>
            <p className="mt-2">
              Las suscripciones pagas se procesan mediante Mercado Pago y se renuevan automáticamente
              según la periodicidad elegida, salvo que sean canceladas antes del próximo cobro. La
              disponibilidad de medios de pago depende de Mercado Pago.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">6. Disponibilidad del servicio</h2>
            <p className="mt-2">
              Se procura mantener PresupuestoIA disponible y funcionando correctamente, aunque pueden
              existir interrupciones por mantenimiento, fallas técnicas, servicios de terceros o
              situaciones fuera de control razonable.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">7. Cambios</h2>
            <p className="mt-2">
              Estos términos pueden actualizarse cuando sea necesario para reflejar cambios en el
              servicio, funcionalidades o condiciones comerciales. La versión vigente será la publicada
              en esta página.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">8. Privacidad</h2>
            <p className="mt-2">
              El tratamiento de datos personales se describe en la {" "}
              <Link href="/privacidad" className="font-semibold text-blue-700 hover:underline">
                Política de privacidad
              </Link>.
            </p>
          </section>
        </div>

        <div className="mt-8 border-t pt-6 text-center">
          <Link href="/" className="font-semibold text-blue-700 hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
