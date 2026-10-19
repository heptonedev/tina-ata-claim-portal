import type { CampaignInfo, GalxeSession } from "@/lib/api";
import { TINA_MINT } from "@/lib/config";
import { formatDeadline, shortAddress } from "@/lib/format";

// 오른쪽 패널: 대상 Galxe 캠페인과 (로그인 후) 캠페인별 포인트를 보여준다.
type Props = { session: GalxeSession | null; campaigns: CampaignInfo[]; closesAt: string | null };

export default function AccountPanel({ session, campaigns, closesAt }: Props) {
  const rows = session?.campaigns ?? campaigns;
  const total = session?.campaigns.reduce((sum, c) => sum + c.points, 0) ?? 0;

  return (
    <aside className="rounded-2xl border border-contour bg-panel/80 p-6 backdrop-blur-sm sm:p-7">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {session ? "Your Galxe points" : "Galxe campaigns"}
        </h2>
        {session && <span className="shrink-0 text-sm text-muted">ID {session.galxeId}</span>}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {session
          ? "Points in either campaign make you eligible."
          : "Accounts that earned points in either campaign can claim. One claim per Galxe account."}
      </p>

      {rows.length > 0 && (
        <ul className="mt-4 divide-y divide-contour">
          {rows.map((c, i) => {
            const points = "points" in c ? (c as { points: number }).points : null;
            return (
              <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate">{c.name ?? `Campaign ${i + 1}`}</p>
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-tina-soft underline decoration-contour-strong underline-offset-4 hover:decoration-tina-soft"
                    >
                      Open on Galxe
                    </a>
                  )}
                </div>
                {points !== null && (
                  <span className={`font-display text-xl font-semibold ${points > 0 ? "text-paper" : "text-muted"}`}>
                    {points.toLocaleString()}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {session && (
        <p className={`mt-4 flex items-center gap-2 text-sm font-medium ${session.eligible ? "text-reach" : "text-muted"}`}>
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${session.eligible ? "bg-reach" : "bg-contour-strong"}`} />
          {session.eligible ? `Eligible with ${total.toLocaleString()} points` : "No points in either campaign yet"}
        </p>
      )}

      <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-contour pt-5 text-sm">
        <dt className="text-muted">Reward</dt>
        <dd className="text-right">TINA on Solana</dd>
        {closesAt && (
          <>
            <dt className="text-muted">Claims close</dt>
            <dd className="text-right">{formatDeadline(closesAt)}</dd>
          </>
        )}
        <dt className="text-muted">Contract</dt>
        <dd className="text-right">
          <a
            href={`https://solscan.io/token/${TINA_MINT}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-contour-strong underline-offset-4 hover:decoration-tina-soft"
          >
            {shortAddress(TINA_MINT)}
          </a>
        </dd>
      </dl>
    </aside>
  );
}
