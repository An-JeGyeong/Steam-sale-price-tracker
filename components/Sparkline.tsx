const W = 130, H = 34;

export default function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const x = (i: number) => i * (W / (data.length - 1));
  const y = (v: number) => mx === mn ? H / 2 : H - 4 - ((v - mn) / (mx - mn)) * (H - 8);
  const pts = data.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const li = data.length - 1;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke="#5fd39a" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(li)} cy={y(data[li])} r={2.8} fill="#5fd39a" />
    </svg>
  );
}
