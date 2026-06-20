using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data;

public class BookDbContext : DbContext
{
    public BookDbContext(DbContextOptions<BookDbContext> options) : base(options)
    {
    }

    public DbSet<Book> Books => Set<Book>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Seed initial data
        modelBuilder.Entity<Book>().HasData(
            new Book
            {
                ISBN = "978-0135957059",
                Title = "The Pragmatic Programmer",
                Author = "Andrew Hunt & David Thomas",
                Description = "Your journey to mastery. One of the most significant books in software development, explaining how to keep your code flexible, easy to adapt and reuse.",
                Genre = "Software Engineering",
                PublishedYear = 2019,
                Price = 39.99m,
                Quantity = 12,
                CoverImageUrl = "/covers/pragmatic_programmer.png"
            },
            new Book
            {
                ISBN = "978-0132350884",
                Title = "Clean Code",
                Author = "Robert C. Martin",
                Description = "A handbook of agile software craftsmanship. Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
                Genre = "Software Engineering",
                PublishedYear = 2008,
                Price = 34.95m,
                Quantity = 8,
                CoverImageUrl = "/covers/clean_code.png"
            },
            new Book
            {
                ISBN = "978-1491903070",
                Title = "Designing Data-Intensive Applications",
                Author = "Martin Kleppmann",
                Description = "The big ideas behind reliable, scalable, and maintainable systems. Learn the key concepts and trade-offs of database engines, processing systems, and messaging.",
                Genre = "System Design",
                PublishedYear = 2017,
                Price = 44.99m,
                Quantity = 15,
                CoverImageUrl = "/covers/designing_data_intensive.png"
            },
            new Book
            {
                ISBN = "978-0261103343",
                Title = "The Hobbit",
                Author = "J.R.R. Tolkien",
                Description = "Written for J.R.R. Tolkien's own children, The Hobbit met with instant critical acclaim when published in 1937 and remains a beloved classic of fantasy literature.",
                Genre = "Fantasy",
                PublishedYear = 1937,
                Price = 14.99m,
                Quantity = 25,
                CoverImageUrl = "/covers/the_hobbit.png"
            },
            new Book
            {
                ISBN = "978-0451524935",
                Title = "1984",
                Author = "George Orwell",
                Description = "A chilling dystopian novel about totalitarianism, surveillance, and individual freedom, introducing concepts like Big Brother and Doublethink.",
                Genre = "Dystopian",
                PublishedYear = 1949,
                Price = 9.99m,
                Quantity = 0,
                CoverImageUrl = "/covers/1984.png"
            }
        );
    }
}
