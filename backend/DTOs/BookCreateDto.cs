using System.ComponentModel.DataAnnotations;

namespace backend.DTOs;

public class BookCreateDto
{
    [Required(ErrorMessage = "ISBN is required.")]
    [RegularExpression(@"^(97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]{1,7}[- ]?[0-9]{1,7}[- ]?[0-9X]$", ErrorMessage = "Invalid ISBN format.")]
    public string ISBN { get; set; } = string.Empty;

    [Required(ErrorMessage = "Title is required.")]
    [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Author name is required.")]
    [StringLength(100, ErrorMessage = "Author name cannot exceed 100 characters.")]
    public string Author { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [StringLength(50, ErrorMessage = "Genre cannot exceed 50 characters.")]
    public string Genre { get; set; } = string.Empty;

    [Range(0, 2100, ErrorMessage = "Please enter a valid publication year.")]
    public int PublishedYear { get; set; }

    [Range(0.0, 10000.0, ErrorMessage = "Price must be a positive value.")]
    public decimal Price { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Quantity cannot be negative.")]
    public int Quantity { get; set; }

    public string CoverImageUrl { get; set; } = string.Empty;
}
