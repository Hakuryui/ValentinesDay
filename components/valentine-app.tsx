"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
    useMemoriesDB,
    type MemoryWithUrl,
} from "@/hooks/use-memories-db"

const BEAR_GIF_URL =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Scared%20Aww%20GIF%20by%20BEARISH-qy9lJSz885P9qI7Frc14U4hnsARPfD.gif"

const ENVELOPE_IMG_URL =
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-A0rLkxNW7Tp9OvvKyUF4DTtuBalR5K.png"

// Note: For production, replace with actual PALAGI audio URL from music provider
// YouTube video: https://www.youtube.com/watch?v=eoq6uEeG0HU
// You can download or use a music service API key for the actual audio stream
const MUSIC_URL =
    "https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp3"

export default function ValentineApp() {
    const [hasSaidYes, setHasSaidYes] = useState(false)
    const [noMessageVisible, setNoMessageVisible] = useState(false)
    const [noOffset, setNoOffset] = useState({ x: 0, y: 0 })
    const [photos, setPhotos] = useState<MemoryWithUrl[]>([])
    const [videos, setVideos] = useState<MemoryWithUrl[]>([])
    const [isLetterOpen, setIsLetterOpen] = useState(false)
    const [showFlowers, setShowFlowers] = useState(false)
    const [flowerImage, setFlowerImage] = useState<string | null>(null)
    const [loaded, setLoaded] = useState(false)
    const [showYesCelebration, setShowYesCelebration] = useState(false)

    const db = useMemoriesDB()

    const photoInputRef = useRef<HTMLInputElement>(null)
    const videoInputRef = useRef<HTMLInputElement>(null)
    const flowerInputRef = useRef<HTMLInputElement>(null)
    const galleryRef = useRef<HTMLDivElement>(null)
    const audioRef = useRef<HTMLAudioElement>(null)

    // Load persisted data on mount
    useEffect(() => {
        let cancelled = false
        async function load() {
            try {
                const [savedPhotos, savedVideos, savedFlower, savedYes] =
                    await Promise.all([
                        db.loadPhotos(),
                        db.loadVideos(),
                        db.loadFlowerImage(),
                        db.loadHasSaidYes(),
                    ])
                if (cancelled) return
                setPhotos(savedPhotos)
                setVideos(savedVideos)
                setFlowerImage(savedFlower)
                setHasSaidYes(savedYes)
            } catch {
                // IndexedDB not available, continue with empty state
            }
            if (!cancelled) setLoaded(true)
        }
        load()
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleYes = useCallback(async () => {
        setHasSaidYes(true)
        setNoMessageVisible(false)
        setShowYesCelebration(true)
        try {
            await db.saveHasSaidYes(true)
        } catch {
            // ignore
        }

        // Start playing music
        if (audioRef.current) {
            audioRef.current.play().catch(() => {
                // Playback failed, likely due to browser autoplay restrictions
            })
        }

        // Wait 2 seconds before scrolling to photos/videos to let them see the celebration
        setTimeout(() => {
            if (galleryRef.current) {
                galleryRef.current.scrollIntoView({ behavior: "smooth" })
            }
        }, 2000)
    }, [db])

    const handleNo = () => {
        setNoMessageVisible(true)
        // More aggressive evasion - moves further away
        const randomX = (Math.random() - 0.5) * 120
        const randomY = (Math.random() - 0.5) * 80
        setNoOffset({ x: randomX, y: randomY })
    }

    const handlePhotoUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(event.target.files || [])
            if (!files.length) return
            try {
                const newPhotos = await db.addPhotos(files)
                setPhotos((prev) => [...prev, ...newPhotos])
            } catch {
                // fallback: just show them without persistence
                const fallback: MemoryWithUrl[] = files.map((file, i) => ({
                    id: `photo-${Date.now()}-${i}`,
                    name: file.name,
                    type: "image" as const,
                    url: URL.createObjectURL(file),
                    caption: "",
                }))
                setPhotos((prev) => [...prev, ...fallback])
            }
            if (event.target) event.target.value = ""
        },
        [db]
    )

    const handleVideoUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(event.target.files || [])
            if (!files.length) return
            try {
                const newVideos = await db.addVideos(files)
                setVideos((prev) => [...prev, ...newVideos])
            } catch {
                const fallback: MemoryWithUrl[] = files.map((file, i) => ({
                    id: `video-${Date.now()}-${i}`,
                    name: file.name,
                    type: "video" as const,
                    url: URL.createObjectURL(file),
                    caption: "",
                }))
                setVideos((prev) => [...prev, ...fallback])
            }
            if (event.target) event.target.value = ""
        },
        [db]
    )

    const handleFlowerUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0]
            if (!file) return
            try {
                const url = await db.saveFlowerImage(file)
                setFlowerImage(url)
            } catch {
                setFlowerImage(URL.createObjectURL(file))
            }
        },
        [db]
    )

    const handleDeletePhoto = useCallback(
        async (id: string) => {
            setPhotos((prev) => prev.filter((p) => p.id !== id))
            try {
                await db.deletePhoto(id)
            } catch {
                // ignore
            }
        },
        [db]
    )

    const handleDeleteVideo = useCallback(
        async (id: string) => {
            setVideos((prev) => prev.filter((v) => v.id !== id))
            try {
                await db.deleteVideo(id)
            } catch {
                // ignore
            }
        },
        [db]
    )

    const handlePhotoCaption = useCallback(
        (id: string, caption: string) => {
            setPhotos((prev) =>
                prev.map((p) => (p.id === id ? { ...p, caption } : p))
            )
            db.updatePhotoCaption(id, caption).catch(() => { })
        },
        [db]
    )

    const handleVideoCaption = useCallback(
        (id: string, caption: string) => {
            setVideos((prev) =>
                prev.map((v) => (v.id === id ? { ...v, caption } : v))
            )
            db.updateVideoCaption(id, caption).catch(() => { })
        },
        [db]
    )

    const openLetter = () => setIsLetterOpen(true)
    const closeLetter = () => setIsLetterOpen(false)

    const openFlowers = (e: React.MouseEvent) => {
        e.preventDefault()
        setShowFlowers(true)
    }
    const closeFlowers = () => setShowFlowers(false)

    if (!loaded) {
        return (
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                    color: "#ff2f86",
                    fontSize: "14px",
                }}
            >
                Loading your memories...
            </div>
        )
    }

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
                        <h1>{"Will you be my Valentine Mahal ?"}</h1>

                        <div className="buttons">
                            <button className="btn yes" onClick={handleYes}>
                                {"Yes"}
                            </button>
                            <button
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
                                <span className="no-text">{"No"}</span>
                            </button>
                        </div>
                        {noMessageVisible && !hasSaidYes && (
                            <p className="no-message">{"Wrong answer Mahal, try again"}</p>
                        )}
                        {showYesCelebration && hasSaidYes && (
                            <p className="yes-message">{"You made me the happiest! Getting your memories ready..."}</p>
                        )}
                    </div>
                </section>

                {/* Photos Section */}
                {hasSaidYes && (
                    <section
                        className="gallery-section"
                        id="gallery"
                        ref={galleryRef}
                    >
                        <h2>{"Our Photos and Memories together Mahal ^_^"}</h2>
                        <p className="section-subtitle">
                            {"Every picture tells a story of us."}
                        </p>

                        <div className="upload-controls">
                            <input
                                type="file"
                                ref={photoInputRef}
                                className="file-input"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoUpload}
                            />
                            <button
                                className="btn upload-btn"
                                onClick={() => photoInputRef.current?.click()}
                            >
                                {"Add Photos"}
                            </button>
                        </div>

                        <div className="gallery-grid">
                            {photos.length === 0 && (
                                <p className="upload-text gallery-empty-text">
                                    {"No photos yet. Tap the button above to add them."}
                                </p>
                            )}
                            {photos.map((photo) => (
                                <div key={photo.id} className="gallery-item">
                                    <img src={photo.url} alt={photo.caption || photo.name} />
                                    <div className="memory-footer">
                                        <button
                                            type="button"
                                            className="delete-memory-btn"
                                            onClick={() => handleDeletePhoto(photo.id)}
                                            aria-label="Delete photo"
                                        >
                                            {"✕"}
                                        </button>
                                    </div>
                                    <div className="caption-area">
                                        <input
                                            type="text"
                                            className="caption-input"
                                            placeholder="Add a description..."
                                            value={photo.caption}
                                            title={photo.caption || "Add a description..."}
                                            onChange={(e) =>
                                                handlePhotoCaption(photo.id, e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Videos Section */}
                {hasSaidYes && (
                    <section className="gallery-section videos-section">
                        <h2>{"Our Videos Together"}</h2>
                        <p className="section-subtitle">
                            {"The moments we can relive over and over."}
                        </p>

                        <div className="upload-controls">
                            <input
                                type="file"
                                ref={videoInputRef}
                                className="file-input"
                                multiple
                                accept="video/*"
                                onChange={handleVideoUpload}
                            />
                            <button
                                className="btn upload-btn"
                                onClick={() => videoInputRef.current?.click()}
                            >
                                {"Add Videos"}
                            </button>
                        </div>

                        <div className="video-grid">
                            {videos.length === 0 && (
                                <p className="upload-text gallery-empty-text">
                                    {"No videos yet. Tap the button above to add them."}
                                </p>
                            )}
                            {videos.map((video) => (
                                <div key={video.id} className="video-item">
                                    <video controls src={video.url}></video>
                                    <div className="memory-footer">
                                        <button
                                            type="button"
                                            className="delete-memory-btn"
                                            onClick={() => handleDeleteVideo(video.id)}
                                            aria-label="Delete video"
                                        >
                                            {"✕"}
                                        </button>
                                    </div>
                                    <div className="caption-area">
                                        <input
                                            type="text"
                                            className="caption-input"
                                            placeholder="Add a description..."
                                            value={video.caption}
                                            title={video.caption || "Add a description..."}
                                            onChange={(e) =>
                                                handleVideoCaption(video.id, e.target.value)
                                            }
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Letter Section */}
                {hasSaidYes && (
                    <section className="letter-section" id="letterSection">
                        <div className="letter-intro">
                            <h2>{"Open Your Love Mail"}</h2>
                            <p className="section-subtitle">
                                {"Tap the cute mail below to read what my heart has been wanting to tell you."}
                            </p>
                        </div>

                        <div className="mail-wrapper">
                            <button className="mail-button" onClick={openLetter}>
                                <img
                                    src={ENVELOPE_IMG_URL}
                                    alt="Love letter envelope"
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
                        <button className="close-letter" onClick={closeLetter}>
                            {"×"}
                        </button>
                        <h3>{"To my Valentine,"}</h3>
                        <p>
                            {"From the moment we started creating these memories together, my world has been softer, brighter, and so much sweeter. Every laugh, every late-night talk, every little moment with you feels like a tiny piece of magic I never want to lose."}
                        </p>
                        <p>
                            {"Thank you for being my comfort, my chaos, my peace, and my favorite person all at once. I'm so grateful for you, for us, and for the love we're still writing together."}
                        </p>
                        <p>
                            {"Today (and always), I choose you. Over and over again. Forever and a little bit more."}
                        </p>
                        <p className="signature">
                            {"Love,"}
                            <br />
                            {"Your baby"}
                        </p>

                        <div className="flowers-section">
                            <p className="flowers-link">
                                {"P.S. Click "}
                                <a href="#" onClick={openFlowers}>
                                    here
                                </a>
                                {" for a little bouquet just for you"}
                            </p>
                            <div className="flower-upload-area">
                                <input
                                    type="file"
                                    ref={flowerInputRef}
                                    className="file-input"
                                    accept="image/*"
                                    onChange={handleFlowerUpload}
                                />
                                <button
                                    type="button"
                                    className="btn flower-upload-btn"
                                    onClick={() => flowerInputRef.current?.click()}
                                >
                                    {"Upload your flower photo"}
                                </button>
                            </div>
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
                        <button className="close-flowers" onClick={closeFlowers}>
                            {"×"}
                        </button>
                        {flowerImage ? (
                            <div className="flower-custom-image">
                                <img src={flowerImage} alt="Flowers for you MAHAL" />
                            </div>
                        ) : (
                            <div className="flowers-default">
                                <img
                                    src={BEAR_GIF_URL}
                                    alt="Bear with love"
                                    className="flowers-bear-gif"
                                />
                            </div>
                        )}
                        <p>
                            {"These are for you, my MAHAL. I wish I could hand you real flowers right now, but for now, take these and all my heart with them I LOVE YOU PO!!."}
                        </p>
                    </div>
                </div>
            )}

            <footer className="bottom-note">
                <span>Love is in the air</span>
            </footer>

            {/* Background Music */}
            <audio
                ref={audioRef}
                loop
                volume={0.5}
                style={{ display: "none" }}
            >
                <source src={MUSIC_URL} type="audio/mpeg" />
            </audio>
        </>
    )
}
