/** Bỏ dấu tiếng Việt -> slug URL thân thiện, vd "Sân bóng Ngọc Khánh" -> "san-bong-ngoc-khanh". */
export function vnSlugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/** Đảm bảo slug duy nhất: thử gốc rồi gạch nối với hậu tố ngẫu nhiên. */
export async function uniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const root = vnSlugify(base) || 'venue';
  if (!(await exists(root))) return root;
  for (let i = 0; i < 5; i++) {
    const candidate = `${root}-${Math.random().toString(36).slice(2, 8)}`;
    if (!(await exists(candidate))) return candidate;
  }
  return `${root}-${Date.now().toString(36)}`;
}
