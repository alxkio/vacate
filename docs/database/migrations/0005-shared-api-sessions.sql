BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113214204_SharedApiSessions'
)
BEGIN
    CREATE TABLE [ApiSessions] (
        [TokenHash] char(64) COLLATE Latin1_General_100_BIN2 NOT NULL,
        [UserId] int NOT NULL,
        [CreatedAt] datetimeoffset NOT NULL,
        [ExpiresAt] datetimeoffset NOT NULL,
        CONSTRAINT [PK_ApiSessions] PRIMARY KEY ([TokenHash]),
        CONSTRAINT [CK_ApiSessions_Expiry] CHECK ([ExpiresAt] > [CreatedAt] AND DATEPART(TZOFFSET, [CreatedAt]) = 0 AND DATEPART(TZOFFSET, [ExpiresAt]) = 0),
        CONSTRAINT [CK_ApiSessions_Hash] CHECK (LEN([TokenHash]) = 64 AND [TokenHash] NOT LIKE '%[^0-9A-F]%' COLLATE Latin1_General_100_BIN2),
        CONSTRAINT [FK_ApiSessions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113214204_SharedApiSessions'
)
BEGIN
    CREATE INDEX [IX_ApiSessions_ExpiresAt] ON [ApiSessions] ([ExpiresAt]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113214204_SharedApiSessions'
)
BEGIN
    CREATE INDEX [IX_ApiSessions_UserId] ON [ApiSessions] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20261113214204_SharedApiSessions'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20261113214204_SharedApiSessions', N'9.0.21');
END;

COMMIT;
GO
