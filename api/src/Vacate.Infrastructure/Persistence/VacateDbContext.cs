using Microsoft.EntityFrameworkCore;

namespace Vacate.Infrastructure.Persistence;

public sealed class VacateDbContext(DbContextOptions<VacateDbContext> options) : DbContext(options);
