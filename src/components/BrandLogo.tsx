import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  href?: string;
  className?: string;
  priority?: boolean;
};

export default function BrandLogo({
  href = "/",
  className = "h-auto w-[220px]",
  priority = false,
}: BrandLogoProps) {
  const logo = (
    <Image
      src="/presupuestoia-logo.webp"
      alt="PresupuestoIA - Presupuestos profesionales en segundos. Cotiza más. Haz crecer tu negocio"
      width={900}
      height={300}
      className={className}
      priority={priority}
    />
  );

  return href ? <Link href={href}>{logo}</Link> : logo;
}
