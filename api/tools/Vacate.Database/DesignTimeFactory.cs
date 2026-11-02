using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Vacate.Infrastructure.Persistence;

namespace Vacate.Database;

public sealed class DesignTimeFactory : IDesignTimeDbContextFactory<VacateDbContext>
{
    public VacateDbContext CreateDbContext(string[] args) => new(new DbContextOptionsBuilder<VacateDbContext>()
        .UseSqlServer("Server=localhost;Database=Vacate;Integrated Security=true;Encrypt=true;TrustServerCertificate=false").Options);
}
