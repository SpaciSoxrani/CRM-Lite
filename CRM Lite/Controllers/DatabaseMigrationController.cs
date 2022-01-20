using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CRM.Data;
using CRM.Data.Models;
using CRM.Data.Models.Lookup;
using CRM.Data.Models.Marketing;
using CRM.Data.Models.Marketing.MarketingList;
using CRM.Data.Models.UserSettings;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Mosaico.NetCore.Models;

namespace CRM.API.Controllers
{
    [Produces("application/json")]
    [Route("api/DatabaseMigration")]
    public class DatabaseMigrationController : Controller
    {
        private readonly string mssqlConnection;
        private readonly string pgConnection;
        private readonly IWebHostEnvironment env;
        private readonly ILogger<DatabaseMigrationController> logger;
        private readonly Dictionary<Guid, Guid?> departmentManagers;
        private readonly Dictionary<Guid, Guid?> mainContacts;

        public DatabaseMigrationController(IConfiguration config, IWebHostEnvironment env, ILogger<DatabaseMigrationController> logger)
        {
            mssqlConnection = "Server=localhost;Database=CRM.2;Trusted_Connection=True;MultipleActiveResultSets=true";
            pgConnection = "Host=localhost;Port=5433;Database=CRM_NEW_22;Username=postgres;Password=123";
            this.env = env;
            this.logger = logger;
            departmentManagers = new Dictionary<Guid, Guid?>();
            mainContacts = new Dictionary<Guid, Guid?>();
        }

        // Не забыть отключить дефолтные фильрры на контекст
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Execute([FromQuery] string password)
        {
            if (!env.IsDevelopment() || password != "135")
                return Forbid();

            var msContextOptions = new DbContextOptionsBuilder<ApplicationContext>();
            msContextOptions.UseSqlServer(mssqlConnection);
            var msContext = new ApplicationContext(msContextOptions.Options);

            var pgContextOptions = new DbContextOptionsBuilder<ApplicationContext>();
            pgContextOptions.UseNpgsql(pgConnection);
            var pgContext = new ApplicationContext(pgContextOptions.Options);

            var types = new dynamic[]
            {
                new Address(),
                new AttachementsList(),
                new BankDetails(),
                new Category(),
                new ContactRole(),
                new DealStatus(),
                new Gender(),
                //new Group(),
                new Industry(),
                new InterestQualification(),
                new Interest(),
                new MarketingCompanyType(),
                new MarketingCongratulationType(),
                new MarketingEventFormat(),
                new MarketingEventType(),
                //new MarketingList(),
                new MarketingNetCompany(),
                new MarketingPRTag(),
                new MarketingPRType(),
                new MosaicoEmail(),
                new PurchaseTimeInterval(),
                new RealisationPlan(),
                new Relationship(),
                new Role(),
                new SelectionProcedure(),
                new Step(),
                new MarketingEventCompany(),
                new MarketingMailCompany(),
                new MarketingPRCompany(),
                //new Message(),
                new Department(),
                new User(),
                new UserEmailManagement(),
                new UserRole(),
                new Files(),
                new Organization(),
                new Contact(),
                new DealType(),
                new Deal(),
                new MarketingListContact(),
                new MarketingLoyaltyBirthday(),
                new MarketingLoyaltyCongratulations(),
                new SalesInterest(),
                new CloudLink(),
                new DealAccessList(),
                new DealAdditionalAccessList(),
                new IndustrialUnitDeal(),
                new MarketingLoyaltySatisfactionRating(),
                new OldCrmFile(),
                new ProductLines(),
                new OldProductRequest(),
                new OldServiceRequest(),
                new PeopleOfInterestDeal(),
                new ProductLineDeal(),
                new ProductRequest(),
                new ProductUnitDeal(),
                new ServicesRequest(),
                new AnotherResponsiblesProductRequest(),
                new AnotherResponsiblesRequest(),
                new AnotherResponsiblesServicesRequest(),
                new AnswersForServicesRequest(),
                new IndustrialUnitServicesRequest(),
                new MarketingCompany(),
                new QuestsForRequest(),
                new Vendor(),
                new VendorsRequest(),
                new MarketingCompanyProductLines(),
                new ResponsiblesForAnswer()
            };

            foreach (var type in types.Reverse())
                await DeleteDbSetAsync(pgContext, type);
            await pgContext.SaveChangesAsync();

            foreach (var type in types)
                await MigrateDbSetAsync(msContext, pgContext, type);

            await UpdateSpecialSetsAsync(pgContext);
            await pgContext.SaveChangesAsync();

            logger.LogInformation("Complete");
            return Ok();
        }

        private async Task UpdateSpecialSetsAsync(ApplicationContext pgContext)
        {
            logger.LogInformation("Start updating special sets");
            foreach (var (id, manager) in departmentManagers)
            {
                var department = await pgContext.Departments.FindAsync(id);
                department.ManagerId = manager;
            }

            foreach (var (id, contact) in mainContacts)
            {
                var department = await pgContext.Organizations.FindAsync(id);
                department.MainContactId = contact;
            }
        }

        private async Task DeleteDbSetAsync<TSet>(ApplicationContext pgContext, TSet _)
            where TSet : class
        {
            if (pgContext.Database.ProviderName != "Npgsql.EntityFrameworkCore.PostgreSQL")
            {
                throw new Exception("Возможно, были перепутаны провайдеры базы данных");
            }

            logger.LogInformation($"Deleting set {typeof(TSet).FullName} from destination");
            var pgSetObjects = await pgContext.Set<TSet>().AsNoTracking().ToArrayAsync();
            pgContext.Set<TSet>().RemoveRange(pgSetObjects);
        }

        private async Task MigrateDbSetAsync<TSet>(
            ApplicationContext msContext,
            ApplicationContext pgContext,
            TSet type)
            where TSet : class
        {
            if (pgContext.Database.ProviderName != "Npgsql.EntityFrameworkCore.PostgreSQL"
                || msContext.Database.ProviderName != "Microsoft.EntityFrameworkCore.SqlServer")
            {
                throw new Exception("Возможно, были перепутаны провайдеры базы данных");
            }

            logger.LogInformation($"Migration set {typeof(TSet).FullName} to destination");
            switch (type)
            {
                case Department _:
                {
                    var entities = await msContext.Set<Department>().ToArrayAsync();
                    foreach (var entity in entities)
                    {
                        departmentManagers.Add(entity.Id, entity.ManagerId);
                        entity.ManagerId = null;
                    }

                    await pgContext.Set<Department>().AddRangeAsync(entities);
                    break;
                }
                case Organization _:
                {
                    var entities = await msContext.Set<Organization>().ToArrayAsync();
                    foreach (var entity in entities)
                    {
                        mainContacts.Add(entity.Id, entity.MainContactId);
                        entity.MainContactId = null;
                    }

                    await pgContext.Set<Organization>().AddRangeAsync(entities);
                    break;
                }
                case Files _:
                {
                    var entities = await msContext.Set<Files>().ToArrayAsync();
                    foreach (var entity in entities)
                    {
                        entity.Path = entity.Path
                            .Replace(@"\\p-host-crm-2\CRM-BACK\", @"/app/")
                            .Replace("\\", "/");
                    }

                    await pgContext.Set<Files>().AddRangeAsync(entities);
                    break;
                }
                default:
                {
                    var entities = await msContext.Set<TSet>().ToArrayAsync();
                    await pgContext.Set<TSet>().AddRangeAsync(entities);
                    break;
                }
            }
            
            try
            {
                await pgContext.SaveChangesAsync();
            }
            catch (Exception e)
            {
                logger.LogWarning($"Error. SET: {typeof(TSet).FullName}. Exception: {e.Message}. Trace: {e.StackTrace}");
            }
        }
    }
}