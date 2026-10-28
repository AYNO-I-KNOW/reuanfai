# Service information sheets and contextual chat — 28 October 2026

## Final UX decisions

- Appointments remains exactly six service cards. Each card is an article with independent controls, never nested buttons.
- Artwork/title opens that service's information sheet for every stage, including unavailable. Reading never changes eligibility or booking state.
- The entire lower action row is clickable for Book/Pay/Review, independent from the information trigger; passive status rows have no click behavior. Confirmed appointment date text retains a separate appointment-detail action.
- Sheet body: existing original service illustration; plain-language overview; what happens at the clinic; readiness/information to disclose; during/aftercare where relevant; five FAQ; source links and general-information boundary. Do not download external clinical photos or reuse third-party illustrations.
- Pinned footer: full-width 52px solid-purple primary action using existing doseConfirm/foundation style for จองคิว/ชำระเงิน/รีวิว, with Chevron. Other stages are non-button tinted52px status panels with no Chevron/press/focus effect. Keep stage colors from the approved appointment model.
- An accessible chat launcher and rotating service-specific question bubble appear INSIDE the native dialog top layer, above the footer at the lower right. The page's background chat button is not used through a modal backdrop. Content reserves112px trailing space so the final source links can be scrolled clear of the assistant.
- Shared SheetResize now accepts a marked `[data-sheet-scroll-body]` rather than assuming the last child is always the scroller; `[data-sheet-footer]` avoids forcing a fixed footer to flex-grow. Existing sheets continue with the previous last-child fallback.
- Service FAQ disclosure uses native details/summary; height animation is progressive enhancement where interpolate-size is supported; reduced-motion disables the transition.

## Service context in chat

- A shared allow-listed service-info catalog supplies both sheet content and the five chat questions per service. No arbitrary URL text is rendered as HTML.
- Sheet → `/ruenfai/chat?from=%2Fruenfai%2Fappointments&service=salt-pot` (example). Optional `question` prefills a draft without automatically sending. Explicit chat suggestion chips retain the existing tap-to-send behavior.
- Chat greeting identifies the current service; its chips match the sheet's FAQ. Back returns to `/ruenfai/appointments?service=salt-pot` and reopens the same information sheet. Unknown service ids fall back to ordinary chat topics, not an error.
- Clicking a FAQ suggestion returns its curated catalog answer through the existing minimum-thinking animation; free text uses a service-aware fallback. **Still a local demo, not a connected LLM or personalized clinical advice.** No patient details are sent to an external service.
- Catalog changes must update sheet text and FAQ together. Actual appointment stage/availability stays separate from educational content.

## Research and editorial scope

Sources checked 28 October 2026:

1. [PSU Thai Traditional Medicine: salt-pot compress](https://www.ttmed.psu.ac.th/th/blog/15) — what the equipment/procedure is. Older source (2010); do not adopt its burning-fat claim or schedule as an app rule.
2. [PSU Thai Traditional Medicine: postpartum herbal compress](https://www.ttmed.psu.ac.th/th/blog/51) — description and heat/skin cautions.
3. [Golden Jubilee Medical Center, Mahidol: postpartum care](https://www.gj.mahidol.ac.th/main/afterbirth/) — explanation of massage/compress/salt-pot/steam; suitability depends on delivery/wound recovery. No fixed universal start date, treatment duration, price, weight-loss or guaranteed recovery claim added.
4. [Postpartum CPG, 6 February 2013, hosted by Boromarajonani College of Nursing](https://bcnb.ac.th/bcnb/uploads/documents/wg4/20190306_104820_118_3760.pdf) — history/exam, herb allergy, heat and relevant conditions; an older reference, not a replacement for current clinician review or production rules.
5. [Siriraj: breast engorgement massage/compress review](https://www.si.mahidol.ac.th/th/department/thaimed/admin/journal_files/16_29_5hWWGq.pdf) — explains service and need for medical examination when a lump is painful/red/hot with fever. Does not justify deep self-massage or a guaranteed milk-supply increase.
6. [Faktha Hospital service catalog](https://fakthahospital.moph.go.th/index.php/th/?id=35&view=category) and [PSU southern-local-knowledge archive](https://clib.psu.ac.th/southerninfo/content/1/701dbb3f) — identify ก้อนเส้า/นาบอิฐ as a traditional/local term. Not interchangeable with spa hot-stone massage; no universal clinical ban inferred. Existing app fixture remains unavailable, and content cannot override that fixture.

The staged educational text is a conservative synthesis for the prototype, **pending clinical editorial approval before production**. No numeric clinical thresholds, new eligibility rules, prescriptions, promises of postpartum weight loss or DIY hot-object instructions added. It is information to help ask the provider; actual dates/reasons must come from the individual's assessment. Source dates and applicability need periodic review by the responsible team.

## Implementation

- `ruenfai/services/service-info.ts`: six articles /30 FAQ and sources, shared by sheet/chat.
- `ruenfai/services/ServiceInfoSheet.tsx`, `service-info.module.css`: modal, reading layout, pinned footer, contextual assistant.
- `ruenfai/appointments/page.tsx`, `page.module.css`: separated info and action rows.
- `ruenfai/ChatInvitation.tsx`: optional question list/callback while preserving ordinary invitations.
- `ruenfai/chat/page.tsx`: allow-listed context, greeting, suggestions, local answers and return route.
- `ruenfai/SheetResize.tsx`, `sheet-resize.module.css`: explicit scroller/pinned-footer compatibility.

## QA

- Browser390×844: opened all six service sheets; each had correct title/art, five FAQ, six underlying cards; all images decoded and no document horizontal overflow.
- Existing user bookings were left unchanged. Default pending/assessment/unavailable footer panels contained no buttons. Development previews verified all eight stages: solid action buttons only for Book/Pay/Review; correct yellow/green/purple/gray passive fills and no Chevron.
- Action measured350×52px within390px viewport with20px gutters; full-width purple #6549F7. Book/Pay/Review footers reached their existing destinations with the correct booking/service parameters, without submitting. Card action row measured150.5×44px inside a174.5px padded card and contained no nested button.
- Salt-pot sheet → chat displayed five salt-pot topics, selected FAQ returned the matching answer through the existing thinking delay; Back reopened salt-pot sheet.
- No real bookings/payments, telephone/GPS, external messages or clinical assessment performed. Touch keyboard/physical-device acceptance and live AI integration remain separate.

## Final reading-sheet behavior
- Opens at the existing 86dvh partial height with rounded upper corners.
- Scrolling into the content expands to the full available viewport with square corners and zero exposed top backdrop. The service sheet opts out of the shared 8px inset.
- Returning to the content top and pulling down collapses to the initial height. Height and corner transitions run together.
- One persistent floating assistant stays above the sheet; its suggested questions follow the selected service.
- Source links and the source-information block are hidden from the product UI; research references remain in this handoff and the content catalog.

## Journal date boundaries
- Only render calendar months from the current month back through the account registration month, inclusive. Hide the older-month action at that boundary.
- Enable daily writing only from the delivery date through today (Bangkok date), inclusive; enforce the same rule for date deep links.
- Missing delivery date keeps writing disabled until the profile is completed. Existing records are retained.
- Prototype stores joinedDate locally on the first onboarding profile submission. Legacy demo users without a registration date receive their first visit date; this is a migration fallback, not a recovered historical signup date. Production must supply the account's actual createdAt date.
