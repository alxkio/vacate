BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE SEQUENCE [CompanyApproverIds] AS int START WITH 1 INCREMENT BY 1 NO CYCLE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE SEQUENCE [CompanyClosureIds] AS int START WITH 1 INCREMENT BY 1 NO CYCLE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE SEQUENCE [CompanyHolidayIds] AS int START WITH 1 INCREMENT BY 1 NO CYCLE;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    ALTER TABLE [LeaveRequests] ADD [ApproverGuid] uniqueidentifier NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    ALTER TABLE [LeaveRequests] ADD [ClosureGuid] uniqueidentifier NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    ALTER TABLE [LeaveRequests] ADD [DecidedAt] datetimeoffset NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    ALTER TABLE [LeaveRequests] ADD [Source] nvarchar(200) NOT NULL DEFAULT N'EmployeeRequest';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    ALTER TABLE [Users] ADD CONSTRAINT [AK_Users_Guid] UNIQUE ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE TABLE [CompanyApproverAssignments] (
        [Id] int NOT NULL,
        [CompanyId] int NOT NULL,
        [Scope] nvarchar(24) NOT NULL,
        [ScopeGuid] uniqueidentifier NOT NULL,
        [ApproverGuid] uniqueidentifier NOT NULL,
        [Guid] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        [DeleteRequestedAt] datetimeoffset NULL,
        [DeletedAt] datetimeoffset NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_CompanyApproverAssignments] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_CompanyApproverAssignments_Identity] CHECK ([Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_CompanyApproverAssignments_Lifecycle] CHECK ([UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))),
        CONSTRAINT [CK_CompanyApproverAssignments_Scope] CHECK ([Scope] IN (N'organization', N'department', N'team') AND [ScopeGuid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_CompanyApproverAssignments_Utc] CHECK (DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)),
        CONSTRAINT [FK_CompanyApproverAssignments_Organizations_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Organizations] ([Id]),
        CONSTRAINT [FK_CompanyApproverAssignments_Users_ApproverGuid] FOREIGN KEY ([ApproverGuid]) REFERENCES [Users] ([Guid])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE TABLE [CompanyClosures] (
        [Id] int NOT NULL,
        [CompanyId] int NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [StartDate] date NOT NULL,
        [EndDate] date NOT NULL,
        [DeductAnnualLeave] bit NOT NULL,
        [IdempotencyKey] uniqueidentifier NOT NULL,
        [Guid] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        [DeleteRequestedAt] datetimeoffset NULL,
        [DeletedAt] datetimeoffset NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_CompanyClosures] PRIMARY KEY ([Id]),
        CONSTRAINT [AK_CompanyClosures_CompanyId_Id] UNIQUE ([CompanyId], [Id]),
        CONSTRAINT [CK_CompanyClosures_Date] CHECK (LEN([Name]) > 0 AND [EndDate] >= [StartDate] AND DATEDIFF(day, [StartDate], [EndDate]) <= 366),
        CONSTRAINT [CK_CompanyClosures_Identity] CHECK ([Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_CompanyClosures_Lifecycle] CHECK ([UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))),
        CONSTRAINT [CK_CompanyClosures_Utc] CHECK (DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)),
        CONSTRAINT [FK_CompanyClosures_Organizations_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Organizations] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE TABLE [CompanyHolidays] (
        [Id] int NOT NULL,
        [CompanyId] int NOT NULL,
        [Name] nvarchar(200) NOT NULL,
        [Month] int NOT NULL,
        [Day] int NOT NULL,
        [Guid] uniqueidentifier NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        [DeleteRequestedAt] datetimeoffset NULL,
        [DeletedAt] datetimeoffset NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_CompanyHolidays] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_CompanyHolidays_Date] CHECK (LEN([Name]) > 0 AND [Month] BETWEEN 1 AND 12 AND [Day] BETWEEN 1 AND CASE WHEN [Month] = 2 THEN 29 WHEN [Month] IN (4,6,9,11) THEN 30 ELSE 31 END),
        CONSTRAINT [CK_CompanyHolidays_Identity] CHECK ([Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_CompanyHolidays_Lifecycle] CHECK ([UpdatedAt] >= [CreatedAt] AND ([DeleteRequestedAt] IS NULL OR [DeleteRequestedAt] BETWEEN [CreatedAt] AND [UpdatedAt]) AND ([DeletedAt] IS NULL OR ([DeleteRequestedAt] IS NOT NULL AND [DeletedAt] BETWEEN [DeleteRequestedAt] AND [UpdatedAt]))),
        CONSTRAINT [CK_CompanyHolidays_Utc] CHECK (DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0 AND ([DeleteRequestedAt] IS NULL OR DATEPART(TZOFFSET, [DeleteRequestedAt]) = 0) AND ([DeletedAt] IS NULL OR DATEPART(TZOFFSET, [DeletedAt]) = 0)),
        CONSTRAINT [FK_CompanyHolidays_Organizations_CompanyId] FOREIGN KEY ([CompanyId]) REFERENCES [Organizations] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE TABLE [CompanyClosureResults] (
        [CompanyId] int NOT NULL,
        [ClosureId] int NOT NULL,
        [UserGuid] uniqueidentifier NOT NULL,
        [DisplayName] nvarchar(401) NOT NULL,
        [Outcome] nvarchar(24) NOT NULL,
        [Days] int NOT NULL,
        [Reason] nvarchar(500) NULL,
        CONSTRAINT [PK_CompanyClosureResults] PRIMARY KEY ([CompanyId], [ClosureId], [UserGuid]),
        CONSTRAINT [CK_CompanyClosureResults_Outcome] CHECK ([Days] >= 0 AND [Outcome] IN (N'recorded', N'skipped', N'already-covered')),
        CONSTRAINT [FK_CompanyClosureResults_CompanyClosures_CompanyId_ClosureId] FOREIGN KEY ([CompanyId], [ClosureId]) REFERENCES [CompanyClosures] ([CompanyId], [Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE INDEX [IX_LeaveRequests_CompanyId_ApproverGuid] ON [LeaveRequests] ([CompanyId], [ApproverGuid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    EXEC(N'ALTER TABLE [LeaveRequests] ADD CONSTRAINT [CK_LeaveRequests_DecisionUtc] CHECK ([DecidedAt] IS NULL OR ([DecidedAt] >= [CreatedAt] AND DATEPART(TZOFFSET, [DecidedAt]) = 0))');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE INDEX [IX_CompanyApproverAssignments_ApproverGuid] ON [CompanyApproverAssignments] ([ApproverGuid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_CompanyApproverAssignments_CompanyId_Scope_ScopeGuid] ON [CompanyApproverAssignments] ([CompanyId], [Scope], [ScopeGuid]) WHERE [DeletedAt] IS NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CompanyApproverAssignments_Guid] ON [CompanyApproverAssignments] ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CompanyClosures_CompanyId_IdempotencyKey] ON [CompanyClosures] ([CompanyId], [IdempotencyKey]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CompanyClosures_Guid] ON [CompanyClosures] ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_CompanyHolidays_CompanyId_Month_Day] ON [CompanyHolidays] ([CompanyId], [Month], [Day]) WHERE [DeletedAt] IS NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    CREATE UNIQUE INDEX [IX_CompanyHolidays_Guid] ON [CompanyHolidays] ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261112210758_CompanyAdministration'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261112210758_CompanyAdministration', N'9.0.21');
END;

COMMIT;
GO
