using System.ComponentModel.DataAnnotations;

namespace CRM_Lite.Data.Models.PreSale
{
    public class PreSale
    {
        [Key]
        public Guid Id { get; set; }
        
        public string? Organization { get; set; }
        public string? FullName { get; set; }
        public string? JobTitle { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Email { get; set; }
        public string? Site { get; set; }
        public string? RequestSent { get; set; }
        public string? IncomingNumber { get; set; }
        public string? ExecutorContact { get; set; }
        public string? Comments { get; set; }
        public string? ResultComments { get; set; }

        public Guid? RegionId { get; set; }
        public PreSaleRegion Region { get; set; }

        public Guid? ResponsibleUserId { get; set; }
        public User ResponsibleUser { get; set; }

        public DateTime? DayAppointment { get; set; }

        public Guid? StatusId { get; set; }
        public PreSaleStatus Status { get; set; }

        public Guid? ResultId { get; set; }
        public PreSaleResult Result { get; set; }

        public DateTime CreatedDate { get; set; }
        public DateTime ChangedDate { get; set; }

        public PreSaleGroup Group { get; set; }
        public Guid? GroupId { get; set; }
    }
}
