import { createSlice, nanoid, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { RootState } from "./store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

const resolveImageUrl = (value?: string) => {
    if (!value) return "";
    const normalized = value.replace(/\\/g, "/").trim();
    if (/^https?:\/\//i.test(normalized)) return normalized;
    const path = normalized.startsWith("/") ? normalized : `/${normalized}`;
    return `${API_BASE_URL}${path}`;
};


export interface Book {
    id: string;
    rentalProviderId?: string;
    bookName: string;
    image: string;
    authorName: string;
    price: number;
    publishedDate: string;
    pages: number;
    genre: string[];
    isFavourite: boolean;
    averageRating?: number;
    ratingsCount?: number;
    description?: string;
    tags?: string[];
    lastUpdatedDate: string;
    readingStatus?: 'want_to_read' | 'reading' | 'completed' | null;
    myRating?: number | null;
    isAvailableForRent?: boolean;
    availabilityStatus?: 'available' | 'pending_provider_review' | 'awaiting_admin_confirmation' | 'refund_in_progress' | 'rented_out';
    availabilityMessage?: string;
}

interface BookState {
    books: Book[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
    filter: {
        search: string;
        genre: string;
    };
    loading: boolean;
    error: string | null;
}

const mapBook = (raw: any): Book => ({
    id: raw._id ?? raw.id,
    rentalProviderId: raw.rentalProviderId,
    bookName: raw.title ?? raw.bookName,
    authorName: raw.authorName,
    price: Number(raw.price ?? 0),
    image: resolveImageUrl(raw.image),
    publishedDate: raw.publishedDate,
    pages: raw.pages,
    genre: Array.isArray(raw.genre) ? raw.genre : (raw.genre ? [raw.genre] : []),
    isFavourite: raw.isFavourite ?? false,
    averageRating: raw.averageRating,
    ratingsCount: raw.ratingsCount,
    description: raw.description,
    tags: raw.tags ?? [],
    lastUpdatedDate: raw.lastUpdatedDate,
    readingStatus: raw.readingStatus ?? null,
    myRating: raw.myRating ?? null,
    isAvailableForRent: raw.isAvailableForRent ?? true,
    availabilityStatus: raw.availabilityStatus ?? 'available',
    availabilityMessage: raw.availabilityMessage ?? (raw.isAvailableForRent === false ? 'Currently not available for rent' : 'Available for rent'),
});

const initialState: BookState = {
    books: [],   // start empty — loaded from API
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    },
    filter: {
        search: "",
        genre: "all",
    },
    loading: false,
    error: null,
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchBooks = createAsyncThunk(
    'books/fetchBooks',
    async (params: { page?: number; limit?: number; search?: string } | undefined, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            const response = await axios.get('http://localhost:5000/api/books', {
                params,
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                    "Content-Type": "application/json",
                },
            });
            // FIX: backend returns { books: [], pagination: {} } — was using response.data directly
            const raw = response.data.books ?? response.data;
            return {
                books: (Array.isArray(raw) ? raw : []).map(mapBook),
                pagination: response.data.pagination ?? initialState.pagination,
            };
        } catch (error) {
            return rejectWithValue("Failed to fetch books");
        }
    }
);

// toggle a favourite book on server for current user
export const toggleFavoriteBook = createAsyncThunk(
    'books/toggleFavoriteBook',
    async (bookId: string, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            const response = await axios.put(
                `http://localhost:5000/api/users/favorites/${bookId}`,
                {},
                { headers: { Authorization: token ? `Bearer ${token}` : '' } }
            );
            return { bookId, isFavourite: response.data.isFavourite };
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update favorite');
        }
    }
);

export const upsertMyBookStatus = createAsyncThunk(
    'books/upsertMyBookStatus',
    async (
        { bookId, status }: { bookId: string; status: 'want_to_read' | 'reading' | 'completed' },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            const response = await axios.put(
                `http://localhost:5000/api/users/my-books/${bookId}`,
                { status },
                { headers: { Authorization: token ? `Bearer ${token}` : '' } }
            );
            return { bookId, status: response.data?.item?.status || status };
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to update my book status');
        }
    }
);

export const rateBook = createAsyncThunk(
    'books/rateBook',
    async (
        { bookId, rating }: { bookId: string; rating: number },
        { getState, rejectWithValue }
    ) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            const response = await axios.put(
                `http://localhost:5000/api/users/ratings/${bookId}`,
                { rating },
                { headers: { Authorization: token ? `Bearer ${token}` : '' } }
            );
            return {
                bookId,
                averageRating: response.data?.averageRating,
                ratingsCount: response.data?.ratingsCount,
                myRating: response.data?.myRating ?? rating
            };
        } catch (err: any) {
            return rejectWithValue(err.response?.data?.message || 'Failed to rate book');
        }
    }
);

export const createBookThunk = createAsyncThunk(
    'books/createBook',
    async (formData: FormData, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            const response = await axios.post('http://localhost:5000/api/books', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            return mapBook(response.data.book);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to create book");
        }
    }
);

export const deleteBookThunk = createAsyncThunk(
    'books/deleteBook',
    async (bookId: string, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            await axios.delete(`http://localhost:5000/api/books/${bookId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return bookId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete book");
        }
    }
);

export const updateBookThunk = createAsyncThunk(
    'books/updateBook',
    async ({ id, formData }: { id: string; formData: FormData }, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const token = state.auth.token;
            const response = await axios.put(`http://localhost:5000/api/books/${id}`, formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            return mapBook(response.data.book);
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || "Failed to update book");
        }
    }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const bookSlice = createSlice({
    initialState,
    name: "books",
    reducers: {
        // Keep your existing local reducers unchanged
        addBook: {
            reducer: (state, action: PayloadAction<Book>) => {
                state.books.push(action.payload);
            },
            prepare: (book: Omit<Book, 'id'>) => ({
                payload: { ...book, id: nanoid() },
            }),
        },
        removeBook: (state, action: PayloadAction<string>) => {
            state.books = state.books.filter(book => book.id !== action.payload);
        },
        updateBook: (state, action: PayloadAction<Partial<Book> & { id: string }>) => {
            const index = state.books.findIndex(book => book.id === action.payload.id);
            if (index !== -1) {
                state.books[index] = { ...state.books[index], ...action.payload };
            }
        },
        toggleFavorite: (state, action: PayloadAction<string>) => {
            const book = state.books.find(book => book.id === action.payload);
            if (book) book.isFavourite = !book.isFavourite;
        },
        searchFilter: (state, action: PayloadAction<string>) => {
            state.filter.search = action.payload;
        },
        searchGenre: (state, action: PayloadAction<string>) => {
            state.filter.genre = action.payload;
        },
        clearFilter: (state) => {
            state.filter.search = '';
            state.filter.genre = 'all';
        },
    },
    extraReducers: (builder) => {
        builder
            // fetchBooks
            .addCase(fetchBooks.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBooks.fulfilled, (state, action) => {
                state.loading = false;
                state.books = action.payload.books;
                state.pagination = {
                    total: action.payload.pagination.total ?? 0,
                    page: action.payload.pagination.page ?? 1,
                    limit: action.payload.pagination.limit ?? state.pagination.limit,
                    totalPages: action.payload.pagination.totalPages ?? 1,
                };
            })
            .addCase(fetchBooks.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string ?? "Failed to fetch books.";
            })

            // createBookThunk
            .addCase(createBookThunk.fulfilled, (state, action) => {
                state.books.unshift(action.payload); // add to top of list
            })
            .addCase(createBookThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            })

            // deleteBookThunk
            .addCase(deleteBookThunk.fulfilled, (state, action) => {
                state.books = state.books.filter(b => b.id !== action.payload);
            })
            .addCase(deleteBookThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            })

            // updateBookThunk
            .addCase(updateBookThunk.fulfilled, (state, action) => {
                const index = state.books.findIndex(b => b.id === action.payload.id);
                if (index !== -1) state.books[index] = action.payload;
            })
            .addCase(updateBookThunk.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            // handle toggling favorites
            .addCase(toggleFavoriteBook.pending, (state, action) => {
                const book = state.books.find(b => b.id === action.meta.arg);
                if (book) book.isFavourite = !book.isFavourite; // optimistic
            })
            .addCase(toggleFavoriteBook.fulfilled, (state, action) => {
                const { bookId, isFavourite } = action.payload;
                const book = state.books.find(b => b.id === bookId);
                if (book) book.isFavourite = isFavourite;
            })
            .addCase(toggleFavoriteBook.rejected, (state, action) => {
                state.error = (action.payload as string) || action.error.message || '';
                const book = state.books.find(b => b.id === action.meta.arg);
                if (book) book.isFavourite = !book.isFavourite; // revert optimistic
            })
            // handle my book status update
            .addCase(upsertMyBookStatus.fulfilled, (state, action) => {
                const { bookId, status } = action.payload;
                const book = state.books.find(b => b.id === bookId);
                if (book) {
                    book.readingStatus = status;
                }
            })
            .addCase(upsertMyBookStatus.rejected, (state, action) => {
                state.error = action.payload as string;
            })
            .addCase(rateBook.fulfilled, (state, action) => {
                const { bookId, averageRating, ratingsCount, myRating } = action.payload;
                const book = state.books.find(b => b.id === bookId);
                if (book) {
                    book.averageRating = averageRating;
                    book.ratingsCount = ratingsCount;
                    book.myRating = myRating;
                }
            })
            .addCase(rateBook.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});


export const {
    addBook,
    removeBook,
    updateBook,
    toggleFavorite,
    searchFilter,
    searchGenre,
    clearFilter,
} = bookSlice.actions;

export default bookSlice.reducer;
