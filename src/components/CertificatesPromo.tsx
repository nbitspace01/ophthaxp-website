import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { certificateName } from "@/components/CertificatePlate";

export function CertificatesPromo() {
  const user = getSessionUser();
  const recipientName = certificateName(user?.firstName, user?.lastName);

  return (
    <section
      aria-labelledby="certificates-title"
      className="mx-auto max-w-[1600px] py-10 sm:py-14"
    >
      <div className="overflow-hidden rounded-[20px] bg-[#DED0BB] lg:grid lg:grid-cols-[42%_58%] lg:items-center lg:min-h-[440px]">
        {/* Left — text */}
        <div className="px-8 py-12 sm:px-16 sm:py-14 lg:px-24 lg:py-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#B05A3A]">
            The Recognition
          </p>
          <h2
            id="certificates-title"
            className="mt-3 text-[clamp(2rem,4vw,3rem)] font-bold leading-tight tracking-tight text-[#1A1410]"
          >
            Among the{" "}
            <em
              className="font-normal not-italic"
              style={{ fontFamily: "var(--font-playfair), serif", fontStyle: "italic" }}
            >
              Few
            </em>
          </h2>
          <p className="mt-4 text-[17px] leading-[1.8] text-[#4A3F35]">
            Take your place among a select group of ophthalmologists from around
            the world and carry the depth of judgement and clinical standards of
            a Legend into your own practice.
          </p>
          <Link
            href="/programmes"
            className="mt-7 inline-block rounded-full bg-[#B05A3A] px-6 py-3 text-[14px] font-semibold text-white hover:opacity-90"
          >
            Explore Programmes
          </Link>
        </div>

        {/* Right — dark certificate card */}
        <div className="grid place-items-center px-8 pb-12 sm:px-16 sm:pb-14 lg:px-16 lg:py-16">
          <div
            className="cert-float relative w-full max-w-[460px]"
            style={{ filter: "none" }}
          >
            {/* Shadow card behind */}
            <div
              className="absolute inset-0 rounded-[16px] bg-black"
              style={{ transform: "translate(14px, 14px)", opacity: 1 }}
            />
            {/* Main dark card */}
            <div
              className="relative rounded-[16px] bg-[#1A1716] px-10 py-10 text-center"
              style={{ border: "1.5px solid #8B4433" }}
            >
              <div
                className="pointer-events-none absolute inset-[10px] rounded-[10px]"
                style={{ border: "1px solid #8B4433", opacity: 0.45 }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/lom-icon-loading.svg" alt="Legends of Medicine" className="mx-auto mb-4 h-7 w-auto" />
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white">
                Legends of Medicine
              </p>
              <p className="mt-6 text-[1.05rem] font-bold uppercase tracking-[0.08em] text-white sm:text-[1.25rem]">
                {recipientName}
              </p>
              <p className="mt-2 text-[11px] leading-[1.6] text-white/60">
                Specialty Development Programme
              </p>
              <p className="mt-6 text-[1.35rem] leading-none text-[#C97B50]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" }}
              >
                Legends of Medicine
              </p>
              <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.26em] text-white/30">
                Cohort 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
