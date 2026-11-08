import { photoUrl } from '../format'

export default function Catalog({ catalog }) {
  const { company, listings } = catalog
  const countLabel = listings.length === 1 ? '1 home' : `${listings.length} homes`

  return (
    <>
      <header className="site-header">
        <a className="brand" href="#homes">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <strong>{company.name}</strong>
            <small>Homes</small>
          </span>
        </a>
      </header>
      <main className="page catalog" id="homes">
        <p className="eyebrow">{company.name}</p>
        <h1>Homes managed by {company.name}</h1>
        <p className="lead">
          {countLabel}. {company.role}.
        </p>
        <div className="catalog-grid">
          {listings.map((listing) => (
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
      </main>
      <footer className="site-footer">
        <p>{company.name} manages these homes.</p>
      </footer>
    </>
  )
}
