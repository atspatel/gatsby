import { useState } from 'react'
import Gallery from './Gallery'
import BookingCard from './BookingCard'
import Content from './Content'
import RichText from './RichText'

export default function StayPage({ listing, company }) {
  const [gallery, setGallery] = useState({ open: false, room: 'All', index: 0 })
  const { capacity, rating, location } = listing

  return (
    <>
      <a className="skip" href="#overview">
        Skip to stay details
      </a>
      <header className="site-header">
        <a className="brand" href="#homes">
          <span className="brand-mark" aria-hidden="true" />
          <span>
            <strong>{company.name}</strong>
            <small>All homes</small>
          </span>
        </a>
        <nav aria-label="On this page">
          <a href="#overview">Overview</a>
          <a href="#spaces">Spaces</a>
          <a href="#amenities">Amenities</a>
          <a href="#location">Location</a>
          <a href="#host">Host</a>
        </nav>
      </header>

      <main id="top">
        <Gallery listing={listing} gallery={gallery} setGallery={setGallery} />
        <div className="page">
          <header className="title-block" id="overview">
            <p className="eyebrow">
              {listing.overview} · managed by {company.name}
            </p>
            <h1>{listing.name}</h1>
            <p className="meta">
              {rating.count > 0 ? (
                <>
                  <span className="stars" aria-hidden="true">
                    {'★'.repeat(Math.round(rating.average))}
                    {'☆'.repeat(5 - Math.round(rating.average))}
                  </span>
                  <strong>{rating.average.toFixed(1)}</strong>
                  <span>{rating.count} reviews</span>
                </>
              ) : (
                <span>New</span>
              )}
              <span className="sep" aria-hidden="true" />
              <span>{location.subtitle}</span>
            </p>
            <ul className="facts">
              {[
                [capacity.guests, 'guests'],
                [capacity.bedrooms, 'bedrooms'],
                [capacity.beds, 'beds'],
                [capacity.bathrooms, 'bathrooms'],
              ]
                .filter(([value]) => value != null)
                .map(([value, label]) => (
                  <li key={label}>
                    <b>{value}</b> {label}
                  </li>
                ))}
            </ul>
          </header>

          <div className="intro-stack">
            <section className="highlight-list" aria-label="Highlights">
              {listing.highlights.map((item) => (
                <article key={item.headline}>
                  <h2>{item.headline}</h2>
                  <RichText text={item.body} />
                </article>
              ))}
            </section>
            <BookingCard listing={listing} />
          </div>
          <Content
            listing={listing}
            onOpenRoom={(room) => setGallery({ open: true, room, index: 0 })}
          />
        </div>
      </main>

      <footer className="site-footer">
        <p>
          {company.name} manages {listing.name}.
        </p>
        <a href={listing.url} target="_blank" rel="noreferrer">
          View the original listing
        </a>
      </footer>
    </>
  )
}
