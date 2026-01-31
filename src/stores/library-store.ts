import { create } from "zustand";

export interface Book {
  id: string;
  slug: string;
  title: string;
  author: string | null;
  description: string | null;
  cover: string | null;
  format: "markdown" | "epub" | "pdf";
  createdAt: string;
}

interface LibraryState {
  books: Book[];
  setBooks: (books: Book[]) => void;
  addBook: (book: Book) => void;
  removeBook: (slug: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
  books: [],
  setBooks: (books) => set({ books }),
  addBook: (book) => set((state) => ({ books: [...state.books, book] })),
  removeBook: (slug) =>
    set((state) => ({ books: state.books.filter((b) => b.slug !== slug) })),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
