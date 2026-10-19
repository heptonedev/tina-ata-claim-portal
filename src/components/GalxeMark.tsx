// "TINA × Galxe" 공동 이벤트 표시. Galxe 로고 파일 대신 이름으로 표기한다.
export default function GalxeMark() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/tina-icon.png" alt="" width={28} height={28} className="rounded-md" />
      <span className="font-display text-xl font-bold tracking-tight">TINA</span>
      <span aria-hidden="true" className="text-lg text-muted">×</span>
      <span className="font-display text-xl font-bold tracking-tight">Galxe</span>
      <span className="sr-only">TINA and Galxe airdrop</span>
    </div>
  );
}
