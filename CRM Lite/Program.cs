using System.Globalization;
using System.Text;
using CRM_Lite.AutoMapper;
using CRM_Lite.Data;
using Microsoft.AspNetCore.Localization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Vostok.Logging.Abstractions;
using Vostok.Logging.Console;
using Vostok.Logging.File;
using Vostok.Logging.File.Configuration;
using Vostok.Logging.Microsoft;
using LogLevel = Microsoft.Extensions.Logging.LogLevel;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddDbContext<ApplicationContext>(options => options
    .UseNpgsql("Host=localhost;Port=5432;Database=CRM_Lite;Username=postgres;Password=123")
);

builder.Services.AddAutoMapper(
    typeof(UserProfile),
    typeof(PreSaleProfile)
);

ConfigureLogging(builder.Logging);

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ApplicationContext>();
    var logger = services.GetRequiredService<ILogger<DbInitializer>>();

    await context.Database.MigrateAsync();

    await DbInitializer.InitializeAsync(context, logger);
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

UseRussianLocalization(app);

app.UseHttpsRedirection();

app.UseStaticFiles(
    new StaticFileOptions
    {
        OnPrepareResponse = ctx => { ctx.Context.Response.Headers.Add("Cache-Control", "public,max-age=300"); }
    });


app.UseStaticFiles(
    new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(
            Path.Combine(Directory.GetCurrentDirectory(), "node_modules")),
        RequestPath = "/node_modules"
    });

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    "default",
    "{controller=Home}/{action=Index}/{id?}");

app.Run();

static void UseRussianLocalization(IApplicationBuilder app)
{
    var supportedCultures = new[]
    {
        new CultureInfo("en-US"),
        new CultureInfo("en-GB"),
        new CultureInfo("en"),
        new CultureInfo("ru-RU"),
        new CultureInfo("ru"),
        new CultureInfo("de-DE"),
        new CultureInfo("de")
    };
    app.UseRequestLocalization(
        new RequestLocalizationOptions
        {
            DefaultRequestCulture = new RequestCulture("ru-RU"),
            SupportedCultures = supportedCultures,
            SupportedUICultures = supportedCultures
        });
}

static void ConfigureLogging(ILoggingBuilder logging)
{
    logging.SetMinimumLevel(LogLevel.Information);
    logging.ClearProviders();
    var log = new CompositeLog(
        new ConsoleLog(),
        new FileLog(
            new FileLogSettings
            {
                RollingStrategy = new RollingStrategyOptions
                {
                    Type = RollingStrategyType.Hybrid,
                    Period = RollingPeriod.Day,
                    MaxFiles = 30
                },
                FileOpenMode = FileOpenMode.Append,
                Encoding = Encoding.UTF8
            }));
    logging.AddVostok(log);
    logging.Services.AddSingleton<ILog>(log);
}