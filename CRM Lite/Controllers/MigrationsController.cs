using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CRM.API.Data;
using CRM.API.Utilities;
using CRM.API.Utilities.Migration;
using CRM.API.Utils.Migration;
using CRM.Data;
using CRM.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM.API.Controllers
{
    [Route("api/[controller]")]
    [Authorize]
    public class MigrationsController : Controller
    {
        private readonly ApplicationContext applicationContext;
        private readonly ILogger<MigrationsController> logger;
        private readonly UserUpdateManager userUpdateManager;
        private readonly ILogger<DbInitializer> dbInitializerlogger;
        private IWebHostEnvironment hostingEnvironment;

        public MigrationsController(ApplicationContext context, UserUpdateManager userUpdateManager, IWebHostEnvironment environment, ILogger<MigrationsController> logger, ILogger<DbInitializer> dbInitializerlogger)
        {
            applicationContext = context;
            this.logger = logger;
            this.userUpdateManager = userUpdateManager;
            this.dbInitializerlogger = dbInitializerlogger;
            hostingEnvironment = environment;
        }

        [HttpGet("MigrateAll")]
        public async Task<IActionResult> MigrateAll()
        {

            try
            {
                await MigrateUsers();

                await MigrateOrganizations();
                await SetParentOrganizations();

                await AddAdditionalDepartmentsAndVendors();

                await MigrateContacts();

                await MigrateDeals();

                await MigrateProductRequests();
                await MigrateServiceRequests();

                await MigrateIndustries();
                await MigrateRelationships();

                logger.LogWarning("MigrationCompleted");
            }
            catch (Exception e)
            {
                return StatusCode(500, new { e, e.Message, e.StackTrace, e.InnerException });
            }

            return Ok("Миграция прошла успешно");
        }

        [HttpGet("AddUserRoles")]
        public async Task<IActionResult> AddUserRoles()
        {
            var userRoles = new List<Tuple<string, string>>
            {
                new Tuple<string, string>( "Администратор", "gorbunov" ),
                new Tuple<string, string>( "Администратор", "muravlev" ),
                new Tuple<string, string>( "TOP-менеджер", "krachkovskaya" ),
                new Tuple<string, string>( "TOP-менеджер", "prozorov" ),
                new Tuple<string, string>( "TOP-менеджер", "suslov" ),
                new Tuple<string, string>( "TOP-менеджер", "bersenev" ),
                new Tuple<string, string>( "TOP-менеджер", "zavada" ),
                new Tuple<string, string>( "TOP-менеджер", "vlad" ),
                new Tuple<string, string>( "TOP-менеджер", "litovskaya" ),
                new Tuple<string, string>( "TOP-менеджер", "kotohin" ),
                new Tuple<string, string>( "TOP-менеджер", "bers" ),
                new Tuple<string, string>( "Менеджер по СМК", "volkova" ),
                new Tuple<string, string>( "Ассистент менеджера по работе с клиентами", "abitotskaya" ),
                new Tuple<string, string>( "Ассистент менеджера по работе с клиентами", "makarova" ),
                new Tuple<string, string>( "Ассистент менеджера по работе с клиентами", "d.sabirov" ),
                new Tuple<string, string>( "Ассистент менеджера по работе с клиентами", "shchukina" ),
                new Tuple<string, string>( "Администратор СЦ", "salakhutdinova" ),
                new Tuple<string, string>( "Юрисконсульт", "konovalova" ),
                new Tuple<string, string>( "Юрисконсульт", "pershin" )
            };

            foreach (var (roleName, login) in userRoles)
            {
                var role = await applicationContext.Roles.FirstOrDefaultAsync(c => c.Name == roleName);

                var user = await applicationContext.Users.FirstOrDefaultAsync(c => c.Login == login);

                if (user == null || role == null)
                    continue;

                var a = await applicationContext.UserRoles.FindAsync(user.Id, role.Id);
                if (a == null)
                    await applicationContext.AddAsync(new UserRole
                    {
                        RoleId = role.Id,
                        UserId = user.Id
                    });
            }

            var departmentManagerGuids = applicationContext.Departments.Select(d => d.ManagerId);

            foreach (var guid in departmentManagerGuids)
            {
                if (guid == null)
                    continue;

                var user = applicationContext.Users.SingleOrDefault(u => u.Id == guid || u.GuidFromAD == guid);

                var role = await applicationContext.Roles.FirstOrDefaultAsync(c => c.Name == "Руководитель подразделения");

                if (user == null || role == null)
                    continue;

                var a = await applicationContext.UserRoles.FindAsync(user.Id, role.Id);
                if (a == null)
                    await applicationContext.AddAsync(new UserRole
                    {
                        RoleId = role.Id,
                        UserId = user.Id
                    });
            }

            var productManagerIds = applicationContext.Vendors.Select(v => v.ResponsibleUserId).ToHashSet();

            foreach (var guid in productManagerIds)
            {
                if (guid == null)
                    continue;

                var user = applicationContext.Users.SingleOrDefault(u => u.GuidFromAD == guid || u.Id == guid);

                var role = await applicationContext.Roles.FirstOrDefaultAsync(c => c.Name == "Менеджер по продуктам");

                if (user == null || role == null)
                    continue;

                var a = await applicationContext.UserRoles.FindAsync(user?.Id, role?.Id);
                if (a == null)
                    await applicationContext.AddAsync(new UserRole
                    {
                        RoleId = role.Id,
                        UserId = user.Id
                    });
            }

            await applicationContext.SaveChangesAsync();

            return Ok("UserRoles was added");
        }

        [HttpGet("MigrateProductRequests")]
        public async Task<IActionResult> MigrateProductRequests()
        {
            var dealsMigMan = new RequestsMigrator(applicationContext);

            var entityIdsInDb = applicationContext.OldProductRequests.Select(entity => entity.DealId);

            await foreach (var entity in dealsMigMan.GetProductRequestsAsync())
            {
                if (entityIdsInDb.Contains(entity.DealId))
                    applicationContext.OldProductRequests.Update(entity);
                else
                    applicationContext.OldProductRequests.Add(entity);
            }

            await applicationContext.SaveChangesAsync();

            logger.LogWarning("ProductRequests Migrated");

            return Ok("ProductRequests Migrated");
        }

        [HttpGet("MigrateFiles")]
        public async Task<IActionResult> MigrateFiles()
        {
            var filesMigrator = new FilesMigrator(applicationContext, hostingEnvironment);

            await filesMigrator.GetDataAsync();

            logger.LogWarning("Files Migrated");

            return Ok("Files Migrated");
        }

        [HttpGet("MigrateOldUserManagerField")]
        public async Task<IActionResult> MigrateOldUserManagerField()
        {
            await foreach (var oldUsersCrmIdAndManagerId in UsersMigrator.GetOldUsersCrmIdAndManagerIds())
            {
                var user = await applicationContext.Users.SingleOrDefaultAsync(u =>
                    u.GuidFromOldCrm == oldUsersCrmIdAndManagerId.CrmUserId);

                var manager = await applicationContext.Users.SingleOrDefaultAsync(u =>
                    u.GuidFromOldCrm == oldUsersCrmIdAndManagerId.ParentCrmUserId);

                if (user != null && manager != null)
                    user.ManagerId = manager.Id;
            }

            await applicationContext.SaveChangesAsync();

            logger.LogDebug("OldUsers Managers Migrated");

            return Ok("OldUsers Managers Migrated");
        }

        [HttpGet("MigrateServiceRequests")]
        public async Task<IActionResult> MigrateServiceRequests()
        {
            var dealsMigMan = new RequestsMigrator(applicationContext);

            var entityIdsInDb = applicationContext.OldServiceRequests.Select(entity => entity.Id);

            await foreach (var entity in dealsMigMan.GetServiceRequestsAsync())
            {
                if (entityIdsInDb.Contains(entity.Id))
                    applicationContext.OldServiceRequests.Update(entity);
                else
                    applicationContext.OldServiceRequests.Add(entity);
            }

            await applicationContext.SaveChangesAsync();

            logger.LogWarning("ProductRequests Migrated");

            return Ok("ProductRequests Migrated");
        }

        [HttpGet("AddAdditionalDepartmentsAndVendors")]
        public async Task<IActionResult> AddAdditionalDepartmentsAndVendors()
        {
            await DbInitializer.InitializeDepartmentsAsync(applicationContext, dbInitializerlogger, true);
            await DbInitializer.InitializeVendorsAsync(applicationContext, dbInitializerlogger, true);

            return Ok("Ok");
        }

        [HttpGet("InitializeFieldsForWorkWithDeals")]
        public async Task<IActionResult> InitializeFieldsForWorkWithDeals()
        {
            await DbInitializer.InitializeRealizationPlansAsync(applicationContext);
            await DbInitializer.InitializeInterestQualificationAsync(applicationContext);
            await DbInitializer.InitializeStepsAsync(applicationContext);
            await DbInitializer.InitializeGendersAsync(applicationContext);
            await DbInitializer.InitializeRelationshipsAsync(applicationContext);
            await DbInitializer.InitializeIndustriesAsync(applicationContext);
            await DbInitializer.InitializeContactRolesAsync(applicationContext);
            await DbInitializer.InitializeInterestsAsync(applicationContext);
            await DbInitializer.InitializeSelectionProceduresAsync(applicationContext);
            await DbInitializer.InitializeDealTypesAsync(applicationContext);
            await DbInitializer.InitializeProductLinesAsync(applicationContext);
            await DbInitializer.InitializePurchaseTimeIntervalsAsync(applicationContext);

            return Ok("Ok");
        }

        [HttpGet("MigrateUsers")]
        public async Task<IActionResult> MigrateUsers()
        {
            try
            {
                await userUpdateManager.CompareAndMigrateUsers();
                await userUpdateManager.SetUserManagers();
            }
            catch (Exception e)
            {
                return StatusCode(500,
                    $"Ошибка миграции: {e.Message}" +
                    $"\n\n Стек вызовов: {e.StackTrace}" +
                    $"\n\n InnerException: {e.InnerException}");
            }

            logger.LogWarning("Users Migrated");

            return Ok("Ok");
        }

        [HttpGet("MigrateContacts")]
        public async Task<IActionResult> MigrateContacts()
        {
            var contMigMan = new ContactsMigrator(applicationContext);

            var contactsFromCrmDb = await contMigMan.GetDataAsync();
            var materializedContacts = contactsFromCrmDb.ToList();

            UpdateContactsInActualDb(materializedContacts);

            await applicationContext.SaveChangesAsync();

            logger.LogWarning("Contacts Migrated");

            return Ok($"{applicationContext.Contacts.Count()}  {materializedContacts.Count}");
        }

        [HttpGet("MigrateDeals")]
        public async Task<IActionResult> MigrateDeals()
        {
            var dealsMigMan = new DealsMigrator(applicationContext);

            await UpdateDealsInActualDb(dealsMigMan.GetDataAsync());

            await applicationContext.SaveChangesAsync();

            logger.LogWarning("Deals Migrated");

            return Ok("Deals Migrated");
        }

        [HttpGet("CloseOldDealsOnLastStep")]
        public async Task<IActionResult> CloseOldDealsOnLastStep()
        {
            var deals = applicationContext.Deals
                .Include(d => d.Step)
                .Where(d => d.IsExported)
                .AsAsyncEnumerable();

            var dealWinStatus = await applicationContext.DealStatus.SingleOrDefaultAsync(d => d.Name == "Закрытая \"Выигрыш\"");

            await foreach (var deal in deals)
            {
                if (deal.Step?.OrderNumber == 7)
                {
                    deal.IsClosed = true;

                    deal.DealStatusId = dealWinStatus.Id;

                }
            }

            await applicationContext.SaveChangesAsync();

            logger.LogWarning("Deals сlosed");

            return Ok("Deals сlosed");
        }

        [HttpGet("MigrateMainContactsToOrganization")]
        public async Task<IActionResult> MigrateMainContactsToOrganization()
        {
            var orgMigMan = new OrganizationsMigrator(applicationContext);

            await foreach ((Guid orgId, Guid contactId) in orgMigMan.GetMainContactAtOrganizationAsync())
            {
                var contact = await applicationContext.Contacts.AsNoTracking()
                    .SingleOrDefaultAsync(c => c.Id == contactId);

                var organization = await applicationContext.Organizations.SingleOrDefaultAsync(o => o.Id == orgId);

                if (contact != null && organization != null)
                    organization.MainContactId = contact.Id;

            }

            await applicationContext.SaveChangesAsync();

            logger.LogWarning("Main Contacts migrated");

            return Ok("Main Contacts migrated");
        }

        [HttpGet("MigrateOrganizations")]
        public async Task<IActionResult> MigrateOrganizations()
        {

            var orgMigMan = new OrganizationsMigrator(applicationContext);
            var orgsFromCrmDb = await orgMigMan.GetDataAsync();
            logger.LogWarning("Organizations was merged from crm db");

            var fromCrmDb = orgsFromCrmDb.ToList();

            UpdateOrganizationsInActualDb(fromCrmDb);

            await applicationContext.SaveChangesAsync();

            logger.LogWarning("Organizations Migrated");

            return Ok(fromCrmDb);
        }

        [HttpGet("SetParentOrganizations")]
        public async Task<IActionResult> SetParentOrganizations()
        {
            var orgMigMan = new OrganizationsMigrator(applicationContext);
            var orgsFromCrmDb = await orgMigMan.GetParentOrganizationsAsync();

            var count = 0;
            var materializedOrganizations = orgsFromCrmDb.ToList();

            foreach (var organization in applicationContext.Organizations)
            {
                var correspondingOrganizationInSample = materializedOrganizations
                    .SingleOrDefault(e => e.OrganizationId == organization.Id);

                if (correspondingOrganizationInSample != default(ValueTuple<Guid, Guid?>))
                    organization.ParentOrganizationId = correspondingOrganizationInSample.ParentOrganizationId;

                count++;
            }

            logger.LogWarning("Parent Organizations Set");

            await applicationContext.SaveChangesAsync();
            return Ok(count);
        }

        [HttpGet("MigrateIndustries")]
        public async Task<IActionResult> MigrateIndustries()
        {
            try
            {
                var excelData = IndustriesMigrator.GetRequiredIndustriesData().ToList();

                foreach (var (id, industryName) in excelData)
                {
                    if (string.IsNullOrEmpty(industryName)) continue;
                    var orgInDb = await applicationContext.Organizations.FindAsync(id);

                    if (orgInDb == null) continue;
                    var properIndustryName = "";

                    switch (industryName.Trim())
                    {
                        case "Обрабатывающее производство":
                        case "Промышленность":
                            properIndustryName = "Промышленность";
                            break;
                        case "Добыча полезных ископаемых":
                        case "Производство и распределение электроэнергии, газа и воды":
                        case "Энергетика":
                            properIndustryName = "Энергетика";
                            break;
                        case "Здравоохранение и предоставление социальных услуг":
                            properIndustryName = "Здравоохранение";
                            break;
                        case "Банки, страховые компании и фин. институты":
                        case "Финансовая деятельность":
                            properIndustryName = "Финансовая деятельность";
                            break;
                        //                            case "Банки, страховые компании и фин. институты":
                        //                                properIndustryName = "Страхование";
                        //                                break;

                        case "Информационные технологии":
                        case "Телеком":
                            properIndustryName = "Связь";
                            break;
                        case "Нефтепром":
                            properIndustryName = "Нефтегаз";
                            break;
                        case "Транспорт":
                        case "Транспорт и связь":
                            properIndustryName = "Транспорт и логистика";
                            break;
                        case "Операции с недвижимым имуществом, аренда и предоставление услуг":
                        case "Строительство":
                            properIndustryName = "Строительство";
                            break;
                        case "Образование":
                            properIndustryName = "Образование";
                            break;
                        case "Гостиницы и рестораны":
                            properIndustryName = "Гостиницы и рестораны";
                            break;
                        case "Бюджетная сфера":
                        case "Государственное управление и обеспечение военной безопасности; обязательное социальное обеспечение":
                            properIndustryName = "Государственное управление";
                            break;
                        case "Оптовая и розничная торговля, ремонт автотранспортных средств, мотоциклов, бытовых изделий и предметов личного пользования":
                            properIndustryName = "Торговля";
                            break;
                        case "Предоставление прочих коммунальных, социальных и персональных услуг":
                        case "Рыболовство и рыбоводство":
                        case "Сельское хозяйство, охота и лесное хозяйство":
                        case "Прочие":
                            properIndustryName = "Прочие";
                            break;
                    }

                    var properIndustry =
                        await applicationContext.Industries.SingleOrDefaultAsync(e => e.Name == properIndustryName);

                    orgInDb.IndustryId = properIndustry?.Id;
                }

                var orgsWithNullIndIdBefore = await applicationContext.Organizations.Where(e => e.IndustryId == null).CountAsync();

                await applicationContext.SaveChangesAsync();

                var orgsWithNullIndIdAfter = await applicationContext.Organizations.Where(e => e.IndustryId == null).CountAsync();

                logger.LogWarning("Industries Migrated");

                return Json(new { excelData.Count, orgsWithNullIndIdBefore, orgsWithNullIndIdAfter });
            }
            catch (Exception e)
            {
                return Json(new { e.Message, e.InnerException, e.StackTrace });
            }
        }

        [HttpGet("MigrateRelationships")]
        public async Task<IActionResult> MigrateRelationships()
        {
            try
            {
                var excelData = RelationshipsMigrator.GetRequiredRelationshipsData().ToList();

                foreach (var (id, relationshipName) in excelData)
                {
                    if (string.IsNullOrEmpty(relationshipName)) continue;

                    var orgInDb = await applicationContext.Organizations.FindAsync(id);

                    if (orgInDb == null) continue;

                    var relationship =
                        await applicationContext.Relationships.SingleOrDefaultAsync(e => e.Name == relationshipName);

                    orgInDb.RelationshipId = relationship?.Id;
                }

                var orgsWithNullReldIdBefore = await applicationContext.Organizations.Where(e => e.RelationshipId == null).CountAsync();

                await applicationContext.SaveChangesAsync();

                var orgsWithNullRelIdAfter = await applicationContext.Organizations.Where(e => e.RelationshipId == null).CountAsync();

                logger.LogWarning("Relationships Migrated");

                return Json(new { excelData.Count, orgsWithNullIndIdBefore = orgsWithNullReldIdBefore, orgsWithNullRelIdAfter });
            }
            catch (Exception e)
            {
                return Json(new { e.Message, e.InnerException, e.StackTrace });
            }
        }

        private void UpdateOrganizationsInActualDb(List<Organization> entities)
        {
            var entityIdsInDb = applicationContext.Organizations.Select(entity => entity.Id);
            foreach (var entity in entities)
            {
                if (entityIdsInDb.Contains(entity.Id))
                    applicationContext.Organizations.Update(entity);
                else
                    applicationContext.Organizations.Add(entity);
            }

            logger.LogWarning("Organizations Updated In Actual DB");
        }

        private async Task UpdateDealsInActualDb(IAsyncEnumerable<Deal> entities)
        {
            await foreach (var entity in entities)
            {
                var deal = await applicationContext.Deals.FindAsync(entity.Id);

                if (deal != null)
                {
                    deal.DealStatusId = entity.DealStatusId;
                    deal.IsClosed = entity.IsClosed;
                }
            }

            logger.LogWarning("Deals Updated In Actual DB");
        }

        private void UpdateContactsInActualDb(List<Contact> entities)
        {
            var entityIdsInDb = applicationContext.Contacts.Select(entity => entity.Id);
            foreach (var entity in entities)
            {
                if (entityIdsInDb.Contains(entity.Id))
                    applicationContext.Contacts.Update(entity);
                else
                    applicationContext.Contacts.Add(entity);
            }

            logger.LogWarning("Contacts Updated In Actual DB");
        }
    }
}
