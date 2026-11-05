using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Vacate.Infrastructure.Persistence;
using Vacate.Infrastructure.Identity;
using Vacate.Infrastructure.Persistence.Sql;
using Vacate.Application.Abstractions;
using Vacate.Application.Leave;

namespace Vacate.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInMemoryPersistence(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddSingleton(provider => new InMemoryDatabase(bool.TryParse(provider.GetRequiredService<IConfiguration>()["SeedData:Enabled"], out var seed) && seed));
        services.AddSingleton<IUnitOfWork, InMemoryUnitOfWork>();
        services.AddSingleton<ILeaveRepository, InMemoryLeaves>();
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

    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration configuration)
    {
        var provider = configuration["Persistence:Provider"] ?? "InMemory";
        if (provider == "InMemory")
        {
            return services.AddInMemoryPersistence();
        }

        if (provider != "SqlServer")
        {
            throw new InvalidOperationException("Choose InMemory or SqlServer persistence.");
        }

        var connection = configuration.GetConnectionString("Vacate");
        if (string.IsNullOrWhiteSpace(connection))
        {
            throw new InvalidOperationException("SQL persistence requires ConnectionStrings:Vacate.");
        }

        var sql = new SqlConnectionStringBuilder(connection);
        if (sql.TrustServerCertificate || sql.Encrypt == SqlConnectionEncryptOption.Optional)
        {
            throw new InvalidOperationException("SQL persistence requires encryption and certificate validation.");
        }

        services.AddSingleton(TimeProvider.System);
        services.AddSingleton(_ => new InMemoryDatabase(bool.TryParse(configuration["SeedData:Enabled"], out var seed) && seed));
        services.AddSingleton<ISessionStore, InMemorySessionStore>();
        services.AddSingleton<IUserPresentationCatalog, UserPresentationCatalog>();
        services.AddScoped<ICredentialValidator, DevelopmentCredentials>();
        services.AddDbContext<VacateDbContext>(options => options.UseSqlServer(connection));
        services.AddScoped<SqlSession>();
        services.AddScoped<ILeaveRepository, SqlLeaves>();
        services.AddScoped<IUnitOfWork>(provider => provider.GetRequiredService<SqlSession>());
        services.AddScoped<IUserRepository, SqlUsers>();
        services.AddScoped<IMembershipRepository, SqlMemberships>();
        services.AddScoped<IOrganizationRepository, SqlOrganizations>();
        services.AddScoped<IRoleCatalog, SqlRoles>();
        services.AddScoped<IProvisioningAccess, SqlDevelopmentAccess>();
        return services;
    }
}
