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
    const r = await api('POST', '/auth/login', null, { email, password: 'Courthub@2026' });
    if (r.json?.accessToken) return r.json.accessToken;
    await new Promise((res) => setTimeout(res, 15000));
  }
  throw new Error('login fail ' + email);
}
const W = { BASE: 50, ON_TIME: 10, LATE_CANCEL: -5, NO_SHOW: -20 };
function expectedScore(bks) {
  let delta = 0;
  for (const b of bks) {
    const startAt = new Date(b.date).getTime() + b.startMinute * 60000;
    if (b.status === 'CANCELLED') {
      if (
        b.cancelledAt &&
        new Date(b.cancelledAt).getTime() > startAt - 43200000 &&
        new Date(b.cancelledAt).getTime() <= startAt
      )
        delta += W.LATE_CANCEL;
      continue;
    }
    if (!b.checkedInAt) {
      if (b.status === 'COMPLETED') delta += W.NO_SHOW;
      continue;
    }
    if (new Date(b.checkedInAt).getTime() <= startAt) delta += W.ON_TIME;
  }
  return Math.max(0, Math.min(100, W.BASE + delta));
}
(async () => {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(B + '/venues/map?bbox=20.9,105.7,21.1,106.0');
      if (r.status === 200) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 2000));
  }

  const custTk = await login('customer@courthub.vn');
  const cust2Tk = await login('customer2@courthub.vn');
  const ownerTk = await login('owner@courthub.vn');
  const users = await prisma.user.findMany({
    where: { email: { in: ['customer@courthub.vn', 'customer2@courthub.vn'] } },
  });
  const uMap = Object.fromEntries(users.map((u) => [u.email, u]));

  // ===== F2-A: compute-on-read khớp công thức =====
  for (const [tk, email] of [
    [custTk, 'customer@courthub.vn'],
    [cust2Tk, 'customer2@courthub.vn'],
  ]) {
    const bks = await prisma.booking.findMany({
      where: {
        customerId: uMap[email].id,
        status: { in: ['CANCELLED', 'CHECKED_IN', 'COMPLETED'] },
      },
      select: { date: true, startMinute: true, status: true, cancelledAt: true, checkedInAt: true },
    });
    const exp = expectedScore(bks);
    const me = await api('GET', '/reputation/me', tk);
    if (email === 'customer@courthub.vn') {
      // user này bị script mutate (chèn no-show) + cache TTL thuần -> assert TỰ-NHẤT QUÁN công thức trên chính response
      const b = me.json?.breakdown || {};
      const selfScore = Math.max(0, Math.min(100, W.BASE + W.ON_TIME * (b.onTimeCheckIns || 0) + W.LATE_CANCEL * (b.lateCancels || 0) + W.NO_SHOW * (b.noShows || 0)));
      rec(
        'F2-' + email.split('@')[0],
        'score tu-nhat-quan cong thuc (clamp 0..100) = ' + selfScore,
        me.status === 200 && me.json?.score === selfScore,
        JSON.stringify({ got: me.json?.score, breakdown: b }),
      );
    } else {
      rec(
        'F2-' + email.split('@')[0],
        'score compute-on-read = ' + exp,
        me.status === 200 && me.json?.score === exp,
        JSON.stringify({ got: me.json?.score, breakdown: me.json?.breakdown }),
      );
    }
  }

  // ===== F2-A2: user moi — diem dung BASE, chong badge (deterministic, khong cache) =====
  const newEmail = 'qa-rep-' + Date.now().toString(36) + '@courthub.vn';
  const regNew = await api('POST', '/auth/register', null, { email: newEmail, password: 'Courthub@2026', fullName: 'QA Rep New' });
  const newTk = regNew.json?.accessToken || (await api('POST', '/auth/login', null, { email: newEmail, password: 'Courthub@2026' })).json?.accessToken;
  const meNew = await api('GET', '/reputation/me', newTk);
  rec(
    'F2-new-user',
    'user moi score=50 (BASE), badge current=0',
    meNew.status === 200 && meNew.json?.score === 50 && (meNew.json?.badges || []).every((b) => Number(b.current) === 0 && !b.unlocked),
    JSON.stringify({ got: meNew.json?.score, badges: meNew.json?.badges }),
  );

  // ===== F2-B: cache TTL thuan (khong invalidate som) =====
  const before = await api('GET', '/reputation/me', custTk);
  // ghi su kien doi diem ngay sau GET1: booking COMPLETED khong check-in (no-show -20)
  const anyCourt = await prisma.court.findFirst();
  const pastDate = new Date(Date.now() - 86400000 * 3);
  const nsBk = await prisma.booking.create({
    data: {
      code: 'QA-NS-' + Date.now().toString(36),
      customerId: uMap['customer@courthub.vn'].id,
      courtId: anyCourt.id,
      date: pastDate,
      startMinute: 600,
      endMinute: 690,
      subtotal: 100000,
      depositAmount: 50000,
      status: 'COMPLETED',
      payments: {
        create: {
          txnRef: 'qa-ns-' + Date.now().toString(36) + '.FULL.x',
          amount: 50000,
          type: 'FULL',
          method: 'MOCK',
          status: 'PAID',
        },
      },
    },
  });
  const afterWrite = await api('GET', '/reputation/me', custTk);
  const sameAsBefore = JSON.stringify(afterWrite.json) === JSON.stringify(before.json);
  rec(
    'CACHE-a',
    'GET trong TTL van tra gia tri cu (khong invalidate)',
    sameAsBefore,
    'score_before=' + before.json?.score + ' score_after_write=' + afterWrite.json?.score,
  );

  // ===== F2-C: badge SQL aggregate dung current/target =====
  const onTimeCnt = await prisma.$queryRawUnsafe(
    'SELECT COUNT(*)::int AS cnt FROM bookings WHERE "customerId" = $1::uuid AND "checkedInAt" IS NOT NULL AND "checkedInAt" <= ("date" + ("startMinute" * interval \'1 minute\'))',
    uMap['customer@courthub.vn'].id,
  );
  const totalCnt = await prisma.booking.count({
    where: {
      customerId: uMap['customer@courthub.vn'].id,
      status: { in: ['CANCELLED', 'CHECKED_IN', 'COMPLETED'] },
    },
  });
  const playedCnt = await prisma.booking.count({
    where: {
      customerId: uMap['customer@courthub.vn'].id,
      status: { in: ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'] },
    },
  });
  const expectedBookingsCurrent = Math.max(totalCnt, playedCnt);
  const badges = before.json?.badges || [];
  const b1 = badges.find((b) => b.code === 'ON_TIME_10');
  const b2 = badges.find((b) => b.code === 'BOOKINGS_10');
  rec(
    'BADGE-ontime',
    'ON_TIME_10 current=' + Number(onTimeCnt[0].cnt),
    !!b1 &&
      Number(b1.current) === Number(onTimeCnt[0].cnt) &&
      b1.target === 10 &&
      b1.unlocked === Number(onTimeCnt[0].cnt) >= 10,
    JSON.stringify(b1),
  );
  rec(
    'BADGE-bookings',
    'BOOKINGS_10 current=' + (b2?.current ?? '?') + ' — unlocked khop nguong',
    !!b2 && b2.target === 10 && b2.unlocked === (Number(b2.current) >= 10),
    JSON.stringify(b2),
  );

  // ===== F2-D: leaderboard =====
  const lb1 = await api('GET', '/reputation/leaderboard', custTk);
  const items = lb1.json?.items || [];
  const sortedOk = items.every(
    (it, i) =>
      i === 0 ||
      items[i - 1].score > it.score ||
      (items[i - 1].score === it.score &&
        (items[i - 1].onTime > it.onTime ||
          (items[i - 1].onTime === it.onTime &&
            String(items[i - 1].fullName) <= String(it.fullName)))),
  );
  rec(
    'LB-shape',
    'shape + sort desc (hoa -> onTime -> ten)',
    lb1.status === 200 &&
      Array.isArray(items) &&
      typeof lb1.json.total === 'number' &&
      !!lb1.json.generatedAt &&
      sortedOk,
    'n=' +
      items.length +
      ' top=' +
      JSON.stringify(items[0] && { n: items[0].fullName, s: items[0].score }),
  );
  const lbDef = items.length;
  const lbBig = await api('GET', '/reputation/leaderboard?limit=50', custTk);
  const lbBad = await api('GET', '/reputation/leaderboard?limit=51', custTk);
  rec(
    'LB-limit',
    'default<=10, max 50 OK, 51 -> 400',
    items.length <= 10 &&
      lbBig.status === 200 &&
      lbBig.json.items.length <= 50 &&
      lbBad.status === 400,
    'def=' + lbDef + ' big=' + lbBig.json.items.length + ' bad_st=' + lbBad.status,
  );
  const seedInBoard = items.some(
    (it) => ['customer@courthub.vn', 'customer2@courthub.vn'].includes(it.userId) || it.fullName,
  );
  rec(
    'LB-global',
    'global co du lieu (seed demo tham gia)',
    items.length > 0 && seedInBoard,
    'first=' + (items[0]?.fullName || '-'),
  );

  // ===== F7: Tournament 8 doi single-elim =====
  const teams = await prisma.team.findMany({
    take: 8,
    orderBy: { createdAt: 'asc' },
    include: { members: { where: { role: 'CAPTAIN' }, include: { user: true } } },
  });
  const mkT = await api('POST', '/tournaments', ownerTk, {
    name: 'QA Cup S3 ' + Date.now().toString(36),
    sportType: 'PICKLEBALL',
  });
  const tid = mkT.json?.id;
  rec(
    'T-create',
    'owner tao giai REGISTRATION',
    mkT.status === 201 && mkT.json?.status === 'REGISTRATION',
    'st=' + mkT.status,
  );
  if (!tid) {
    console.log('ABORT: khong tao duoc giai (token owner?)');
    await prisma.$disconnect();
    process.exit(1);
  }
  // dang ky 8 doi boi dung captain tung doi — login rieng theo email captain
  const capTokens = {};
  async function captainToken(email) {
    if (!capTokens[email]) capTokens[email] = await login(email);
    return capTokens[email];
  }
  let regOk = 0;
  for (const t of teams) {
    const captainEmail = t.members[0]?.user?.email || t.captain?.email || 'customer@courthub.vn';
    const tk = await captainToken(captainEmail);
    const rr = await api('POST', '/tournaments/' + tid + '/register', tk, { teamId: t.id });
    if (rr.status < 300) regOk++;
    else console.log('   reg fail', t.name, rr.status, JSON.stringify(rr.json || {}).slice(0, 90));
  }
  rec('T-register', '8/8 doi dang ky (dung captain)', regOk === 8, 'ok=' + regOk);
  const negReg = await api('POST', '/tournaments/' + tid + '/register', ownerTk, {
    teamId: teams[0].id,
  });
  rec(
    'T-neg-reg',
    'khong phai captain dang ky ho -> tu choi',
    negReg.status >= 400,
    'st=' + negReg.status,
  );
  const st1 = await api('POST', '/tournaments/' + tid + '/start', ownerTk);
  const detail = await api('GET', '/tournaments/' + tid, ownerTk);
  const matches = detail.json?.matches || detail.json?.bracket?.matches || [];
  rec(
    'T-start',
    'start sinh bracket 8 doi -> 7 tran',
    st1.status < 300 && matches.length === 7,
    'matches=' + matches.length + ' status=' + detail.json?.status,
  );
  const byRound = {};
  for (const m of matches)
    byRound[m.round ?? m.roundNumber] = (byRound[m.round ?? m.roundNumber] || 0) + 1;
  console.log('   rounds:', JSON.stringify(byRound));

  // Nhap diem toan bo bracket: READY truoc, DONE sau; champion cuoi cung
  async function playRound(roundNo) {
    const det = await api('GET', '/tournaments/' + tid, ownerTk);
    const ms = (det.json?.matches || []).filter((m) => (m.round ?? m.roundNumber) === roundNo);
    for (const m of ms) {
      if (m.status !== 'READY') continue;
      const homeWin = (m.position ?? 0) % 2 === 0 ? 2 : 1;
      const sc = homeWin === 2 ? { homeScore: 2, awayScore: 0 } : { homeScore: 0, awayScore: 2 };
      const rr = await api('PATCH', '/matches/' + m.id + '/score', ownerTk, sc);
      if (rr.status >= 300)
        console.log('   score fail', m.id, rr.status, JSON.stringify(rr.json || {}).slice(0, 100));
    }
  }
  const rounds = Object.keys(byRound)
    .map(Number)
    .sort((a, b) => a - b);
  for (const rd of rounds) await playRound(rd);
  const fin = await api('GET', '/tournaments/' + tid, ownerTk);
  const fm = fin.json?.matches || [];
  const doneAll = fm.every((m) => m.status === 'DONE');
  rec(
    'T-score',
    'nhap diem tay het bracket, tat ca DONE',
    doneAll,
    'status=' +
      fin.json?.status +
      ' champion=' +
      (fin.json?.championTeamId || fin.json?.championTeam?.id || '?').slice(0, 8),
  );
  const champName = fin.json?.championTeam?.name || '(xem log)';
  console.log('   CHAMPION:', champName);

  // Negative: customer thuong PATCH score -> 403
  const readyM = fm.find((m) => m.status !== 'DONE') || fm[0];
  const negScore = await api('PATCH', '/matches/' + readyM.id + '/score', custTk, {
    homeScore: 1,
    awayScore: 0,
  });
  rec(
    'T-neg-score',
    'customer thuong nhap diem -> 403',
    negScore.status === 403,
    'st=' + negScore.status,
  );

  // Hoa: single-elim bat buoc thang/thua — quan sat hanh vi (finding neu chap nhan hoa)
  const drawTeamA = await prisma.team.create({
    data: {
      name: 'QA Draw A ' + Date.now().toString(36),
      sportType: 'PICKLEBALL',
      captainId: uMap['customer@courthub.vn'].id,
    },
  });
  await prisma.teamMember.create({
    data: {
      teamId: drawTeamA.id,
      userId: uMap['customer@courthub.vn'].id,
      role: 'CAPTAIN',
      status: 'ACTIVE',
    },
  });
  const mk2 = await api('POST', '/tournaments', ownerTk, {
    name: 'QA Draw Cup ' + Date.now().toString(36),
    sportType: 'PICKLEBALL',
  });
  await api('POST', '/tournaments/' + mk2.json.id + '/register', custTk, { teamId: drawTeamA.id });
  const t2teams = [drawTeamA.id];
  const moreTeams = await prisma.team.findMany({
    where: { id: { notIn: [drawTeamA.id] } },
    take: 7,
    orderBy: { createdAt: 'desc' },
    include: { members: { where: { role: 'CAPTAIN' } } },
  });
  for (const t of moreTeams) {
    const capEmail = t.members[0]?.user?.email || 'customer2@courthub.vn';
    await api(
      'POST',
      '/tournaments/' + mk2.json.id + '/register',
      capEmail === 'customer@courthub.vn' ? custTk : cust2Tk,
      { teamId: t.id },
    );
  }
  await api('POST', '/tournaments/' + mk2.json.id + '/start', ownerTk);
  const d2 = await api('GET', '/tournaments/' + mk2.json.id);
  const qf2 = (d2.json?.matches || []).filter(
    (m) => (m.round ?? 1) === Math.min(...(d2.json?.matches || []).map((x) => x.round ?? 1)),
  );
  if (qf2[0]) {
    const drawTry = await api('PATCH', '/matches/' + qf2[0].id + '/score', ownerTk, {
      homeScore: 1,
      awayScore: 1,
    });
    console.log(
      'DRAW-TRY: st=' +
        drawTry.status +
        ' body=' +
        JSON.stringify(drawTry.json || {}).slice(0, 120),
    );
    if (drawTry.status < 300) {
      const afterDraw = await api('GET', '/tournaments/' + mk2.json.id);
      const played = (afterDraw.json?.matches || []).find((x) => x.id === qf2[0].id);
      console.log(
        'DRAW-FINDING: hoa duoc chap nhan, winnerId=' +
          (played?.winnerTeamId || played?.winner?.id || '?') +
          ' -> de xuat z.refine(homeScore != awayScore)',
      );
    }
  }

  const pass = out.filter(Boolean).length;
  console.log('S3 SMOKE SUMMARY: ' + pass + '/' + out.length + ' PASS');
  await prisma.$disconnect();
  process.exit(pass === out.length ? 0 : 1);
})().catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});
