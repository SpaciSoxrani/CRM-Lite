using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace CRM_Lite.Data.Models.PreSale
{
    public class PreSaleGroup
    {
        public PreSaleGroup()
        {
            IsVisible = true;
        }

        [Key]
        public Guid Id { get; set; }

        public string Name { get; set; }

        public Guid? StatusId { get; set; }
        public PreSaleGroupStatus Status { get; set; }

        public Guid? DepartmentId { get; set; }
        public Department Department { get; set; }

        public DateTime? CreatedDate { get; set; }
        public DateTime? ChangedDate { get; set; }

        [DefaultValue(true)]
        public bool IsVisible { get; set; }
    }
}
