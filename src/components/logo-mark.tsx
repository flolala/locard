export default function LogoMark({
  className = "h-8 w-8",
  tone = "wine",
}: {
  className?: string;
  tone?: "wine" | "cream";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brand/lc-${tone}.png`}
      alt=""
      width={64}
      height={64}
      className={className}
      aria-hidden
    />
  );
}
