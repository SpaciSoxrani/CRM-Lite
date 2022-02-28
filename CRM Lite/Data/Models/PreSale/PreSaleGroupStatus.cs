using System.ComponentModel.DataAnnotations;

namespace CRM_Lite.Data.Models.PreSale
{
    public class PreSaleGroupStatus
    {

        [Key]
        public Guid Id { get; set; }

        public string Name { get; set; }

        public IEnumerable<PreSaleGroup> PreSaleGroups { get; set; }
    }
}
