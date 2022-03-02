using CRM_Lite.Data.Models;
using CRM_Lite.Data.Models.PreSale;
using Microsoft.EntityFrameworkCore;

namespace CRM_Lite.Data;

public class DbInitializer
{
    public static async Task InitializeAsync(
        ApplicationContext context,
        ILogger<DbInitializer> logger,
        bool isSecondInit = false)
    {
        await context.Database.EnsureCreatedAsync();

        await InitializeUsersAsync(context);
            
        await InitializeDepartmentsAsync(context, logger, isSecondInit);
            
        await InitializePreSaleGroupStatusesAsync(context);

        await InitializePreSaleStatusesAsync(context);

        await InitializePreSaleRegionsAsync(context);

        await InitializePreSaleResultsAsync(context);
    }


    private static async Task InitializeDepartmentsAsync(
        ApplicationContext context,
        ILogger<DbInitializer> logger,
        bool needToUpdate = false)
    {
        var mandatoryDepartments = new List<Department>
        {
            new Department
            {
                Name = "ДВС", CanSell = false, CanProduct = true,
                CanExecute = true, IsActive = true,
                ManagerId = context.Users.SingleOrDefault(u => u.Login == "kotohin")?.Id,
                ChildDepartments = new List<Department>
                {
                    new Department
                    {
                        Name = "Группа продаж ДВС",
                        CanSell = true, CanProduct = false, CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "Rogachev")?.Id
                    },
                    new Department
                    {
                        Name = "ОИР",
                        CanSell = false, CanProduct = true, CanExecute = true, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "koltasheva")?.Id
                    },
                    new Department
                    {
                        Name = "ОПР",
                        CanSell = false, CanProduct = true, CanExecute = true, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "koltasheva")?.Id
                    },
                    new Department
                    {
                        Name = "ОВиС",
                        CanSell = false, CanProduct = true, CanExecute = true, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "fyodorov")?.Id
                    },
                    new Department
                    {
                        Name = "ГС",
                        CanSell = false, CanProduct = false, CanExecute = true, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "dokalova")?.Id
                    },
                    new Department
                    {
                        Name = "ГА",
                        CanSell = false, CanProduct = false, CanExecute = true, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "koltasheva")?.Id
                    },
                    new Department
                    {
                        Name = "Проектный отдел", CanSell = false,
                        CanProduct = false, CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "artyukhina")?.Id
                    }
                }
            },

            new Department
            {
                Name = "ДИС", CanSell = true,
                CanProduct = true, CanExecute = true, IsActive = true,
                ManagerId = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.Id,
                ChildDepartments = new List<Department>
                {
                    new Department
                    {
                        Name = "Офис продаж ЕКБ", CanSell = true,
                        CanProduct = false, CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "kochev")?.Id
                    },
                    new Department
                    {
                        Name = "Офис продаж ПРМ", CanSell = true,
                        CanProduct = false, CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "nelavitskaya")?.Id
                    },
                    new Department
                    {
                        Name = "Офис продаж СПБ", CanSell = true,
                        CanProduct = false, CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "simakov")?.Id
                    },
                    new Department
                    {
                        Name = "Офис продаж ТЮМ", CanSell = true,
                        CanProduct = false, CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "azarenko")?.Id
                    },
                    new Department
                    {
                        Name = "ОИР", CanSell = false,
                        CanProduct = true, CanExecute = true, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.Id
                    },
                    new Department
                    {
                        Name = "ОПиР", CanSell = false,
                        CanProduct = true, CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "yantsen")?.Id
                    },
                    new Department
                    {
                        Name = "ОСиК", CanSell = false,
                        CanProduct = true, CanExecute = true, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.Id
                    },
                    new Department
                    {
                        Name = "ОЛ", CanSell = false,
                        CanProduct = false, CanExecute = true, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.Id
                    },
                    new Department
                    {
                        Name = "ОРРП", CanSell = false,
                        CanProduct = true, CanExecute = true, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "prozorov")?.Id
                    },
                    new Department
                    {
                        Name = "Проектный отдел", CanSell = false,
                        CanProduct = false, CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "Yakimova")?.Id
                    }
                }
            },

            new Department
            {
                Name = "ДПС", CanSell = false,
                CanProduct = true, IsActive = true, CanExecute = true,
                ManagerId = context.Users.SingleOrDefault(u => u.Login == "zavada")?.Id,
                ChildDepartments = new List<Department>
                {
                    new Department
                    {
                        Name = "Офис продаж ДПС", CanSell = true,
                        CanProduct = false, CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "krivoshein")?.Id
                    },
                    new Department
                    {
                        Name = "ОРПО", CanSell = false,
                        CanProduct = true, CanExecute = true, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "zavada")?.Id
                    },
                }
            },
            new Department
            {
                Name = "Управляющая компания", CanSell = false, CanProduct = false,
                CanExecute = false, IsActive = true,
                ManagerId = context.Users.SingleOrDefault(u => u.Login == "suslov")?.Id,
                ChildDepartments = new List<Department>
                {
                    new Department
                    {
                        Name = "Бухгалтерия", CanSell = false, CanProduct = false,
                        CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "vorontsova")?.Id
                    },
                    new Department
                    {
                        Name = "Административный отдел", CanSell = false,
                        CanProduct = false, CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "krachkovskaya")?.Id
                    },
                    new Department
                    {
                        Name = "Отдел маркетинга и рекламы", CanSell = false,
                        CanProduct = false, CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "prosvetova")?.Id
                    },
                    new Department
                    {
                        Name = "Финансово-экономический отдел", CanSell = false,
                        CanProduct = false, CanExecute = false, IsActive = true
                    },
                    new Department
                    {
                        Name = "ТОП-менеджмент", CanSell = false, CanProduct = false,
                        CanExecute = false, IsActive = true,
                        ManagerId = context.Users.SingleOrDefault(u => u.Login == "suslov")?.Id
                    },
                }
            },
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
                if (depFromContext != null)
                {
                    depFromContext.ManagerId = mandatoryDepartment.ManagerId;
                    depFromContext.ManagerFromAD = mandatoryDepartment.ManagerFromAD;
                    context.Update(depFromContext);

                    await context.SaveChangesAsync();

                    foreach (var childDepartment in mandatoryDepartment.ChildDepartments)
                    {
                        var childDepFromContext = await context.Departments
                            .SingleOrDefaultAsync(entity => entity.Name == childDepartment.Name
                                                            && entity.CanSell == childDepartment.CanSell &&
                                                            entity.CanProduct == childDepartment.CanProduct &&
                                                            entity.CanExecute == childDepartment.CanExecute &&
                                                            entity.ParentDepartmentId == depFromContext.Id);

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
        }

        logger.LogInformation("End add and update departments");
        await context.SaveChangesAsync();
    }


    private static async Task InitializeUsersAsync(ApplicationContext context)
    {
        var users = new List<User>
        {
            new User() {FirstName = "Борис", LastName = "Кузнецов", FullName = "Кузнецов Борис", Login = "kuznetsov"},
            new User() {FirstName = "Елена", LastName = "Склярова", FullName = "Склярова Елена", Login = "sklyarova"},
            new User() {FirstName = "Анастасия", LastName = "Смирнова", FullName = "Смирнова Анастасия", Login = "smirnova"},
        };

        foreach (var user in users)
        {
            if (await context.Users
                    .SingleOrDefaultAsync(u => u.FullName == user.FullName) == null)
            {
                await context.AddAsync(user);
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

}