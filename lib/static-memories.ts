import fs from "fs"
import path from "path"

export type StaticMemory = {
  id: string
  name: string
  type: "video" | "image"
  url: string
  caption: string
}

const IGNORED_PHOTO_FILES = new Set<string>([
  "Scared Aww GIF by BEARISH.gif",
  "Valentines Day Sending Love GIF.gif",
  "PINK.jpg",
])

const HIDDEN_NAME_PREFIXES = ["hidden-", "_hidden-"]

// Static captions for each photo filename (gallery order)
const PHOTO_CAPTIONS: Record<string, string> = {
  "1.jfif": "EYyyy Heart I love you!!",
  "2.jfif": "Cute natiiin ditooo!!",
  "2.1.jfif": "hehehe pababe ako no??",
  "3.jfif": "hahaha ganda mo dito oh epal lang si kuya ahhaha",
  "4.jfif": "bakt parang mas maganda kapa sa ART???><",
  "4.1.jfif": "edit mo nalng mga epal hahaha",
  "5.jfif": "nighhtttt in manilaaaa",
  "6.jfif": "grabee mga ngiti ah",
  "7.jfif": "pano mag pic mga TITO at TITA ?  AHHAHAH",
  "8.jfif": "samG mahal oh!!!! baka naman",
  "9.jfif": "namimisss ko na to huhu!!!",
  "10.jfif": "Bdayyyy mo to e ! ahaha",
  "11.jfif": "pic muna bago sumabak sa UNLIIII >_<  AHHAHAHA",
  "12.jfif": "ITOOO YUNG UNLI ANG LAKI HAHAHHAHA",
  "13.jfif": "SIMPLE DATE WITH MAHAL SA MINI MART </3",
  "14.jfif": "Ayan seryoso yern? ahhaha",
  "15.jfif": "walang pera pero nag date hahaha",
  "16.jfif": "Marugameee Our fav food!!",
  "17.jfif": "thankyouu po sa Pa Bday niya sakin HAHHAHAHA",
  "19.jfif": "walang kasawaang marugameee T_T hahaha",
  "20.jfif": "at marugami nanaman HAHhhaha",
  "22.jfif": "naghahanap tayo nito ng makakin e haha",
  "23.jfif": "walang bugettttt >>>>>>",
  "23.1.jfif": "kaya ? nag chooks to go HAHAHAH",
  "24.jfif": "THANKYOU MAHAL SA REGALO MO LAST FEB 14 I LOVE YOU.",
  "25.jfif": "GANDAAA MO NAMAN POO!! STOLEN YERNN???",
  "26.jfif": "BORGERRRR YERNN??",
  "28.jfif": "Gandaa mo mahaaal",
  "28.1.jfif": "SUS tago tago pa I love you",
  "29.jfif": "Congrats mahal koooo  Keep it up!! I love you",
}

// Static captions for each video filename (gallery order)
const VIDEO_CAPTIONS: Record<string, string> = {
  "18.mp4": "saraaaaaap no??? walang kasawaan e hahaha",
  "26c606f5-635f-4793-a9a4-5db53cf97fc1.mp4": "VLOGGGER YERN? HAHAHA",
  "78934303-7d3f-4580-aae2-3e44db934194.mp4": "CONCERTTTTTT!! HAAHAH",
  "b4c15f68-aeba-4fdc-9ade-187a5a2a0fe0.mp4": "PORKET MAY TULOG KA HA???",
  "bf15cf7a-95f8-4571-83a2-e18dbe764697.mp4":
    "MUKHANG DINOSAUR NA CHICKEN AMP HAHAHA PERO NAKAKA MISS NO?",
  "e7da0a75-ba4e-45c5-97f8-02bd3727d98f.mp4":
    "EYY MARUGAMI MUKBHANG TY SA PA BERTDAYYYY!!! I LOVE  YOU",
  "fafd95ae-a050-4937-bbc6-92f937face12.mp4":
    "SAKIT NG KUROT MO SHEMS RAMDAM KO PADIN KAHIT ANTOK NAKO NOW HAHAHHA",
  "ffa0c8a2-401c-462a-87f0-e1e5dd420704.mp4":
    "MINSAN BOYFRIEND MINSAN FOOD DELIVERY HAYS HAHAHA",
}

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".jfif",
])

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".mov",
  ".m4v",
  ".ogg",
])

function listFilesInDir(relativeDir: string): string[] {
  const absoluteDir = path.join(process.cwd(), "public", relativeDir)

  if (!fs.existsSync(absoluteDir)) {
    return []
  }

  return fs
    .readdirSync(absoluteDir)
    .filter((file) => fs.statSync(path.join(absoluteDir, file)).isFile())
}

export async function getStaticMemories(): Promise<{
  photos: StaticMemory[]
  videos: StaticMemory[]
}> {
  const photoFiles = listFilesInDir("photos")
  const videoFiles = listFilesInDir("videos")

  // Helper to sort by the numeric part of the filename (e.g. 1.jfif, 2.1.jfif, 10.jfif)
  const numericSort = (a: string, b: string) => {
    const baseA = path.basename(a, path.extname(a))
    const baseB = path.basename(b, path.extname(b))

    const numA = Number.parseFloat(baseA)
    const numB = Number.parseFloat(baseB)

    const hasNumA = !Number.isNaN(numA)
    const hasNumB = !Number.isNaN(numB)

    if (hasNumA && hasNumB && numA !== numB) {
      return numA - numB
    }

    // Fallback natural string compare
    return baseA.localeCompare(baseB, undefined, { numeric: true })
  }

  const photos: StaticMemory[] = photoFiles
    .filter((file) => {
      const ext = path.extname(file).toLowerCase()
      if (!IMAGE_EXTENSIONS.has(ext)) return false
      if (IGNORED_PHOTO_FILES.has(file)) return false
      if (HIDDEN_NAME_PREFIXES.some((prefix) => file.startsWith(prefix))) {
        return false
      }
      return true
    })
    .sort(numericSort)
    .map((file) => ({
      id: `photo-${file}`,
      name: file,
      type: "image" as const,
      url: `/photos/${file}`,
      caption: PHOTO_CAPTIONS[file] ?? "",
    }))

  const videos: StaticMemory[] = videoFiles
    .filter((file) =>
      VIDEO_EXTENSIONS.has(path.extname(file).toLowerCase())
    )
    .sort(numericSort)
    .map((file) => ({
      id: `video-${file}`,
      name: file,
      type: "video" as const,
      url: `/videos/${file}`,
      caption: VIDEO_CAPTIONS[file] ?? "",
    }))

  return { photos, videos }
}

