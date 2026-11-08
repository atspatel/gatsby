const PLACE_ORDER = ['Gurugram', 'Hills', 'Goa']
const TYPE_ORDER = ['Apartment', 'Condo', 'Treehouse', 'Villa', 'Dome', 'Tiny house']
const GUEST_OPTIONS = ['Any', '2', '3+', '4+']

const AMENITY_FILTERS = [
  ['kitchen', 'Kitchen', 'Kitchen'],
  ['workspace', 'Workspace', 'Dedicated workspace'],
  ['parking', 'Free parking', 'Free parking on premises'],
  ['balcony', 'Balcony', 'Patio or balcony'],
  ['pool', 'Pool', 'Pool'],
  ['hotTub', 'Hot tub', 'Hot tub'],
  ['washer', 'Washer', 'Washing machine'],
]

const TYPE_LABELS = {
  APARTMENT: 'Apartment',
  CONDOMINIUM: 'Condo',
  TREEHOUSE: 'Treehouse',
  VILLA: 'Villa',
  DOME: 'Dome',
  TINY_HOUSE: 'Tiny house',
}

export const emptyFilters = {
  place: 'All',
  type: 'All',
  guests: 'Any',
  pets: false,
  favorite: false,
  amenities: [],
}

export function placeOf(listing) {
  const text = `${listing.location?.city || ''} ${listing.location?.subtitle || ''}`.toLowerCase()
  if (/goa|arpora/.test(text)) return 'Goa'
  if (/jibhi|manali|himachal|dharmpur|dharampur|kasauli|tandi/.test(text)) return 'Hills'
  return 'Gurugram'
}

export function typeOf(listing) {
  return TYPE_LABELS[listing.property_type] || listing.property_type || 'Home'
}

export function hasAmenity(listing, title) {
  return (listing.amenities || []).some(
    (group) =>
      group.group !== 'Not included' &&
      (group.amenities || []).some((item) => item.title === title && item.available !== false),
  )
}

function guestMatch(guests, choice) {
  if (choice === 'Any') return true
  if (choice === '2') return guests === 2
  if (choice === '3+') return guests >= 3
  if (choice === '4+') return guests >= 4
  return true
}

export function matchesFilters(listing, filters) {
  if (filters.place !== 'All' && placeOf(listing) !== filters.place) return false
  if (filters.type !== 'All' && typeOf(listing) !== filters.type) return false
  if (!guestMatch(listing.capacity?.guests || 0, filters.guests)) return false
  if (filters.pets && !listing.pets?.allowed) return false
  if (filters.favorite && !listing.rating?.guest_favorite) return false
  return filters.amenities.every((key) => {
    const amenity = AMENITY_FILTERS.find(([id]) => id === key)
    return amenity ? hasAmenity(listing, amenity[2]) : true
  })
}

export function filterListings(listings, filters) {
  return listings.filter((listing) => matchesFilters(listing, filters))
}

export function selectedFilters(filters) {
  const picked = []
  if (filters.place !== 'All') picked.push({ id: 'place', label: filters.place })
  if (filters.type !== 'All') picked.push({ id: 'type', label: filters.type })
  if (filters.guests !== 'Any') picked.push({ id: 'guests', label: `${filters.guests} guests` })
  if (filters.pets) picked.push({ id: 'pets', label: 'Pets' })
  if (filters.favorite) picked.push({ id: 'favorite', label: 'Guest favourite' })
  for (const key of filters.amenities) {
    const amenity = AMENITY_FILTERS.find(([id]) => id === key)
    if (amenity) picked.push({ id: key, label: amenity[1] })
  }
  return picked
}

export function filtersActive(filters) {
  return (
    filters.place !== 'All' ||
    filters.type !== 'All' ||
    filters.guests !== 'Any' ||
    filters.pets ||
    filters.favorite ||
    filters.amenities.length > 0
  )
}

export function filterChoices(listings) {
  const places = new Set(listings.map(placeOf))
  const types = new Set(listings.map(typeOf))
  return {
    places: ['All', ...PLACE_ORDER.filter((place) => places.has(place))],
    types: ['All', ...TYPE_ORDER.filter((type) => types.has(type))],
    guests: GUEST_OPTIONS,
    amenities: AMENITY_FILTERS.map(([id, label]) => ({ id, label })),
  }
}
