import TinaLogo from "@/components/TinaLogo";
import { shortAddress } from "@/lib/format";

type Props = {
  /** 연결된 Solana 지갑 주소. 있으면 주소 버튼(누르면 연결 해제)을 보인다 */
  walletAddress: string | null;
  /** Galxe 로그인 전이면 "Sign in" 버튼을 보인다 */
  onSignIn: (() => void) | null;
  onDisconnect: () => void;
};

// 상단 헤더: TINA 로고 + "Galxe Event", 오른쪽에 Figma Header Wallet (Disconnected=Sign in / Connected=지갑 주소)
export default function SiteHeader({ walletAddress, onSignIn, onDisconnect }: Props) {
  const pill =
    "flex items-center justify-center rounded-full border border-accent bg-accent/12 leading-none font-semibold text-white transition-colors hover:bg-accent/22 h-[47px] text-lg max-sm:h-11 max-sm:text-[15px]";

  return (
    <header className="mx-auto flex h-[88px] w-full max-w-[1600px] items-center justify-between px-10 max-sm:px-5">
      <a href="/" className="flex items-center gap-3" aria-label="TINA Galxe Event">
        <span className="max-sm:hidden"><TinaLogo size={30} /></span>
        <span className="sm:hidden"><TinaLogo size={26} /></span>
        <span className="sr-only">TINA</span>
        <span className="text-[22px] leading-[1.2] font-semibold text-white max-sm:hidden">Galxe Event</span>
      </a>

      {walletAddress ? (
        <button
          type="button"
          onClick={onDisconnect}
          title="Disconnect wallet"
          className={`${pill} gap-2.5 pr-7 pl-2 max-sm:pr-[18px] max-sm:pl-[7px]`}
        >
          <span className="grid size-[30px] place-items-center rounded-full bg-wallet-symbol">
            <img src="/galxe/icon-wallet.svg" alt="" width={18} height={18} className="size-[18px]" />
          </span>
          {shortAddress(walletAddress)}
          <span className="sr-only">, disconnect</span>
        </button>
      ) : onSignIn ? (
        <button type="button" onClick={onSignIn} className={`${pill} px-7 max-sm:px-[18px]`}>
          Sign in
        </button>
      ) : null}
    </header>
  );
}
