using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Vacate.Infrastructure.Persistence;
using Vacate.Infrastructure.Identity;
using Vacate.Application.Abstractions;

namespace Vacate.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInMemoryPersistence(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton(provider => new InMemoryDatabase(bool.TryParse(provider.GetRequiredService<IConfiguration>()["SeedData:Enabled"], out var seed) && seed));
        services.AddSingleton<IUnitOfWork, InMemoryUnitOfWork>();
        services.AddSingleton<IUserRepository, UserRepository>();
        services.AddSingleton<IMembershipRepository, MembershipRepository>();
        services.AddSingleton<IOrganizationRepository, OrganizationRepository>();
        services.AddSingleton<IRoleCatalog, RoleCatalog>();
        services.AddSingleton<IProvisioningAccess, ProvisioningAccess>();
        services.AddSingleton<IUserPresentationCatalog, UserPresentationCatalog>();
        services.AddSingleton<ICredentialValidator, DevelopmentCredentials>();
        services.AddSingleton<ISessionStore, InMemorySessionStore>();
        return services;
    }

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<VacateDbContext>(options =>
            options.UseSqlServer(configuration.GetConnectionString("Vacate")));

        return services;
    }
}
