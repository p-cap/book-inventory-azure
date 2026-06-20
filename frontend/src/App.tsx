import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  Sun, 
  Moon, 
  DollarSign, 
  Layers, 
  AlertTriangle, 
  X, 
  RefreshCw,
  BookMarked
} from 'lucide-react';
import { api } from './services/api';
import type { Book } from './services/api';


const DEFAULT_FORM_STATE: Book = {
  isbn: '',
  title: '',
  author: '',
  description: '',
  genre: '',
  publishedYear: new Date().getFullYear(),
  price: 0.0,
  quantity: 0,
  coverImageUrl: ''
};

export default function App() {
  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  // API & Data States
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  
  // Modals States
  const [isAddEditOpen, setIsAddEditOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  
  // Selection and Form States
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [formData, setFormData] = useState<Book>(DEFAULT_FORM_STATE);
  const [formErrors, setFormErrors] = useState<string[]>([]);

  // Apply dark mode theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Initial load and filter change
  useEffect(() => {
    loadBooks();
  }, [searchTerm, selectedGenre]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getBooks(searchTerm, selectedGenre);
      setBooks(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load books from database.');
    } finally {
      setLoading(false);
    }
  };

  // Stats calculation
  const totalTitles = books.length;
  const totalQuantity = books.reduce((acc, b) => acc + b.quantity, 0);
  const totalValue = books.reduce((acc, b) => acc + (b.price * b.quantity), 0);
  const outOfStockCount = books.filter(b => b.quantity === 0).length;

  // Extract unique genres for the dropdown list
  const allGenres = Array.from(new Set(books.map(b => b.genre).filter(Boolean)));

  // Form Handlers
  const handleOpenAdd = () => {
    setIsEditMode(false);
    setSelectedBook(null);
    setFormData({
      ...DEFAULT_FORM_STATE,
      publishedYear: new Date().getFullYear()
    });
    setFormErrors([]);
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (book: Book) => {
    setIsEditMode(true);
    setSelectedBook(book);
    setFormData({ ...book });
    setFormErrors([]);
    setIsAddEditOpen(true);
  };

  const handleOpenDetails = (book: Book) => {
    setSelectedBook(book);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (book: Book, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid opening details modal
    setSelectedBook(book);
    setIsDeleteOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'publishedYear' || name === 'quantity' 
        ? parseInt(value) || 0 
        : name === 'price' 
          ? parseFloat(value) || 0
          : value
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    // ISBN Validation
    const isbnRegex = /^(97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]{1,7}[- ]?[0-9]{1,7}[- ]?[0-9X]$/;
    if (!formData.isbn.trim()) {
      errors.push('ISBN is required.');
    } else if (!isbnRegex.test(formData.isbn.replace(/\s+/g, ''))) {
      errors.push('Invalid ISBN format (should be e.g. 978-0135957059 or 10-digit equivalent).');
    }

    if (!formData.title.trim()) errors.push('Book Title is required.');
    if (!formData.author.trim()) errors.push('Author name is required.');
    if (formData.publishedYear < 0 || formData.publishedYear > 2100) errors.push('Please enter a valid publication year.');
    if (formData.price < 0) errors.push('Price cannot be negative.');
    if (formData.quantity < 0) errors.push('Quantity cannot be negative.');

    setFormErrors(errors);
    return errors.length === 0;
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (isEditMode && selectedBook) {
        await api.updateBook(selectedBook.isbn, formData);
      } else {
        await api.createBook(formData);
      }
      setIsAddEditOpen(false);
      loadBooks();
    } catch (err: any) {
      setFormErrors([err.message || 'An error occurred while saving the book.']);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedBook) return;
    try {
      await api.deleteBook(selectedBook.isbn);
      setIsDeleteOpen(false);
      setSelectedBook(null);
      loadBooks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete book.');
    }
  };

  const getStockBadgeClass = (qty: number) => {
    if (qty === 0) return 'stock-status stock-out';
    if (qty < 5) return 'stock-status stock-low';
    return 'stock-status stock-in';
  };

  const getStockBadgeText = (qty: number) => {
    if (qty === 0) return 'Out of Stock';
    if (qty < 5) return `Low Stock (${qty})`;
    return `In Stock (${qty})`;
  };

  return (
    <div className="app-container">
      {/* Premium Glass Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon">
            <BookMarked size={22} />
          </div>
          <div>
            <h1 className="brand-title">LuminaBooks</h1>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={handleOpenAdd}
          >
            <Plus size={18} /> Add Book
          </button>
        </div>
      </header>

      {/* Statistics Panel */}
      <section className="stats-grid" aria-label="Inventory Statistics">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'var(--primary-gradient)' }}>
            <BookOpen size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Titles</span>
            <span className="stat-value">{totalTitles}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'var(--accent-gradient)' }}>
            <Layers size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Stock Copies</span>
            <span className="stat-value">{totalQuantity}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Value</span>
            <span className="stat-value">${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: outOfStockCount > 0 ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Out of Stock Alert</span>
            <span className="stat-value">{outOfStockCount}</span>
          </div>
        </div>
      </section>

      {/* Control Hub: Search and Filters */}
      <section className="control-hub" aria-label="Inventory Filters">
        <div className="search-filter-group">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              className="search-input"
              placeholder="Search by Title, Author, Description or ISBN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="select-genre"
            value={selectedGenre}
            onChange={(e) => setSelectedGenre(e.target.value)}
          >
            <option value="">All Genres</option>
            {allGenres.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <button 
          className="btn btn-secondary"
          onClick={() => { setSearchTerm(''); setSelectedGenre(''); }}
          title="Refresh database"
        >
          <RefreshCw size={16} /> Reset
        </button>
      </section>

      {/* Error State Banner */}
      {error && (
        <div className="form-errors-summary" style={{ marginBottom: '2rem' }} role="alert">
          <p><strong>Error connecting to server:</strong> {error}</p>
          <button className="btn btn-secondary" style={{ marginTop: '0.75rem', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={loadBooks}>
            Try Reconnecting
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
          <RefreshCw className="animate-spin" size={32} style={{ animation: 'spin 1.5s linear infinite', marginBottom: '1rem' }} />
          <p>Syncing book inventory...</p>
        </div>
      ) : (
        /* Books Display Grid */
        <main className="books-grid">
          {books.length === 0 ? (
            <div className="no-books-card">
              <BookOpen size={48} />
              <h3>No books found</h3>
              <p style={{ marginTop: '0.5rem' }}>We couldn't find any books matching your criteria. Try adjusting your search filters or add a new book!</p>
            </div>
          ) : (
            books.map(book => (
              <article key={book.isbn} className="book-card" onClick={() => handleOpenDetails(book)}>
                <div className="book-cover-container">
                  <img 
                    src={book.coverImageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'} 
                    alt={`Cover image of ${book.title}`} 
                    className="book-cover-image"
                    onError={(e) => {
                      // Fallback to placeholder if imageUrl fails
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                  {book.genre && <span className="book-genre-tag">{book.genre}</span>}
                </div>
                
                <div className="book-content">
                  <header className="book-header">
                    <h2 className="book-title">{book.title}</h2>
                    <p className="book-author">by {book.author}</p>
                  </header>
                  
                  <p className="book-desc">{book.description || 'No description provided.'}</p>
                  
                  <div className="book-meta">
                    <span className="book-price">${book.price.toFixed(2)}</span>
                    <span className={getStockBadgeClass(book.quantity)}>
                      {getStockBadgeText(book.quantity)}
                    </span>
                  </div>

                  <div className="book-card-actions">
                    <button 
                      className="btn btn-icon"
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(book); }}
                      title="Edit book details"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      className="btn btn-icon btn-icon-danger"
                      onClick={(e) => handleOpenDelete(book, e)}
                      title="Delete book from inventory"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </main>
      )}

      {/* Add / Edit Book Modal */}
      {isAddEditOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-edit-modal-title">
          <div className="modal-window">
            <div className="modal-header">
              <h2 className="modal-title" id="add-edit-modal-title">
                {isEditMode ? 'Edit Book Specifications' : 'Catalog New Book Entry'}
              </h2>
              <button className="btn btn-icon" onClick={() => setIsAddEditOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveBook}>
              <div className="modal-body">
                {formErrors.length > 0 && (
                  <div className="form-errors-summary">
                    <strong>Validation Error Checklist:</strong>
                    <ul>
                      {formErrors.map((err, idx) => <li key={idx}>{err}</li>)}
                    </ul>
                  </div>
                )}
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label" htmlFor="input-isbn">ISBN Code (Key)</label>
                    <input 
                      type="text" 
                      id="input-isbn"
                      name="isbn"
                      className="form-input" 
                      placeholder="e.g. 978-0135957059"
                      value={formData.isbn}
                      onChange={handleInputChange}
                      disabled={isEditMode} // Cannot edit primary key
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-title">Book Title</label>
                    <input 
                      type="text" 
                      id="input-title"
                      name="title"
                      className="form-input" 
                      placeholder="e.g. Clean Code"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-author">Author Name</label>
                    <input 
                      type="text" 
                      id="input-author"
                      name="author"
                      className="form-input" 
                      placeholder="e.g. Robert C. Martin"
                      value={formData.author}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-genre">Genre</label>
                    <input 
                      type="text" 
                      id="input-genre"
                      name="genre"
                      className="form-input" 
                      placeholder="e.g. Software Engineering"
                      value={formData.genre}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-year">Published Year</label>
                    <input 
                      type="number" 
                      id="input-year"
                      name="publishedYear"
                      className="form-input" 
                      placeholder="e.g. 2008"
                      value={formData.publishedYear}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-price">Unit Price ($)</label>
                    <input 
                      type="number" 
                      id="input-price"
                      name="price"
                      step="0.01"
                      className="form-input" 
                      placeholder="0.00"
                      value={formData.price || ''}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-quantity">Initial Stock Quantity</label>
                    <input 
                      type="number" 
                      id="input-quantity"
                      name="quantity"
                      className="form-input" 
                      placeholder="0"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="input-cover">Cover Image URL</label>
                    <input 
                      type="text" 
                      id="input-cover"
                      name="coverImageUrl"
                      className="form-input" 
                      placeholder="e.g. /covers/clean_code.png or remote URL"
                      value={formData.coverImageUrl}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="form-group form-group-full">
                    <label className="form-label" htmlFor="input-desc">Book Synopsis / Description</label>
                    <textarea 
                      id="input-desc"
                      name="description"
                      className="form-input form-textarea" 
                      placeholder="Write a brief overview of the book's contents, main ideas..."
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddEditOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditMode ? 'Apply Updates' : 'Commit Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Detailed Drawer Modal */}
      {isDetailsOpen && selectedBook && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="details-modal-title" onClick={() => setIsDetailsOpen(false)}>
          <div className="modal-window" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" id="details-modal-title">Book Specifications Sheet</h2>
              <button className="btn btn-icon" onClick={() => setIsDetailsOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-cover-container">
                  <img 
                    src={selectedBook.coverImageUrl || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400'} 
                    alt={`Cover photo of ${selectedBook.title}`}
                    className="detail-cover-image"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&q=80&w=400';
                    }}
                  />
                </div>
                
                <div className="detail-info">
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>{selectedBook.title}</h3>
                    <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 500 }}>by {selectedBook.author}</p>
                  </div>

                  <div className="detail-badge-group">
                    {selectedBook.genre && <span className="book-genre-tag" style={{ position: 'static' }}>{selectedBook.genre}</span>}
                    <span className={getStockBadgeClass(selectedBook.quantity)} style={{ margin: 0 }}>
                      {getStockBadgeText(selectedBook.quantity)}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">ISBN Code:</span>
                    <span className="detail-value" style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedBook.isbn}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Price:</span>
                    <span className="detail-value" style={{ fontWeight: 700 }}>${selectedBook.price.toFixed(2)}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Published:</span>
                    <span className="detail-value">{selectedBook.publishedYear || 'N/A'}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Stock Quantity:</span>
                    <span className="detail-value">{selectedBook.quantity} units</span>
                  </div>

                  <div className="detail-row" style={{ border: 'none' }}>
                    <span className="detail-label">Valuation:</span>
                    <span className="detail-value" style={{ color: 'var(--success)', fontWeight: 700 }}>
                      ${(selectedBook.price * selectedBook.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>Synopsis / Description</h4>
                <p className="detail-desc">{selectedBook.description || 'No detailed description available for this catalog entry.'}</p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => { setIsDetailsOpen(false); handleOpenEdit(selectedBook); }}
              >
                Edit Book Specs
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setIsDetailsOpen(false)}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && selectedBook && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="modal-window" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title" id="delete-modal-title" style={{ color: 'var(--danger)' }}>De-catalog Book Entry?</h2>
              <button className="btn btn-icon" onClick={() => setIsDeleteOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body">
              <p>Are you sure you want to permanently delete the book <strong>"{selectedBook.title}"</strong> (ISBN: {selectedBook.isbn}) from the inventory?</p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '1rem' }}>This action is irreversible and will remove all copies and pricing data.</p>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-danger" onClick={handleDeleteConfirm}>
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
