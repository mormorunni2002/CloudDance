export function clampPage(page?: string | number | null) {
  const parsed = Number(page);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.floor(parsed);
}

export function getPagination(skipPage: number, pageSize = 25) {
  const take = pageSize;
  const skip = (skipPage - 1) * pageSize;
  return { take, skip };
}
