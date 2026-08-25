const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const B = 'http://localhost:4000/api/v1';
const results = [];
const rec = (id, name, pass, detail) => {
  results.push({ id, name, pass });
  console.log((pass ? 'PASS' : 'FAIL') + ' | ' + id + ' ' + name + (detail ? ' :: ' + detail : ''));
};

async function api(method, path, token, body) {
  const res = await fetch(B + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try {
    json = await res.json();
  } catch {}
  return { status: res.status, json };
}
async function waitApi() {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(B + '/venues/map?bbox=20.9,105.7,21.1,106.0');
      if (r.status < 500) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

(async () => {
  if (!(await waitApi())) {
    console.log('API NOT UP');
    process.exit(1);
  }

  // ---- S0 login ----
  async function login(email) {
    const r = await api('POST', '/auth/login', null, { email, password: 'Courthub@2026' });
    const j = r.json || {};
    let rr = r,
      jj = j;
    for (let a = 0; a < 4 && rr.status === 429; a++) {
      await new Promise((res) => setTimeout(res, 20000));
      rr = await api('POST', '/auth/login', null, { email, password: 'Courthub@2026' });
      jj = rr.json || {};
    }
    if (rr.status >= 300)
      console.log(
        'LOGIN ISSUE ' + email + ' st=' + rr.status + ' ' + JSON.stringify(jj).slice(0, 120),
      );
    return {
      token: jj.accessToken || jj.token || jj.access_token,
      id: jj.user?.id || jj.userId || jj.id,
      raw: jj,
    };
  }
  const owner = await login('owner@courthub.vn');
  const cust = await login('customer@courthub.vn');
  const cust2 = await login('customer2@courthub.vn');
  rec(
    'S0',
    'login 3 role',
    !!(owner.token && cust.token && cust2.token),
    'keys=' + Object.keys(owner.raw).join(','),
  );

  // ids từ DB (đọc-only)
  const users = await prisma.user.findMany({
    where: { email: { in: ['customer@courthub.vn', 'customer2@courthub.vn'] } },
  });
  const uMap = Object.fromEntries(users.map((u) => [u.email, u.id]));
  const vOwner = await prisma.venue.findFirst({
    where: { owner: { email: 'owner@courthub.vn' } },
    include: { courts: { take: 3 } },
  });
  // Chọn ngày+slot còn trống cho court (tránh dữ liệu smoke các lần chạy trước)
  async function pickSlot(courtId) {
    for (let off = 1; off <= 9; off++) {
      const d = new Date(Date.now() + off * 86400000).toISOString().slice(0, 10);
      const day = new Date(d + 'T00:00:00Z');
      const busy = new Set();
      const bks = await prisma.booking.findMany({
        where: { courtId, date: day, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
        select: { startMinute: true },
      });
      bks.forEach((b) => busy.add(b.startMinute));
      const hds = await prisma.bookingHold.findMany({
        where: { courtId, date: day, status: 'ACTIVE' },
        select: { startMinute: true },
      });
      hds.forEach((h) => busy.add(h.startMinute));
      for (const s of [1020, 600, 660, 720, 780])
        if (!busy.has(s)) return { date: d, minute: s, dow: day.getUTCDay() };
    }
    throw new Error('khong con slot trong');
  }
  console.log('INFO venue=' + vOwner.name + ' courts=' + vOwner.courts.length);

  // Dọn hold còn hiệu lực để chạy lại sạch (luồng DELETE chính thức)
  for (const u of [
    [cust, 'customer@courthub.vn'],
    [cust2, 'customer2@courthub.vn'],
  ]) {
    const olds = await prisma.bookingHold
      .findMany({
        where: {
          userId: uMap['customer2@courthub.vn'] === undefined ? '' : uMap[u[1]],
          status: 'ACTIVE',
        },
      })
      .catch(() => []);
    for (const oh of olds) await api('DELETE', '/bookings/holds/' + oh.id, u[0].token);
    if (olds.length) console.log('CLEANUP holds ' + u[1] + ': ' + olds.length);
  }

  // ---- S1 MAP ----
  const m1 = await api('GET', '/venues/map?bbox=20.90,105.70,21.10,106.00');
  const items = m1.json?.items || m1.json?.data || m1.json;
  const arr = Array.isArray(items) ? items : items?.items || [];
  const withPrice = arr.filter((v) => v.priceFrom != null || v.priceFrom === 0);
  rec(
    'S1a',
    'map bbox tra venue + priceFrom',
    m1.status === 200 && arr.length > 0,
    'n=' +
      arr.length +
      ' priceFrom_sample=' +
      JSON.stringify(arr[0] && { n: arr[0].name, pf: arr[0].priceFrom, pt: arr[0].priceTo }),
  );
  const mBad = await api('GET', '/venues/map?bbox=21.10,105.70,20.90,106.00');
  rec('S1b', 'bbox min>max -> 400', mBad.status === 400, 'st=' + mBad.status);

  // ---- S2 TEAM ----
  const tCreate = await api('POST', '/teams', cust.token, {
    name: 'Team QA S2 Smoke ' + Date.now().toString(36),
    sportType: 'PICKLEBALL',
  });
  const team = tCreate.json;
  rec(
    'S2a',
    'captain tao doi',
    tCreate.status === 201 || tCreate.status === 200,
    JSON.stringify(team).slice(0, 120),
  );
  const inv = await api('POST', '/teams/' + team.id + '/invite', cust.token, {
    userId: uMap['customer2@courthub.vn'],
    role: 'MEMBER',
  });
  rec(
    'S2b',
    'moi thanh vien',
    inv.status === 201 || inv.status === 200,
    JSON.stringify(inv.json || {}).slice(0, 100),
  );
  const resp = await api('POST', '/teams/' + team.id + '/respond-invite', cust2.token, {
    accept: true,
  });
  rec(
    'S2c',
    'member accept loi moi',
    resp.status === 200 || resp.status === 201,
    'st=' + resp.status,
  );
  const memList = await api('GET', '/teams/' + team.id, cust2.token);
  const members = memList.json?.members || [];
  rec(
    'S2d',
    'team co 2 thanh vien ACTIVE',
    members.length >= 2,
    JSON.stringify(members.map((m) => m.role + ':' + (m.user?.email || m.email))).slice(0, 140),
  );
  const forbidden = await api('PATCH', '/teams/' + team.id, cust2.token, {
    description: 'member tu y sua',
  });
  rec('S2e', 'member sua doi bi 403', forbidden.status === 403, 'st=' + forbidden.status);

  // ---- S3 BOOKING THEO DOI ----
  const court = vOwner.courts[0];
  const pick3 = await pickSlot(court.id);
  const h = await api('POST', '/bookings/holds', cust2.token, {
    courtId: court.id,
    date: pick3.date,
    slots: [pick3.minute],
    teamId: team.id,
  });
  const hold = h.json;
  rec(
    'S3a',
    'hold kem teamId',
    h.status === 201 || h.status === 200,
    JSON.stringify(hold).slice(0, 140),
  );
  const co = await api('POST', '/payments/checkout', cust2.token, {
    holdId: hold.holdId || hold.id,
    type: 'FULL',
  });
  rec(
    'S3b',
    'checkout FULL mock',
    co.status === 201 || co.status === 200,
    'st=' + co.status + ' raw=' + JSON.stringify(co.json || {}).slice(0, 260),
  );
  const cb = co.json?.txnRef
    ? await api(
        'GET',
        '/payments/mock/callback?txnRef=' +
          encodeURIComponent(co.json.txnRef) +
          '&amount=' +
          co.json.amount,
      )
    : { status: 0, json: null };
  rec('S3c', 'mock callback PAID', cb.status === 200, JSON.stringify(cb.json || {}).slice(0, 120));
  const bkMine = co.json?.txnRef ? await api('GET', '/bookings/me', cust2.token) : { json: [] };
  const bkArr = bkMine.json?.items || bkMine.json || [];
  const bkTeam = (Array.isArray(bkArr) ? bkArr : []).find((b) => b.teamId === team.id);
  rec(
    'S3d',
    'booking CONFIRMED dung doi',
    !!bkTeam && bkTeam.status === 'CONFIRMED',
    JSON.stringify(bkTeam && { code: bkTeam.code, status: bkTeam.status, teamId: !!bkTeam.teamId }),
  );

  // ---- S4 EXPENSE chia deu ----
  if (!bkTeam) {
    console.log('SKIP S4/S5 (khong co booking team)');
    await prisma.$disconnect();
    process.exit(1);
  }
  const sp = await api('POST', '/teams/' + team.id + '/expenses/split-booking', cust.token, {
    bookingId: bkTeam.id,
    memberIds: [uMap['customer@courthub.vn'], uMap['customer2@courthub.vn']],
    note: 'Smoke S2 quỹ đội',
  });
  const shares = Array.isArray(sp.json) ? sp.json : sp.json?.items || sp.json?.shares || [];
  const totalShare = shares.reduce((s, x) => s + (x.amount || 0), 0);
  const expPer = Math.floor((bkTeam.depositAmount || bkTeam.subtotal || 0) / 2);
  rec(
    'S4a',
    'split-booking loai payer, moi debtor ' + expPer,
    (sp.status === 201 || sp.status === 200) &&
      shares.length === 1 &&
      shares[0]?.amount === expPer &&
      shares[0]?.debtorId === uMap['customer2@courthub.vn'],
    JSON.stringify(sp.json || {}).slice(0, 180),
  );
  const shId = shares[0]?.id;
  const pay1 = await api(
    'PATCH',
    '/teams/' + team.id + '/expenses/' + shId + '/status',
    cust.token,
    { status: 'PAID' },
  );
  const pay2 = await api(
    'PATCH',
    '/teams/' + team.id + '/expenses/' + shId + '/status',
    cust.token,
    { status: 'PAID' },
  );
  rec(
    'S4b',
    'danh dau PAID idempotent (bam 2 lan)',
    pay1.status < 300 && pay2.status < 300,
    'st1=' + pay1.status + ' st2=' + pay2.status,
  );

  // ---- S5 ADDON ----
  const sv1 = await api('POST', '/owner/venues/' + vOwner.id + '/services', owner.token, {
    name: 'Nước suối',
    price: 10000,
    type: 'BEVERAGE',
  });
  const sv2 = await api('POST', '/owner/venues/' + vOwner.id + '/services', owner.token, {
    name: 'Thuê vợt',
    price: 30000,
    type: 'EQUIPMENT',
  });
  rec(
    'S5a',
    'owner CRUD menu dich vu',
    (sv1.status === 201 || sv1.status === 200) && (sv2.status === 201 || sv2.status === 200),
    'st=' + sv1.status + '/' + sv2.status,
  );
  const pubSvc = await api('GET', '/venues/' + vOwner.id + '/services');
  rec(
    'S5b',
    'public danh sach dich vu',
    pubSvc.status === 200,
    'n=' + (pubSvc.json?.items || pubSvc.json || []).length,
  );
  const add = await api('POST', '/bookings/' + bkTeam.id + '/addons', cust2.token, {
    items: [
      { serviceId: sv1.json.id, quantity: 2 },
      { serviceId: sv2.json.id, quantity: 1 },
    ],
  });
  rec(
    'S5c',
    'them addon vao don CONFIRMED',
    add.status === 201 || add.status === 200,
    JSON.stringify(add.json || {}).slice(0, 120),
  );
  const aco = await api('POST', '/bookings/' + bkTeam.id + '/addons/checkout', cust2.token, {});
  rec(
    'S5d',
    'checkout ADD_ON 50k',
    (aco.status === 201 || aco.status === 200) &&
      aco.json?.amount === 50000 &&
      String(aco.json?.txnRef || '').includes('.ADD_ON.'),
    'txnRef=' + aco.json?.txnRef?.slice(-24) + ' amount=' + aco.json?.amount,
  );
  const badCb = await api(
    'GET',
    '/payments/mock/callback?txnRef=' + encodeURIComponent(aco.json.txnRef) + '&amount=999',
  );
  rec(
    'S5e',
    'callback sai amount -> 400 MISMATCH',
    badCb.status === 400,
    'st=' + badCb.status + ' ' + JSON.stringify(badCb.json || {}).slice(0, 80),
  );
  const goodCb = await api(
    'GET',
    '/payments/mock/callback?txnRef=' + encodeURIComponent(aco.json.txnRef) + '&amount=50000',
  );
  rec(
    'S5f',
    'callback du amount -> PAID',
    goodCb.status === 200,
    JSON.stringify(goodCb.json || {}).slice(0, 100),
  );
  const replay = await api(
    'GET',
    '/payments/mock/callback?txnRef=' + encodeURIComponent(aco.json.txnRef) + '&amount=50000',
  );
  const addOnPayments = await prisma.payment.count({
    where: { txnRef: aco.json.txnRef, status: 'PAID', type: 'ADD_ON' },
  });
  rec(
    'S5g',
    'replay idempotent - 1 Payment PAID duy nhat',
    replay.status === 200 && addOnPayments === 1,
    'paidCount=' + addOnPayments,
  );
  const addonsAfter = await api('GET', '/bookings/' + bkTeam.id + '/addons', cust2.token);
  rec(
    'S5h',
    'lich su addon day du',
    addonsAfter.status === 200,
    JSON.stringify(addonsAfter.json || {}).slice(0, 160),
  );

  // ---- S6 MAJOR-1: ma usageLimit=1 rieng, 2 user tranh luot cuoi (B1+B2) ----
  const pickA = await pickSlot(court.id);
  const vCode = 'QAEXH-' + Date.now().toString(36).toUpperCase().slice(-6);
  const mkVoucher = await api('POST', '/owner/vouchers', owner.token, {
    code: vCode,
    percentOff: 20,
    dayOfWeek: pickA.dow,
    validFromMinute: 360,
    validToMinute: 1320,
    usageLimit: 1,
    perUserLimit: 1,
  });
  console.log(
    'S6 tao voucher ' +
      vCode +
      ' st=' +
      mkVoucher.status +
      ' slot=' +
      pickA.date +
      '#' +
      pickA.minute,
  );

  // Luot 1: customer apply + checkout + PAID -> tieu luot duy nhat
  const h1 = await api('POST', '/bookings/holds', cust.token, {
    courtId: court.id,
    date: pickA.date,
    slots: [pickA.minute],
  });
  const H1 = h1.json.holdId || h1.json.id;
  const ap1 = await api('POST', '/holds/' + H1 + '/voucher', cust.token, { code: vCode });
  const c1 = await api('POST', '/payments/checkout', cust.token, { holdId: H1, type: 'FULL' });
  const cb1 = c1.json?.txnRef
    ? await api(
        'GET',
        '/payments/mock/callback?txnRef=' +
          encodeURIComponent(c1.json.txnRef) +
          '&amount=' +
          c1.json.amount,
      )
    : { status: 0 };
  rec(
    'S6b',
    'luot 1 (customer): apply OK + checkout PAID, tieu luot duy nhat',
    ap1.status < 300 && c1.status < 300 && cb1.status === 200,
    'st_ap=' + ap1.status + ' amount=' + c1.json?.amount,
  );

  // Luot 2: customer2 apply CUNG ma (snapshot OK vi per-user chua dung) -> checkout phai bi chan do quota can
  let mB = pickA.minute;
  for (const cand of [600, 660, 720, 780, 840, 900, 540])
    if (cand !== pickA.minute) {
      const probe = await prisma.bookingHold.count({
        where: {
          courtId: court.id,
          date: new Date(pickA.date + 'T00:00:00Z'),
          startMinute: cand,
          status: 'ACTIVE',
        },
      });
      const bkBusy = await prisma.booking.count({
        where: {
          courtId: court.id,
          date: new Date(pickA.date + 'T00:00:00Z'),
          startMinute: cand,
          status: { in: ['CONFIRMED', 'CHECKED_IN'] },
        },
      });
      if (!probe && !bkBusy) {
        mB = cand;
        break;
      }
    }
  const h2 = await api('POST', '/bookings/holds', cust2.token, {
    courtId: court.id,
    date: pickA.date,
    slots: [mB],
  });
  const H2 = h2.json.holdId || h2.json.id;
  const ap2 = await api('POST', '/holds/' + H2 + '/voucher', cust2.token, { code: vCode });
  rec(
    'S6a',
    'luot 2 (customer2): snapshot tai apply van OK (quota chua kiem o buoc nay)',
    ap2.status < 300,
    'st=' + ap2.status + ' raw=' + JSON.stringify(ap2.json || {}).slice(0, 140),
  );
  const c2 = await api('POST', '/payments/checkout', cust2.token, { holdId: H2, type: 'FULL' });
  const blocked =
    c2.status >= 400 && /VOUCHER_(USER_LIMIT|EXHAUSTED)/.test(JSON.stringify(c2.json));
  rec(
    'S6c',
    'checkout thu 2 BI CHAN voi VOUCHER_*',
    blocked,
    'st=' + c2.status + ' ' + JSON.stringify(c2.json).slice(0, 110),
  );
  const payForH2 = c2.json?.txnRef
    ? await prisma.payment.count({ where: { txnRef: c2.json.txnRef } })
    : 0;
  rec('S6d', 'khong sinh Payment cho hold bi chan', payForH2 === 0, 'payments=' + payForH2);

  // ---- Summary ----
  const fails = results.filter((r) => !r.pass);
  console.log(
    '\n===== SUMMARY: ' + (results.length - fails.length) + '/' + results.length + ' PASS =====',
  );
  if (fails.length) console.log('FAILED: ' + fails.map((f) => f.id + ' ' + f.name).join(' ; '));
  await prisma.$disconnect();
})().catch((e) => {
  console.error('SCRIPT ERROR', e);
  process.exit(1);
});
