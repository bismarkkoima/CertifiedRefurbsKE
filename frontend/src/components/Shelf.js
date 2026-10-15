'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Icon from './Icon'

// Horizontally scrolling, snap-aligned carousel with prev/next controls.
export default function Shelf({ children, variant = '', label }) {
  const track = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const update = useCallback(() => {
    const el = track.current
    if (!el) return
    setEdges({ start: el.scrollLeft < 8, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8 })
  }, [])
  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update, children])

  const go = (dir) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: 'smooth' })

  return (
    <div className={`shelf ${variant}`}>
      <div className="shelf-track" ref={track} onScroll={update} role="list" aria-label={label}>
        {children}
      </div>
      <div className="container shelf-nav">
        <button className="shelf-btn" onClick={() => go(-1)} disabled={edges.start} aria-label="Previous"><Icon name="chevron" size={16} style={{ transform: 'rotate(90deg)' }} /></button>
        <button className="shelf-btn" onClick={() => go(1)} disabled={edges.end} aria-label="Next"><Icon name="chevron" size={16} style={{ transform: 'rotate(-90deg)' }} /></button>
      </div>
    </div>
  )
}
