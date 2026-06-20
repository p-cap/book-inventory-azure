using backend.Data;
using backend.Models;
using backend.DTOs;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

var builder = WebApplication.CreateBuilder(args);

// Determine database provider and connection string
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrEmpty(connectionString))
{
    // Fallback to SQLite for local development if no connection string is provided
    connectionString = "Data Source=books.db";
    builder.Services.AddDbContext<BookDbContext>(options =>
        options.UseSqlite(connectionString));
}
else if (connectionString.Contains("Host=") || connectionString.Contains("Server=") || connectionString.Contains("Port="))
{
    // Use PostgreSQL
    builder.Services.AddDbContext<BookDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else
{
    // Default SQLite fallback
    builder.Services.AddDbContext<BookDbContext>(options =>
        options.UseSqlite(connectionString));
}

// Add CORS configuration
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();

// Auto-create/migrate database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BookDbContext>();
    try
    {
        // EnsureCreated is used here as it supports multiple database providers
        // without conflict over migration history formats (Sqlite vs Postgres).
        db.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "An error occurred while creating/seeding the database.");
    }
}

// REST API Endpoints Group for Books
var booksApi = app.MapGroup("/api/books");

// GET /api/books - List all books (with optional search and genre filters)
booksApi.MapGet("/", async (BookDbContext db, string? search, string? genre) =>
{
    IQueryable<Book> query = db.Books;

    if (!string.IsNullOrEmpty(genre))
    {
        query = query.Where(b => b.Genre.ToLower() == genre.ToLower());
    }

    if (!string.IsNullOrEmpty(search))
    {
        var searchLower = search.ToLower();
        query = query.Where(b => 
            b.Title.ToLower().Contains(searchLower) || 
            b.Author.ToLower().Contains(searchLower) || 
            b.ISBN.Contains(search) || 
            b.Description.ToLower().Contains(searchLower)
        );
    }

    var books = await query.ToListAsync();
    var bookDtos = books.Select(b => b.ToDto()).ToList();
    return Results.Ok(bookDtos);
})
.WithName("GetBooks");

// GET /api/books/{isbn} - Get single book details
booksApi.MapGet("/{isbn}", async (BookDbContext db, string isbn) =>
{
    var book = await db.Books.FindAsync(isbn);
    return book is not null ? Results.Ok(book.ToDto()) : Results.NotFound(new { message = $"Book with ISBN {isbn} not found." });
})
.WithName("GetBookByIsbn");

// POST /api/books - Create new book
booksApi.MapPost("/", async (BookDbContext db, BookCreateDto newBookDto) =>
{
    // Validate model properties
    var validationContext = new ValidationContext(newBookDto);
    var validationResults = new List<ValidationResult>();
    if (!Validator.TryValidateObject(newBookDto, validationContext, validationResults, true))
    {
        var errors = validationResults.Select(r => r.ErrorMessage).ToList();
        return Results.BadRequest(new { errors });
    }

    // Check if duplicate ISBN exists
    var existingBook = await db.Books.FindAsync(newBookDto.ISBN);
    if (existingBook is not null)
    {
        return Results.Conflict(new { errors = new[] { $"A book with ISBN {newBookDto.ISBN} already exists." } });
    }

    var newBook = newBookDto.ToEntity();
    db.Books.Add(newBook);
    await db.SaveChangesAsync();

    return Results.Created($"/api/books/{newBook.ISBN}", newBook.ToDto());
})
.WithName("CreateBook");

// PUT /api/books/{isbn} - Update an existing book
booksApi.MapPut("/{isbn}", async (BookDbContext db, string isbn, BookUpdateDto updatedBookDto) =>
{
    if (isbn != updatedBookDto.ISBN)
    {
        return Results.BadRequest(new { errors = new[] { "ISBN in route and request body must match." } });
    }

    // Validate model properties
    var validationContext = new ValidationContext(updatedBookDto);
    var validationResults = new List<ValidationResult>();
    if (!Validator.TryValidateObject(updatedBookDto, validationContext, validationResults, true))
    {
        var errors = validationResults.Select(r => r.ErrorMessage).ToList();
        return Results.BadRequest(new { errors });
    }

    var book = await db.Books.FindAsync(isbn);
    if (book is null)
    {
        return Results.NotFound(new { message = $"Book with ISBN {isbn} not found." });
    }

    // Update entity values
    updatedBookDto.UpdateEntity(book);

    await db.SaveChangesAsync();

    return Results.Ok(book.ToDto());
})
.WithName("UpdateBook");

// DELETE /api/books/{isbn} - Remove a book
booksApi.MapDelete("/{isbn}", async (BookDbContext db, string isbn) =>
{
    var book = await db.Books.FindAsync(isbn);
    if (book is null)
    {
        return Results.NotFound(new { message = $"Book with ISBN {isbn} not found." });
    }

    db.Books.Remove(book);
    await db.SaveChangesAsync();

    return Results.Ok(new { message = $"Book with ISBN {isbn} was successfully deleted." });
})
.WithName("DeleteBook");

app.Run();
