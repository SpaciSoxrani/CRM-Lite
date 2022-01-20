using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CRM.Data.Models.Lookup;

namespace CRM.Data.Models.PreSale
{
    public class PreSaleGroupStatus
    {

        [Key]
        public Guid Id { get; set; }

        public string Name { get; set; }

        public IEnumerable<PreSaleGroup> PreSaleGroups { get; set; }
    }
}
