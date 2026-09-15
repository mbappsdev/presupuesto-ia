import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";

export default function PrivacidadPage() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex justify-center">
          <BrandLogo className="h-auto w-full max-w-[300px]" priority />
        </div>

        <h1 className="text-3xl font-bold">Política de privacidad</h1>
        <p className="mt-2 text-sm text-slate-500">Última actualización: 14 de septiembre de 2026</p>

        <div className="mt-8 space-y-6 text-sm leading-7 sm:text-base">
          <section>
            <h2 className="text-lg font-bold">1. Qué información se utiliza</h2>
            <p className="mt-2">
              PresupuestoIA puede tratar datos de cuenta, como correo electrónico e identificadores
              necesarios para iniciar sesión; datos de empresa que el usuario decide cargar; datos de
              presupuestos creados dentro de la plataforma; y datos técnicos indispensables para operar
              el servicio y gestionar suscripciones.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">2. Para qué se utilizan los datos</h2>
            <p className="mt-2">
              Los datos se utilizan para brindar las funciones de PresupuestoIA, mantener la sesión,
              guardar presupuestos y datos de empresa, generar archivos PDF, administrar límites de uso,
              procesar suscripciones y mejorar la seguridad y funcionamiento del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">3. Servicios de terceros</h2>
            <p className="mt-2">
              PresupuestoIA utiliza proveedores tecnológicos para operar determinadas funciones. Entre
              ellos pueden encontrarse servicios de infraestructura y base de datos, procesamiento de
              pagos y herramientas de inteligencia artificial. Estos proveedores reciben únicamente la
              información necesaria para prestar la función correspondiente.
            </p>
            <p className="mt-2">
              Los pagos y suscripciones son procesados por Mercado Pago. PresupuestoIA no almacena los
              datos completos de tarjetas de crédito o débito utilizados en el checkout de Mercado Pago.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">4. Uso de inteligencia artificial</h2>
            <p className="mt-2">
              Cuando el usuario solicita una descripción asistida por IA, se envía el texto necesario
              para generar esa descripción. Se recomienda no incluir información confidencial o datos
              personales innecesarios en esas solicitudes.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">5. Conservación y seguridad</h2>
            <p className="mt-2">
              Se aplican medidas técnicas y organizativas razonables para proteger la información y se
              conserva mientras resulte necesaria para prestar el servicio, cumplir obligaciones
              aplicables o resolver cuestiones relacionadas con la cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">6. Control de la información</h2>
            <p className="mt-2">
              El usuario puede editar la información de su empresa y administrar sus presupuestos desde
              la plataforma. Para consultas relacionadas con sus datos o con la eliminación de una
              cuenta, deberá utilizar el canal de contacto que PresupuestoIA informe en el sitio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">7. Cambios en esta política</h2>
            <p className="mt-2">
              Esta política puede actualizarse para reflejar cambios en las funcionalidades, proveedores
              o prácticas del servicio. La versión vigente será la publicada en esta página.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold">8. Términos del servicio</h2>
            <p className="mt-2">
              El uso de PresupuestoIA también está sujeto a los {" "}
              <Link href="/terminos" className="font-semibold text-blue-700 hover:underline">
                Términos y condiciones
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
