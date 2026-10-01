"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FaqGrid, type FaqItem } from "@/components/FaqGrid";

const FAQS: FaqItem[] = [
  // Category 01: Is This Right for Me? (5)
  {
    tag: "Is This Right for Me?",
    q: "I already have years of experience in this sub-specialty. Will the programme still challenge me?",
    a: "Yes. The programme is built to pursue breakthroughs in judgement and practice - not merely to transfer knowledge. Its curriculum works through the decisions, exceptions and patterns that emerge only after years in practice. The Dialogue with the Legend establishes whether the programme can genuinely take your work further. If it cannot, we will say so.",
  },
  {
    tag: "Is This Right for Me?",
    q: "I am interested in a sub-specialty but do not yet practise it extensively. Can I still apply?",
    a: "Yes - if the programme’s starting point matches yours. Each programme sets out the clinical foundation and prior experience it expects. The Dialogue with the Legend allows you to understand whether you are ready to enter now or whether another starting point would serve you better.",
  },
  {
    tag: "Is This Right for Me?",
    q: "How do I decide which programme - and which Legend - is right for me?",
    a: "Begin with what you want to see, decide or build differently in your work. If more than one programme or Legend appears right, use Visualise Your Future, Caseroom and LoMa to clarify your direction, test your judgement and narrow the choice. If it is still unclear, our concierge will guide you by asking the right questions.",
  },
  {
    tag: "Is This Right for Me?",
    q: "I practise in a smaller city or town. Will the programme work in my setting?",
    a: "Yes. Your patients, referral environment, available resources and geography become part of the work you bring into the programme. The aim is not to reproduce the Legend’s institution, but to build a standard of care that can work within your setting.",
  },
  {
    tag: "Is This Right for Me?",
    q: "My clinic does not have all the equipment. Can I still participate?",
    a: "A complete setup is not assumed. The programme helps you distinguish what needs to be available within your practice, what can be accessed through referral or partnership, and what should wait until the clinical need justifies it. Any non-negotiable equipment requirements will be made clear before admission.",
  },

  // Category 02: Can I Make It Work? (3)
  {
    tag: "Can I Make It Work?",
    q: "How much time should I set aside for the programme each month?",
    a: "The commitment varies by programme and module, and will be stated clearly before admission. It includes live engagements, preparation and work carried into your own practice - so not all of it sits outside your clinical day. The programme is designed to run alongside practice, but it does require continuity.",
  },
  {
    tag: "Can I Make It Work?",
    q: "How many in-person engagements are required, and where will they take place?",
    a: "The number, duration and location of in-person engagements vary by programme. Every requirement involving travel will be stated on the programme page and reconfirmed before admission, allowing you to assess its feasibility before committing.",
  },
  {
    tag: "Can I Make It Work?",
    q: "What happens if an unexpected clinical commitment causes me to miss a live engagement?",
    a: "The programme calendar is communicated well in advance, allowing you to plan around each engagement. If an unexpected clinical commitment causes you to miss one, the platform will help you recover what was covered and regain continuity. Even so, we recommend protecting the scheduled time wherever possible: the exchange with the Legend, the cohort dynamic and the continuity of the journey are difficult to replicate.",
  },

  // Category 03: What Will the Programme Be Like? (5)
  {
    tag: "What Will the Programme Be Like?",
    q: "What does a typical month in the programme look like?",
    a: "Each month moves through a deliberate cycle: engage live with the Legend, take that thinking back to your practice, act on it, and return with the cases, decisions and outcomes that followed. The precise mix of online and in-person work varies by programme and module, but the movement between the Legend and your practice remains constant.",
  },
  {
    tag: "What Will the Programme Be Like?",
    q: "Will the Legend know my work and engage with my cases personally?",
    a: "Yes. Cohorts are limited to three to five doctors so the Legend can come to know how you see, reason and decide - not merely recognise your name. This happens through the programme’s scheduled engagements, case discussions and reviews.",
  },
  {
    tag: "What Will the Programme Be Like?",
    q: "Can I bring decisions and complications from my own patients into the programme?",
    a: "Yes. You can bring relevant cases, decisions, outcomes and complications from your practice into the programme. They become the material through which you examine what you noticed, why you chose a particular path and what else may have been possible. All cases must be shared in accordance with the programme’s patient-confidentiality requirements.",
  },
  {
    tag: "What Will the Programme Be Like?",
    q: "How will my judgement and progress be reviewed?",
    a: "Your progress is reviewed through the work itself: the cases you interpret, the decisions you make, how you explain them, what you apply in practice and what changes when you return. Caseroom, programme assignments and the Legend’s reviews make that development visible over time.",
  },
  {
    tag: "What Will the Programme Be Like?",
    q: "How will patient information be protected when I share cases?",
    a: "Patient confidentiality is non-negotiable. All case sharing and patient-data handling comply with applicable law and professional confidentiality standards. Patient-identifiable information is removed before a case enters the programme, access is restricted to authorised participants, and clear requirements covering consent, submission, storage, use and retention are provided in advance.",
  },

  // Category 04: How Do I Enter? (3)
  {
    tag: "How Do I Enter?",
    q: "What happens after I submit my application?",
    a: "The programme team reviews your clinical background and what draws you to the programme. You then attend the Dialogue at the time you selected, where you can discuss your goals directly with the Legend, understand the programme’s expectations and see whether it is right for you. The outcome and next steps are communicated after the Dialogue.",
  },
  {
    tag: "How Do I Enter?",
    q: "Does every applicant receive a place in the cohort?",
    a: "No. Each cohort is limited to three to five doctors. A place is offered only when the Dialogue establishes that the programme matches your present work, what you hope to develop and the commitment the journey requires. This protects the depth of engagement promised to every member of the cohort.",
  },
  {
    tag: "How Do I Enter?",
    q: "What happens if I am not selected? Can I apply again or consider another programme?",
    a: "Not being selected for one cohort does not close the door to LoM. You will receive a clear outcome and guidance on what may be more appropriate - a later cohort, another programme or further preparation before you return. You may apply again when the fit is stronger.",
  },

  // Category 05: Programme Fee & Payment (5)
  {
    tag: "Programme Fee & Payment",
    q: "What does the programme cost, and what does the fee cover?",
    a: "The fee varies by programme and is stated on the respective programme page. It covers the complete curriculum, all scheduled online and in-person engagements with the Legend, programme reviews and assessments, and access to LoM’s curated tools throughout the journey. Any programme-specific exclusions will be made clear before you apply.",
  },
  {
    tag: "Programme Fee & Payment",
    q: "Is there a separate charge for the Dialogue with the Legend?",
    a: "Yes. A separate fee applies to the Dialogue with the Legend. If you are offered a place and join the programme, the full amount paid for the Dialogue will be adjusted against the programme fee.",
  },
  {
    tag: "Programme Fee & Payment",
    q: "Can the programme fee be paid in instalments?",
    a: "Yes. Payment is structured by module, allowing you to pay as the programme progresses. A discount applies when the complete programme fee is paid upfront. At checkout, you may also access any card-based offers available through our payment partners, subject to the card issuer’s terms.",
  },
  {
    tag: "Programme Fee & Payment",
    q: "Are there costs beyond the programme fee?",
    a: "Travel and accommodation for in-person engagements are not included in the programme fee.",
  },
  {
    tag: "Programme Fee & Payment",
    q: "What happens if I need to defer or withdraw after joining?",
    a: "Deferral, withdrawal and refund eligibility depend on when the request is made and are governed by the terms shared before payment. Because every place is reserved within a cohort of three to five doctors, these requests are considered in relation to both your journey and the continuity of the cohort.",
  },

  // Category 06: What Changes Afterwards? (4)
  {
    tag: "What Changes Afterwards?",
    q: "What should I be able to do differently by the end of the programme?",
    a: "By the end, the change should be visible in your work: what you notice, how you decide, what you can perform reliably and how your practice supports that standard. The specific outcomes are defined in each programme’s curriculum and reviewed against the evidence you build throughout the journey.",
  },
  {
    tag: "What Changes Afterwards?",
    q: "Will I be ready to manage this area of care independently?",
    a: "The programme is designed to move you towards greater independence - not declare it by default. In the final stage, the Legend reviews how your judgement, clinical skills and practice systems work together. What you are ready to manage independently, and what should still be referred, will depend on your starting point and the progress you demonstrate.",
  },
  {
    tag: "What Changes Afterwards?",
    q: "What access continues after the cohort concludes?",
    a: "Your LoM account and the record of your progress remain with you. Continued access to LoMa, Caseroom, programme materials and other programme resources will be stated on the respective programme page and confirmed before admission.",
  },
  {
    tag: "What Changes Afterwards?",
    q: "Does my connection with the Legend and cohort continue after the programme?",
    a: "The formal journey with the Legend has a defined conclusion, but the relationships built through it need not end there. Opportunities to remain connected through the cohort and the wider LoM community will continue, although the programme does not promise unrestricted access to the Legend.",
  },
];

const CONTACT_PROMPT: FaqItem = {
  tag: "Support",
  q: "Still have questions?",
  a: "Contact our support team and we will make sure everything is clear and intuitive for you!",
  cta: { label: "Contact Support", href: "/contact" },
  isPrompt: true,
};

const TABS_ROW1 = [
  "All",
  "Is This Right for Me?",
  "Can I Make It Work?",
  "What Will the Programme Be Like?",
  "How Do I Enter?",
];

const TABS_ROW2 = [
  "Programme Fee & Payment",
  "What Changes Afterwards?",
];

const TABS = [...TABS_ROW1, ...TABS_ROW2];

export function FaqSection() {
  const [tab, setTab] = useState(TABS[0]);

  const shown =
    tab === "All" ? FAQS : FAQS.filter((f) => f.tag === tab);

  const countFor = (t: string) =>
    t === "All" ? FAQS.length : FAQS.filter((f) => f.tag === t).length;

  return (
    <section
      aria-labelledby="faq-title"
      className="mx-auto max-w-[1440px] px-5 py-12 sm:px-10 sm:py-14 lg:px-14"
    >
      <h2
        id="faq-title"
        className="text-center text-[clamp(1.75rem,3.1vw,2.6rem)] font-extrabold leading-tight tracking-[-0.015em] text-white"
      >
        Frequently asked questions
      </h2>

      <p className="mx-auto mt-4 max-w-[560px] text-center text-[15px] leading-relaxed text-white/50">
        Pick a question to see its answer.
      </p>

      <div
        role="tablist"
        aria-label="FAQ categories"
        className="mt-8 flex flex-col items-center gap-2 sm:gap-3"
      >
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {TABS_ROW1.map((t) => {
            const selected = t === tab;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-[10px] px-4 py-2.5 text-[13px] transition sm:px-6 sm:py-3 sm:text-[15px]",
                  selected
                    ? "bg-accent font-medium text-white"
                    : "bg-ink-800 text-white/60 hover:bg-ink-700 hover:text-white",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {TABS_ROW2.map((t) => {
            const selected = t === tab;
            return (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setTab(t)}
                className={cn(
                  "rounded-[10px] px-4 py-2.5 text-[13px] transition sm:px-6 sm:py-3 sm:text-[15px]",
                  selected
                    ? "bg-accent font-medium text-white"
                    : "bg-ink-800 text-white/60 hover:bg-ink-700 hover:text-white",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-10 sm:mt-12">
        <FaqGrid
          key={tab}
          items={[...shown, CONTACT_PROMPT]}
          label="Legends of Medicine"
        />
      </div>
    </section>
  );
}
