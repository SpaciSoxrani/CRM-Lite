using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CRM.Data.Models.Lookup;
using CRM.Data.Models.Marketing.MarketingList;
using Newtonsoft.Json;

namespace CRM.Data.Models.PreSale
{
    public class PreSaleRegion
    {
        [Key]
        public Guid Id { get; set; }
        
        public string Name { get; set; }
        public string Timezone { get; set; }
    }
}
