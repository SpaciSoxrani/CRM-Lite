using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CRM_Lite.Data.Models.PreSale
{
    public class PreSaleStatus
    {

        [Key]
        public Guid Id { get; set; }

        public string Name { get; set; }

        public IEnumerable<CRM_Lite.Data.Models.PreSale.PreSale> PreSales { get; set; }
    }
}
