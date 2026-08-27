export interface ClubRankingItem {
  rank: number;
  teamId: string;
  teamName: string;
  sportType: string;
  city: string;
  eloScore: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  titlesCount: number;
}

export interface AthleteRankingItem {
  rank: number;
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  sportType: string;
  city: string;
  reputationScore: number;
  matchesPlayed: number;
  mvpCount: number;
  fairPlayBadge: string;
}

const MOCK_CLUB_RANKINGS: ClubRankingItem[] = [
  {
    rank: 1,
    teamId: 'team-1',
    teamName: 'SanGo Warriors FC',
    sportType: 'FOOTBALL7',
    city: 'Hà Nội',
    eloScore: 1850,
    matchesPlayed: 24,
    wins: 20,
    draws: 2,
    losses: 2,
    winRate: 83.3,
    titlesCount: 3,
  },
  {
    rank: 2,
    teamId: 'team-2',
    teamName: 'Cầu Giấy Thunder',
    sportType: 'FOOTBALL7',
    city: 'Hà Nội',
    eloScore: 1780,
    matchesPlayed: 22,
    wins: 17,
    draws: 3,
    losses: 2,
    winRate: 77.2,
    titlesCount: 2,
  },
  {
    rank: 3,
    teamId: 'team-3',
    teamName: 'Sài Gòn Dinks Club',
    sportType: 'PICKLEBALL',
    city: 'TP. Hồ Chí Minh',
    eloScore: 1720,
    matchesPlayed: 18,
    wins: 14,
    draws: 1,
    losses: 3,
    winRate: 77.8,
    titlesCount: 2,
  },
  {
    rank: 4,
    teamId: 'team-4',
    teamName: 'Ba Đình Smashers',
    sportType: 'BADMINTON',
    city: 'Hà Nội',
    eloScore: 1690,
    matchesPlayed: 20,
    wins: 15,
    draws: 0,
    losses: 5,
    winRate: 75.0,
    titlesCount: 1,
  },
  {
    rank: 5,
    teamId: 'team-5',
    teamName: 'Thanh Xuân United',
    sportType: 'FOOTBALL7',
    city: 'Hà Nội',
    eloScore: 1640,
    matchesPlayed: 19,
    wins: 12,
    draws: 4,
    losses: 3,
    winRate: 63.1,
    titlesCount: 1,
  },
  {
    rank: 6,
    teamId: 'team-6',
    teamName: 'Quận 1 Ace Tennis',
    sportType: 'TENNIS',
    city: 'TP. Hồ Chí Minh',
    eloScore: 1610,
    matchesPlayed: 15,
    wins: 10,
    draws: 1,
    losses: 4,
    winRate: 66.7,
    titlesCount: 0,
  },
];

const MOCK_ATHLETE_RANKINGS: AthleteRankingItem[] = [
  {
    rank: 1,
    userId: 'u-1',
    fullName: 'Trần Đức Người Chơi',
    sportType: 'FOOTBALL7',
    city: 'Hà Nội',
    reputationScore: 100,
    matchesPlayed: 32,
    mvpCount: 14,
    fairPlayBadge: 'Huyền Thoại Fair-Play',
  },
  {
    rank: 2,
    userId: 'u-2',
    fullName: 'Nguyễn Thành Long',
    sportType: 'FOOTBALL7',
    city: 'Hà Nội',
    reputationScore: 100,
    matchesPlayed: 28,
    mvpCount: 11,
    fairPlayBadge: 'Đội Trưởng Mẫu Mực',
  },
  {
    rank: 3,
    userId: 'u-3',
    fullName: 'Ngô Thuỳ Linh',
    sportType: 'PICKLEBALL',
    city: 'TP. Hồ Chí Minh',
    reputationScore: 99,
    matchesPlayed: 25,
    mvpCount: 10,
    fairPlayBadge: 'Tay Vợt Xuất Sắc',
  },
  {
    rank: 4,
    userId: 'u-4',
    fullName: 'Phạm Minh Tuấn',
    sportType: 'FOOTBALL7',
    city: 'Hà Nội',
    reputationScore: 99,
    matchesPlayed: 22,
    mvpCount: 8,
    fairPlayBadge: 'Chiến Binh Sân Cỏ',
  },
  {
    rank: 5,
    userId: 'u-5',
    fullName: 'Lê Hoàng Nam',
    sportType: 'BADMINTON',
    city: 'Hà Nội',
    reputationScore: 98,
    matchesPlayed: 20,
    mvpCount: 7,
    fairPlayBadge: 'Tinh Thần Thể Thao',
  },
];

export async function getClubRankingsApi(params?: {
  sportType?: string;
  city?: string;
}): Promise<ClubRankingItem[]> {
  let list = [...MOCK_CLUB_RANKINGS];
  if (params?.sportType && params.sportType !== 'ALL') {
    list = list.filter((item) => item.sportType.includes(params.sportType!));
  }
  if (params?.city && params.city !== 'ALL') {
    list = list.filter((item) => item.city === params.city);
  }
  return list;
}

export async function getAthleteRankingsApi(params?: {
  sportType?: string;
  city?: string;
}): Promise<AthleteRankingItem[]> {
  let list = [...MOCK_ATHLETE_RANKINGS];
  if (params?.sportType && params.sportType !== 'ALL') {
    list = list.filter((item) => item.sportType.includes(params.sportType!));
  }
  if (params?.city && params.city !== 'ALL') {
    list = list.filter((item) => item.city === params.city);
  }
  return list;
}
