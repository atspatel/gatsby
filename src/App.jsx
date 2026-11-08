import { useEffect, useState } from 'react'
import catalog from './data/listings.json'
import About from './components/About'
import Catalog from './components/Catalog'
import StayPage from './components/StayPage'
import { emptyFilters } from './filters'

function listingIdFromHash() {
  return window.location.hash.replace(/^#/, '')
}

export default function App() {
  const [listingId, setListingId] = useState(listingIdFromHash)
  const [filters, setFilters] = useState(emptyFilters)
  const listing = catalog.listings.find((item) => item.listing_id === listingId)

  useEffect(() => {
    const onHashChange = () => setListingId(listingIdFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [listingId])

  if (listingId === 'about') return <About catalog={catalog} />
  if (!listing) return <Catalog catalog={catalog} filters={filters} onFilters={setFilters} />
  return <StayPage listing={listing} company={catalog.company} />
}
