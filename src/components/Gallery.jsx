import { useEffect, useMemo, useRef } from 'react'
import { photoUrl } from '../format'

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
      <div className="mosaic">
        {mosaic.map((photo, photoIndex) => (
          <button
            key={photo.url}
            type="button"
            className="shot"
            onClick={() => openAt(photo.url)}
          >
            <img
              src={photoUrl(photo.url, photoIndex === 0 ? 1600 : 900)}
              alt={`${photo.room} at ${listing.name}`}
            />
          </button>
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
