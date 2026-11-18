export default function Loading() {
  return (
    <div className="py-14" aria-busy="true">
      <p className="eyebrow">
        <span className="idx">●</span> Loading
      </p>
      <div className="mt-6 h-12 w-2/3 animate-pulse bg-line" />
      <div className="mt-8 h-40 animate-pulse bg-line/60" />
    </div>
  );
}
