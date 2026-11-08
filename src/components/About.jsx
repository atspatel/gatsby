import { useEffect, useMemo, useRef, useState } from 'react'
import { photoUrl } from '../format'
import { uniqueHosts } from '../hosts'
import { SiteFooter, SiteHeader } from './Brand'
import RichText from './RichText'

function sample(list, count) {
  const copy = list.slice()
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1))
    ;[copy[index], copy[swap]] = [copy[swap], copy[index]]
  }
  return copy.slice(0, count)
}

function catalogPhotos(listings) {
  const photos = []
  const seen = new Set()
  for (const listing of listings) {
    const add = (url, room) => {
      if (!url || seen.has(url)) return
      seen.add(url)
      photos.push({
        url,
        room: room || 'Photo',
        listingId: listing.listing_id,
        listingName: listing.name,
      })
    }
    add(listing.photos?.cover, 'Photo')
    for (const room of listing.photos?.by_room || []) {
      for (const url of room.photos || []) add(url, room.name)
    }
  }
  return photos
}

function AboutShot({ photo, wide }) {
  const [visible, setVisible] = useState(photo)
  const [previous, setPrevious] = useState(null)
  const visibleRef = useRef(photo)
  const size = wide ? 1440 : 960

  useEffect(() => {
    if (!photo?.url || photo.url === visibleRef.current.url) return undefined
    let cancel = false
    const incoming = new Image()
    const shown = visibleRef.current
    incoming.onload = () => {
      if (cancel) return
      visibleRef.current = photo
      setPrevious(shown)
      setVisible(photo)
    }
    incoming.src = photoUrl(photo.url, size)
    return () => {
      cancel = true
    }
  }, [photo, size])

  return (
    <a className="shot" href={`#${visible.listingId}`}>
      {previous && <img src={photoUrl(previous.url, size)} alt="" />}
      <img
        key={visible.url}
        className={previous ? 'is-entering' : undefined}
        src={photoUrl(visible.url, size)}
        alt={`${visible.room} at ${visible.listingName}`}
        onAnimationEnd={(event) => {
          if (event.animationName === 'shot-enter') setPrevious(null)
        }}
      />
    </a>
  )
}

function AboutCollage({ listings }) {
  const photos = useMemo(() => catalogPhotos(listings), [listings])
  const [frames, setFrames] = useState(() => sample(photos, 5))
  const hold = useRef(false)
  const lastSlot = useRef(-1)

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches || photos.length <= frames.length) return undefined
    let timer = 0
    const tick = () => {
      const wait = 1200 + Math.random() * 1000
      timer = window.setTimeout(() => {
        if (!hold.current && !document.hidden) {
          setFrames((current) => {
            let slot = Math.floor(Math.random() * current.length)
            if (current.length > 1 && slot === lastSlot.current) slot = (slot + 1) % current.length
            lastSlot.current = slot
            const used = new Set(current.map((item) => item.url))
            const pool = photos.filter((item) => !used.has(item.url))
            if (pool.length === 0) return current
            const next = pool[Math.floor(Math.random() * pool.length)]
            const copy = current.slice()
            copy[slot] = next
            return copy
          })
        }
        tick()
      }, wait)
    }
    tick()
    return () => window.clearTimeout(timer)
  }, [photos, frames.length])

  return (
    <section className="gallery-wrap" aria-label="Photos from the homes">
      <div
        className="mosaic"
        onMouseEnter={() => {
          hold.current = true
        }}
        onMouseLeave={() => {
          hold.current = false
        }}
        onFocusCapture={() => {
          hold.current = true
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) hold.current = false
        }}
      >
        {frames.map((photo, index) => (
          <AboutShot key={index} photo={photo} wide={index === 0} />
        ))}
      </div>
    </section>
  )
}

export default function About({ catalog }) {
  const { company, listings } = catalog
  const hosts = uniqueHosts(listings)

  return (
    <>
      <SiteHeader company={company} current="about" />
      <AboutCollage listings={listings} />
      <main className="page">
        <p className="eyebrow">{company.name}</p>
        <h1>About us</h1>
        <div className="about-copy">
          <p>
            {company.tagline} {company.name} manages every home in this collection.
          </p>
          <p>
            {hosts.length} hosts run them. They look after the listing, the handover, and the stay.
          </p>
        </div>
        <h2>The hosts</h2>
        <div className="host-list">
          {hosts.map((host) => (
            <article key={host.id} className="host-card">
              <div className="host-head">
                <img src={host.profile_picture_url} alt="" />
                <div>
                  <h3>{host.name}</h3>
                  <p className="host-badges">
                    <span>
                      {host.homes} {host.homes === 1 ? 'home' : 'homes'}
                    </span>
                    {host.is_superhost && <span className="superhost">Superhost</span>}
                    {host.is_verified && <span>Identity verified</span>}
                  </p>
                </div>
              </div>
              <ul className="host-stats">
                <li>
                  <strong>{host.reviews}</strong>
                  <span>Reviews</span>
                </li>
                <li>
                  <strong>{host.rating}</strong>
                  <span>Rating</span>
                </li>
                <li>
                  <strong>{host.years_hosting}</strong>
                  <span>{String(host.years_hosting) === '1' ? 'Year hosting' : 'Years hosting'}</span>
                </li>
              </ul>
              {(host.response_rate || host.response_time) && (
                <p className="host-response">
                  {host.response_rate}
                  {host.response_time ? ` · ${host.response_time}` : ''}
                </p>
              )}
              {host.about && <RichText text={host.about} />}
              {host.highlights?.length > 0 && (
                <ul className="host-chips">
                  {host.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </main>
      <SiteFooter company={company} />
    </>
  )
}
