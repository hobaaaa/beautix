import Image from "next/image";

type ArtexoBrandProps = {
  compact?: boolean;
  suffix?: string;
};

export function ArtexoBrand({ compact = false, suffix }: ArtexoBrandProps) {
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        <Image
          src="/icons/icon-192x192.png"
          alt="Artexo"
          width={32}
          height={32}
          className="h-8 w-8 rounded-lg bg-white object-contain"
        />
        {suffix ? <span className="font-semibold">{suffix}</span> : null}
      </div>
    );
  }

  return (
    <Image
      src="/brand/artexo-logo-small.png"
      alt="Artexo"
      width={384}
      height={256}
      className="h-auto w-40 object-contain"
    />
  );
}
