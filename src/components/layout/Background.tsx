/** Ambient background: blueprint grid + aurora blobs + film grain (zero JS). */
export default function Background() {
  return (
    <>
      <div className="bg-grid pointer-events-none fixed inset-0 -z-20" aria-hidden="true" />
      <div className="aurora" aria-hidden="true">
        <div className="a" />
        <div className="b" />
        <div className="c" />
      </div>
      <div className="noise pointer-events-none fixed inset-0 z-50 opacity-5 mix-blend-overlay" aria-hidden="true" />
    </>
  );
}
