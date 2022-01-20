using CRM_Lite.Data.Models;
using CRM_Lite.Data.Models.PreSale;
using Microsoft.EntityFrameworkCore;

namespace CRM_Lite.Data
{
    public class ApplicationContext : DbContext
    {
        public ApplicationContext(DbContextOptions options)
            : base(options)
        {
        }
        
        public DbSet<User> Users { get; set; }
        public DbSet<Department> Departments { get; set; }
        
        #region Pre-sale
        public DbSet<PreSale> PreSales { get; set; }
        public DbSet<PreSaleGroup> PreSaleGroups { get; set; }
        public DbSet<PreSaleGroupStatus> PreSaleGroupStatuses { get; set; }
        public DbSet<PreSaleStatus> PreSaleStatuses { get; set; }
        public DbSet<PreSaleResult> PreSaleResults { get; set; }
        public DbSet<PreSaleRegion> PreSaleRegions { get; set; }
        #endregion

    }
}