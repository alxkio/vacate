using Microsoft.EntityFrameworkCore;
using Vacate.Infrastructure.Persistence.Sql;

namespace Vacate.Infrastructure.Persistence;

public sealed class VacateDbContext(DbContextOptions<VacateDbContext> options) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder modelBuilder) => ResourceModel.Configure(modelBuilder);
}
