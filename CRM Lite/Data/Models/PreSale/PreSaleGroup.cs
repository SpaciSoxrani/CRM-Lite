using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using CRM.Data.Models.Lookup;

namespace CRM.Data.Models.PreSale
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

        public User CreatedByUser { get; set; }
        public Guid? CreatedByUserId { get; set; }

        public User ChangedByUser { get; set; }
        public Guid? ChangedByUserId { get; set; }

        [DefaultValue(true)]
        public bool IsVisible { get; set; }
        public IEnumerable<PreSaleGroupAccessList> PreSaleGroupAccessLists { get; set; }
    }
}
