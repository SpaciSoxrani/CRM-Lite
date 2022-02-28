using System.ComponentModel.DataAnnotations;

namespace CRM_Lite.Data.Models.PreSale
{
    public class PreSaleResult
    {

        [Key]
        public Guid Id { get; set; }

        public string Name { get; set; }

        public IEnumerable<CRM_Lite.Data.Models.PreSale.PreSale> PreSales { get; set; }
    }
}
