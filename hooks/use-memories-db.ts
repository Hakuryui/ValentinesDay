"use client"

import { useEffect, useRef, useCallback } from "react"
import { firestore, storage, USE_FIREBASE } from "@/lib/firebase-client"
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage"

const DB_NAME = "valentine-memories"
const DB_VERSION = 1
const PHOTOS_STORE = "photos"
const VIDEOS_STORE = "videos"
const META_STORE = "meta"
const FIREBASE_MEMORIES_COLLECTION = "memories"

export interface StoredMemory {
  id: string
  name: string
  type: "video" | "image"
  caption: string
  blob: Blob
}

export interface MemoryWithUrl {
  id: string
  name: string
  type: "video" | "image"
  url: string
  caption: string
}

async function uploadToFirebase(
  file: File,
  type: "video" | "image"
): Promise<MemoryWithUrl> {
  if (!firestore || !storage) {
    throw new Error("Firebase is not configured")
  }

  const prefix = type === "image" ? "photo" : "video"
  const id = `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
  const objectPath = `memories/${id}`
  const objectRef = storageRef(storage, objectPath)

  await uploadBytes(objectRef, file, { contentType: file.type })
  const url = await getDownloadURL(objectRef)

  await setDoc(doc(firestore, FIREBASE_MEMORIES_COLLECTION, id), {
    id,
    name: file.name,
    type,
    caption: "",
    url,
    createdAt: Date.now(),
    storagePath: objectPath,
  })

  return {
    id,
    name: file.name,
    type,
    url,
    caption: "",
  }
}

async function fetchFirebaseMemories(
  type: "video" | "image"
): Promise<MemoryWithUrl[]> {
  if (!firestore) return []

  const q = query(
    collection(firestore, FIREBASE_MEMORIES_COLLECTION),
    where("type", "==", type),
    orderBy("createdAt", "asc")
  )
  const snapshot = await getDocs(q)

  return snapshot.docs.map((d) => {
    const data = d.data() as any
    return {
      id: data.id ?? d.id,
      name: data.name,
      type: data.type,
      url: data.url,
      caption: data.caption ?? "",
    }
  })
}

async function deleteFirebaseMemory(id: string): Promise<void> {
  if (!firestore || !storage) return

  const docRef = doc(firestore, FIREBASE_MEMORIES_COLLECTION, id)
  const snap = await getDoc(docRef)
  const data = snap.exists() ? (snap.data() as any) : null

  const storagePath: string = data?.storagePath ?? `memories/${id}`
  const objectRef = storageRef(storage, storagePath)

  await Promise.allSettled([
    deleteObject(objectRef),
    deleteDoc(docRef),
  ])
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PHOTOS_STORE)) {
        db.createObjectStore(PHOTOS_STORE, { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains(VIDEOS_STORE)) {
        db.createObjectStore(VIDEOS_STORE, { keyPath: "id" })
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: "key" })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function getAllFromStore(
  db: IDBDatabase,
  storeName: string
): Promise<StoredMemory[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const store = tx.objectStore(storeName)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function putToStore(
  db: IDBDatabase,
  storeName: string,
  item: StoredMemory
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)
    const request = store.put(item)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function deleteFromStore(
  db: IDBDatabase,
  storeName: string,
  id: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)
    const request = store.delete(id)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

function updateCaptionInStore(
  db: IDBDatabase,
  storeName: string,
  id: string,
  caption: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    const store = tx.objectStore(storeName)
    const getReq = store.get(id)
    getReq.onsuccess = () => {
      const item = getReq.result
      if (item) {
        item.caption = caption
        const putReq = store.put(item)
        putReq.onsuccess = () => resolve()
        putReq.onerror = () => reject(putReq.error)
      } else {
        resolve()
      }
    }
    getReq.onerror = () => reject(getReq.error)
  })
}

function getMeta(
  db: IDBDatabase,
  key: string
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readonly")
    const store = tx.objectStore(META_STORE)
    const request = store.get(key)
    request.onsuccess = () => resolve(request.result?.value ?? null)
    request.onerror = () => reject(request.error)
  })
}

function setMeta(
  db: IDBDatabase,
  key: string,
  value: unknown
): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readwrite")
    const store = tx.objectStore(META_STORE)
    const request = store.put({ key, value })
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export interface MemoryWithUrl {
  id: string
  name: string
  type: "video" | "image"
  url: string
  caption: string
}

interface UseMemoriesDBReturn {
  loadPhotos: () => Promise<MemoryWithUrl[]>
  loadVideos: () => Promise<MemoryWithUrl[]>
  addPhotos: (files: File[]) => Promise<MemoryWithUrl[]>
  addVideos: (files: File[]) => Promise<MemoryWithUrl[]>
  deletePhoto: (id: string) => Promise<void>
  deleteVideo: (id: string) => Promise<void>
  updatePhotoCaption: (id: string, caption: string) => Promise<void>
  updateVideoCaption: (id: string, caption: string) => Promise<void>
  loadFlowerImage: () => Promise<string | null>
  saveFlowerImage: (file: File) => Promise<string>
  loadHasSaidYes: () => Promise<boolean>
  saveHasSaidYes: (val: boolean) => Promise<void>
}

export function useMemoriesDB(): UseMemoriesDBReturn {
  const dbRef = useRef<IDBDatabase | null>(null)
  const urlCacheRef = useRef<Map<string, string>>(new Map())

  useEffect(() => {
    openDB().then((db) => {
      dbRef.current = db
    })

    return () => {
      urlCacheRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const getDB = useCallback(async () => {
    if (dbRef.current) return dbRef.current
    const db = await openDB()
    dbRef.current = db
    return db
  }, [])

  const storedToMemory = useCallback(
    (item: StoredMemory): MemoryWithUrl => {
      let url = urlCacheRef.current.get(item.id)
      if (!url && item.blob) {
        url = URL.createObjectURL(item.blob)
        urlCacheRef.current.set(item.id, url)
      }
      return {
        id: item.id,
        name: item.name,
        type: item.type,
        url: url || "",
        caption: item.caption,
      }
    },
    []
  )

  const loadPhotos = useCallback(async (): Promise<MemoryWithUrl[]> => {
    if (USE_FIREBASE) {
      return fetchFirebaseMemories("image")
    }

    const db = await getDB()
    const items = await getAllFromStore(db, PHOTOS_STORE)
    return items.map(storedToMemory)
  }, [getDB, storedToMemory])

  const loadVideos = useCallback(async (): Promise<MemoryWithUrl[]> => {
    if (USE_FIREBASE) {
      return fetchFirebaseMemories("video")
    }

    const db = await getDB()
    const items = await getAllFromStore(db, VIDEOS_STORE)
    return items.map(storedToMemory)
  }, [getDB, storedToMemory])

  const addPhotos = useCallback(
    async (files: File[]): Promise<MemoryWithUrl[]> => {
      if (USE_FIREBASE) {
        const results: MemoryWithUrl[] = []
        for (const file of files) {
          const uploaded = await uploadToFirebase(file, "image")
          results.push(uploaded)
        }
        return results
      }

      const db = await getDB()
      const results: MemoryWithUrl[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const item: StoredMemory = {
          id: `photo-${Date.now()}-${i}`,
          name: file.name,
          type: "image",
          caption: "",
          blob: file,
        }
        await putToStore(db, PHOTOS_STORE, item)
        results.push(storedToMemory(item))
      }

      return results
    },
    [getDB, storedToMemory]
  )

  const addVideos = useCallback(
    async (files: File[]): Promise<MemoryWithUrl[]> => {
      if (USE_FIREBASE) {
        const results: MemoryWithUrl[] = []
        for (const file of files) {
          const uploaded = await uploadToFirebase(file, "video")
          results.push(uploaded)
        }
        return results
      }

      const db = await getDB()
      const results: MemoryWithUrl[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const item: StoredMemory = {
          id: `video-${Date.now()}-${i}`,
          name: file.name,
          type: "video",
          caption: "",
          blob: file,
        }
        await putToStore(db, VIDEOS_STORE, item)
        results.push(storedToMemory(item))
      }

      return results
    },
    [getDB, storedToMemory]
  )

  const deletePhoto = useCallback(
    async (id: string) => {
      if (USE_FIREBASE) {
        await deleteFirebaseMemory(id)
      } else {
        const db = await getDB()
        await deleteFromStore(db, PHOTOS_STORE, id)
      }

      const url = urlCacheRef.current.get(id)
      if (url) {
        URL.revokeObjectURL(url)
        urlCacheRef.current.delete(id)
      }
    },
    [getDB]
  )

  const deleteVideo = useCallback(
    async (id: string) => {
      if (USE_FIREBASE) {
        await deleteFirebaseMemory(id)
      } else {
        const db = await getDB()
        await deleteFromStore(db, VIDEOS_STORE, id)
      }

      const url = urlCacheRef.current.get(id)
      if (url) {
        URL.revokeObjectURL(url)
        urlCacheRef.current.delete(id)
      }
    },
    [getDB]
  )

  const updatePhotoCaption = useCallback(
    async (id: string, caption: string) => {
      if (USE_FIREBASE && firestore) {
        await updateDoc(
          doc(firestore, FIREBASE_MEMORIES_COLLECTION, id),
          { caption }
        )
      } else {
        const db = await getDB()
        await updateCaptionInStore(db, PHOTOS_STORE, id, caption)
      }
    },
    [getDB]
  )

  const updateVideoCaption = useCallback(
    async (id: string, caption: string) => {
      if (USE_FIREBASE && firestore) {
        await updateDoc(
          doc(firestore, FIREBASE_MEMORIES_COLLECTION, id),
          { caption }
        )
      } else {
        const db = await getDB()
        await updateCaptionInStore(db, VIDEOS_STORE, id, caption)
      }
    },
    [getDB]
  )

  const loadFlowerImage = useCallback(async (): Promise<string | null> => {
    if (USE_FIREBASE && firestore) {
      const snap = await getDoc(doc(firestore, "config", "flower"))
      const data = snap.exists() ? (snap.data() as any) : null
      return data?.url ?? null
    }

    const db = await getDB()
    const blob = (await getMeta(db, "flowerImage")) as Blob | null
    if (!blob) return null
    let url = urlCacheRef.current.get("flower")
    if (!url) {
      url = URL.createObjectURL(blob)
      urlCacheRef.current.set("flower", url)
    }
    return url
  }, [getDB])

  const saveFlowerImage = useCallback(
    async (file: File): Promise<string> => {
      if (USE_FIREBASE && firestore && storage) {
        const id = `flower-${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 10)}`
        const objectPath = `flowers/${id}`
        const objectRef = storageRef(storage, objectPath)
        await uploadBytes(objectRef, file, { contentType: file.type })
        const url = await getDownloadURL(objectRef)

        await setDoc(doc(firestore, "config", "flower"), {
          url,
          storagePath: objectPath,
          updatedAt: Date.now(),
        })

        return url
      }

      const db = await getDB()
      await setMeta(db, "flowerImage", file)
      const oldUrl = urlCacheRef.current.get("flower")
      if (oldUrl) URL.revokeObjectURL(oldUrl)
      const url = URL.createObjectURL(file)
      urlCacheRef.current.set("flower", url)
      return url
    },
    [getDB]
  )

  const loadHasSaidYes = useCallback(async (): Promise<boolean> => {
    const db = await getDB()
    const val = await getMeta(db, "hasSaidYes")
    return val === true
  }, [getDB])

  const saveHasSaidYes = useCallback(
    async (val: boolean) => {
      const db = await getDB()
      await setMeta(db, "hasSaidYes", val)
    },
    [getDB]
  )

  return {
    loadPhotos,
    loadVideos,
    addPhotos,
    addVideos,
    deletePhoto,
    deleteVideo,
    updatePhotoCaption,
    updateVideoCaption,
    loadFlowerImage,
    saveFlowerImage,
    loadHasSaidYes,
    saveHasSaidYes,
  }
}
