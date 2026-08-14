import type { SVGProps } from "react";

/**
 * React mark — the atom: a nucleus with three orbits at 60° apart.
 * Inherits currentColor so it can sit on the gradient brand tile.
 */
export default function ReactIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="-11.5 -10.23 23 20.46" fill="none" aria-hidden="true" {...props}>
      <circle r="2.05" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <ellipse rx="11" ry="4.2" />
        <ellipse rx="11" ry="4.2" transform="rotate(60)" />
        <ellipse rx="11" ry="4.2" transform="rotate(120)" />
      </g>
    </svg>
  );
}
