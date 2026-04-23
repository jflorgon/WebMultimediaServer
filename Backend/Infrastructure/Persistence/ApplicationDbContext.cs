using Application.Common.Interfaces;
using Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : DbContext(options), IApplicationDbContext
{
    public DbSet<Movie> Movies => Set<Movie>();
    public DbSet<Series> Series => Set<Series>();
    public DbSet<Documentary> Documentaries => Set<Documentary>();
    public DbSet<Episode> Episodes => Set<Episode>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var utcNow = DateTime.UtcNow;

        foreach (var entry in ChangeTracker.Entries<Movie>().Where(e => e.State == EntityState.Modified))
            entry.Entity.UpdatedAt = utcNow;

        foreach (var entry in ChangeTracker.Entries<Series>().Where(e => e.State == EntityState.Modified))
            entry.Entity.UpdatedAt = utcNow;

        foreach (var entry in ChangeTracker.Entries<Documentary>().Where(e => e.State == EntityState.Modified))
            entry.Entity.UpdatedAt = utcNow;

        foreach (var entry in ChangeTracker.Entries<Episode>().Where(e => e.State == EntityState.Modified))
            entry.Entity.UpdatedAt = utcNow;

        return base.SaveChangesAsync(cancellationToken);
    }
}
