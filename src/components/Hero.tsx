// 히어로: "Thanks for Joining / TINA × Galxe!" + 선물 상자 그림. 넓은 화면은 좌우, 태블릿 이하는 그림이 위로 온다.
const HERO_BG = [
  "linear-gradient(180deg, rgb(8 6 15 / 0) 60%, rgb(8 6 15) 100%)",
  "radial-gradient(ellipse 45.7% 25.7% at 28.6% 89.3%, rgb(224 128 153 / 0.3), rgb(224 128 153 / 0))",
  "radial-gradient(ellipse 64% 36% at 50% 38%, rgb(125 59 237 / 0.6), rgb(92 46 217 / 0.22) 55%, rgb(77 38 204 / 0))",
  "#08060f",
].join(", ");

export default function Hero({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col items-center" style={{ background: HERO_BG }}>
      {children}
      <div className="flex w-full max-w-[1456px] items-center gap-[50px] px-10 lg:min-h-[632px] max-lg:flex-col-reverse max-lg:gap-10 max-lg:px-8 max-lg:pt-10 max-lg:pb-[136px] max-sm:px-5 max-sm:pt-6 max-sm:pb-28">
        <h1 className="flex shrink-0 flex-col items-center gap-10 text-center font-bold text-white [text-shadow:0_0_12px_rgb(0_0_0/0.8)] lg:w-[689px] max-lg:w-full max-sm:gap-5">
          <span className="trim-cap text-[80px] leading-[1.2] tracking-[-2px] max-sm:text-[37px] max-sm:tracking-[-0.925px]">
            Thanks for Joining
          </span>
          <span className="trim-cap text-[110px] leading-[1.2] tracking-[-2.75px] max-lg:text-[100px] max-lg:tracking-[-2.5px] max-sm:text-[50px] max-sm:tracking-[-1.25px]">
            TINA{" "}
            <span className="text-[0.909em] font-light tracking-[-0.025em] text-white/70 max-lg:text-[1em]">×</span>{" "}
            {/* 투명 글자에 text-shadow 를 주면 그림자가 비쳐 어두워진다. 그라데이션 글자는 drop-shadow 로 대신한다 */}
            <span className="bg-gradient-to-r from-[#6b59ff] to-[#e0a3c8] bg-clip-text text-transparent [text-shadow:none] drop-shadow-[0_0_12px_rgb(0_0_0/0.8)]">Galxe!</span>
          </span>
        </h1>
        {/* 그림 영역 안 위치·크기는 Figma 화면 크기별 값 (1280·1920 / 768 / 360) */}
        <div className="relative aspect-[461/416] min-w-0 flex-1 lg:max-w-[637px] max-lg:aspect-auto max-lg:h-[325px] max-lg:w-full max-lg:flex-none max-sm:h-[208px]">
          <img
            src="/galxe/hero-gift.webp"
            alt="A gift box full of TINA coins"
            width={857}
            height={1084}
            className="absolute top-[8.31%] left-[20.25%] h-[83.37%] w-[59.5%] max-w-none max-lg:top-[8.52%] max-lg:left-1/2 max-lg:h-[79.64%] max-lg:w-auto max-lg:-translate-x-1/2 max-sm:top-[11.34%] max-sm:h-[77.41%]"
          />
        </div>
      </div>
    </section>
  );
}
