namespace backend.DTOs;

public class BookDto
{
    public string ISBN { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Genre { get; set; } = string.Empty;
    public int PublishedYear { get; set; }
    public decimal Price { get; set; }
    public int Quantity { get; set; }
    public string CoverImageUrl { get; set; } = string.Empty;
}
