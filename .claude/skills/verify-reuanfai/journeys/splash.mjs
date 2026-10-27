// Opening /ruenfai shows the splash (role=status "กำลังเปิดเรือนไฟ") for >= 3 s, then the home screen.
export const viewport = {width: 390, height: 844};

export default async function ({page, step, assert, url}) {
  await step('open-home-splash-clears', async () => {
    const started = Date.now();
    await page.goto(url('/ruenfai'));
    const splash = page.getByRole('status', {name: 'กำลังเปิดเรือนไฟ'});
    await splash.waitFor({state: 'detached', timeout: 20_000});
    assert(Date.now() - started >= 2500, 'splash shown for about 3 s minimum');
  });
}
