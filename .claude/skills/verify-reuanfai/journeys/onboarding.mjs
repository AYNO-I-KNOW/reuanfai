// New mother: gated to onboarding, sees validation on empty/wrong input, finishes all 4 stages, then "กลับสู่หน้าแรก" reaches home.
// Run against a production build too (`next build && next start`): the home bounce only reproduced with production prefetching.
export const viewport = {width: 390, height: 844};

const PROFILE = 'reuanfai-mother-profile-v1';
const PHONE_FORMAT = 'เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9–10 หลัก';
const STAGE1_ERRORS = ['กรุณากรอกชื่อเล่นคุณแม่', 'กรุณาเลือกวันคลอด', 'กรุณากรอกเบอร์ติดต่อคุณแม่', 'กรุณากรอกเบอร์ติดต่อฉุกเฉิน', 'กรุณาเลือกวิธีคลอด', 'กรุณาเลือกโรคประจำตัว หรือเลือก “ไม่มี”', 'กรุณาตอบประวัติแพ้สมุนไพร', 'กรุณาตอบประวัติครรภ์เป็นพิษ'];

export default async function ({page, step, assert, url}) {
  const main = () => page.locator('main:not([hidden])').last();
  const submit = () => page.locator('footer button[type=submit]:visible');
  const visible = text => main().getByText(text, {exact: true}).isVisible();
  const focusedLabel = () => page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.closest('label')?.textContent?.trim() || document.activeElement?.tagName);

  await step('gate-redirects-to-onboarding', async () => {
    await page.goto(url('/ruenfai'));
    await page.getByRole('heading', {name: 'เริ่มต้นใช้งานเรือนไฟ'}).waitFor();
    assert(new URL(page.url()).pathname === '/ruenfai/onboarding', `redirected to onboarding, got ${page.url()}`);
    await page.getByRole('checkbox', {name: /ยินยอมให้ใช้ข้อมูลเพื่อรับบริการ/}).check();
    await page.getByRole('button', {name: 'ยอมรับและดำเนินการต่อ'}).click();
    await page.getByRole('progressbar', {name: 'ช่วงที่ 1 จาก 4'}).waitFor();
  });

  await step('stage1-empty-submit-shows-every-error', async () => {
    assert(await submit().isEnabled(), 'ถัดไป stays tappable so the mother can learn what is missing');
    await submit().click();
    for (const text of STAGE1_ERRORS) assert(await visible(text), `error shown: ${text}`);
    await page.waitForTimeout(400);
    assert((await focusedLabel()).startsWith('ชื่อเล่นคุณแม่'), `first invalid field focused, got ${await focusedLabel()}`);
    const nickname = page.getByRole('textbox', {name: 'ชื่อเล่นคุณแม่'});
    assert((await nickname.getAttribute('aria-invalid')) === 'true', 'nickname aria-invalid');
    assert(await page.getByRole('progressbar', {name: 'ช่วงที่ 1 จาก 4'}).isVisible(), 'still on stage 1');
  });

  await step('stage1-wrong-phone-flagged', async () => {
    const phone = page.getByRole('textbox', {name: 'เบอร์ติดต่อคุณแม่'});
    await phone.fill('0812');
    await phone.blur();
    assert(await visible(PHONE_FORMAT), 'short number flagged');
    await phone.fill('1812345678');
    assert(await visible(PHONE_FORMAT), 'number without leading 0 flagged');
    await phone.fill('0812345678');
    assert((await phone.getAttribute('aria-invalid')) === 'false', 'valid number clears the error');
  });

  await step('stage1-allergy-yes-needs-herb', async () => {
    await page.getByRole('textbox', {name: 'ชื่อเล่นคุณแม่'}).fill('แม่ทดสอบ');
    await page.getByRole('button', {name: 'วันคลอด'}).click();
    await page.getByRole('dialog', {name: 'วันคลอด'}).getByRole('button', {name: /^20 /}).click();
    await page.getByRole('dialog', {name: 'วันคลอด'}).waitFor({state: 'hidden'});
    await page.getByRole('textbox', {name: 'เบอร์ติดต่อฉุกเฉิน'}).fill('0898765432');
    await page.getByRole('button', {name: 'วิธีคลอด'}).click();
    await page.getByRole('dialog', {name: 'วิธีคลอด'}).getByRole('button', {name: 'คลอดปกติ'}).click();
    await page.getByRole('dialog', {name: 'วิธีคลอด'}).waitFor({state: 'hidden'});
    await page.getByRole('group', {name: /โรคประจำตัว/}).getByRole('checkbox', {name: 'ไม่มี'}).check();
    await page.getByRole('group', {name: 'ประวัติแพ้สมุนไพร'}).getByRole('radio', {name: 'มี', exact: true}).check();
    await page.getByRole('group', {name: 'ประวัติครรภ์เป็นพิษ'}).getByRole('radio', {name: 'ไม่มี'}).check();
    for (const text of STAGE1_ERRORS) assert(!(await visible(text)), `fixed field no longer flagged: ${text}`);
    await submit().click();
    assert(await visible('กรุณาระบุสมุนไพรที่แพ้อย่างน้อย 1 รายการ'), 'herb name required when allergy = มี');
    await page.waitForTimeout(400);
    assert((await focusedLabel()) === 'สมุนไพรที่แพ้รายการที่ 1', `herb input focused, got ${await focusedLabel()}`);
    await page.getByRole('textbox', {name: 'สมุนไพรที่แพ้รายการที่ 1'}).fill('ไพล');
    await submit().click();
    await page.getByRole('progressbar', {name: 'ช่วงที่ 2 จาก 4'}).waitFor();
    const profile = await page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), PROFILE);
    assert(profile?.phone === '0812345678' && profile?.emergencyPhone === '0898765432' && profile?.birth === 'คลอดปกติ', `profile stored: ${JSON.stringify(profile)}`);
  });

  for (const stage of [2, 3, 4]) {
    await step(`stage${stage}-empty-submit-then-answer`, async () => {
      await page.getByRole('progressbar', {name: `ช่วงที่ ${stage} จาก 4`}).waitFor();
      const groups = main().getByRole('group');
      const count = await groups.count();
      await submit().click();
      assert((await main().getByText('กรุณาตอบข้อนี้', {exact: true}).count()) === count, `${count} unanswered questions flagged`);
      assert(await page.getByRole('progressbar', {name: `ช่วงที่ ${stage} จาก 4`}).isVisible(), `still on stage ${stage}`);
      for (let i = 0; i < count; i++) await groups.nth(i).getByRole('radio', {name: 'ไม่มี'}).check();
      assert((await main().getByText('กรุณาตอบข้อนี้', {exact: true}).count()) === 0, 'answered questions clear');
      await submit().click();
    });
  }

  await step('results-mark-onboarded', async () => {
    await page.getByRole('heading', {name: 'ผลการประเมิน'}).waitFor({timeout: 15_000});
    const cookie = (await page.context().cookies()).find(c => c.name === 'rf_onboarded');
    assert(cookie?.value === '1', 'rf_onboarded cookie set');
  });

  await step('back-home-stays-home', async () => {
    await page.getByRole('link', {name: 'กลับสู่หน้าแรก'}).click();
    await page.getByRole('navigation', {name: 'เมนูหลัก'}).waitFor();
    await page.waitForTimeout(2000); // a bounce back to onboarding would land within this window
    assert(new URL(page.url()).pathname === '/ruenfai', `home after results, got ${page.url()}`);
    assert(!(await page.getByRole('heading', {name: 'เริ่มต้นใช้งานเรือนไฟ'}).isVisible()), 'onboarding not shown');
  });

  await step('second-view-reload-home', async () => {
    await page.reload();
    await page.getByRole('navigation', {name: 'เมนูหลัก'}).waitFor();
    assert(new URL(page.url()).pathname === '/ruenfai', `home after reload, got ${page.url()}`);
  });
}
