const ANIME_CATEGORY_CONFIG = [
  { id: 'dragon-ball', name: '드래곤볼', searchTitle: 'Dragon Ball' },
  { id: 'one-piece', name: '원피스', searchTitle: 'One Piece' },
  { id: 'naruto', name: '나루토', searchTitle: 'Naruto' },
  { id: 'bleach', name: '블리치', searchTitle: 'Bleach' },
  { id: 'demon-slayer', name: '귀멸의 칼날', searchTitle: 'Demon Slayer' },
  { id: 'jujutsu-kaisen', name: '주술회전', searchTitle: 'Jujutsu Kaisen' },
  { id: 'chainsaw-man', name: '체인소 맨', searchTitle: 'Chainsaw Man' },
  { id: 'attack-on-titan', name: '진격의 거인', searchTitle: 'Attack on Titan' },
  { id: 'fullmetal-alchemist', name: '강철의 연금술사', searchTitle: 'Fullmetal Alchemist: Brotherhood' },
  { id: 'jojo', name: '죠죠의 기묘한 모험', searchTitle: "JoJo's Bizarre Adventure" },
  { id: 'my-hero-academia', name: '나의 히어로 아케데미아', searchTitle: 'My Hero Academia' },
];

const anilistCache = new Map();

async function fetchAniListPoster(searchTitle) {
  if (anilistCache.has(searchTitle)) {
    return anilistCache.get(searchTitle);
  }

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      query: `
        query ($search: String) {
          Media(search: $search, type: ANIME) {
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
              color
            }
            bannerImage
          }
        }
      `,
      variables: { search: searchTitle },
    }),
  });

  if (!response.ok) {
    throw new Error(`AniList responded with ${response.status}`);
  }

  const payload = await response.json();
  const media = payload?.data?.Media;
  const result = {
    imageUrl: media?.bannerImage || media?.coverImage?.extraLarge || media?.coverImage?.large || null,
    accentColor: media?.coverImage?.color || '#D4AF37',
  };

  anilistCache.set(searchTitle, result);
  return result;
}

async function fetchAnimeCategories() {
  const settled = await Promise.allSettled(
    ANIME_CATEGORY_CONFIG.map(async (anime) => {
      try {
        const poster = await fetchAniListPoster(anime.searchTitle);
        return {
          id: anime.id,
          name: anime.name,
          query: `${anime.name} 쿠지`,
          imageUrl: poster.imageUrl,
          accentColor: poster.accentColor,
        };
      } catch {
        return {
          id: anime.id,
          name: anime.name,
          query: `${anime.name} 쿠지`,
          imageUrl: null,
          accentColor: '#D4AF37',
        };
      }
    }),
  );

  return settled.map((entry, index) =>
    entry.status === 'fulfilled'
      ? entry.value
      : {
          id: ANIME_CATEGORY_CONFIG[index].id,
          name: ANIME_CATEGORY_CONFIG[index].name,
          query: `${ANIME_CATEGORY_CONFIG[index].name} 쿠지`,
          imageUrl: null,
          accentColor: '#D4AF37',
        },
  );
}

module.exports = {
  ANIME_CATEGORY_CONFIG,
  fetchAnimeCategories,
};
