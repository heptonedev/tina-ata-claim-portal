import TinaLogo from "@/components/TinaLogo";
import { CONTACT_EMAIL } from "@/lib/config";

export default function SiteFooter() {
  return (
    <footer className="flex justify-center border-t border-white/5 bg-page px-10 py-16 max-lg:px-8 max-lg:py-14 max-sm:px-5">
      <div className="flex w-full max-w-[1200px] items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
        <TinaLogo size={24} />
        <div className="flex flex-col items-end gap-1 text-sm leading-[1.5] tracking-[0.2px] text-footer-muted max-sm:items-start">
          <p>© 2026 TINA. All rights reserved.</p>
          <p>
            Contact: <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white">{CONTACT_EMAIL}</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
