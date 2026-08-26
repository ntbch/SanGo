import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const B = 'http://localhost:4000/api/v1';
const out = [];
const rec = (id, name, pass, detail) => {
  out.push(pass);
  console.log((pass ? 'PASS' : 'FAIL') + ' | ' + id + ' ' + name + ' :: ' + detail);
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
async function login(email) {
  for (let a = 0; a < 5; a++) {
    const r = await api('POST', '/auth/login', null, { email, password: 'Sango@2026' });
    if (r.json?.accessToken) return r.json.accessToken;
    await new Promise((res) => setTimeout(res, 15000));
  }
  throw new Error('login fail ' + email);
}
(async () => {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(B + '/venues/map?bbox=20.9,105.7,21.1,106.0');
      if (r.status === 200) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }

  const custTk = await login('customer@sango.vn');
  const cust2Tk = await login('customer2@courthub.vn');
  const ownerTk = await login('owner@sango.vn');

  const users = await prisma.user.findMany({
    where: { email: { in: ['customer@sango.vn', 'customer2@courthub.vn'] } },
  });
  const uid = Object.fromEntries(users.map((u) => [u.email, u.id]));
  const venue = await prisma.venue.findFirst({
    where: { owner: { email: 'owner@sango.vn' } },
    include: { courts: { take: 1 } },
  });
  const court = venue.courts[0];

  async function pickSlot() {
    for (let off = 1; off <= 9; off++) {
      const d = new Date(Date.now() + off * 86400000).toISOString().slice(0, 10);
      const day = new Date(d + 'T00:00:00Z');
      const busy = new Set();
      (
        await prisma.booking.findMany({
          where: { courtId: court.id, date: day, status: { in: ['CONFIRMED', 'CHECKED_IN'] } },
          select: { startMinute: true },
        })
      ).forEach((b) => busy.add(b.startMinute));
      (
        await prisma.bookingHold.findMany({
          where: { courtId: court.id, date: day, status: 'ACTIVE' },
          select: { startMinute: true },
        })
      ).forEach((h) => busy.add(h.startMinute));
      for (const s of [1020, 600, 660, 720, 780, 540])
        if (!busy.has(s)) return { date: d, minute: s };
    }
    throw new Error('het slot');
  }
  for (const email of ['customer@sango.vn', 'customer2@courthub.vn']) {
    const olds = await prisma.bookingHold.findMany({
      where: { userId: uid[email], status: 'ACTIVE' },
    });
    for (const oh of olds)
      await api(
        'DELETE',
        '/bookings/holds/' + oh.id,
        email === 'customer@sango.vn' ? custTk : cust2Tk,
      );
  }

  // ===== MAJOR-A(1): user NGOAI team (chua duoc moi) dat hold kem teamId =====
  const mkTeam = await api('POST', '/teams', custTk, {
    name: 'Reverify A ' + Date.now().toString(36),
    sportType: 'PICKLEBALL',
  });
  const freshTeamId = mkTeam.json.id;
  const p1 = await pickSlot();
  const badHold = await api('POST', '/bookings/holds', cust2Tk, {
    courtId: court.id,
    date: p1.date,
    slots: [p1.minute],
    teamId: freshTeamId,
  });
  rec(
    'A1',
    'user ngoai team hold voi teamId -> 403',
    badHold.status === 403 && /MEMBER|FORBIDDEN|NOT/.test(JSON.stringify(badHold.json || {})),
    'st=' + badHold.status + ' ' + JSON.stringify(badHold.json || {}).slice(0, 120),
  );

  // ===== Setup: booking CH moi cua cust tren FC SanGo (ca 2 la ACTIVE member) =====
  const fcTeam = await prisma.team.findFirst({ where: { name: 'FC SanGo' } });
  const p2 = await pickSlot();
  const h = await api('POST', '/bookings/holds', custTk, {
    courtId: court.id,
    date: p2.date,
    slots: [p2.minute],
    teamId: fcTeam.id,
  });
  const hid = h.json.holdId || h.json.id;
  const co = await api('POST', '/payments/checkout', custTk, { holdId: hid, type: 'FULL' });
  const cbSetup = co.json?.txnRef
    ? await api(
        'GET',
        '/payments/mock/callback?txnRef=' +
          encodeURIComponent(co.json.txnRef) +
          '&amount=' +
          co.json.amount,
      )
    : { status: 0 };
  const bkDb = await prisma.booking.findFirst({
    where: {
      customerId: uid['customer@sango.vn'],
      courtId: court.id,
      date: new Date(p2.date + 'T00:00:00Z'),
      startMinute: p2.minute,
    },
    orderBy: { createdAt: 'desc' },
  });
  rec(
    'SETUP',
    'booking CH moi CONFIRMED',
    !!bkDb && bkDb.status === 'CONFIRMED',
    'code=' + (bkDb?.code || '?') + ' cbSt=' + cbSetup.status,
  );

  // ===== MAJOR-A(2): split lan 1 OK -> lan 2 BI CHAN, khong nhan doi =====
  const mIds = [uid['customer@sango.vn'], uid['customer2@courthub.vn']];
  const sp1 = await api('POST', '/teams/' + fcTeam.id + '/expenses/split-booking', custTk, {
    bookingId: bkDb.id,
    memberIds: mIds,
  });
  const sp2 = await api('POST', '/teams/' + fcTeam.id + '/expenses/split-booking', custTk, {
    bookingId: bkDb.id,
    memberIds: mIds,
  });
  const cnt = await prisma.expenseShare.count({ where: { bookingId: bkDb.id } });
  rec(
    'A2',
    'split lan 1 OK, lan 2 409 BOOKING_ALREADY_SPLIT',
    sp1.status < 300 && sp2.status >= 400 && /ALREADY_SPLIT/.test(JSON.stringify(sp2.json || {})),
    'st1=' + sp1.status + ' st2=' + sp2.status,
  );
  rec('A2b', 'so share dung bang ky vong (idempotent)', cnt === 1, 'shares=' + cnt);

  // ===== MAJOR-B: 2 callback SONG SONG, tong PAID khong vuot unpaid =====
  const sv = await api('POST', '/owner/venues/' + venue.id + '/services', ownerTk, {
    name: 'Nuoc race QA',
    price: 40000,
    type: 'BEVERAGE',
  });
  const add = await api('POST', '/bookings/' + bkDb.id + '/addons', custTk, {
    items: [{ serviceId: sv.json.id, quantity: 1 }],
  });
  console.log('addon add:', add.status, JSON.stringify(add.json || {}).slice(0, 140));
  const co1 = await api('POST', '/bookings/' + bkDb.id + '/addons/checkout', custTk, {});
  console.log('checkout#1:', co1.status, JSON.stringify(co1.json || {}).slice(0, 160));
  let co2 = null;
  if ((co1.json?.amount || 0) > 0) {
    co2 = await api('POST', '/bookings/' + bkDb.id + '/addons/checkout', custTk, {});
    console.log('checkout#2:', co2.status, JSON.stringify(co2.json || {}).slice(0, 160));
  }
  const calls = [];
  calls.push(
    api(
      'GET',
      '/payments/mock/callback?txnRef=' +
        encodeURIComponent(co1.json.txnRef) +
        '&amount=' +
        co1.json.amount,
    ),
  );
  if (co2?.json?.txnRef && co2.json.txnRef !== co1.json.txnRef)
    calls.push(
      api(
        'GET',
        '/payments/mock/callback?txnRef=' +
          encodeURIComponent(co2.json.txnRef) +
          '&amount=' +
          co2.json.amount,
      ),
    );
  else
    calls.push(
      api(
        'GET',
        '/payments/mock/callback?txnRef=' +
          encodeURIComponent(co1.json.txnRef) +
          '&amount=' +
          co1.json.amount,
      ),
    );
  const rs = await Promise.allSettled(calls);
  rs.forEach((x, i) =>
    console.log(
      'cb#' + i + ':',
      x.value?.status,
      JSON.stringify(x.value?.json || {}).slice(0, 130),
    ),
  );
  const paidSum = Number(
    (
      await prisma.payment.aggregate({
        where: { bookingId: bkDb.id, type: 'ADD_ON', status: 'PAID' },
        _sum: { amount: true },
      })
    )._sum.amount || 0,
  );
  const paidCnt = await prisma.payment.count({
    where: { bookingId: bkDb.id, type: 'ADD_ON', status: 'PAID' },
  });
  const totalAddOn = 40000;
  rec(
    'B1',
    '2 callback song song: khong 500, khong ghi vuot',
    rs.every((x) => x.value?.status > 0 && x.value?.status < 500),
    'statuses=' + JSON.stringify(rs.map((x) => x.value?.status)),
  );
  rec(
    'B2',
    'tong PAID ADD_ON == ' + totalAddOn + ' (dung unpaid, thua bi tu choi)',
    paidSum === totalAddOn && paidCnt === 1,
    'sum=' + paidSum + ' cnt=' + paidCnt,
  );

  const pass = out.filter(Boolean).length;
  console.log('REVERIFY SUMMARY: ' + pass + '/' + out.length + ' PASS');
  await prisma.$disconnect();
  process.exit(pass === out.length ? 0 : 1);
})().catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});
