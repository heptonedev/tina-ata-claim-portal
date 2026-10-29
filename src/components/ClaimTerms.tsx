import { useId, useState } from "react";
import { CONTACT_EMAIL, PAYOUT_START } from "@/lib/config";

const TERMS = [
  "All TINA claims must be completed by November 20, 2026, at 23:59 UTC.",
  "Any Loyalty Points not claimed by the deadline will automatically expire and cannot be recovered.",
  `Successfully claimed and verified TINA rewards will be distributed in batches to the designated wallet addresses starting ${PAYOUT_START}.`,
  "Each Galxe account can claim only once.",
  "All claims are subject to final verification. Fraudulent activities, duplicate claims, wallet abuse, or other irregular participation may result in disqualification.",
  "Signing in with Galxe is used only to verify your Loyalty Points in the TINA campaigns. We will not modify your account or perform any actions on your behalf.",
  "Wallet signatures are used solely to verify wallet ownership and authenticate claim requests. The official claim process does not require token transfer approvals or access to users’ assets.",
  "Participants are responsible for connecting the correct wallet and providing accurate information. The TINA team is not responsible for any losses resulting from incorrect wallet information or user errors.",
  "Participants are responsible for any applicable blockchain network fees.",
  "Submitting a claim does not guarantee reward distribution. Rewards will only be distributed after all eligibility requirements have been met and verification procedures have been completed.",
  "The event organizer reserves the right to modify or terminate the event early without prior notice.",
] as const;

// 약관: 접고 펼치는 제목(Accordion Header) + 번호 목록 카드. 처음엔 펼친 상태.
export default function ClaimTerms() {
  const [open, setOpen] = useState(true);
  const panelId = useId();

  return (
    <section className="flex justify-center bg-terms px-10 py-36 max-lg:px-8 max-lg:py-[120px] max-sm:px-5 max-sm:py-24">
      <div className="flex w-full max-w-[1200px] flex-col gap-8">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex items-center justify-between text-left"
        >
          <span className="flex flex-1 items-center gap-3">
            <img src="/galxe/icon-pin.svg" alt="" width={28} height={28} className="size-7 shrink-0" />
            <span className="text-[30px] leading-[1.15] font-bold tracking-[-0.7px] text-white max-lg:text-[28px] max-lg:tracking-[-0.66px] max-sm:text-[26px] max-sm:tracking-[-0.6px]">
              Galxe Loyalty Points Airdrop Terms &amp; Conditions
            </span>
          </span>
          <span className="grid size-11 shrink-0 place-items-center rounded-full border border-white/10 bg-white/3">
            <img src="/galxe/icon-chevron.svg" alt="" width={18} height={18} className={`size-[18px] ${open ? "" : "rotate-180"}`} />
          </span>
        </button>

        {open && (
          <div id={panelId} className="rounded-2xl border border-white/5 bg-white/3 p-10 max-lg:p-8">
            <ol className="flex max-w-[880px] flex-col gap-4 text-base leading-[1.625]">
              {[...TERMS, null].map((text, i) => (
                <li key={i} className="flex items-start">
                  <span className="w-9 shrink-0 font-semibold tracking-[-0.32px] text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1 tracking-[0.09px] text-white/75 max-sm:text-[15px] max-sm:tracking-[0.144px]">
                    {text ?? (
                      <>
                        For event-related inquiries, please contact{" "}
                        <a href={`mailto:${CONTACT_EMAIL}`} className="text-accent hover:underline">{CONTACT_EMAIL}</a>.
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}
