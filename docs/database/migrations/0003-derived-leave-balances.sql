BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102193840_DerivedLeaveBalances'
)
BEGIN
    DECLARE @lockResult int;
    EXEC @lockResult = sys.sp_getapplock @Resource=N'vacate:resource-use-cases', @LockMode=N'Exclusive', @LockOwner=N'Transaction', @LockTimeout=15000;
    IF @lockResult < 0 THROW 51000, 'Resource lock unavailable.', 1;
    IF EXISTS (
        SELECT 1 FROM dbo.MembershipBalanceSnapshots b
        JOIN dbo.Memberships m ON m.Id=b.MembershipId AND m.CompanyId=b.CompanyId
        JOIN dbo.Users u ON u.Id=m.UserId
        JOIN dbo.Organizations o ON o.Id=m.CompanyId
        WHERE (b.Used > 0 OR b.Pending > 0) AND NOT EXISTS (
            SELECT 1 FROM (VALUES
        ('20000000-0000-4000-8000-000000000600', '20000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000100', 3, 0, '2026-01-01', '2026-12-31'),
        ('20000000-0000-4000-8000-000000000601', '20000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000100', 4, 0, '2026-01-01', '2026-12-31'),
        ('20000000-0000-4000-8000-000000000602', '20000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000100', 5, 0, '2026-01-01', '2026-12-31'),
        ('20000000-0000-4000-8000-000000000603', '20000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000100', 8, 3, '2026-01-01', '2026-12-31'),
        ('20000000-0000-4000-8000-000000000604', '20000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000100', 7, 0, '2026-01-01', '2026-12-31'),
        ('20000000-0000-4000-8000-000000000605', '20000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000100', 3, 0, '2026-01-01', '2026-12-31'),
        ('20000000-0000-4000-8000-000000000606', '20000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000100', 4, 0, '2026-01-01', '2026-12-31'),
        ('20000000-0000-4000-8000-000000000607', '20000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000100', 5, 0, '2026-01-01', '2026-12-31'),
        ('20000000-0000-4000-8000-000000000608', '20000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000100', 6, 0, '2026-01-01', '2026-12-31'),
        ('20000000-0000-4000-8000-000000000609', '20000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000100', 7, 0, '2026-01-01', '2026-12-31'),
        ('20000000-0000-4000-8000-000000000610', '20000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000100', 1, 2, '2026-01-01', '2026-12-31'),
        ('20000000-0000-4000-8000-000000000611', '20000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000100', 4, 0, '2026-01-01', '2026-12-31')
            ) f(MemberGuid, UserGuid, CompanyGuid, Used, Pending, PeriodStart, PeriodEnd)
            WHERE m.Guid=CONVERT(uniqueidentifier,f.MemberGuid) AND u.Guid=CONVERT(uniqueidentifier,f.UserGuid)
            AND o.Guid=CONVERT(uniqueidentifier,f.CompanyGuid) AND o.IsDemo=1
            AND b.Used=f.Used AND b.Pending=f.Pending
            AND b.PeriodStart=CONVERT(date,f.PeriodStart) AND b.PeriodEnd=CONVERT(date,f.PeriodEnd)))
        THROW 51000, 'Unrecognized nonzero consumption: reviewed provenance/import required; snapshots preserved.', 1;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102193840_DerivedLeaveBalances'
)
BEGIN
    CREATE TABLE [MembershipEntitlements] (
        [MembershipId] int NOT NULL,
        [CompanyId] int NOT NULL,
        [PeriodStart] date NOT NULL,
        [PeriodEnd] date NOT NULL,
        [AsOf] date NOT NULL,
        [PolicyVersion] nvarchar(200) NULL,
        [PolicyMinimum] decimal(12,4) NULL,
        [CustomAllocation] decimal(12,4) NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_MembershipEntitlements] PRIMARY KEY ([MembershipId]),
        CONSTRAINT [AK_MembershipEntitlements_CompanyId_MembershipId] UNIQUE ([CompanyId], [MembershipId]),
        CONSTRAINT [CK_Entitlement_Allocation] CHECK (([PolicyMinimum] IS NULL OR [PolicyMinimum] >= 0) AND ([CustomAllocation] IS NULL OR [CustomAllocation] >= COALESCE([PolicyMinimum], 0))),
        CONSTRAINT [CK_Entitlement_Period] CHECK ([PeriodEnd] >= [PeriodStart]),
        CONSTRAINT [FK_MembershipEntitlements_Memberships_CompanyId_MembershipId] FOREIGN KEY ([CompanyId], [MembershipId]) REFERENCES [Memberships] ([CompanyId], [Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102193840_DerivedLeaveBalances'
)
BEGIN
    CREATE TABLE [Leaves] (
        [Id] int NOT NULL IDENTITY,
        [Guid] uniqueidentifier NOT NULL,
        [CompanyId] int NOT NULL,
        [MembershipId] int NOT NULL,
        [EntryKind] nvarchar(24) COLLATE Latin1_General_100_BIN2 NOT NULL,
        [Status] nvarchar(16) COLLATE Latin1_General_100_BIN2 NOT NULL,
        [QuantityDays] decimal(12,4) NOT NULL,
        [StartDate] date NULL,
        [EndDate] date NULL,
        [Source] nvarchar(200) NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [UpdatedAt] datetimeoffset NOT NULL,
        [RowVersion] rowversion NOT NULL,
        CONSTRAINT [PK_Leaves] PRIMARY KEY ([Id]),
        CONSTRAINT [CK_Leaves_Identity] CHECK ([Id] > 0 AND [Guid] <> '00000000-0000-0000-0000-000000000000'),
        CONSTRAINT [CK_Leaves_Origin] CHECK (LEN([Source]) > 0 AND (([EntryKind] = N'ImportedOpening' AND [Status] IN (N'Used', N'Pending') AND [StartDate] IS NULL AND [EndDate] IS NULL) OR ([EntryKind] = N'RecordedLeave' AND [Status] IN (N'Used', N'Pending', N'Cancelled') AND [StartDate] IS NOT NULL AND [EndDate] IS NOT NULL AND [EndDate] >= [StartDate]))),
        CONSTRAINT [CK_Leaves_Quantity] CHECK ([QuantityDays] > 0),
        CONSTRAINT [CK_Leaves_Utc] CHECK ([UpdatedAt] >= [CreatedAt] AND DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [UpdatedAt]) = 0),
        CONSTRAINT [FK_Leaves_MembershipEntitlements_CompanyId_MembershipId] FOREIGN KEY ([CompanyId], [MembershipId]) REFERENCES [MembershipEntitlements] ([CompanyId], [MembershipId]),
        CONSTRAINT [FK_Leaves_Memberships_CompanyId_MembershipId] FOREIGN KEY ([CompanyId], [MembershipId]) REFERENCES [Memberships] ([CompanyId], [Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102193840_DerivedLeaveBalances'
)
BEGIN
    CREATE UNIQUE INDEX [IX_Leaves_Guid] ON [Leaves] ([Guid]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102193840_DerivedLeaveBalances'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_Leaves_CompanyId_MembershipId_EntryKind_Status] ON [Leaves] ([CompanyId], [MembershipId], [EntryKind], [Status]) WHERE [EntryKind] = N''ImportedOpening''');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102193840_DerivedLeaveBalances'
)
BEGIN
    CREATE INDEX [IX_Leaves_CompanyId_MembershipId_Status] ON [Leaves] ([CompanyId], [MembershipId], [Status]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102193840_DerivedLeaveBalances'
)
BEGIN
    INSERT dbo.MembershipEntitlements (MembershipId,CompanyId,PeriodStart,PeriodEnd,AsOf,PolicyVersion,PolicyMinimum,CustomAllocation)
    SELECT MembershipId,CompanyId,PeriodStart,PeriodEnd,AsOf,PolicyVersion,PolicyMinimum,CustomAllocation
    FROM dbo.MembershipBalanceSnapshots;

    INSERT dbo.Leaves (Guid,CompanyId,MembershipId,EntryKind,Status,QuantityDays,StartDate,EndDate,Source,CreatedAt,UpdatedAt)
    SELECT NEWID(),b.CompanyId,b.MembershipId,N'ImportedOpening',v.Status,v.Quantity,NULL,NULL,
        N'fictional-fixture-opening-v1',m.CreatedAt,m.UpdatedAt
    FROM dbo.MembershipBalanceSnapshots b
    JOIN dbo.Memberships m ON m.CompanyId=b.CompanyId AND m.Id=b.MembershipId
    CROSS APPLY (VALUES (N'Used',b.Used),(N'Pending',b.Pending)) v(Status,Quantity)
    WHERE v.Quantity > 0;

    IF (SELECT COUNT_BIG(*) FROM dbo.MembershipEntitlements) <> (SELECT COUNT_BIG(*) FROM dbo.MembershipBalanceSnapshots)
        THROW 51000, 'Entitlement migration count mismatch; transaction rolled back.', 1;
    IF EXISTS (
        SELECT 1 FROM dbo.MembershipBalanceSnapshots b
        WHERE b.Used <> COALESCE((SELECT SUM(l.QuantityDays) FROM dbo.Leaves l WHERE l.CompanyId=b.CompanyId AND l.MembershipId=b.MembershipId AND l.Status=N'Used'),0)
        OR b.Pending <> COALESCE((SELECT SUM(l.QuantityDays) FROM dbo.Leaves l WHERE l.CompanyId=b.CompanyId AND l.MembershipId=b.MembershipId AND l.Status=N'Pending'),0))
        THROW 51000, 'Leave migration total mismatch; transaction rolled back.', 1;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102193840_DerivedLeaveBalances'
)
BEGIN
    DROP TABLE [MembershipBalanceSnapshots];
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261102193840_DerivedLeaveBalances'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261102193840_DerivedLeaveBalances', N'9.0.21');
END;

COMMIT;
GO
