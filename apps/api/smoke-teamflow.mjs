import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const B = 'http://localhost:4000/api/v1';
const out = [];
const rec = (id, pass, detail) => {
  out.push({ id, pass });
  console.log((pass ? 'PASS' : 'FAIL') + ' | ' + id + ' :: ' + detail);
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
(async () => {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(B + '/venues/map?bbox=20.9,105.7,21.1,106.0');
      if (r.status === 200) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }

  const lg = async (email) =>
    (await api('POST', '/auth/login', null, { email, password: 'Sango@2026' })).json;
  let cust = null;
  for (let a = 0; a < 5; a++) {
    cust = await lg('customer@sango.vn');
    if (cust?.accessToken) break;
    await new Promise((r) => setTimeout(r, 15000));
  }
  const TK = cust.accessToken;

  const users = await prisma.user.findMany({ where: { email: 'customer@sango.vn' } });
  const uid = users[0].id;
  // dọn hold active
  const olds = await prisma.bookingHold.findMany({ where: { userId: uid, status: 'ACTIVE' } });
  for (const oh of olds) await api('DELETE', '/bookings/holds/' + oh.id, TK);

  const venue = await prisma.venue.findFirst({
    where: { owner: { email: 'owner@sango.vn' } },
    include: { courts: { take: 1 } },
  });
  const court = venue.courts[0];
  const team = await prisma.team.findFirst({ where: { captainId: uid } });

  // pick slot trống trong 9 ngày tới
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
    const vMeta = await prisma.venue.findUnique({
      where: { id: venue.id },
      select: { openMinute: true, closeMinute: true },
    });
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
  console.log('slot: ' + date + '#' + minute + ' team=' + team.name);

  // NEGATIVE: hold với teamId lạ -> phải bị chặn rõ ràng (fix gap #2)
  const badTeam = await api('POST', '/bookings/holds', TK, {
    courtId: court.id,
    date,
    slots: [minute],
    teamId: '00000000-0000-4000-8000-000000000000',
  });
  rec(
    'TF-0 hold teamId la -> 4xx TEAM_*',
    badTeam.status >= 400 && /TEAM_/.test(JSON.stringify(badTeam.json || {})),
    'st=' + badTeam.status + ' ' + JSON.stringify(badTeam.json || {}).slice(0, 110),
  );

  // HAPPY: hold kèm teamId thật
  const h = await api('POST', '/bookings/holds', TK, {
    courtId: court.id,
    date,
    slots: [minute],
    teamId: team.id,
  });
  const hid = h.json?.holdId || h.json?.id;
  rec('TF-1 create hold persist teamId', h.status < 300 && !!hid, 'st=' + h.status);
  const hd = await prisma.bookingHold.findUnique({ where: { id: hid } });
  rec(
    'TF-2 BookingHold.teamId trong DB',
    hd?.teamId === team.id,
    'hold.teamId=' + (hd?.teamId || 'null'),
  );

  const co = await api('POST', '/payments/checkout', TK, { holdId: hid, type: 'FULL' });
  const cb = co.json?.txnRef
    ? await api(
        'GET',
        '/payments/mock/callback?txnRef=' +
          encodeURIComponent(co.json.txnRef) +
          '&amount=' +
          co.json.amount,
      )
    : { status: 0 };
  rec(
    'TF-3 checkout + callback PAID',
    co.status < 300 && cb.status === 200,
    'txnRef=' + (co.json?.txnRef || '').slice(-16),
  );

  const bkMe = await api('GET', '/bookings/me?status=CONFIRMED', TK);
  const arr = Array.isArray(bkMe.json) ? bkMe.json : bkMe.json?.items || [];
  const mine =
    arr.filter((b) => b.teamId === team.id).sort((a, b) => (b.date > b.date ? 1 : -1))[0] ||
    arr[arr.length - 1];
  rec(
    'TF-4 GET /bookings/me tra teamId + CONFIRMED',
    !!mine && mine.status === 'CONFIRMED' && mine.teamId === team.id,
    JSON.stringify(mine && { code: mine.code, status: mine.status, teamId: mine.teamId }),
  );
  const bkDb = await prisma.booking.findUnique({ where: { id: mine.id } });
  rec(
    'TF-5 booking trong DB co teamId',
    bkDb?.teamId === team.id,
    'db.teamId=' + (bkDb?.teamId || 'null'),
  );

  const fails = out.filter((o) => !o.pass);
  console.log('TEAMFLOW SUMMARY: ' + (out.length - fails.length) + '/' + out.length + ' PASS');
  await prisma.$disconnect();
  process.exit(fails.length ? 1 : 0);
})().catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});
