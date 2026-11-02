using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Vacate.Infrastructure.Persistence.Sql;

internal static class ResourceModel
{
    internal static readonly string[] Sequences = ["UserIds", "MembershipIds", "OrganizationIds", "DepartmentIds", "TeamIds", "JobRoleIds", "WorkScheduleIds"];

    public static void Configure(ModelBuilder model)
    {
        model.UseCollation("Latin1_General_100_CI_AS_SC_UTF8");
        foreach (var sequence in Sequences)
        {
            model.HasSequence<int>(sequence).StartsAt(1).IncrementsBy(1);
        }

        var users = Entity<UserRow>(model, "Users");
        users.Property(x => x.Username).HasMaxLength(200).UseCollation("Latin1_General_100_BIN2");
        users.HasIndex(x => x.Username).IsUnique();
        users.Property(x => x.FirstName).HasMaxLength(200);
        users.Property(x => x.MiddleName).HasMaxLength(200);
        users.Property(x => x.LastName).HasMaxLength(200);
        users.Property(x => x.Gender).HasMaxLength(16).UseCollation("Latin1_General_100_BIN2");
        users.Property(x => x.Status).HasMaxLength(16).UseCollation("Latin1_General_100_BIN2");
        users.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Users_Username", "LEN([Username]) > 0 AND [Username] = LTRIM(RTRIM([Username]))");
            t.HasCheckConstraint("CK_Users_Name", "LEN([FirstName]) > 0 AND LEN([LastName]) > 0");
            t.HasCheckConstraint("CK_Users_Gender", "[Gender] IN (N'woman', N'man', N'unspecified')");
            t.HasCheckConstraint("CK_Users_Status", "[Status] IN (N'active', N'disabled')");
        });
        var profiles = model.Entity<PrivateProfileRow>();
        profiles.ToTable("UserPrivateProfiles", t => t.HasCheckConstraint("CK_Private_Family", "[DependentChildren] >= 0 AND NOT ([Married] = 1 AND [SoleCare] = 1)"));
        profiles.HasKey(x => x.UserId);
        profiles.Property(x => x.UserId).ValueGeneratedNever();
        profiles.Property(x => x.RowVersion).IsRowVersion();
        users.HasOne(x => x.PrivateProfile).WithOne().HasForeignKey<PrivateProfileRow>(x => x.UserId).OnDelete(DeleteBehavior.NoAction);

        var organizations = Entity<OrganizationRow>(model, "Organizations");
        organizations.Property(x => x.Name).HasMaxLength(200);
        organizations.Property(x => x.IsDemo).HasDefaultValue(false);
        organizations.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Organizations_Settings", "[WorkWeekDays] IN (5, 6) AND [CarryoverYears] >= 0 AND LEN([Name]) > 0");
        });
        var departments = Entity<DepartmentRow>(model, "Departments");
        departments.Property(x => x.Name).HasMaxLength(200);
        departments.HasAlternateKey(x => new { x.CompanyId, x.Id });
        departments.ToTable(t => t.HasCheckConstraint("CK_Departments_Name", "LEN([Name]) > 0"));
        organizations.HasMany(x => x.Departments).WithOne().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.NoAction);
        var teams = Entity<TeamRow>(model, "Teams");
        teams.Property(x => x.Name).HasMaxLength(200);
        teams.HasAlternateKey(x => new { x.CompanyId, x.Id });
        teams.ToTable(t => t.HasCheckConstraint("CK_Teams_Name", "LEN([Name]) > 0"));
        organizations.HasMany(x => x.Teams).WithOne().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.NoAction);
        teams.HasOne<DepartmentRow>().WithMany().HasForeignKey(x => new { x.CompanyId, x.DepartmentId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id }).OnDelete(DeleteBehavior.NoAction);

        var systemRoles = Entity<SystemRoleRow>(model, "SystemRoles");
        systemRoles.Property(x => x.Name).HasMaxLength(200);
        systemRoles.ToTable(t => t.HasCheckConstraint("CK_SystemRoles_Fixed", "([Id] = 1 AND [Name] = N'admin') OR ([Id] = 2 AND [Name] = N'employee')"));
        var jobRoles = Entity<JobRoleRow>(model, "JobRoles");
        jobRoles.Property(x => x.Name).HasMaxLength(200);
        jobRoles.HasAlternateKey(x => new { x.CompanyId, x.Id });
        jobRoles.HasOne<OrganizationRow>().WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.NoAction);
        jobRoles.ToTable(t => t.HasCheckConstraint("CK_JobRoles_Name", "LEN([Name]) > 0"));
        var schedules = Entity<WorkScheduleRow>(model, "WorkSchedules");
        schedules.Property(x => x.Name).HasMaxLength(200);

        var members = Entity<MembershipRow>(model, "Memberships");
        members.HasAlternateKey(x => new { x.CompanyId, x.Id });
        members.HasIndex(x => x.UserId).IsUnique().HasFilter("[DeletedAt] IS NULL");
        members.HasIndex(x => new { x.UserId, x.Id });
        members.HasIndex(x => new { x.CompanyId, x.DeletedAt, x.SystemRoleId });
        members.HasIndex(x => new { x.CompanyId, x.ManagerUserId });
        members.HasIndex(x => new { x.CompanyId, x.DepartmentId });
        members.HasIndex(x => new { x.CompanyId, x.TeamId });
        members.Property(x => x.SettingsRole).HasMaxLength(24).UseCollation("Latin1_General_100_BIN2");
        members.Property(x => x.PriorServiceYears).HasPrecision(18, 8);
        members.HasOne<UserRow>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction);
        members.HasOne<OrganizationRow>().WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.NoAction);
        members.HasOne<SystemRoleRow>().WithMany().HasForeignKey(x => x.SystemRoleId).OnDelete(DeleteBehavior.NoAction);
        members.HasOne<JobRoleRow>().WithMany().HasForeignKey(x => new { x.CompanyId, x.JobRoleId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id }).OnDelete(DeleteBehavior.NoAction);
        members.HasOne<DepartmentRow>().WithMany().HasForeignKey(x => new { x.CompanyId, x.DepartmentId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id }).OnDelete(DeleteBehavior.NoAction);
        members.HasOne<TeamRow>().WithMany().HasForeignKey(x => new { x.CompanyId, x.TeamId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id }).OnDelete(DeleteBehavior.NoAction);
        members.HasOne<UserRow>().WithMany().HasForeignKey(x => x.ManagerUserId).OnDelete(DeleteBehavior.NoAction);
        members.HasOne<WorkScheduleRow>().WithMany().HasForeignKey(x => x.WorkScheduleId).OnDelete(DeleteBehavior.NoAction);
        members.ToTable(t =>
        {
            t.HasCheckConstraint("CK_Memberships_Dates", "[HireDate] IS NULL OR [EmploymentEndDate] IS NULL OR [EmploymentEndDate] >= [HireDate]");
            t.HasCheckConstraint("CK_Memberships_Service", "[PriorServiceYears] IS NULL OR [PriorServiceYears] >= 0");
            t.HasCheckConstraint("CK_Memberships_SettingsRole", "[SettingsRole] IN (N'Employee', N'TeamLead', N'DepartmentLead', N'Owner', N'Hr') AND ([SettingsRole] NOT IN (N'Owner', N'Hr') OR [SystemRoleId] = 1)");
            // No reference target exists yet; the current application also rejects non-null values.
            t.HasCheckConstraint("CK_Memberships_UnconfiguredPolicy", "[HolidayCalendarId] IS NULL AND [LeavePolicyId] IS NULL");
        });
        var entitlements = model.Entity<MembershipEntitlementRow>();
        entitlements.ToTable("MembershipEntitlements", t =>
        {
            t.HasCheckConstraint("CK_Entitlement_Period", "[PeriodEnd] >= [PeriodStart]");
            t.HasCheckConstraint("CK_Entitlement_Allocation", "([PolicyMinimum] IS NULL OR [PolicyMinimum] >= 0) AND ([CustomAllocation] IS NULL OR [CustomAllocation] >= COALESCE([PolicyMinimum], 0))");
        });
        entitlements.HasKey(x => x.MembershipId);
        entitlements.HasAlternateKey(x => new { x.CompanyId, x.MembershipId });
        entitlements.Property(x => x.MembershipId).ValueGeneratedNever();
        entitlements.Property(x => x.RowVersion).IsRowVersion();
        entitlements.Property(x => x.PolicyVersion).HasMaxLength(200);
        entitlements.Property(x => x.PolicyMinimum).HasPrecision(12, 4);
        entitlements.Property(x => x.CustomAllocation).HasPrecision(12, 4);
        members.HasOne(x => x.Entitlement).WithOne().HasForeignKey<MembershipEntitlementRow>(x => new { x.CompanyId, x.MembershipId })
            .HasPrincipalKey<MembershipRow>(x => new { x.CompanyId, x.Id }).OnDelete(DeleteBehavior.NoAction);

        var leaves = model.Entity<LeaveRow>();
        leaves.ToTable("Leaves", t =>
        {
            t.HasCheckConstraint("CK_Leaves_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
            t.HasCheckConstraint("CK_Leaves_Quantity", "[QuantityDays] > 0");
            t.HasCheckConstraint("CK_Leaves_Origin", "LEN([Source]) > 0 AND (([EntryKind] = N'ImportedOpening' AND [Status] IN (N'Used', N'Pending') AND [StartDate] IS NULL AND [EndDate] IS NULL) OR ([EntryKind] = N'RecordedLeave' AND [Status] IN (N'Used', N'Pending', N'Cancelled') AND [StartDate] IS NOT NULL AND [EndDate] IS NOT NULL AND [EndDate] >= [StartDate]))");
            t.HasCheckConstraint("CK_Leaves_Utc", "[UpdatedAt] >= [CreatedAt] AND DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0");
        });
        leaves.HasKey(x => x.Id);
        leaves.Property(x => x.Id).UseIdentityColumn();
        leaves.HasIndex(x => x.Guid).IsUnique();
        leaves.Property(x => x.Guid).ValueGeneratedNever();
        leaves.Property(x => x.EntryKind).HasMaxLength(24).UseCollation("Latin1_General_100_BIN2");
        leaves.Property(x => x.Status).HasMaxLength(16).UseCollation("Latin1_General_100_BIN2");
        leaves.Property(x => x.Source).HasMaxLength(200);
        leaves.Property(x => x.QuantityDays).HasPrecision(12, 4);
        leaves.Property(x => x.RowVersion).IsRowVersion();
        leaves.HasIndex(x => new { x.CompanyId, x.MembershipId, x.Status });
        leaves.HasIndex(x => new { x.CompanyId, x.MembershipId, x.EntryKind, x.Status }).IsUnique()
            .HasFilter("[EntryKind] = N'ImportedOpening'");
        members.HasMany(x => x.Leaves).WithOne().HasForeignKey(x => new { x.CompanyId, x.MembershipId })
            .HasPrincipalKey(x => new { x.CompanyId, x.Id }).OnDelete(DeleteBehavior.NoAction);
        leaves.HasOne<MembershipEntitlementRow>().WithMany().HasForeignKey(x => new { x.CompanyId, x.MembershipId })
            .HasPrincipalKey(x => new { x.CompanyId, x.MembershipId }).OnDelete(DeleteBehavior.NoAction);

        var access = model.Entity<DevelopmentAccessRow>();
        access.ToTable("DevelopmentProvisioningAccess");
        access.HasKey(x => new { x.UserId, x.CompanyId });
        access.HasIndex(x => x.UserId).IsUnique().HasFilter("[Invited] = 1");
        access.HasOne<UserRow>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.NoAction);
        access.HasOne<OrganizationRow>().WithMany().HasForeignKey(x => x.CompanyId).OnDelete(DeleteBehavior.NoAction);
    }

    private static EntityTypeBuilder<T> Entity<T>(ModelBuilder model, string table) where T : EntityRow
    {
        var entity = model.Entity<T>();
        entity.HasBaseType((Type?)null);
        entity.ToTable(table, t =>
        {
            t.HasCheckConstraint($"CK_{table}_Identity", "[Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'");
            t.HasCheckConstraint($"CK_{table}_Lifecycle", "[UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))");
            t.HasCheckConstraint($"CK_{table}_Utc", "DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)");
        });
        entity.HasKey(x => x.Id);
        entity.Property(x => x.Id).ValueGeneratedNever();
        entity.HasIndex(x => x.Guid).IsUnique();
        entity.Property(x => x.RowVersion).IsRowVersion();
        return entity;
    }
}
