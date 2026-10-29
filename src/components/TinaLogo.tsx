// TINA 심볼 + 워드마크. 크기별 심볼 파일이 따로 있다 (헤더 30px, 모바일 헤더 26px, 푸터 24px).
const SYMBOL = { 30: "/galxe/tina-symbol.svg", 26: "/galxe/tina-symbol-mobile.svg", 24: "/galxe/tina-symbol-footer.svg" } as const;

export default function TinaLogo({ size }: { size: keyof typeof SYMBOL }) {
  return (
    <span className="flex items-center gap-2">
      {/* Figma symbol 프레임 안에서 심볼이 차지하는 위치를 그대로 둔다 */}
      <span className="relative shrink-0 overflow-hidden" style={{ width: size, height: size }}>
        <span className="absolute" style={{ inset: "5.39% 8.33% 6.05% 3.11%" }}>
          <img src={SYMBOL[size]} alt="" className="absolute inset-0 block size-full max-w-none" />
        </span>
      </span>
      <span className="leading-none font-extrabold whitespace-nowrap text-white" style={{ fontSize: size * 0.95, letterSpacing: size * -0.0095 }}>
        TINA
      </span>
    </span>
  );
}
