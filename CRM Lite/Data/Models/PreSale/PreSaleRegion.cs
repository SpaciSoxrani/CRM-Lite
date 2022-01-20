﻿using System;
using System.ComponentModel.DataAnnotations;

namespace CRM_Lite.Data.Models.PreSale
{
    public class PreSaleRegion
    {
        [Key]
        public Guid Id { get; set; }
        
        public string Name { get; set; }
        public string Timezone { get; set; }
    }
}
