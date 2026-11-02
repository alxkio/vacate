IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE SEQUENCE [DepartmentIds] AS int START WITH 1 INCREMENT BY 1 NO CYCLE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE SEQUENCE [JobRoleIds] AS int START WITH 1 INCREMENT BY 1 NO CYCLE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE SEQUENCE [MembershipIds] AS int START WITH 1 INCREMENT BY 1 NO CYCLE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE SEQUENCE [OrganizationIds] AS int START WITH 1 INCREMENT BY 1 NO CYCLE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE SEQUENCE [TeamIds] AS int START WITH 1 INCREMENT BY 1 NO CYCLE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE SEQUENCE [UserIds] AS int START WITH 1 INCREMENT BY 1 NO CYCLE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE SEQUENCE [WorkScheduleIds] AS int START WITH 1 INCREMENT BY 1 NO CYCLE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE TABLE [Organizations] (
        [Id] int NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [WorkWeekDays] int NOT NULL,
        [RequireVacationApproval] bit NOT NULL,
        [DepartmentLeadSettingsEnabled] bit NOT NULL,
        [TeamLeadSettingsEnabled] bit NOT NULL,
        [CarryoverEnabled] bit NOT NULL,
        [CarryoverYears] int NOT NULL,
        [Guid] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        [DeleteRequestedAt] datetimeoffset NULL,
        [DeletedAt] datetimeoffset NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Organizations] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_Organizations_Identity] CHECK ([Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_Organizations_Lifecycle] CHECK ([UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))),
        CONSTRAINT [CK_Organizations_Settings] CHECK ([WorkWeekDays] IN (5, 6) AND [CarryoverYears] >= 0 AND LEN([Name]) > 0),
        CONSTRAINT [CK_Organizations_Utc] CHECK (DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0))
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE TABLE [SystemRoles] (
        [Id] int NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Guid] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        [DeleteRequestedAt] datetimeoffset NULL,
        [DeletedAt] datetimeoffset NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_SystemRoles] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_SystemRoles_Fixed] CHECK (([Id] = 1 AND [Name] = N'admin') OR ([Id] = 2 AND [Name] = N'employee')),
        CONSTRAINT [CK_SystemRoles_Identity] CHECK ([Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_SystemRoles_Lifecycle] CHECK ([UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))),
        CONSTRAINT [CK_SystemRoles_Utc] CHECK (DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0))
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE TABLE [Users] (
        [Id] int NOT NULL,
        [Username] nvarchar(200) COLLATE Latin1_General_100_BIN2 NOT NULL,
        [FirstName] nvarchar(200) NOT NULL,
        [MiddleName] nvarchar(200) NULL,
        [LastName] nvarchar(200) NOT NULL,
        [Gender] nvarchar(16) COLLATE Latin1_General_100_BIN2 NOT NULL,
        [Status] nvarchar(16) COLLATE Latin1_General_100_BIN2 NOT NULL,
        [Guid] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        [DeleteRequestedAt] datetimeoffset NULL,
        [DeletedAt] datetimeoffset NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_Users_Gender] CHECK ([Gender] IN (N'woman', N'man', N'unspecified')),
        CONSTRAINT [CK_Users_Identity] CHECK ([Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_Users_Lifecycle] CHECK ([UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))),
        CONSTRAINT [CK_Users_Name] CHECK (LEN([FirstName]) > 0 AND LEN([LastName]) > 0),
        CONSTRAINT [CK_Users_Status] CHECK ([Status] IN (N'active', N'disabled')),
        CONSTRAINT [CK_Users_Username] CHECK (LEN([Username]) > 0 AND [Username] = LTRIM(RTRIM([Username]))),
        CONSTRAINT [CK_Users_Utc] CHECK (DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0))
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE TABLE [WorkSchedules] (
        [Id] int NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Guid] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        [DeleteRequestedAt] datetimeoffset NULL,
        [DeletedAt] datetimeoffset NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_WorkSchedules] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_WorkSchedules_Identity] CHECK ([Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_WorkSchedules_Lifecycle] CHECK ([UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))),
        CONSTRAINT [CK_WorkSchedules_Utc] CHECK (DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0))
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE TABLE [Departments] (
        [Id] int NOT NULL,
        [CompanyId] int NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [RequireVacationApproval] bit NULL,
        [Guid] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        [DeleteRequestedAt] datetimeoffset NULL,
        [DeletedAt] datetimeoffset NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Departments] PRIMARY KEY ([Id]),
        CONSTRAINT [AK_Departments_CompanyId_Id] UNIQUE ([CompanyId], [Id]),
        CONSTRAINT [CK_Departments_Identity] CHECK ([Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_Departments_Lifecycle] CHECK ([UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))),
        CONSTRAINT [CK_Departments_Name] CHECK (LEN([Name]) > 0),
        CONSTRAINT [CK_Departments_Utc] CHECK (DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)),
        CONSTRAINT [FK_Departments_Organizations_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Organizations] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE TABLE [JobRoles] (
        [Id] int NOT NULL,
        [CompanyId] int NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Guid] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        [DeleteRequestedAt] datetimeoffset NULL,
        [DeletedAt] datetimeoffset NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_JobRoles] PRIMARY KEY ([Id]),
        CONSTRAINT [AK_JobRoles_CompanyId_Id] UNIQUE ([CompanyId], [Id]),
        CONSTRAINT [CK_JobRoles_Identity] CHECK ([Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_JobRoles_Lifecycle] CHECK ([UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))),
        CONSTRAINT [CK_JobRoles_Name] CHECK (LEN([Name]) > 0),
        CONSTRAINT [CK_JobRoles_Utc] CHECK (DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)),
        CONSTRAINT [FK_JobRoles_Organizations_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Organizations] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE TABLE [DevelopmentProvisioningAccess] (
        [UserId] int NOT NULL,
        [CompanyId] int NOT NULL,
        [Invited] bit NOT NULL,
        [CanProvision] bit NOT NULL,
        CONSTRAINT [PK_DevelopmentProvisioningAccess] PRIMARY KEY ([UserId], [CompanyId]),
        CONSTRAINT [FK_DevelopmentProvisioningAccess_Organizations_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Organizations] ([Id]),
        CONSTRAINT [FK_DevelopmentProvisioningAccess_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE TABLE [UserPrivateProfiles] (
        [UserId] int NOT NULL,
        [Married] bit NOT NULL,
        [DependentChildren] int NOT NULL,
        [SoleCare] bit NOT NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_UserPrivateProfiles] PRIMARY KEY ([UserId]),
        CONSTRAINT [CK_Private_Family] CHECK ([DependentChildren] >= 0 AND NOT ([Married] = 1 AND [SoleCare] = 1)),
        CONSTRAINT [FK_UserPrivateProfiles_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE TABLE [Teams] (
        [Id] int NOT NULL,
        [CompanyId] int NOT NULL,
        [DepartmentId] int NULL,
        [Name] nvarchar(200) NOT NULL,
        [RequireVacationApproval] bit NULL,
        [Guid] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        [DeleteRequestedAt] datetimeoffset NULL,
        [DeletedAt] datetimeoffset NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Teams] PRIMARY KEY ([Id]),
        CONSTRAINT [AK_Teams_CompanyId_Id] UNIQUE ([CompanyId], [Id]),
        CONSTRAINT [CK_Teams_Identity] CHECK ([Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_Teams_Lifecycle] CHECK ([UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))),
        CONSTRAINT [CK_Teams_Name] CHECK (LEN([Name]) > 0),
        CONSTRAINT [CK_Teams_Utc] CHECK (DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)),
        CONSTRAINT [FK_Teams_Departments_CompanyId_DepartmentId] FOREIGN KEY ([CompanyId], [DepartmentId]) REFERENCES [Departments] ([CompanyId], [Id]),
        CONSTRAINT [FK_Teams_Organizations_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Organizations] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE TABLE [Memberships] (
        [Id] int NOT NULL,
        [CompanyId] int NOT NULL,
        [UserId] int NOT NULL,
        [SystemRoleId] int NOT NULL,
        [JobRoleId] int NOT NULL,
        [SettingsRole] nvarchar(24) COLLATE Latin1_General_100_BIN2 NOT NULL,
        [DepartmentId] int NULL,
        [TeamId] int NULL,
        [ManagerUserId] int NULL,
        [HireDate] date NULL,
        [EmploymentEndDate] date NULL,
        [PriorServiceYears] decimal(18,8) NULL,
        [WorkScheduleId] int NULL,
        [HolidayCalendarId] int NULL,
        [LeavePolicyId] int NULL,
        [Guid] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        [DeleteRequestedAt] datetimeoffset NULL,
        [DeletedAt] datetimeoffset NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Memberships] PRIMARY KEY ([Id]),
        CONSTRAINT [AK_Memberships_CompanyId_Id] UNIQUE ([CompanyId], [Id]),
        CONSTRAINT [CK_Memberships_Dates] CHECK ([HireDate] IS NULL OR [EmploymentEndDate] IS NULL OR [EmploymentEndDate] >= [HireDate]),
        CONSTRAINT [CK_Memberships_Identity] CHECK ([Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_Memberships_Lifecycle] CHECK ([UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))),
        CONSTRAINT [CK_Memberships_Service] CHECK ([PriorServiceYears] IS NULL OR [PriorServiceYears] >= 0),
        CONSTRAINT [CK_Memberships_SettingsRole] CHECK ([SettingsRole] IN (N'Employee', N'TeamLead', N'DepartmentLead', N'Owner', N'Hr') AND ([SettingsRole] NOT IN (N'Owner', N'Hr') OR [SystemRoleId] = 1)),
        CONSTRAINT [CK_Memberships_UnconfiguredPolicy] CHECK ([HolidayCalendarId] IS NULL AND [LeavePolicyId] IS NULL),
        CONSTRAINT [CK_Memberships_Utc] CHECK (DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)),
        CONSTRAINT [FK_Memberships_Departments_CompanyId_DepartmentId] FOREIGN KEY ([CompanyId], [DepartmentId]) REFERENCES [Departments] ([CompanyId], [Id]),
        CONSTRAINT [FK_Memberships_JobRoles_CompanyId_JobRoleId] FOREIGN KEY ([CompanyId], [JobRoleId]) REFERENCES [JobRoles] ([CompanyId], [Id]),
        CONSTRAINT [FK_Memberships_Organizations_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Organizations] ([Id]),
        CONSTRAINT [FK_Memberships_SystemRoles_SystemRoleId] FOREIGN KEY ([SystemRoleId]) REFERENCES [SystemRoles] ([Id]),
        CONSTRAINT [FK_Memberships_Teams_CompanyId_TeamId] FOREIGN KEY ([CompanyId], [TeamId]) REFERENCES [Teams] ([CompanyId], [Id]),
        CONSTRAINT [FK_Memberships_Users_ManagerUserId] FOREIGN KEY ([ManagerUserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_Memberships_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]),
        CONSTRAINT [FK_Memberships_WorkSchedules_WorkScheduleId] FOREIGN KEY ([WorkScheduleId]) REFERENCES [WorkSchedules] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE TABLE [MembershipBalanceSnapshots] (
        [MembershipId] int NOT NULL,
        [CompanyId] int NOT NULL,
        [PeriodStart] date NOT NULL,
        [PeriodEnd] date NOT NULL,
        [AsOf] date NOT NULL,
        [PolicyVersion] nvarchar(200) NULL,
        [PolicyMinimum] decimal(12,4) NULL,
        [CustomAllocation] decimal(12,4) NULL,
        [Used] decimal(12,4) NOT NULL,
        [Pending] decimal(12,4) NOT NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_MembershipBalanceSnapshots] PRIMARY KEY ([MembershipId]),
        CONSTRAINT [CK_Balance_Period] CHECK ([PeriodEnd] >= [PeriodStart]),
        CONSTRAINT [CK_Balance_Quantity] CHECK ([Used] >= 0 AND [Pending] >= 0 AND ([PolicyMinimum] IS NULL OR [PolicyMinimum] >= 0) AND ([CustomAllocation] IS NULL OR [CustomAllocation] >= COALESCE([PolicyMinimum], 0))),
        CONSTRAINT [FK_MembershipBalanceSnapshots_Memberships_CompanyId_MembershipId] FOREIGN KEY ([CompanyId], [MembershipId]) REFERENCES [Memberships] ([CompanyId], [Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Departments_Guid] ON [Departments] ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE INDEX [IX_DevelopmentProvisioningAccess_CompanyId] ON [DevelopmentProvisioningAccess] ([CompanyId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_DevelopmentProvisioningAccess_UserId] ON [DevelopmentProvisioningAccess] ([UserId]) WHERE [Invited] = 1');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE UNIQUE INDEX [IX_JobRoles_Guid] ON [JobRoles] ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE UNIQUE INDEX [IX_MembershipBalanceSnapshots_CompanyId_MembershipId] ON [MembershipBalanceSnapshots] ([CompanyId], [MembershipId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE INDEX [IX_Memberships_CompanyId_DeletedAt_SystemRoleId] ON [Memberships] ([CompanyId], [DeletedAt], [SystemRoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE INDEX [IX_Memberships_CompanyId_DepartmentId] ON [Memberships] ([CompanyId], [DepartmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE INDEX [IX_Memberships_CompanyId_JobRoleId] ON [Memberships] ([CompanyId], [JobRoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE INDEX [IX_Memberships_CompanyId_ManagerUserId] ON [Memberships] ([CompanyId], [ManagerUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE INDEX [IX_Memberships_CompanyId_TeamId] ON [Memberships] ([CompanyId], [TeamId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Memberships_Guid] ON [Memberships] ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE INDEX [IX_Memberships_ManagerUserId] ON [Memberships] ([ManagerUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE INDEX [IX_Memberships_SystemRoleId] ON [Memberships] ([SystemRoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Memberships_UserId] ON [Memberships] ([UserId]) WHERE [DeletedAt] IS NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE INDEX [IX_Memberships_UserId_Id] ON [Memberships] ([UserId], [Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE INDEX [IX_Memberships_WorkScheduleId] ON [Memberships] ([WorkScheduleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Organizations_Guid] ON [Organizations] ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE UNIQUE INDEX [IX_SystemRoles_Guid] ON [SystemRoles] ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE INDEX [IX_Teams_CompanyId_DepartmentId] ON [Teams] ([CompanyId], [DepartmentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Teams_Guid] ON [Teams] ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Guid] ON [Users] ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Users_Username] ON [Users] ([Username]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    CREATE UNIQUE INDEX [IX_WorkSchedules_Guid] ON [WorkSchedules] ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    INSERT INTO [SystemRoles] ([Id], [Guid], [Name], [CreatedAt], [UpdatedAt])
    VALUES (1, '20000000-0000-4000-8000-000000000101', N'admin', SYSUTCDATETIME(), SYSUTCDATETIME()),
           (2, '20000000-0000-4000-8000-000000000102', N'employee', SYSUTCDATETIME(), SYSUTCDATETIME());
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101223127_InitialResources'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261101223127_InitialResources', N'9.0.21');
END;

COMMIT;
GO
