/**
 * Badge de status/tipo com cor dinâmica.
 * Recebe a cor hex do banco e aplica como estilo inline.
 */

export default function Badge({ label, color = "#6B7280" }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-semibold text-white whitespace-nowrap"
      style={{ backgroundColor: color + "cc" }}
    >
      {label}
    </span>
  );
}
