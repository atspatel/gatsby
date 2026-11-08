import { useEffect, useMemo, useRef, useState } from 'react'
import { photoUrl } from '../format'

function CollageShot({ photo, wide, listingName, onOpen }) {
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
    <button type="button" className="shot" onClick={() => onOpen(visible.url)}>
      {previous && <img src={photoUrl(previous.url, size)} alt="" />}
      <img
        key={visible.url}
        className={previous ? 'is-entering' : undefined}
        src={photoUrl(visible.url, size)}
        alt={`${visible.room} at ${listingName}`}
        onAnimationEnd={(event) => {
          if (event.animationName === 'shot-enter') setPrevious(null)
        }}
      />
    </button>
  )
}

export default function Gallery({ listing, gallery, setGallery }) {
  const photos = useMemo(
    () =>
      listing.photos.by_room.flatMap((room) =>
        room.photos.map((url) => ({ url, room: room.name })),
      ),
    [listing],
  )
  const mosaic = useMemo(() => {
    const chosen = []
    const seen = new Set()
    const add = (url, room) => {
      if (!url || seen.has(url) || chosen.length >= 5) return
      seen.add(url)
      chosen.push(photos.find((photo) => photo.url === url) || { url, room: room || 'Photo' })
    }

    add(listing.photos.cover, 'Photo')
    listing.photos.by_room.forEach((room) => add(room.photos[0], room.name))
    photos.forEach((photo) => add(photo.url, photo.room))
    return chosen
  }, [listing, photos])

  const [frames, setFrames] = useState(mosaic)
  const hold = useRef(false)
  const lastSlot = useRef(-1)

  useEffect(() => {
    setFrames(mosaic)
  }, [mosaic])

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motion.matches || gallery.open || photos.length <= frames.length) return undefined
    let timer = 0
    const tick = () => {
      const wait = 1200 + Math.random() * 1000
      timer = window.setTimeout(() => {
        if (!hold.current && !document.hidden) {
          setFrames((current) => {
            let slot = Math.floor(Math.random() * current.length)
            if (current.length > 1 && slot === lastSlot.current) {
              slot = (slot + 1) % current.length
            }
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
  }, [gallery.open, photos, frames.length])

  const rooms = ['All', ...listing.photos.by_room.map((room) => room.name)]
  const visible = gallery.room === 'All' ? photos : photos.filter((photo) => photo.room === gallery.room)
  const index = Math.min(gallery.index, Math.max(visible.length - 1, 0))
  const current = visible[index]
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!gallery.open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') setGallery((state) => ({ ...state, open: false }))
      if (event.key === 'ArrowRight') {
        setGallery((state) => ({
          ...state,
          index: (state.index + 1) % visible.length,
        }))
      }
      if (event.key === 'ArrowLeft') {
        setGallery((state) => ({
          ...state,
          index: (state.index - 1 + visible.length) % visible.length,
        }))
      }
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [gallery.open, setGallery, visible.length])

  function openAt(url) {
    const match = photos.findIndex((photo) => photo.url === url)
    setGallery({ open: true, room: 'All', index: Math.max(match, 0) })
  }

  function step(direction) {
    setGallery((state) => ({
      ...state,
      index: (state.index + direction + visible.length) % visible.length,
    }))
  }

  return (
    <section className="gallery-wrap" aria-label="Photos">
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
        {frames.map((photo, photoIndex) => (
          <CollageShot
            key={photoIndex}
            photo={photo}
            wide={photoIndex === 0}
            listingName={listing.name}
            onOpen={openAt}
          />
        ))}
        <button type="button" className="show-all" onClick={() => openAt(photos[0].url)}>
          Show all {photos.length} photos
        </button>
      </div>

      {gallery.open && current && (
        <div className="lightbox" role="presentation" onClick={() => setGallery((state) => ({ ...state, open: false }))}>
          <div
            className="lightbox-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Photo tour"
            tabIndex={-1}
            ref={dialogRef}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="lightbox-bar">
              <p>
                {current.room}
                <span>
                  {index + 1} / {visible.length}
                </span>
              </p>
              <button type="button" className="text-button" onClick={() => setGallery((state) => ({ ...state, open: false }))}>
                Close
              </button>
            </div>
            <div className="room-chips" role="tablist" aria-label="Rooms">
              {rooms.map((room) => (
                <button
                  key={room}
                  type="button"
                  role="tab"
                  aria-selected={gallery.room === room}
                  className={gallery.room === room ? 'chip on' : 'chip'}
                  onClick={() => setGallery({ open: true, room, index: 0 })}
                >
                  {room}
                </button>
              ))}
            </div>
            <div className="lightbox-stage">
              <button type="button" className="nav-arrow" onClick={() => step(-1)} aria-label="Previous photo">
                ‹
              </button>
              <img src={photoUrl(current.url, 1600)} alt={`${current.room} photo ${index + 1}`} />
              <button type="button" className="nav-arrow" onClick={() => step(1)} aria-label="Next photo">
                ›
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
