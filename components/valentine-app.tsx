"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"

type Memory = {
  id: string
  name: string
  type: "video" | "image"
  url: string
  caption: string
}

interface ValentineAppProps {
  photos: Memory[]
  videos: Memory[]
}

const BEAR_GIF_URL = "/photos/Scared Aww GIF by BEARISH.gif"
const ENVELOPE_GIF_URL = "/photos/Valentines Day Sending Love GIF.gif"
const DEFAULT_BOUQUET_URL = "/photos/PINK.jpg"

// Palagi by TJ Monterde - YouTube embed ID
const PALAGI_YOUTUBE_ID = "eoq6uEeG0HU"

export default function ValentineApp({
  photos: initialPhotos,
  videos: initialVideos,
}: ValentineAppProps) {
  const [hasSaidYes, setHasSaidYes] = useState(false)
  const [noMessageVisible, setNoMessageVisible] = useState(false)
  const [noOffset, setNoOffset] = useState({ x: 0, y: 0 })
  const [isLetterOpen, setIsLetterOpen] = useState(false)
  const [showFlowers, setShowFlowers] = useState(false)
  const [showYesCelebration, setShowYesCelebration] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [photos] = useState<Memory[]>(initialPhotos)
  const [videos] = useState<Memory[]>(initialVideos)

  const galleryRef = useRef<HTMLDivElement>(null)
  const youtubePlayerRef = useRef<HTMLIFrameElement>(null)

  const handleYes = () => {
    setHasSaidYes(true)
    setNoMessageVisible(false)
    setShowYesCelebration(true)

    // Start playing Palagi by TJ Monterde via YouTube
    setIsMusicPlaying(true)

    // Wait 2 seconds before scrolling to photos/videos to let them see the celebration
    setTimeout(() => {
      if (galleryRef.current) {
        galleryRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }, 2000)
  }

  const handleNo = () => {
    setNoMessageVisible(true)
    // More aggressive evasion - moves further away
    const randomX = (Math.random() - 0.5) * 120
    const randomY = (Math.random() - 0.5) * 80
    setNoOffset({ x: randomX, y: randomY })
  }

  const openLetter = () => setIsLetterOpen(true)
  const closeLetter = () => setIsLetterOpen(false)

  const openFlowers = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowFlowers(true)
  }
  const closeFlowers = () => setShowFlowers(false)

  return (
    <>
      <div className="background-blur"></div>

      <header className="top-badge">
        <span>All You Need Is</span>
        <strong>Love</strong>
      </header>

      <main>
        {/* Question Section */}
        <section className="hero" id="top">
          <div className="hero-card">
            <div className="cute-bear">
              <img
                src={BEAR_GIF_URL}
                alt="Cute pink bear holding its heart"
                className="hero-gif"
              />
            </div>
            <h1>Will you be my Valentine Mahal ?</h1>

            <div className="buttons">
              <button type="button" className="btn yes" onClick={handleYes}>
                Yes
              </button>
              <button
                type="button"
                className="btn no"
                onClick={(e) => {
                  if (!hasSaidYes) {
                    e.preventDefault()
                    handleNo()
                  }
                }}
                onMouseEnter={() => {
                  if (!hasSaidYes) handleNo()
                }}
                onMouseMove={() => {
                  if (!hasSaidYes) handleNo()
                }}
                style={{
                  transform: `translate(${noOffset.x}px, ${noOffset.y}px)`,
                  opacity: hasSaidYes ? 0.3 : 1,
                  cursor: hasSaidYes ? "default" : "pointer",
                }}
                disabled={hasSaidYes}
              >
                <span className="no-text">No</span>
              </button>
            </div>
            {noMessageVisible && !hasSaidYes && (
              <p className="no-message">Wrong answer Mahal, try again</p>
            )}
            {showYesCelebration && hasSaidYes && (
              <p className="yes-message">
                You made me the happiest! Getting your memories ready...
              </p>
            )}
          </div>
        </section>

        {/* Music Section - explicit player so sound always works */}
        {hasSaidYes && (
          <section className="music-section">
            <h2>Our Song – Palagi by TJ Monterde</h2>
            <p className="section-subtitle">
              Tap play to listen while you read the letter and look at our memories.
            </p>
            <div className="music-player">
              <iframe
                src={`https://www.youtube.com/embed/${PALAGI_YOUTUBE_ID}?autoplay=0&loop=1&playlist=${PALAGI_YOUTUBE_ID}`}
                title="Palagi by TJ Monterde"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <p className="music-note">
              If the sound doesn&apos;t play inside apps like Messenger, tap the button
              below to open the song directly in YouTube:
            </p>
            <a
              href={`https://www.youtube.com/watch?v=${PALAGI_YOUTUBE_ID}`}
              target="_blank"
              rel="noopener noreferrer"
              className="music-link-button"
            >
              Open song in YouTube
            </a>
          </section>
        )}

        {/* Photos Section */}
        {hasSaidYes && (
          <section
            className="gallery-section"
            id="gallery"
            ref={galleryRef}
          >
            <h2>Our Photos and Memories together Mahal ^_^</h2>
            <p className="section-subtitle">
              Every picture tells a story of us.
            </p>

            <div className="gallery-grid">
              {photos.length === 0 && (
                <p className="upload-text gallery-empty-text">
                  No photos yet. Add image files to the
                  <code>public/photos</code> folder to show them here.
                </p>
              )}
              {photos.map((photo) => {
                const value = photo.caption || photo.name
                return (
                  <div key={photo.id} className="gallery-item">
                    <img src={photo.url} alt={value || photo.name} />
                    <div className="caption-area">
                      <p className="caption-input">{value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Videos Section */}
        {hasSaidYes && (
          <section className="gallery-section videos-section">
            <h2>Our Videos Together</h2>
            <p className="section-subtitle">
              The moments we can relive over and over.
            </p>

            <div className="video-grid">
              {videos.length === 0 && (
                <p className="upload-text gallery-empty-text">
                  No videos yet. Add video files to the
                  <code>public/videos</code> folder to show them here.
                </p>
              )}
              {videos.map((video) => {
                const value = video.caption || video.name
                return (
                  <div key={video.id} className="video-item">
                    <video controls src={video.url}></video>
                    <div className="caption-area">
                      <p className="caption-input">{value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Letter Section */}
        {hasSaidYes && (
          <section className="letter-section" id="letterSection">
            <div className="letter-intro">
              <h2>Open Your Love Mail</h2>
              <p className="section-subtitle">
                Tap the cute mail below to read what my heart has been wanting
                to tell you.
              </p>
            </div>

            <div className="mail-wrapper">
              <button type="button" className="mail-button" onClick={openLetter}>
                <img
                  src={ENVELOPE_GIF_URL}
                  alt="Cute Valentine envelope sending love"
                  className="envelope-image"
                />
                <span className="mail-text">Open Letter</span>
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Letter Modal */}
      {isLetterOpen && (
        <div
          className="letter-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeLetter()
            }
          }}
        >
          <div className="letter-content">
            <button type="button" className="close-letter" onClick={closeLetter}>
              ×
            </button>
            <h3>To my Mahal,</h3>
            <p>
              {
                "Mahal I love you so much, sorrry minsan e nakakagawa ako at nakakasabi ng di maganda sayo, patawad din if nasasaktan kita pero kahit ganun mahal na mahal kita sobra di ko alam if insecure ba ako or natatakot lang ako na mawala ka hirap din kasi kapag maganda gf feeeling ko lagi akong may kaagaw haha pero kidding aside, Im really sorry huhu I love you so much"
              }
            </p>
            <p>
              {
                "puyat nako kakagawa nito 2 am na tapos may pasok pako mamaya ojt hhahahaha sana mag enjoy ka Happy Valentines mahal ko I love you so muchh!!!!!!!!"
              }
            </p>
            <p className="signature">
              Love,
              <br />
              Your Mahal
            </p>

            <div className="flowers-section">
              <p className="flowers-link">
                P.S. Click{" "}
                <a href="#" onClick={openFlowers}>
                  here
                </a>
                {" for a little bouquet just for you"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Flowers Popup */}
      {showFlowers && (
        <div
          className="flowers-popup"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeFlowers()
            }
          }}
        >
          <div className="flowers-card">
            <button type="button" className="close-flowers" onClick={closeFlowers}>
              ×
            </button>
            <div className="flowers-default">
              <img
                src={DEFAULT_BOUQUET_URL}
                alt="Bouquet of pink flowers"
                className="flowers-bear-gif"
              />
            </div>
            <p>
              These are for you, my MAHAL. I wish I could hand you real flowers
              right now, but for now, take these and all my heart with them I
              LOVE YOU PO!!.
            </p>
          </div>
        </div>
      )}

      <footer className="bottom-note">
        <span>Love is in the air</span>
      </footer>

      {/* Background Music - Palagi by TJ Monterde via YouTube (best-effort autoplay) */}
      {isMusicPlaying && (
        <iframe
          ref={youtubePlayerRef}
          src={`https://www.youtube.com/embed/${PALAGI_YOUTUBE_ID}?autoplay=1&loop=1&playlist=${PALAGI_YOUTUBE_ID}&controls=0`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          style={{
            position: "fixed",
            width: 1,
            height: 1,
            bottom: 0,
            left: 0,
            opacity: 0,
            pointerEvents: "none",
          }}
          title="Palagi by TJ Monterde"
        />
      )}
    </>
  )
}

