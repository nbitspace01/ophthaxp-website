/**
 * A blurred, darkened copy of an image filling its whole box, to sit behind
 * the same image shown whole (`object-contain`).
 *
 * Uploads come in every size and shape. With `object-cover` a photo whose
 * shape differs from its box loses its sides or its top, often the face. With
 * `object-contain` over this backdrop, the full picture is always visible and
 * the spare room is filled with its own colours instead of empty bars. A photo
 * that already matches the box looks the same either way.
 *
 * Put it as the first child of a positioned box; the image after it paints on top.
 *
 * `tone`: "dark" (default) sits back as a glow on the dark pages; "bright" keeps
 * most of the picture's own light, so thin side bands read as the photo
 * continuing rather than as dark strips.
 */
export function ImageBackdrop({
  src,
  className = "",
  tone = "dark",
}: {
  src?: string | null;
  className?: string;
  tone?: "dark" | "bright";
}) {
  if (!src) return null;
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 block overflow-hidden ${className}`}
    >
      <span
        className={`absolute -inset-[10%] block bg-cover bg-center blur-3xl ${
          tone === "bright" ? "brightness-[.8] saturate-100" : "brightness-[.32] saturate-[.85]"
        }`}
        style={{ backgroundImage: `url("${src.replace(/"/g, "%22")}")` }}
      />
    </span>
  );
}
