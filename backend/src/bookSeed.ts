import mongoose from "mongoose";
import { BookModel } from "./modules/books/book.model";

const books = [
    {
        "rentalProviderId": "65f1a1b2c3d4e5f678901301",
        "title": "Project Hail Mary",
        "image": "https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg",
        "authorName": "Andy Weir",
        "price": 950,
        "publishedDate": new Date("2021-05-04"),
        "pages": 496,
        "lastUpdatedDate": new Date(),
        "genre": ["Science Fiction", "Adventure"],
        "averageRating": 4.9,
        "ratingsCount": 5800,
        "description": "A lone astronaut must save humanity from an extinction-level threat.",
        "tags": ["space", "survival", "problem-solving"]
    },
    {
        "rentalProviderId": "65f1a1b2c3d4e5f678901302",
        "title": "Atomic Habits",
        "image": "https://covers.openlibrary.org/b/isbn/9780735211292-L.jpg",
        "authorName": "James Clear",
        "price": 1050,
        "publishedDate": new Date("2018-10-16"),
        "pages": 320,
        "lastUpdatedDate": new Date(),
        "genre": ["Self-help", "Productivity"],
        "averageRating": 4.8,
        "ratingsCount": 7200,
        "description": "Tiny changes that lead to remarkable results.",
        "tags": ["habits", "productivity", "self-improvement"]
    },
    {
        "rentalProviderId": "65f1a1b2c3d4e5f678901303",
        "title": "Dune",
        "image": "https://covers.openlibrary.org/b/isbn/9780441013593-L.jpg",
        "authorName": "Frank Herbert",
        "price": 1150,
        "publishedDate": new Date("1965-08-01"),
        "pages": 896,
        "lastUpdatedDate": new Date(),
        "genre": ["Science Fiction", "Politics"],
        "averageRating": 4.7,
        "ratingsCount": 8900,
        "description": "A noble family becomes entangled in a war for control of the galaxy's most valuable resource.",
        "tags": ["epic", "politics", "ecology"]
    },
    {
        "rentalProviderId": "65f1a1b2c3d4e5f678901304",
        "title": "Becoming",
        "image": "https://covers.openlibrary.org/b/isbn/9781524763138-L.jpg",
        "authorName": "Michelle Obama",
        "price": 1200,
        "publishedDate": new Date("2018-11-13"),
        "pages": 448,
        "lastUpdatedDate": new Date(),
        "genre": ["Biography", "Memoir"],
        "averageRating": 4.9,
        "ratingsCount": 6400,
        "description": "The intimate memoir of the former First Lady of the United States.",
        "tags": ["inspiring", "leadership", "personal-growth"]
    },
    {
        "rentalProviderId": "65f1a1b2c3d4e5f678901305",
        "title": "The Midnight Library",
        "image": "https://covers.openlibrary.org/b/isbn/9780525559474-L.jpg",
        "authorName": "Matt Haig",
        "price": 880,
        "publishedDate": new Date("2020-08-13"),
        "pages": 304,
        "lastUpdatedDate": new Date(),
        "genre": ["Fantasy", "Fiction"],
        "averageRating": 4.6,
        "ratingsCount": 4700,
        "description": "A woman gets to experience alternate versions of her life in a magical library.",
        "tags": ["philosophical", "hope", "regret"]
    },
    {
        "rentalProviderId": "65f1a1b2c3d4e5f678901306",
        "title": "Sapiens",
        "image": "https://covers.openlibrary.org/b/isbn/9780062316097-L.jpg",
        "authorName": "Yuval Noah Harari",
        "price": 1350,
        "publishedDate": new Date("2011-01-01"),
        "pages": 464,
        "lastUpdatedDate": new Date(),
        "genre": ["History", "Anthropology"],
        "averageRating": 4.7,
        "ratingsCount": 5100,
        "description": "A brief history of humankind from evolution to modern times.",
        "tags": ["evolution", "society", "philosophy"]
    },
    {
        "rentalProviderId": "65f1a1b2c3d4e5f678901307",
        "title": "Circe",
        "image": "https://covers.openlibrary.org/b/isbn/9780316556347-L.jpg",
        "authorName": "Madeline Miller",
        "price": 980,
        "publishedDate": new Date("2018-04-10"),
        "pages": 400,
        "lastUpdatedDate": new Date(),
        "genre": ["Fantasy", "Mythology"],
        "averageRating": 4.8,
        "ratingsCount": 4300,
        "description": "The story of the exiled witch goddess from Greek mythology.",
        "tags": ["greek-mythology", "feminism", "magic"]
    },
    {
        "rentalProviderId": "65f1a1b2c3d4e5f678901308",
        "title": "Educated",
        "image": "https://covers.openlibrary.org/b/isbn/9780399590504-L.jpg",
        "authorName": "Tara Westover",
        "price": 1000,
        "publishedDate": new Date("2018-02-20"),
        "pages": 352,
        "lastUpdatedDate": new Date(),
        "genre": ["Memoir", "Education"],
        "averageRating": 4.8,
        "ratingsCount": 3900,
        "description": "A woman born to survivalists in the mountains of Idaho pursues education.",
        "tags": ["resilience", "family", "self-discovery"]
    },
    {
        "rentalProviderId": "65f1a1b2c3d4e5f678901309",
        "title": "Klara and the Sun",
        "image": "https://covers.openlibrary.org/b/isbn/9780571364909-L.jpg",
        "authorName": "Kazuo Ishiguro",
        "price": 890,
        "publishedDate": new Date("2021-03-02"),
        "pages": 320,
        "lastUpdatedDate": new Date(),
        "genre": ["Science Fiction", "Literary Fiction"],
        "averageRating": 4.5,
        "ratingsCount": 2800,
        "description": "An artificial friend observes the world and her human companions.",
        "tags": ["AI", "humanity", "love"]
    },
    {
        "rentalProviderId": "65f1a1b2c3d4e5f678901310",
        "title": "The Four Agreements",
        "image": "https://covers.openlibrary.org/b/isbn/9781878424310-L.jpg",
        "authorName": "Don Miguel Ruiz",
        "price": 750,
        "publishedDate": new Date("1997-01-01"),
        "pages": 160,
        "lastUpdatedDate": new Date(),
        "genre": ["Spirituality", "Self-help"],
        "averageRating": 4.8,
        "ratingsCount": 5600,
        "description": "A practical guide to personal freedom based on ancient Toltec wisdom.",
        "tags": ["wisdom", "personal-freedom", "mindfulness"]
    }
];
const seed = async () => {
    await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/test"
    );

    await BookModel.insertMany(books);

    console.log("Inserted");

    process.exit();
};

seed();
