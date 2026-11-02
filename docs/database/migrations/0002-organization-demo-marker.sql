BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101230540_OrganizationDemoMarker'
)
BEGIN
    ALTER TABLE [Organizations] ADD [IsDemo] bit NOT NULL DEFAULT CAST(0 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261101230540_OrganizationDemoMarker'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261101230540_OrganizationDemoMarker', N'9.0.21');
END;

COMMIT;
GO
