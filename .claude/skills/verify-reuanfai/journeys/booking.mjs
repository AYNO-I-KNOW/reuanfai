// Mother books a queue slot from the appointments page, then sees it listed after a full reload.
export const viewport = {width: 390, height: 844};

const STORE = 'reuanfai-care-demo-v1';
const UNIT = 'ศูนย์บริการแพทย์แผนไทย (ตัวอย่าง)'; // units[0] in BookingForm.tsx
const SERVICE = 'นวดไทย';
const RIGHTS = 'บัตรทอง';
const DAY = 15;
const MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

export default async function ({page, step, assert, url}) {
  // Next month's 15th is always in the future; hour chosen so the slot is not fake-booked
  // ((hour + day + unitIdx) % 4 === 0 is "เต็มแล้ว"; unitIdx = 0 for UNIT).
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit'}).formatToParts(new Date());
  const year = Number(parts.find(p => p.type === 'year').value);
  const month0 = Number(parts.find(p => p.type === 'month').value) - 1;
  const target = new Date(Date.UTC(year, month0 + 1, DAY));
  const date = target.toISOString().slice(0, 10);
  const dayLabel = `${DAY} ${MONTHS[target.getUTCMonth()]} ${target.getUTCFullYear() + 543}`;
  const hour = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18].find(h => (h + DAY) % 4 !== 0);
  const time = `${String(hour).padStart(2, '0')}:00`;

  const readStore = () => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), STORE);

  // Enter like a user: home -> "นัดหมาย" tab -> "ทับหม้อเกลือ" card (the only "จองคิว" card in seed data).
  await step('open-home-and-appointments-tab', async () => {
    // Precondition: returning mother. proxy.ts redirects /ruenfai to onboarding until the rf_onboarded cookie exists
    // (set by markOnboarded() at the end of onboarding, which is covered by onboarding-screening, not this journey).
    await page.context().addCookies([{name: 'rf_onboarded', value: '1', url: url('/')}]);
    await page.goto(url('/ruenfai'));
    await page.getByRole('status', {name: 'กำลังเปิดเรือนไฟ'}).waitFor({state: 'detached', timeout: 20_000});
    await page.getByRole('navigation', {name: 'เมนูหลัก'}).getByRole('link', {name: 'นัดหมาย'}).click();
    await page.getByRole('heading', {name: 'นัดหมายทั้งหมด'}).waitFor();
    assert(!(await readStore())?.bookings?.length, 'baseline has no bookings');
  });

  await step('choose-booking-card', async () => {
    await page.getByRole('button', {name: 'จองคิว ทับหม้อเกลือ', exact: true}).click();
    await page.getByRole('heading', {name: 'จองคิวรับบริการ', level: 1}).waitFor();
  });

  // Pickers are a button (aria-label = title) opening a dialog of option buttons.
  await step('pick-unit-service-rights', async () => {
    await page.getByRole('button', {name: 'หน่วยบริการที่ต้องการจอง', exact: true}).click();
    await page.getByRole('dialog', {name: 'หน่วยบริการที่ต้องการจอง'}).getByRole('button', {name: UNIT}).click();
    await page.getByRole('checkbox', {name: SERVICE}).check();
    await page.getByRole('button', {name: 'สิทธิที่ใช้รับบริการ', exact: true}).click();
    await page.getByRole('dialog', {name: 'สิทธิที่ใช้รับบริการ'}).getByRole('button', {name: RIGHTS, exact: true}).click();
  });

  await step('pick-date-and-slot', async () => {
    await page.getByRole('button', {name: 'วันที่เข้ารับบริการ', exact: true}).click();
    const calendar = page.getByRole('dialog', {name: 'วันที่เข้ารับบริการ'});
    await calendar.getByRole('button', {name: 'เดือนถัดไป'}).click();
    await calendar.getByRole('button', {name: dayLabel, exact: true}).click();
    const slot = page.getByRole('button', {name: `${time} น.`, exact: true});
    await slot.click();
    assert((await slot.getAttribute('aria-pressed')) === 'true', `slot ${time} selected`);
  });

  await step('submit-and-confirm', async () => {
    await page.getByRole('button', {name: 'ยืนยันการจอง', exact: true}).click();
    const dialog = page.getByRole('dialog', {name: 'ยืนยันการจองคิว?'});
    await dialog.getByRole('button', {name: 'ยืนยัน', exact: true}).click();
    await page.getByRole('heading', {name: 'ยืนยันการจองสำเร็จ'}).waitFor();
  });

  await step('assert-storage-side-effect', async () => {
    const store = await readStore();
    assert(store?.bookings?.length === 1, `exactly 1 booking stored, got ${store?.bookings?.length}`);
    const b = store.bookings[0];
    assert(b.unit === UNIT && b.date === date && b.time === time && b.rights === RIGHTS && b.services.join() === SERVICE, `booking fields match: ${JSON.stringify(b)}`);
    const a = store.appointments.find(x => x.id === b.id);
    assert(a && a.status === 'รอยืนยันนัด', 'matching appointment record with status รอยืนยันนัด');
  });

  await step('second-view-appointments-after-reload', async () => {
    await page.goto(url('/ruenfai/appointments'));
    const day = await page.evaluate(date => new Date(`${date}T12:00:00+07:00`).toLocaleDateString('th-TH', {timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short'}), date);
    // Bookings fold into their service card (appointments/page.tsx resolve()); pending cards show date/time, not the unit.
    const card = page.getByRole('article').filter({has: page.getByRole('heading', {name: 'นวดแผนไทย', level: 2})});
    await card.getByText(`ขอนัดวันที่ ${day} เวลา ${time} น.`).waitFor();
    assert((await card.innerText()).includes('รอยืนยันนัด'), 'card shows status รอยืนยันนัด');
  });
}
