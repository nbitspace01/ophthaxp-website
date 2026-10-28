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
      <div className="rounded-[20px] bg-[#DED0BB] py-12 sm:py-14 lg:flex lg:items-center lg:gap-0 lg:pl-16 lg:pr-12">
        {/* Left — text */}
        <div className="px-8 sm:px-0 lg:w-[42%]">
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
            href="/programs"
            className="mt-7 inline-block rounded-full bg-[#B05A3A] px-6 py-3 text-[14px] font-semibold text-white hover:opacity-90"
          >
            Explore Programmes
          </Link>
        </div>

        {/* Right — dark certificate card */}
        <div className="mt-10 flex justify-center px-8 sm:px-0 lg:mt-0 lg:w-[58%] lg:justify-end">
          <div
            className="cert-float relative w-[340px] sm:w-[500px]"
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
              style={{ border: "1.5px solid #FF6B2B" }}
            >
              <div
                className="pointer-events-none absolute inset-[10px] rounded-[10px]"
                style={{ border: "1px solid #FF6B2B", opacity: 0.4 }}
              />
              <div className="mb-5 flex justify-center gap-[7px]">
                <div className="h-[24px] w-[3.5px] rounded-full bg-[#C97B50]" />
                <div className="h-[24px] w-[3.5px] rounded-full bg-[#C97B50]" />
              </div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[#C97B50]">
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
