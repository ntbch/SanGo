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

  const ownerTk = await login('owner@sango.vn');
  const custTk = await login('customer@sango.vn');
  const cust2Tk = await login('customer2@courthub.vn');
  const users = await prisma.user.findMany({
    where: { email: { in: ['customer@sango.vn', 'customer2@courthub.vn'] } },
  });
  const uid = Object.fromEntries(users.map((u) => [u.email, u.id]));
  // captains sẵn có từ seed S3
  const capEmails = [
    'customer@sango.vn',
    'customer2@courthub.vn',
    'captain3@courthub.vn',
    'captain4@courthub.vn',
    'captain5@courthub.vn',
    'captain6@courthub.vn',
    'captain7@courthub.vn',
  ];
  const tokens = {};
  for (const e of capEmails)
    tokens[e] =
      e === 'customer@sango.vn'
        ? custTk
        : e === 'customer2@courthub.vn'
          ? cust2Tk
          : await login(e);

  // ===== V1: bye guard NOT_ENOUGH_TEAMS =====
  const mkT = await api('POST', '/tournaments', ownerTk, {
    name: 'QA Bye Guard ' + Date.now().toString(36),
    sportType: 'PICKLEBALL',
  });
  const tid = mkT.json?.id;
  rec('V0', 'tao giai cho verify', mkT.status === 201 && !!tid, 'st=' + mkT.status);

  const allTeams = await prisma.team.findMany({
    orderBy: { createdAt: 'asc' },
    include: { members: { where: { role: 'CAPTAIN' }, include: { user: true } } },
  });
  async function regTeam(t) {
    const capEmail = t.members[0]?.user?.email || 'customer@sango.vn';
    return api(
      'POST',
      '/tournaments/' + tid + '/register',
      await (capEmail in tokens ? Promise.resolve(tokens[capEmail]) : login(capEmail)),
      { teamId: t.id },
    );
  }
  // đăng ký lần lượt 4 đội (= maxTeams/2)
  for (let i = 0; i < 4; i++) {
    const rr = await regTeam(allTeams[i]);
    if (rr.status >= 300) console.log('   reg fail', allTeams[i].name, rr.status);
  }
  const earlyStart = await api('POST', '/tournaments/' + tid + '/start', ownerTk);
  rec(
    'V1a',
    'start voi 4 doi (= maxTeams/2) -> 400 NOT_ENOUGH_TEAMS',
    earlyStart.status === 400 && /NOT_ENOUGH_TEAMS/.test(JSON.stringify(earlyStart.json || {})),
    'st=' + earlyStart.status + ' ' + JSON.stringify(earlyStart.json || {}).slice(0, 110),
  );
  // biên trên: đội thứ 5 -> start OK
  const rr5 = await regTeam(allTeams[4]);
  const okStart = await api('POST', '/tournaments/' + tid + '/start', ownerTk);
  rec(
    'V1b',
    'start voi 5 doi (> nua slot) -> thanh cong',
    rr5.status < 300 && okStart.status < 300,
    'reg5_st=' + rr5.status + ' start_st=' + okStart.status,
  );

  // ===== V2: dedup memberIds khi chia tiền =====
  const fcTeam = await prisma.team.findFirst({ where: { name: 'FC SanGo' } });
  // booking CONFIRMED moi cua cust (kèm teamId FC SanGo để khớp scoping)
  const olds = await prisma.bookingHold.findMany({
    where: { userId: uid['customer@sango.vn'], status: 'ACTIVE' },
  });
  for (const oh of olds) await api('DELETE', '/bookings/holds/' + oh.id, custTk);
  const venue = await prisma.venue.findFirst({
    where: { owner: { email: 'owner@sango.vn' } },
    include: { courts: { take: 1 } },
  });
  const court = venue.courts[0];
  const vMeta = await prisma.venue.findUnique({
    where: { id: court.venueId },
    select: { openMinute: true, closeMinute: true },
  });
  let date, minute;
  outer: for (let off = 1; off <= 9; off++) {
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
    for (
      let m = vMeta.openMinute;
      m + court.slotMinutes <= vMeta.closeMinute;
      m += court.slotMinutes
    )
      if (!busy.has(m)) {
        date = d;
        minute = m;
        break outer;
      }
  }
  const h = await api('POST', '/bookings/holds', custTk, {
    courtId: court.id,
    date,
    slots: [minute],
    teamId: fcTeam.id,
  });
  const hid = h.json.holdId || h.json.id;
  const co = await api('POST', '/payments/checkout', custTk, { holdId: hid, type: 'FULL' });
  await api(
    'GET',
    '/payments/mock/callback?txnRef=' +
      encodeURIComponent(co.json.txnRef) +
      '&amount=' +
      co.json.amount,
  );
  const bkDb = await prisma.booking.findFirst({
    where: {
      customerId: uid['customer@sango.vn'],
      courtId: court.id,
      date: new Date(date + 'T00:00:00Z'),
      startMinute: minute,
    },
    orderBy: { createdAt: 'desc' },
  });

  const dupIds = [
    uid['customer2@courthub.vn'],
    uid['customer2@courthub.vn'],
    uid['customer@sango.vn'],
  ]; // cust2 xuat hien 2 lan
  const sp1 = await api('POST', '/teams/' + fcTeam.id + '/expenses/split-booking', custTk, {
    bookingId: bkDb.id,
    memberIds: dupIds,
  });
  const spCnt = await prisma.expenseShare.count({
    where: { bookingId: bkDb.id, teamId: fcTeam.id },
  });
  const dupDebtor = await prisma.expenseShare.count({
    where: { bookingId: bkDb.id, teamId: fcTeam.id, debtorId: uid['customer2@courthub.vn'] },
  });
  rec(
    'V2a',
    'split memberIds trung -> dedup, 1 khoan no duy nhat/debtor',
    sp1.status < 300 && spCnt === 1 && dupDebtor === 1,
    JSON.stringify(sp1.json || {}).slice(0, 150),
  );
  // goi lai lan 2 van khong nhan doi (idempotent qua ALREADY_SPLIT hoac unique)
  const sp2 = await api('POST', '/teams/' + fcTeam.id + '/expenses/split-booking', custTk, {
    bookingId: bkDb.id,
    memberIds: dupIds,
  });
  const spCnt2 = await prisma.expenseShare.count({
    where: { bookingId: bkDb.id, teamId: fcTeam.id },
  });
  rec(
    'V2b',
    'goi lan 2 van khong sinh them no',
    spCnt2 === spCnt,
    'st2=' + sp2.status + ' cnt=' + spCnt2,
  );

  const pass = out.filter(Boolean).length;
  console.log('T36 REVERIFY SUMMARY: ' + pass + '/' + out.length + ' PASS');
  await prisma.$disconnect();
  process.exit(pass === out.length ? 0 : 1);
})().catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});
