using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Vacate.Infrastructure.Persistence;

namespace Vacate.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<VacateDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("Vacate")));

        return services;
    }
}
