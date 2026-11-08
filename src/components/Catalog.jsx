import { useEffect, useRef, useState } from 'react'
import { SiteFooter, SiteHeader } from './Brand'
import { photoUrl } from '../format'
import { emptyFilters, filterChoices, filterListings, filtersActive, selectedFilters } from '../filters'

function ChoiceRow({ label, options, value, onChange }) {
  return (
    <fieldset className="filter-row">
      <legend>{label}</legend>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={value === option ? 'filter-chip on' : 'filter-chip'}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </fieldset>
  )
}

function activeCount(filters) {
  return (
    (filters.place !== 'All' ? 1 : 0) +
    (filters.type !== 'All' ? 1 : 0) +
    (filters.guests !== 'Any' ? 1 : 0) +
    (filters.pets ? 1 : 0) +
    (filters.favorite ? 1 : 0) +
    filters.amenities.length
  )
}

export default function Catalog({ catalog, filters, onFilters }) {
  const { company, listings } = catalog
  const choices = filterChoices(listings)
  const visible = filterListings(listings, filters)
  const active = filtersActive(filters)
  const picked = selectedFilters(filters)
  const noun = listings.length === 1 ? 'home' : 'homes'
  const countLabel = active ? `${visible.length} of ${listings.length} ${noun}` : `${listings.length} ${noun}`
  const showLabel = visible.length === 0 ? 'No matching homes' : `Show ${visible.length} ${visible.length === 1 ? 'home' : 'homes'}`
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    panelRef.current?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
      triggerRef.current?.focus()
    }
  }, [open])

  function removeFilter(id) {
    if (id === 'place') onFilters({ ...filters, place: 'All' })
    else if (id === 'type') onFilters({ ...filters, type: 'All' })
    else if (id === 'guests') onFilters({ ...filters, guests: 'Any' })
    else if (id === 'pets') onFilters({ ...filters, pets: false })
    else if (id === 'favorite') onFilters({ ...filters, favorite: false })
    else onFilters({ ...filters, amenities: filters.amenities.filter((item) => item !== id) })
  }

  function toggle(key) {
    const amenities = filters.amenities.includes(key)
      ? filters.amenities.filter((item) => item !== key)
      : [...filters.amenities, key]
    onFilters({ ...filters, amenities })
  }

  return (
    <>
      <SiteHeader company={company} />
      <main className="page catalog" id="homes">
        <p className="eyebrow">{company.name}</p>
        <h1>Stay with {company.name}</h1>
        <p className="lead">
          {countLabel}. {company.tagline}
        </p>
        <div className="filter-bar">
          <button
            ref={triggerRef}
            type="button"
            className={active ? 'filter-open on' : 'filter-open'}
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            Filters
            {active && <span>{activeCount(filters)}</span>}
          </button>
          {picked.map((item) => (
            <button
              key={item.id}
              type="button"
              className="filter-picked"
              aria-label={`Remove ${item.label}`}
              onClick={() => removeFilter(item.id)}
            >
              {item.label}
              <span aria-hidden="true">×</span>
            </button>
          ))}
          {active && (
            <button type="button" className="text-button dark filter-clear" onClick={() => onFilters(emptyFilters)}>
              Clear
            </button>
          )}
        </div>
        {open && (
          <div className="filter-pop" role="presentation" onClick={() => setOpen(false)}>
            <div
              ref={panelRef}
              className="filter-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="filter-title"
              tabIndex={-1}
              onClick={(event) => event.stopPropagation()}
            >
              <header>
                <h2 id="filter-title">Filters</h2>
                <button type="button" className="filter-close" aria-label="Close filters" onClick={() => setOpen(false)}>
                  ×
                </button>
              </header>
              <div className="filters">
                <ChoiceRow label="Place" options={choices.places} value={filters.place} onChange={(place) => onFilters({ ...filters, place })} />
                <ChoiceRow label="Type" options={choices.types} value={filters.type} onChange={(type) => onFilters({ ...filters, type })} />
                <ChoiceRow label="Guests" options={choices.guests} value={filters.guests} onChange={(guests) => onFilters({ ...filters, guests })} />
                <fieldset className="filter-row">
                  <legend>Also</legend>
                  <button
                    type="button"
                    className={filters.pets ? 'filter-chip on' : 'filter-chip'}
                    aria-pressed={filters.pets}
                    onClick={() => onFilters({ ...filters, pets: !filters.pets })}
                  >
                    Pets
                  </button>
                  <button
                    type="button"
                    className={filters.favorite ? 'filter-chip on' : 'filter-chip'}
                    aria-pressed={filters.favorite}
                    onClick={() => onFilters({ ...filters, favorite: !filters.favorite })}
                  >
                    Guest favourite
                  </button>
                  {choices.amenities.map((amenity) => (
                    <button
                      key={amenity.id}
                      type="button"
                      className={filters.amenities.includes(amenity.id) ? 'filter-chip on' : 'filter-chip'}
                      aria-pressed={filters.amenities.includes(amenity.id)}
                      onClick={() => toggle(amenity.id)}
                    >
                      {amenity.label}
                    </button>
                  ))}
                </fieldset>
              </div>
              <footer className="filter-foot">
                <button
                  type="button"
                  className="text-button dark filter-clear"
                  disabled={!active}
                  onClick={() => onFilters(emptyFilters)}
                >
                  Clear
                </button>
                <button type="button" className="solid-button" onClick={() => setOpen(false)}>
                  {showLabel}
                </button>
              </footer>
            </div>
          </div>
        )}
        {visible.length === 0 ? (
          <p className="empty-filters">No homes match these filters.</p>
        ) : (
          <div className="catalog-grid">
            {visible.map((listing) => (
              <a key={listing.listing_id} className="stay-card" href={`#${listing.listing_id}`}>
                <img src={photoUrl(listing.photos.cover, 720)} alt="" />
                <div>
                  <p className="eyebrow">{listing.location.city}</p>
                  <h2>{listing.name}</h2>
                  <p>
                    {[
                      listing.capacity.guests != null && `${listing.capacity.guests} guests`,
                      listing.capacity.bedrooms != null && `${listing.capacity.bedrooms} bedrooms`,
                      listing.capacity.beds != null && `${listing.capacity.beds} beds`,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <p className="quiet">
                    {listing.rating.count > 0
                      ? `${listing.rating.average.toFixed(1)} · ${listing.rating.count} reviews`
                      : 'New'}
                  </p>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
      <SiteFooter company={company} />
    </>
  )
}
