using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CRM.Data.Models.Lookup;
using CRM.Data.Models.Marketing.MarketingList;

namespace CRM.Data.Models.PreSale
{
    public class PreSaleStatus
    {

        [Key]
        public Guid Id { get; set; }

        public string Name { get; set; }

        public IEnumerable<PreSale> PreSales { get; set; }
    }
}
