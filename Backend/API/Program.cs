using API.Middleware;
using API.Scanner.Models;
using API.Scanner.Services;
using API.Scanner.Workers;
using Application;
using Application.Common.Behaviors;
using Application.Common.Interfaces;
using FluentValidation;
using Infrastructure;
using Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// Infraestructura (EF Core + SQL Server)
builder.Services.AddInfrastructure(builder.Configuration);

// MediatR + pipeline behaviors
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(typeof(AssemblyMarker).Assembly));
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
builder.Services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

// FluentValidation
builder.Services.AddValidatorsFromAssembly(typeof(AssemblyMarker).Assembly);

// AutoMapper
builder.Services.AddAutoMapper(typeof(AssemblyMarker).Assembly);

// Scanner
builder.Services.Configure<ScannerOptions>(builder.Configuration.GetSection("Scanner"));
builder.Services.Configure<TmdbOptions>(builder.Configuration.GetSection("Tmdb"));
builder.Services.AddSingleton<IScannerStatusService, ScannerStatusService>();
builder.Services.AddScoped<IMediaScannerService, MediaScannerService>();
builder.Services.AddHostedService<ScannerWorker>();
builder.Services.AddHttpClient<ITmdbClientService, TmdbClientService>(client =>
{
    var tmdbOptions = builder.Configuration.GetSection("Tmdb").Get<TmdbOptions>()!;
    client.BaseAddress = new Uri(tmdbOptions.BaseUrl);
    client.DefaultRequestHeaders.Authorization =
        new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", tmdbOptions.ApiKey);
});

// API
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// CORS para el frontend en desarrollo
builder.Services.AddCors(options =>
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

var app = builder.Build();

// Aplicar migraciones pendientes al arrancar
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    await db.Database.MigrateAsync();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
app.MapOpenApi();
app.MapScalarApiReference();
app.MapControllers();

app.Run();

public partial class Program { }
