export function uniqueHosts(listings) {
  const hosts = new Map()
  for (const listing of listings) {
    const picture = listing.host?.profile_picture_url || ''
    const id = picture.match(/User-(\d+)/)?.[1] || listing.host?.name
    if (!id || !listing.host) continue
    if (!hosts.has(id)) hosts.set(id, { ...listing.host, id, homes: 0 })
    hosts.get(id).homes += 1
  }
  return [...hosts.values()].sort((a, b) => b.homes - a.homes || a.name.localeCompare(b.name))
}
