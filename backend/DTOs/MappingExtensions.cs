using backend.Models;

namespace backend.DTOs;

public static class MappingExtensions
{
    public static BookDto ToDto(this Book book)
    {
        return new BookDto
        {
            ISBN = book.ISBN,
            Title = book.Title,
            Author = book.Author,
            Description = book.Description,
            Genre = book.Genre,
            PublishedYear = book.PublishedYear,
            Price = book.Price,
            Quantity = book.Quantity,
            CoverImageUrl = book.CoverImageUrl
        };
    }

    public static Book ToEntity(this BookCreateDto dto)
    {
        return new Book
        {
            ISBN = dto.ISBN,
            Title = dto.Title,
            Author = dto.Author,
            Description = dto.Description,
            Genre = dto.Genre,
            PublishedYear = dto.PublishedYear,
            Price = dto.Price,
            Quantity = dto.Quantity,
            CoverImageUrl = dto.CoverImageUrl
        };
    }

    public static void UpdateEntity(this BookUpdateDto dto, Book book)
    {
        book.Title = dto.Title;
        book.Author = dto.Author;
        book.Description = dto.Description;
        book.Genre = dto.Genre;
        book.PublishedYear = dto.PublishedYear;
        book.Price = dto.Price;
        book.Quantity = dto.Quantity;
        book.CoverImageUrl = dto.CoverImageUrl;
    }
}
