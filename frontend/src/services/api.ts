const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5142';

export interface Book {
  isbn: string;
  title: string;
  author: string;
  description: string;
  genre: string;
  publishedYear: number;
  price: number;
  quantity: number;
  coverImageUrl: string;
}

export const api = {
  async getBooks(search?: string, genre?: string): Promise<Book[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (genre) params.append('genre', genre);
    
    const url = `${API_BASE_URL}/api/books${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch books');
    return response.json();
  },
  
  async getBook(isbn: string): Promise<Book> {
    const response = await fetch(`${API_BASE_URL}/api/books/${isbn}`);
    if (!response.ok) throw new Error(`Failed to fetch book with ISBN ${isbn}`);
    return response.json();
  },
  
  async createBook(book: Book): Promise<Book> {
    const response = await fetch(`${API_BASE_URL}/api/books`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errors = errorData.errors || [errorData.message || 'Failed to create book'];
      throw new Error(errors.join(', '));
    }
    return response.json();
  },
  
  async updateBook(isbn: string, book: Book): Promise<Book> {
    const response = await fetch(`${API_BASE_URL}/api/books/${isbn}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(book),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errors = errorData.errors || [errorData.message || 'Failed to update book'];
      throw new Error(errors.join(', '));
    }
    return response.json();
  },
  
  async deleteBook(isbn: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/books/${isbn}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete book');
    }
    return response.json();
  }
};
