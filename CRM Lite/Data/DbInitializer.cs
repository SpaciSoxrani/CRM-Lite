using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using CRM.Data;
using CRM.Data.Models;
using CRM.Data.Models.Lookup;
using CRM.Data.Models.Marketing.MarketingList;
using CRM.Data.Models.PreSale;
using CRM.Data.Models.Lead;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM.API.Data
{
    public class DbInitializer
    {
        public static async Task InitializeAsync(ApplicationContext context, ILogger<DbInitializer> logger, bool isSecondInit = false)
        {
            await context.Database.EnsureCreatedAsync();

            await InitializeIndustriesAsync(context);
            // Попробую заполнять из юзеров
            await InitializeDepartmentsAsync(context, logger, isSecondInit);
            await InitializeRelationshipsAsync(context);
            await InitializeGendersAsync(context);
            await InitializePresentsAsync(context);

            await InitializeStepsAsync(context);

            await InitializeContactRolesAsync(context);

            await InitializeDealStatusesAsync(context);

            await InitializeInterestQualificationAsync(context);

            await InitializeInterestsAsync(context);

            await InitializeRealizationPlansAsync(context);

            await InitializeSelectionProceduresAsync(context);

            await InitializeDealTypesAsync(context);

            await InitializePurchaseTimeIntervalsAsync(context);

            await InitializeRolesAsync(context);

            await InitializeProductLinesAsync(context);

            await InitializeVendorsAsync(context, logger, isSecondInit);

            //await InitializeUserRolesAsync(context);

            await InitializePreSaleGroupStatusesAsync(context);

            await InitializePreSaleStatusesAsync(context);

            await InitializePreSaleRegionsAsync(context);

            await InitializePreSaleResultsAsync(context);

            await InitializeLeadTargetsAsync(context);

            await InitializeLeadStatusesAsync(context);

            await InitializeLeadProjectsAsync(context);
        }

        private static async Task InitializePresentsAsync(ApplicationContext context)
        {
            var roles = new List<MarketingListPresent>
            {
                new MarketingListPresent { Name = "VIP" },
                new MarketingListPresent { Name = "Средний" },
                new MarketingListPresent { Name = "Эконом" },
                new MarketingListPresent { Name = "Открытка" }

            };

            foreach (var present in roles)
            {
                if (await context.MarketingListPresents
                        .SingleOrDefaultAsync(entity => entity.Name == present.Name) == null)
                {
                    await context.AddAsync(present);
                }
            }

            await context.SaveChangesAsync();
        }

        private static async Task InitializeUserRolesAsync(ApplicationContext context)
        {
            var userRoles = new List<Tuple<string, string>>
            {
                new Tuple<string, string>( "Администратор", "gorbunov" ),
                new Tuple<string, string>( "Администратор", "muravlev" ),
                new Tuple<string, string>( "TOP-менеджер", "krachkovskaya" ),
                new Tuple<string, string>( "TOP-менеджер", "prozorov" ),
                new Tuple<string, string>( "Менеджер по СМК", "volkova" )
            };

            foreach ( var (roleName, login) in userRoles)
            {
                var role = await context.Roles.FirstOrDefaultAsync(c => c.Name == roleName);

                var user = await context.Users.FirstOrDefaultAsync(c => c.Login == login);

                var a = await context.UserRoles.FindAsync(user?.Id, role?.Id);
                if (a == null)
                    await context.AddAsync(new UserRole
                    {
                        RoleId = role.Id,
                        UserId = user.Id
                    });
            }

            var departmentManagerGuids = context.Departments.Select(d => d.ManagerFromAD);

            foreach(var guid in departmentManagerGuids)
            {
                if (guid == null)
                    continue;

                var user = context.Users.SingleOrDefault(u => u.GuidFromAD == guid || u.Id == guid);

                var role = await context.Roles.FirstOrDefaultAsync(c => c.Name == "Руководитель подразделения");

                var a = await context.UserRoles.FindAsync(user?.Id, role?.Id);
                if (a == null)
                    await context.AddAsync(new UserRole
                    {
                        RoleId = role.Id,
                        UserId = user.Id
                    });
            }

            var productManagerIds = context.Vendors.Select(v => v.ResponsibleUserId).ToHashSet();

            foreach (var guid in productManagerIds)
            {
                if (guid == null)
                    continue;

                var user = context.Users.SingleOrDefault(u => u.GuidFromAD == guid || u.Id == guid);

                var role = await context.Roles.FirstOrDefaultAsync(c => c.Name == "Менеджер по продуктам");

                var a = await context.UserRoles.FindAsync(user?.Id, role?.Id);
                if (a == null)
                    await context.AddAsync(new UserRole
                    {
                        RoleId = role.Id,
                        UserId = user.Id
                    });
            }

            await context.SaveChangesAsync();
        }

        private static async Task InitializeRolesAsync(ApplicationContext context)
        {
            var roles = new List<Role>
            {
                new Role { Name = "TOP-менеджер" },
                new Role { Name = "Менеджер по СМК" },
                new Role { Name = "Юрисконсульт" },
                new Role { Name = "Главный бухгалтер" },
                new Role { Name = "Инженер-сметчик" },
                new Role { Name = "Администратор СЦ" },
                new Role { Name = "Администратор" },
                new Role { Name = "Руководитель подразделения" },
                new Role { Name = "Руководитель офиса продаж" },
                new Role { Name = "Менеджер по продажам" },
                new Role { Name = "Тестовая роль" },
                new Role { Name = "Менеджер по продуктам" },
                new Role { Name = "Ассистент менеджера по работе с клиентами" },
                new Role { Name = "Менеджер по маркетингу и PR" }
            };

            foreach (var role in roles)
            {
                if (await context.Roles
                        .SingleOrDefaultAsync(entity => entity.Name == role.Name) == null)
                {
                    await context.AddAsync(role);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializeRealizationPlansAsync(ApplicationContext context)
        {
            var realizationPlans = new List<RealisationPlan>
            {
                new RealisationPlan { Name = "1 месяц" },
                new RealisationPlan { Name = "3 месяца" },
                new RealisationPlan { Name = "6 месяцев" },
                new RealisationPlan { Name = "1 год" },
                new RealisationPlan { Name = "Неопределённые" }
            };

            foreach (var realizationPlan in realizationPlans)
            {
                if (await context.RealisationPlan
                        .SingleOrDefaultAsync(entity => entity.Name == realizationPlan.Name) == null)
                {
                    await context.AddAsync(realizationPlan);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializeInterestQualificationAsync(ApplicationContext context)
        {
            var interestQualifications = new List<InterestQualification>
            {
                new InterestQualification { Name = "Нецелевой" },
                new InterestQualification { Name = "Холодный" },
                new InterestQualification { Name = "Тёплый" }
            };

            foreach (var interestQualification in interestQualifications)
            {
                if (await context.InterestQualification
                        .SingleOrDefaultAsync(entity => entity.Name == interestQualification.Name) == null)
                {
                    await context.AddAsync(interestQualification);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializeDealStatusesAsync(ApplicationContext context)
        {
            var dealStatuses = new List<DealStatus>
            {
                new DealStatus { Name = "Активная" },
                new DealStatus { Name = "Отложенная" },
                new DealStatus { Name = "Закрытая \"Потеря\"" },
                new DealStatus { Name = "Закрытая \"Выигрыш\"" }
            };

            foreach (var dealStatus in dealStatuses)
            {
                if (await context.DealStatus
                        .SingleOrDefaultAsync(entity => entity.Name == dealStatus.Name) == null)
                {
                    await context.AddAsync(dealStatus);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializeStepsAsync(ApplicationContext context)
        {
            var mandatorySteps = new List<Step>
            {
                new Step { Name = "Верификация потребности", OrderNumber = 1},
                new Step { Name = "Разработка проекта технического решения", OrderNumber = 2},
                new Step { Name = "Согласование решения", OrderNumber = 3},
                new Step { Name = "Конкурсная процедура", OrderNumber = 4},
                new Step { Name = "Подписание контракта", OrderNumber = 5},
                new Step { Name = "Работа по контракту", OrderNumber = 6},
                new Step { Name = "Контракт закрыт", OrderNumber = 7}
            };

            foreach (var mandatoryStep in mandatorySteps)
            {
                if (await context.Steps
                        .SingleOrDefaultAsync(entity => entity.Name == mandatoryStep.Name) == null)
                {
                    await context.AddAsync(mandatoryStep);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializeGendersAsync(ApplicationContext context)
        {
            var mandatorySexes = new List<Gender>
            {
                new Gender { Name = "Мужской"},
                new Gender { Name = "Женский"}
            };

            foreach (var mandatorySex in mandatorySexes)
            {
                if (await context.Genders
                        .SingleOrDefaultAsync(entity => entity.Name == mandatorySex.Name) == null)
                {
                    await context.AddAsync(mandatorySex);
                }
            }

            await context.SaveChangesAsync();
        }
        public static async Task InitializeRelationshipsAsync(ApplicationContext context)
        {
            var mandatoryRelationships = new List<Relationship>
            {
                new Relationship { Name = "Конкурент"},
                new Relationship { Name = "Консультант"},
                new Relationship { Name = "Клиент"},
                new Relationship { Name = "Партнер"},
                new Relationship { Name = "Пресса"},
                new Relationship { Name = "Вендор"},
                new Relationship { Name = "Дистрибутор"},
                new Relationship { Name = "Другое"},
            };

            foreach (var mandatoryRelationship in mandatoryRelationships)
            {
                if (await context.Relationships
                        .SingleOrDefaultAsync(entity => entity.Name == mandatoryRelationship.Name) == null)
                {
                    await context.AddAsync(mandatoryRelationship);
                }
            }

            await context.SaveChangesAsync();

        }

        public static async Task InitializeDepartmentsAsync(ApplicationContext context, ILogger<DbInitializer> logger, bool needToUpdate = false)
        {
            var mandatoryDepartments = new List<Department>
            {
                new Department { Name = "ДВС",  CanSell = false, CanProduct = true,
                    CanExecute = true, IsActive = true, ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "kotohin")?.GuidFromAD,
                    ManagerId = context.Users.SingleOrDefault(u => u.Login == "kotohin")?.Id,
                    ChildDepartments = new List<Department>{
						new Department { Name = "Группа продаж ДВС",
							CanSell = true, CanProduct = false, CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "Rogachev")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "Rogachev")?.Id},
						new Department { Name = "ОИР",
							CanSell = false, CanProduct = true, CanExecute = true, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "koltasheva")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "koltasheva")?.Id},
						new Department { Name = "ОПР",
							CanSell = false, CanProduct = true, CanExecute = true, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "koltasheva")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "koltasheva")?.Id},
						new Department { Name = "ОВиС",
							CanSell = false, CanProduct = true, CanExecute = true, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "fyodorov")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "fyodorov")?.Id},
						new Department { Name = "ГС",
							CanSell = false, CanProduct = false, CanExecute = true, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "dokalova")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "dokalova")?.Id},
						new Department { Name = "ГА",
							CanSell = false, CanProduct = false, CanExecute = true, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "koltasheva")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "koltasheva")?.Id},
                        new Department { Name = "Проектный отдел",  CanSell = false,
                            CanProduct = false, CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "artyukhina")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "artyukhina")?.Id}
                    } },

                new Department { Name = "ДИС",  CanSell = true,
                    CanProduct = true, CanExecute = true, IsActive = true,
                    ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.GuidFromAD,
                    ManagerId = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.Id,
                    ChildDepartments = new List<Department>{
                        new Department { Name = "Офис продаж ЕКБ",  CanSell = true,
                            CanProduct = false, CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "kochev")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "kochev")?.Id},
                        new Department { Name = "Офис продаж ПРМ",  CanSell = true,
                            CanProduct = false, CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "nelavitskaya")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "nelavitskaya")?.Id},
                        new Department { Name = "Офис продаж СПБ",  CanSell = true,
                            CanProduct = false, CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "simakov")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "simakov")?.Id},
                        new Department { Name = "Офис продаж ТЮМ",  CanSell = true,
                            CanProduct = false, CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "azarenko")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "azarenko")?.Id},
						new Department { Name = "ОИР",  CanSell = false,
							CanProduct = true, CanExecute = true, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.Id},
						new Department { Name = "ОПиР",  CanSell = false,
							CanProduct = true, CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "yantsen")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "yantsen")?.Id},
						new Department { Name = "ОСиК",  CanSell = false,
							CanProduct = true, CanExecute = true, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.Id},
						new Department { Name = "ОЛ",  CanSell = false,
							CanProduct = false, CanExecute = true, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.Id},
                        new Department { Name = "ОРРП",  CanSell = false,
                            CanProduct = true, CanExecute = true, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.Id},
                        new Department { Name = "Проектный отдел",  CanSell = false,
                            CanProduct = false, CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "Yakimova")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "Yakimova")?.Id}
                    }},

                new Department { Name = "ДПС",  CanSell = false,
                    CanProduct = true, IsActive = true, CanExecute = true,
                    ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "zavada")?.GuidFromAD,
                    ManagerId = context.Users.SingleOrDefault(u => u.Login == "zavada")?.Id,
                    ChildDepartments = new List<Department>{
                        new Department { Name = "Офис продаж ДПС",  CanSell = true,
                            CanProduct = false, CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "krivoshein")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "krivoshein")?.Id},
                        new Department { Name = "ОРПО",  CanSell = false,
                            CanProduct = true, CanExecute = true,  IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "zavada")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "zavada")?.Id},
                    } },
                new Department { Name = "Управляющая компания",  CanSell = false, CanProduct = false,
                    CanExecute = false, IsActive = true,
                    ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "suslov")?.GuidFromAD,
                    ManagerId = context.Users.SingleOrDefault(u => u.Login == "suslov")?.Id,
                    ChildDepartments = new List<Department>{
                        new Department { Name = "Бухгалтерия",  CanSell = false, CanProduct = false,
                            CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "vorontsova")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "vorontsova")?.Id},
                        new Department { Name = "Административный отдел",  CanSell = false,
                            CanProduct = false, CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "krachkovskaya")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "krachkovskaya")?.Id},
                        new Department { Name = "Отдел маркетинга и рекламы",  CanSell = false,
                            CanProduct = false, CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "prosvetova")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "prosvetova")?.Id},
                        new Department { Name = "Финансово-экономический отдел",  CanSell = false,
                            CanProduct = false, CanExecute = false, IsActive = true},
                        new Department { Name = "ТОП-менеджмент",  CanSell = false, CanProduct = false,
                            CanExecute = false, IsActive = true,
                            ManagerFromAD = context.Users.SingleOrDefault(u => u.Login == "suslov")?.GuidFromAD,
                            ManagerId = context.Users.SingleOrDefault(u => u.Login == "suslov")?.Id},
                    }},
            };

            logger.LogInformation("Start add and update departments");

            foreach (var mandatoryDepartment in mandatoryDepartments)
            {
                var depFromContext = await context.Departments
                        .SingleOrDefaultAsync(entity => entity.Name == mandatoryDepartment.Name);
                if (depFromContext == null)
                {
                    await context.AddAsync(mandatoryDepartment);
                }

                if (needToUpdate)
                {
                    depFromContext.ManagerId = mandatoryDepartment.ManagerId;
                    depFromContext.ManagerFromAD = mandatoryDepartment.ManagerFromAD;
                    context.Update(depFromContext);

                    await context.SaveChangesAsync();

                    foreach (var childDepartment in mandatoryDepartment.ChildDepartments)
                    {
                        var childDepFromContext = await context.Departments
                            .SingleOrDefaultAsync(entity => entity.Name == childDepartment.Name 
                                && entity.CanSell == childDepartment.CanSell && entity.CanProduct == childDepartment.CanProduct &&
                                entity.CanExecute == childDepartment.CanExecute && entity.ParentDepartmentId == depFromContext.Id);

                        if (childDepFromContext == null)
                            await context.AddAsync(childDepartment);
                        else
                        {
                            childDepFromContext.ManagerId = childDepartment.ManagerId;
                            childDepFromContext.ManagerFromAD = childDepartment.ManagerFromAD;
                            context.Update(childDepFromContext);
                        }

                        await context.SaveChangesAsync();

                    }
                }
            }
            logger.LogInformation("End add and update departments");
            await context.SaveChangesAsync();

        }

        public static async Task InitializeIndustriesAsync(ApplicationContext context)
        {
            var mandatoryIndustries = new List<Industry>
            {
                new Industry { Name = "Промышленность"},
                new Industry { Name = "Энергетика"},
                new Industry { Name = "Здравоохранение"},
                new Industry { Name = "Финансовая деятельность"},
                new Industry { Name = "Страхование"},
                new Industry { Name = "Связь"},
                new Industry { Name = "Нефтегаз"},
                new Industry { Name = "Транспорт и логистика"},
                new Industry { Name = "Строительство"},
                new Industry { Name = "Образование"},
                new Industry { Name = "Гостиницы и рестораны"},
                new Industry { Name = "Государственное управление"},
                new Industry { Name = "Торговля"},
                new Industry { Name = "СМИ"},
                new Industry { Name = "Прочие"},
            };

            foreach (var mandatoryIndustry in mandatoryIndustries)
            {
                if (await context.Industries
                        .SingleOrDefaultAsync(entity => entity.Name == mandatoryIndustry.Name) == null)
                {
                    await context.AddAsync(mandatoryIndustry);
                }
            }

            await context.SaveChangesAsync();

        }

        public static async Task InitializeContactRolesAsync(ApplicationContext context)
        {
            var mandatoryContactRoles = new List<ContactRole>
            {
                new ContactRole { Name = "ЛПР"},
                new ContactRole { Name = "АВ"},
                new ContactRole { Name = "CEO"},
                new ContactRole { Name = "CFO"},
                new ContactRole { Name = "CIO"},
                new ContactRole { Name = "CISO"},
                new ContactRole { Name = "CTO"},
                new ContactRole { Name = "Engineer"},
                new ContactRole { Name = "Specialist"},
                new ContactRole { Name = "ЛВР"},
                new ContactRole { Name = "ЛФР"},

            };

            foreach (var mandatoryContactRole in mandatoryContactRoles)
            {
                if (await context.ContactRoles
                        .SingleOrDefaultAsync(entity => entity.Name == mandatoryContactRole.Name) == null)
                {
                    await context.AddAsync(mandatoryContactRole);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializeInterestsAsync(ApplicationContext context)
        {
            var mandatoryInterests = new List<Interest>
            {
                new Interest { Name = "Менеджер по работе с клиентами"},
                new Interest { Name = "Входящий звонок"},
                new Interest { Name = "Интернет-маркетинг"},
                new Interest { Name = "Мероприятие"},
                new Interest { Name = "Рекомендация партнера/клиента"},
                new Interest { Name = "PR"},
            };

            foreach (var mandatoryInterest in mandatoryInterests)
            {
                if (await context.Interests
                        .SingleOrDefaultAsync(entity => entity.Name == mandatoryInterest.Name) == null)
                {
                    await context.AddAsync(mandatoryInterest);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializeSelectionProceduresAsync(ApplicationContext context)
        {
            var mandatoryEntities = new List<SelectionProcedure>
            {
                new SelectionProcedure { Name = "Неформализованная процедура" },
                new SelectionProcedure { Name = "Собственное положение о закупках" },
                new SelectionProcedure { Name = "Собственное положение о закупках на площадке" },
                new SelectionProcedure { Name = "ФЗ № 44" },
                new SelectionProcedure { Name = "ФЗ № 223" },
            };

            foreach (var mandatoryEntity in mandatoryEntities)
            {
                if (await context.SelectionProcedures
                        .SingleOrDefaultAsync(entity => entity.Name == mandatoryEntity.Name) == null)
                {
                    await context.AddAsync(mandatoryEntity);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializeDealTypesAsync(ApplicationContext context)
        {
            var disDepartment = await context.Departments
                .SingleOrDefaultAsync(e => e.Name == "ДИС");

            var dvsDepartment = await context.Departments
                .SingleOrDefaultAsync(e => e.Name == "ДВС");

            var dpsDepartment = await context.Departments
                .SingleOrDefaultAsync(e => e.Name == "ДПС");

            if (disDepartment == null || dvsDepartment == null || dpsDepartment == null)
                return;

            var mandatoryEntities = new List<DealType>
            {
                new DealType { Name = "Новая потребность", DepartmentId = disDepartment.Id },
                new DealType { Name = "Модернизация", DepartmentId = disDepartment.Id },
                new DealType { Name = "Продление ТП", DepartmentId = disDepartment.Id },
                new DealType { Name = "Услуги", DepartmentId = disDepartment.Id },
                new DealType { Name = "Ген.подряд", DepartmentId = dvsDepartment.Id },
                new DealType { Name = "Поставка/внедрение", DepartmentId = dvsDepartment.Id },
                new DealType { Name = "Разработка", DepartmentId = dvsDepartment.Id },
                new DealType { Name = "Новая потребность", DepartmentId = dpsDepartment.Id },
                new DealType { Name = "Модернизация", DepartmentId = dpsDepartment.Id },
                new DealType { Name = "Сопровождение", DepartmentId = dvsDepartment.Id },
                new DealType { Name = "Модернизация/развитие", DepartmentId = dvsDepartment.Id }
            };

            foreach (var mandatoryEntity in mandatoryEntities)
            {
                if (await context.DealTypes
                        .SingleOrDefaultAsync(entity => entity.Name == mandatoryEntity.Name
                        && entity.DepartmentId == mandatoryEntity.DepartmentId) == null)
                {
                    await context.AddAsync(mandatoryEntity);
                }
            }

            await context.SaveChangesAsync();
        }

        /* 14 - dis
         * 98 - dps
         * ca - dvs */

        public static async Task InitializeProductLinesAsync(ApplicationContext context)
        {
            var disDepartment = await context.Departments
                .SingleOrDefaultAsync(e => e.Name == "ДИС");

            var dvsDepartment = await context.Departments
                .SingleOrDefaultAsync(e => e.Name == "ДВС");

            var dpsDepartment = await context.Departments
                .SingleOrDefaultAsync(e => e.Name == "ДПС");

            if (disDepartment == null || dvsDepartment == null || dpsDepartment == null)
                return;

            var mandatoryEntities = new List<ProductLines>
            {
                new ProductLines { Name = "Информационная безопасность", DepartmentId = disDepartment.Id },
                new ProductLines { Name = "Интеграционная шина здравоохранения", DepartmentId = dvsDepartment.Id },
                new ProductLines { Name = "ПУОМП", DepartmentId = dvsDepartment.Id },
                new ProductLines { Name = "Мониторинг", DepartmentId = dvsDepartment.Id },
                new ProductLines { Name = "Портал пациента", DepartmentId = dvsDepartment.Id },
                new ProductLines { Name = "Инженерная инфраструктура", DepartmentId = disDepartment.Id },
                new ProductLines { Name = "Телемедицина", DepartmentId = dpsDepartment.Id },
                new ProductLines { Name = "Сетевые решения", DepartmentId = disDepartment.Id },
                new ProductLines { Name = "Медицинская статистика", DepartmentId = dvsDepartment.Id },
                new ProductLines { Name = "Вычислительная инфраструктура", DepartmentId = disDepartment.Id },
                new ProductLines { Name = "Прикладные решения РМС", DepartmentId = dvsDepartment.Id },
                new ProductLines { Name = "Коммуникации и командный мессенджер", DepartmentId = dpsDepartment.Id },
                new ProductLines { Name = "Прикладные решения ИПРА", DepartmentId = dvsDepartment.Id },
                new ProductLines { Name = "Консалтинг", DepartmentId = disDepartment.Id },
                new ProductLines { Name = "Медицинская информационная система", DepartmentId = dvsDepartment.Id },
                new ProductLines { Name = "Прикладные решения ВМП", DepartmentId = dvsDepartment.Id },
                new ProductLines { Name = "Другое", DepartmentId = null },
                new ProductLines { Name = "HR", DepartmentId = null },
                new ProductLines { Name = "Имидж", DepartmentId = null }
            };

            foreach (var mandatoryEntity in mandatoryEntities)
            {
                if (await context.ProductLines
                        .FirstOrDefaultAsync(entity => entity.Name == mandatoryEntity.Name
                        && entity.DepartmentId == mandatoryEntity.DepartmentId) == null)
                {
                    await context.AddAsync(mandatoryEntity);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializeVendorsAsync(ApplicationContext context, ILogger<DbInitializer> logger, bool needToUpdate = false)
        {
            var compInfrastructure = await context.ProductLines.Include(pl => pl.Department).AsNoTracking()
                .FirstOrDefaultAsync(e => e.Name == "Вычислительная инфраструктура"
                && e.Department != null && e.Department.Name == "ДИС");

            var netSolution = await context.ProductLines.Include(pl => pl.Department).AsNoTracking()
                .FirstOrDefaultAsync(e => e.Name == "Сетевые решения"
                && e.Department != null && e.Department.Name == "ДИС");

            var engineerInfrastructure = await context.ProductLines.Include(pl => pl.Department).AsNoTracking()
                .FirstOrDefaultAsync(e => e.Name == "Инженерная инфраструктура"
                && e.Department != null && e.Department.Name == "ДИС");

            var infoSecurity = await context.ProductLines.Include(pl => pl.Department).AsNoTracking()
                .FirstOrDefaultAsync(e => e.Name == "Информационная безопасность"
                && e.Department != null && e.Department.Name == "ДИС");

            var consulting = await context.ProductLines.Include(pl => pl.Department).AsNoTracking()
                .FirstOrDefaultAsync(e => e.Name == "Консалтинг"
                && e.Department != null && e.Department.Name == "ДИС");

            var productManagersIds = new HashSet<Guid>();

            var prozorov = await context.Users.SingleOrDefaultAsync(u => u.Login == "prozorov");
            var denisov = await context.Users.SingleOrDefaultAsync(u => u.Login == "denisov");
            var kruchinin = await context.Users.SingleOrDefaultAsync(u => u.Login == "Kruchinin");
            var svyatkin = await context.Users.SingleOrDefaultAsync(u => u.Login == "svyatkin");
            var shvetsov = await context.Users.SingleOrDefaultAsync(u => u.Login == "shvetsov");
            var shidlovskiy = await context.Users.SingleOrDefaultAsync(u => u.Login == "shidlovskiy");
            var shchelkanova = await context.Users.SingleOrDefaultAsync(u => u.Login == "shchelkanova");
            var borisov = await context.Users.SingleOrDefaultAsync(u => u.Login == "borisov");
            var klimov = await context.Users.SingleOrDefaultAsync(u => u.Login == "klimov");

            if (compInfrastructure == null ||
                netSolution == null ||
                engineerInfrastructure == null ||
                infoSecurity == null ||
                consulting == null)
                return;

            var mandatoryEntities = new List<Vendor>
            {
                new Vendor { Name = "NetApp", ProductLineId = compInfrastructure.Id, ResponsibleUserId = svyatkin?.GuidFromAD },
                new Vendor { Name = "DellEMC", ProductLineId = compInfrastructure.Id, ResponsibleUserId = svyatkin?.GuidFromAD },
                new Vendor { Name = "IBM", ProductLineId = compInfrastructure.Id, ResponsibleUserId = kruchinin?.GuidFromAD },
                new Vendor { Name = "RedHat", ProductLineId = compInfrastructure.Id, ResponsibleUserId = shchelkanova?.GuidFromAD },
                new Vendor { Name = "Veritas", ProductLineId = compInfrastructure.Id, ResponsibleUserId = kruchinin?.GuidFromAD },
                new Vendor { Name = "Stratus", ProductLineId = compInfrastructure.Id, ResponsibleUserId = shidlovskiy?.GuidFromAD },
                new Vendor { Name = "Veeam", ProductLineId = compInfrastructure.Id, ResponsibleUserId = shchelkanova?.GuidFromAD },
                new Vendor { Name = "Oracle", ProductLineId = compInfrastructure.Id, ResponsibleUserId = shchelkanova?.GuidFromAD },
                new Vendor { Name = "Huawei", ProductLineId = compInfrastructure.Id, ResponsibleUserId = kruchinin?.GuidFromAD },
                new Vendor { Name = "CISCO", ProductLineId = compInfrastructure.Id, ResponsibleUserId = svyatkin?.GuidFromAD },
                new Vendor { Name = "Citrix", ProductLineId = compInfrastructure.Id, ResponsibleUserId = shchelkanova?.GuidFromAD },
                new Vendor { Name = "Microsoft", ProductLineId = compInfrastructure.Id, ResponsibleUserId = shchelkanova?.GuidFromAD },
                new Vendor { Name = "Lenovo", ProductLineId = compInfrastructure.Id, ResponsibleUserId = kruchinin?.GuidFromAD },
                new Vendor { Name = "VMware", ProductLineId = compInfrastructure.Id, ResponsibleUserId = shchelkanova?.GuidFromAD },
                new Vendor { Name = "HOSTVM", ProductLineId = compInfrastructure.Id, ResponsibleUserId = klimov?.GuidFromAD },
                new Vendor { Name = "CISCO", ProductLineId = netSolution.Id, ResponsibleUserId = svyatkin?.GuidFromAD },
                new Vendor { Name = "HPE", ProductLineId = compInfrastructure.Id, ResponsibleUserId = shidlovskiy?.GuidFromAD },
                new Vendor { Name = "Huawei", ProductLineId = engineerInfrastructure.Id, ResponsibleUserId = shvetsov?.GuidFromAD },
                new Vendor { Name = "Eurolan", ProductLineId = engineerInfrastructure.Id, ResponsibleUserId = shvetsov?.GuidFromAD },
                new Vendor { Name = "Panduit", ProductLineId = engineerInfrastructure.Id, ResponsibleUserId = shvetsov?.GuidFromAD },
                new Vendor { Name = "Conteg", ProductLineId = engineerInfrastructure.Id, ResponsibleUserId = shvetsov?.GuidFromAD },
                new Vendor { Name = "Comfloor", ProductLineId = engineerInfrastructure.Id, ResponsibleUserId = shvetsov?.GuidFromAD },
                new Vendor { Name = "Jansen", ProductLineId = engineerInfrastructure.Id, ResponsibleUserId = shvetsov?.GuidFromAD },
                new Vendor { Name = "Rittal", ProductLineId = engineerInfrastructure.Id, ResponsibleUserId = shvetsov?.GuidFromAD },
                new Vendor { Name = "Stulz", ProductLineId = engineerInfrastructure.Id, ResponsibleUserId = shvetsov?.GuidFromAD },
                new Vendor { Name = "Master Scada", ProductLineId = engineerInfrastructure.Id, ResponsibleUserId = shvetsov?.GuidFromAD },
                new Vendor { Name = "Delta Electronics", ProductLineId = engineerInfrastructure.Id, ResponsibleUserId = shvetsov?.GuidFromAD },
                new Vendor { Name = "ХОСТ", ProductLineId = infoSecurity.Id, ResponsibleUserId = prozorov?.GuidFromAD },
                new Vendor { Name = "Код безопасности", ProductLineId = infoSecurity.Id, ResponsibleUserId = borisov?.GuidFromAD },
                new Vendor { Name = "Check Point", ProductLineId = infoSecurity.Id, ResponsibleUserId = borisov?.GuidFromAD },
                new Vendor { Name = "Positive Technologies", ProductLineId = infoSecurity.Id, ResponsibleUserId = denisov?.GuidFromAD },
                new Vendor { Name = "Fortinet", ProductLineId = infoSecurity.Id, ResponsibleUserId = borisov?.GuidFromAD },
                new Vendor { Name = "Falcongaze", ProductLineId = infoSecurity.Id, ResponsibleUserId = denisov?.GuidFromAD },
                new Vendor { Name = "ХОСТ", ProductLineId = consulting.Id, ResponsibleUserId = prozorov?.GuidFromAD  }
            };

            logger.LogInformation("Start add and update Vendors");

            foreach (var mandatoryEntity in mandatoryEntities)
            {
                var vendor = await context.Vendors
                        .SingleOrDefaultAsync(entity => entity.Name == mandatoryEntity.Name
                        && entity.ProductLineId == mandatoryEntity.ProductLineId);

                if (vendor == null)
                {
                    await context.AddAsync(mandatoryEntity);
                }

                if (needToUpdate)
                {
                    vendor.ResponsibleUserId = mandatoryEntity.ResponsibleUserId;
                    if(mandatoryEntity.ResponsibleUserId != null)
                        productManagersIds.Add((Guid)mandatoryEntity.ResponsibleUserId);
                    context.Update(vendor);
                    await context.SaveChangesAsync();
                }
            }


            logger.LogInformation("End add and update Vendors");
            await context.SaveChangesAsync();
        }

        public static async Task InitializePurchaseTimeIntervalsAsync(ApplicationContext context)
        {
            var mandatoryEntities = new List<PurchaseTimeInterval>
            {
                new PurchaseTimeInterval { Name = "Текущий квартал" },
                new PurchaseTimeInterval { Name = "Квартал" },
                new PurchaseTimeInterval { Name = "Полгода" },
                new PurchaseTimeInterval { Name = "Текущий год" },
                new PurchaseTimeInterval { Name = "Бюджетирование на будущие годы" },
            };

            foreach (var mandatoryEntity in mandatoryEntities)
            {
                if (await context.PurchaseTimeIntervals
                        .SingleOrDefaultAsync(entity => entity.Name == mandatoryEntity.Name) == null)
                {
                    await context.AddAsync(mandatoryEntity);
                }
            }

            await context.SaveChangesAsync();
        }

        #region Pre-sale
        public static async Task InitializePreSaleGroupStatusesAsync(ApplicationContext context)
        {
            var preSaleGroupStatuses = new List<PreSaleGroupStatus>
            {
                new PreSaleGroupStatus { Name = "В работе"},
                new PreSaleGroupStatus { Name = "Закрыта"}
            };

            foreach (var preSaleGroupStatus in preSaleGroupStatuses)
            {
                if (await context.PreSaleGroupStatuses
                        .SingleOrDefaultAsync(entity => entity.Name == preSaleGroupStatus.Name) == null)
                {
                    await context.AddAsync(preSaleGroupStatus);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializePreSaleStatusesAsync(ApplicationContext context)
        {
            var preSaleStatuses = new List<PreSaleStatus>
            {
                new PreSaleStatus { Name = "В работе"},
                new PreSaleStatus { Name = "Позвонить"},
                new PreSaleStatus { Name = "Передано сейлу"},
                new PreSaleStatus { Name = "Не интересно"},
            };

            foreach (var preSaleStatus in preSaleStatuses)
            {
                if (await context.PreSaleStatuses
                        .SingleOrDefaultAsync(entity => entity.Name == preSaleStatus.Name) == null)
                {
                    await context.AddAsync(preSaleStatus);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializePreSaleRegionsAsync(ApplicationContext context)
        {
            var preSaleRegions = new List<PreSaleRegion>
            {
                new PreSaleRegion { Name = "Республика Адыгея", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Республика Алтай", Timezone = "(EKB+2)"},
                new PreSaleRegion { Name = "Республика Башкортостан", Timezone = "(EKB+0)"},
                new PreSaleRegion { Name = "Республика Бурятия", Timezone = "(EKB+3)"},
                new PreSaleRegion { Name = "Республика Дагестан", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Республика Ингушетия", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Кабардино-Балкарская Республика", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Республика Калмыкия", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Карачаево-Черкесская Республика", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Республика Карелия", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Республика Коми", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Республика Крым", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Республика Марий Эл", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Республика Мордовия", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Республика Саха (Якутия)", Timezone = "(EKB+4)"},
                new PreSaleRegion { Name = "Республика Северная Осетия — Алания", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Республика Татарстан", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Республика Тыва", Timezone = "(EKB+2)"},
                new PreSaleRegion { Name = "Удмуртская Республика", Timezone = "(EKB-1)"},
                new PreSaleRegion { Name = "Республика Хакасия", Timezone = "(EKB+2)"},
                new PreSaleRegion { Name = "Чеченская Республика", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Чувашская Республика — Чувашия", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Алтайский край", Timezone = "(EKB+2)"},
                new PreSaleRegion { Name = "Забайкальский край", Timezone = "(EKB+4)"},
                new PreSaleRegion { Name = "Краснодарский край", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Камчатский край", Timezone = "(EKB+7)"},
                new PreSaleRegion { Name = "Красноярский край", Timezone = "(EKB+2)"},
                new PreSaleRegion { Name = "Пермский край", Timezone = "(EKB+0)"},
                new PreSaleRegion { Name = "Приморский край", Timezone = "(EKB+5)"},
                new PreSaleRegion { Name = "Ставропольский край", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Хабаровский край", Timezone = "(EKB+5)"},
                new PreSaleRegion { Name = "Амурская область", Timezone = "(EKB+3)"},
                new PreSaleRegion { Name = "Архангельская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Астраханская область", Timezone = "(EKB-1)"},
                new PreSaleRegion { Name = "Белгородская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Брянская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Владимирская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Волгоградская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Вологодская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Воронежская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Ивановская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Иркутская область", Timezone = "(EKB+3)"},
                new PreSaleRegion { Name = "Калининградская область", Timezone = "(EKB-3)"},
                new PreSaleRegion { Name = "Калужская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Кемеровская область — Кузбасс", Timezone = "(EKB+2)"},
                new PreSaleRegion { Name = "Кировская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Костромская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Курганская область", Timezone = "(EKB+0)"},
                new PreSaleRegion { Name = "Курская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Ленинградская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Липецкая область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Магаданская область", Timezone = "(EKB+6)"},
                new PreSaleRegion { Name = "Московская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Мурманская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Нижегородская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Новгородская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Новосибирская область", Timezone = "(EKB+2)"},
                new PreSaleRegion { Name = "Омская область", Timezone = "(EKB+1)"},
                new PreSaleRegion { Name = "Оренбургская область", Timezone = "(EKB+0)"},
                new PreSaleRegion { Name = "Орловская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Пензенская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Псковская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Ростовская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Рязанская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Саратовская область", Timezone = "(EKB-1)"},
                new PreSaleRegion { Name = "Самарская область", Timezone = "(EKB-1)"},
                new PreSaleRegion { Name = "Сахалинская область", Timezone = "(EKB+6)"},
                new PreSaleRegion { Name = "Свердловская область", Timezone = "(EKB+0)"},
                new PreSaleRegion { Name = "Смоленская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Тамбовская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Тверская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Томская область", Timezone = "(EKB+2)"},
                new PreSaleRegion { Name = "Тульская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Тюменская область", Timezone = "(EKB+0)"},
                new PreSaleRegion { Name = "Ульяновская область", Timezone = "(EKB-1)"},
                new PreSaleRegion { Name = "Челябинская область", Timezone = "(EKB+0)"},
                new PreSaleRegion { Name = "Ярославская область", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Москва", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Санкт-Петербург", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Севастополь", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Еврейская АО", Timezone = "(EKB+5)"},
                new PreSaleRegion { Name = "Ненецкий АО", Timezone = "(EKB-2)"},
                new PreSaleRegion { Name = "Ханты-Мансийский АО — Югра", Timezone = "(EKB+0)"},
                new PreSaleRegion { Name = "Чукотский АО", Timezone = "(EKB+7)"},
                new PreSaleRegion { Name = "Ямало-Ненецкий АО", Timezone = "(EKB+0)"}
            };

            foreach (var preSaleRegion in preSaleRegions)
            {
                if (await context.PreSaleRegions
                        .SingleOrDefaultAsync(entity => entity.Name == preSaleRegion.Name) == null)
                {
                    await context.AddAsync(preSaleRegion);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializePreSaleResultsAsync(ApplicationContext context)
        {
            var preSaleResults = new List<PreSaleResult>
            {
                new PreSaleResult { Name = "В работе"},
                new PreSaleResult { Name = "Рассмотрели, но отказали"},
                new PreSaleResult { Name = "Договорились на демонстрацию"},
                new PreSaleResult { Name = "Успешно"}
            };

            foreach (var preSaleResult in preSaleResults)
            {
                if (await context.PreSaleResults
                        .SingleOrDefaultAsync(entity => entity.Name == preSaleResult.Name) == null)
                {
                    await context.AddAsync(preSaleResult);
                }
            }

            await context.SaveChangesAsync();
        }
        #endregion

        #region Lead
        public static async Task InitializeLeadTargetsAsync(ApplicationContext context)
        {
            var leadTargets = new List<LeadTarget>
            {
                new LeadTarget { Name = "Целевой"},
                new LeadTarget { Name = "Нецелевой"}
            };

            foreach (var leadTarget in leadTargets)
            {
                if (await context.LeadTargets
                        .SingleOrDefaultAsync(entity => entity.Name == leadTarget.Name) == null)
                {
                    await context.AddAsync(leadTarget);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializeLeadStatusesAsync(ApplicationContext context)
        {
            var leadStatuses = new List<LeadStatus>
            {
                new LeadStatus { Name = "В работе"},
                new LeadStatus { Name = "Позвонить"},
                new LeadStatus { Name = "Успешно"},
                new LeadStatus { Name = "Не интересно"},
            };

            foreach (var leadStatus in leadStatuses)
            {
                if (await context.LeadStatuses
                        .SingleOrDefaultAsync(entity => entity.Name == leadStatus.Name) == null)
                {
                    await context.AddAsync(leadStatus);
                }
            }

            await context.SaveChangesAsync();
        }

        public static async Task InitializeLeadProjectsAsync(ApplicationContext context)
        {
            var leadProjects = new List<LeadProject>
            {
                new LeadProject { Name = "www.hostco.ru"},
                new LeadProject { Name = "mis-region.ru"},
                new LeadProject { Name = "medved-telemed.ru"},
                new LeadProject { Name = "egisz.mis-region.ru"},
                new LeadProject { Name = "network.hostco.ru"},
                new LeadProject { Name = "reestr.hostco.ru"},
                new LeadProject { Name = "pvhostvm.ru"}
            };

            foreach (var leadProject in leadProjects)
            {
                if (await context.LeadProjects
                        .SingleOrDefaultAsync(entity => entity.Name == leadProject.Name) == null)
                {
                    await context.AddAsync(leadProject);
                }
            }

            await context.SaveChangesAsync();
        }
        #endregion
    }
}
