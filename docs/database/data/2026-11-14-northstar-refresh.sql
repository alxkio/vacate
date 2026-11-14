-- VAC-42 one-time TEST DATABASE data correction. Not an EF migration, app seed or deploy hook.
-- PREVIEW is the default. Review output, then set @Apply=1 to commit the same guarded transaction.
-- Only the named pre-existing IsDemo tenant and its 12 known members may be changed.
-- Daria is the owner/root (no manager); all other employees have a manager.
-- PriorServiceYears means experience BEFORE this employer. Historical quotas are explicitly fictional.
-- Uses saved holiday exclusions, not a claim of complete/reviewed Greek statutory calendar coverage.
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET DATEFIRST 1;
DECLARE @Apply bit=0, @Company int, @Now datetimeoffset=SYSUTCDATETIME();
DECLARE @Today date=CONVERT(date,@Now AT TIME ZONE 'GTB Standard Time');
IF DB_NAME() <> N'vacate-dev-db' THROW 51000,'Wrong database; no data changed.',1;
BEGIN TRANSACTION;
BEGIN TRY
 DECLARE @Lock int;
 EXEC @Lock=sys.sp_getapplock @Resource=N'vacate:resource-use-cases',@LockMode=N'Exclusive',@LockOwner=N'Transaction',@LockTimeout=15000;
 IF @Lock<0 THROW 51000,'Resource lock unavailable.',1;
 SELECT @Company=Id FROM dbo.Organizations WHERE Guid='20000000-0000-4000-8000-000000000100' AND IsDemo=1 AND DeletedAt IS NULL AND Name=N'Northstar Example' AND CountryCode='GR' AND TimeZone='Europe/Athens' AND WorkWeekDays=5;
 IF @Company IS NULL THROW 51000,'Expected marked test tenant not found; no changes applied.',1;
 DECLARE @Profiles table(UserGuid uniqueidentifier PRIMARY KEY,MemberGuid uniqueidentifier,Username nvarchar(200),HireDate date,ManagerGuid uniqueidentifier NULL,PriorYears decimal(18,8),Remaining int,SummerSlot int,OldRequestGuid uniqueidentifier,OriginalUsed int);
 INSERT @Profiles VALUES
('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000600','leah@example.invalid','2017-09-04','20000000-0000-4000-8000-000000000010',6,7,0,'422f8e38-d610-09ba-de58-9c66d206e6a2',3),
('20000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000601','ravi@example.invalid','2019-02-11','20000000-0000-4000-8000-000000000001',4,8,2,'2e0e8d3f-6181-b49e-a0d6-3cb63779dbf9',4),
('20000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000602','noah@example.invalid','2023-06-05','20000000-0000-4000-8000-000000000001',1,6,5,'1bd08d89-8652-d65a-5740-bd1bd076646f',5),
('20000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000603','maya@example.invalid','2020-03-02','20000000-0000-4000-8000-000000000001',3,5,0,'b749a547-0133-3dd3-aed5-3bd6e6602d2c',8),
('20000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000604','theo@example.invalid','2018-10-01','20000000-0000-4000-8000-000000000001',5,7,2,'7e732bf3-c7d5-d527-6aad-c77d55a17465',7),
('20000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000605','iris@example.invalid','2024-01-15','20000000-0000-4000-8000-000000000001',2,9,5,'089c5a65-5c0a-b376-6b34-0aa3519f5724',3),
('20000000-0000-4000-8000-000000000007','20000000-0000-4000-8000-000000000606','ella@example.invalid','2016-05-09','20000000-0000-4000-8000-000000000010',7,8,0,'84b0c8f4-f293-d82e-3483-ae566948bfa5',4),
('20000000-0000-4000-8000-000000000008','20000000-0000-4000-8000-000000000607','owen@example.invalid','2022-04-04','20000000-0000-4000-8000-000000000007',2,5,2,'01c5e30c-48fe-a34e-e7f5-49678b1d9b3e',5),
('20000000-0000-4000-8000-000000000009','20000000-0000-4000-8000-000000000608','zoe@example.invalid','2021-11-08','20000000-0000-4000-8000-000000000007',4,6,5,'a44a5fad-5604-9aa0-284d-ae024db052be',6),
('20000000-0000-4000-8000-000000000010','20000000-0000-4000-8000-000000000609','daria@example.invalid','2014-03-03',NULL,8,7,0,'c9097e74-75fd-6c77-66a9-edbcbba85dc4',7),
('20000000-0000-4000-8000-000000000011','20000000-0000-4000-8000-000000000610','nora@example.invalid','2017-02-06','20000000-0000-4000-8000-000000000010',6,6,2,'06f91317-d478-c30b-f021-37d6e9fc5e9b',1),
('20000000-0000-4000-8000-000000000012','20000000-0000-4000-8000-000000000611','sam@example.invalid','2024-09-02','20000000-0000-4000-8000-000000000011',0,9,5,'8beaa36f-6381-087f-51be-bfbb99245e0b',4);
 DECLARE @Members table(Id int PRIMARY KEY,UserId int,Username nvarchar(200),HireDate date,ManagerUserId int NULL,PriorYears decimal(18,8),Remaining int,SummerSlot int,OldRequestGuid uniqueidentifier,OriginalUsed int);
 INSERT @Members SELECT m.Id,u.Id,p.Username,p.HireDate,manager.Id,p.PriorYears,p.Remaining,p.SummerSlot,p.OldRequestGuid,p.OriginalUsed
 FROM @Profiles p JOIN dbo.Users u ON u.Guid=p.UserGuid AND u.Username=p.Username AND u.DeletedAt IS NULL AND u.Status=N'active'
 JOIN dbo.Memberships m ON m.Guid=p.MemberGuid AND m.UserId=u.Id AND m.CompanyId=@Company AND m.DeletedAt IS NULL AND m.EmploymentEndDate IS NULL
 LEFT JOIN dbo.Users manager ON manager.Guid=p.ManagerGuid AND manager.DeletedAt IS NULL;
 IF (SELECT COUNT(*) FROM @Members)<>12 OR (SELECT COUNT(*) FROM dbo.Memberships WHERE CompanyId=@Company AND DeletedAt IS NULL)<>12
 THROW 51000,'Fixture membership changed; preserve current data for review.',1;
 IF EXISTS(SELECT 1 FROM @Profiles p JOIN @Members m ON m.Username=p.Username WHERE p.ManagerGuid IS NOT NULL AND m.ManagerUserId IS NULL)
 THROW 51000,'Expected reporting manager unavailable.',1;
 IF EXISTS(SELECT 1 FROM @Members p JOIN dbo.Memberships m ON m.Id=p.Id WHERE
 (m.HireDate IS NOT NULL AND m.HireDate<>p.HireDate) OR (m.ManagerUserId IS NOT NULL AND (p.ManagerUserId IS NULL OR m.ManagerUserId<>p.ManagerUserId)) OR (m.PriorServiceYears IS NOT NULL AND m.PriorServiceYears<>p.PriorYears))
 THROW 51000,'Employment metadata was edited; existing values preserved.',1;
 IF EXISTS(SELECT 1 FROM @Members m JOIN dbo.MembershipEntitlements e ON e.MembershipId=m.Id WHERE e.PeriodStart<>'2026-01-01' OR e.PeriodEnd<>'2026-12-31' OR COALESCE(e.CustomAllocation,e.PolicyMinimum) IS NULL)
 THROW 51000,'Expected finite 2026 allowance unavailable.',1;
 -- Explicitly persist the already-public test logins; a company marker alone never enables them.
 IF OBJECT_ID(N'dbo.DevelopmentLogins',N'U') IS NULL THROW 51000,'Apply DatabaseDevelopmentLogins schema first, before this data update or app publication.',1;
 DECLARE @Logins table(Alias nvarchar(200),UserId int,Advertise bit);
 INSERT @Logins SELECT LEFT(Username,CHARINDEX('@',Username)-1),UserId,1 FROM @Members;
 INSERT @Logins SELECT N'user',UserId,0 FROM @Members WHERE Username=N'maya@example.invalid';
 INSERT @Logins SELECT N'admin',UserId,0 FROM @Members WHERE Username=N'nora@example.invalid';
 IF EXISTS(SELECT 1 FROM @Logins p JOIN dbo.DevelopmentLogins l ON l.Alias=p.Alias WHERE l.UserId<>p.UserId)
 THROW 51000,'A development alias belongs to another account; existing login preserved.',1;
 INSERT dbo.DevelopmentLogins(Alias,UserId,Enabled,Advertise,CreatedAt,UpdatedAt)
 SELECT p.Alias,p.UserId,1,p.Advertise,@Now,@Now FROM @Logins p WHERE NOT EXISTS(SELECT 1 FROM dbo.DevelopmentLogins l WHERE l.Alias=p.Alias);
 -- Recognize only the previous imported two-day example and its untouched dates.
 IF EXISTS(SELECT 1 FROM dbo.LeaveRequests r JOIN @Members m ON m.Id=r.MembershipId AND m.OldRequestGuid=r.Guid WHERE r.CompanyId=@Company AND
 (r.Fingerprint<>N'fictional-history-v1' OR r.LeaveTypeId<>N'annual' OR r.Source<>N'EmployeeRequest'
 OR (SELECT COUNT(*) FROM dbo.Leaves l WHERE l.CompanyId=@Company AND l.RequestId=r.Id)<>CASE WHEN m.OriginalUsed<2 THEN m.OriginalUsed ELSE 2 END
 OR EXISTS(SELECT 1 FROM dbo.Leaves l WHERE l.CompanyId=@Company AND l.RequestId=r.Id AND (l.Status<>N'Used' OR l.QuantityDays<>1 OR l.EntitlementYear<>2026 OR l.StartDate NOT IN ('2026-08-03','2026-08-04') OR l.StartDate<>l.EndDate))))
 THROW 51000,'Previous synthetic requests were changed; preserve them for review.',1;
 IF EXISTS(SELECT 1 FROM dbo.Leaves l JOIN @Members m ON m.Id=l.MembershipId WHERE l.CompanyId=@Company AND l.EntryKind=N'ImportedOpening' AND l.Status=N'Used'
 AND (l.Source<>N'fictional-fixture-opening-v1' OR l.LeaveTypeId<>N'annual' OR l.QuantityDays>m.OriginalUsed OR (l.EntitlementYear IS NOT NULL AND l.EntitlementYear<>2026)))
 THROW 51000,'Unrecognized opening consumption; no data correction.',1;
 DECLARE @RemoveRequests table(Id int PRIMARY KEY);
 INSERT @RemoveRequests SELECT r.Id FROM dbo.LeaveRequests r JOIN @Members m ON m.Id=r.MembershipId AND m.OldRequestGuid=r.Guid WHERE r.CompanyId=@Company;
 DELETE l FROM dbo.Leaves l JOIN @Members m ON m.Id=l.MembershipId WHERE l.CompanyId=@Company AND ((l.EntryKind=N'ImportedOpening' AND l.Status=N'Used' AND l.Source=N'fictional-fixture-opening-v1') OR l.RequestId IN(SELECT Id FROM @RemoveRequests));
 DELETE r FROM dbo.LeaveRequests r WHERE r.CompanyId=@Company AND r.Id IN(SELECT Id FROM @RemoveRequests);
 UPDATE m SET HireDate=p.HireDate,ManagerUserId=p.ManagerUserId,PriorServiceYears=p.PriorYears,UpdatedAt=@Now
 FROM dbo.Memberships m JOIN @Members p ON p.Id=m.Id WHERE m.HireDate IS NULL OR m.PriorServiceYears IS NULL OR (m.ManagerUserId IS NULL AND p.ManagerUserId IS NOT NULL);
 DECLARE @Member int,@User int,@Remaining int,@Slot int,@Year int,@Quota decimal(12,4),@Used decimal(12,4),@Pending decimal(12,4),@Need decimal(12,4),@RequireApproval bit,@Fingerprint nvarchar(64),@Summer date,@Break int,@Request int,@Guid uniqueidentifier;
 DECLARE @Candidates table(Date date PRIMARY KEY,BreakId int,Priority int);
 DECLARE @Selected table(Date date PRIMARY KEY,BreakId int);
 DECLARE @Audit table(Username nvarchar(200),Year int,AddedDays int,SummerDays int);
 DECLARE members CURSOR LOCAL FAST_FORWARD FOR SELECT Id,UserId,Remaining,SummerSlot FROM @Members ORDER BY Id;
 OPEN members;
 FETCH NEXT FROM members INTO @Member,@User,@Remaining,@Slot;
 WHILE @@FETCH_STATUS=0
 BEGIN
  SELECT @Quota=COALESCE(e.CustomAllocation,e.PolicyMinimum),@RequireApproval=COALESCE(t.RequireVacationApproval,d.RequireVacationApproval,o.RequireVacationApproval)
  FROM dbo.Memberships m JOIN dbo.MembershipEntitlements e ON e.MembershipId=m.Id JOIN dbo.Organizations o ON o.Id=m.CompanyId
  LEFT JOIN dbo.Teams t ON t.Id=m.TeamId AND t.CompanyId=@Company LEFT JOIN dbo.Departments d ON d.Id=m.DepartmentId AND d.CompanyId=@Company WHERE m.Id=@Member;
  SET @Year=2025;
  WHILE @Year<=2026
  BEGIN
   SET @Fingerprint=CONCAT(N'vac42-natural-company-v1:',@Year);
   IF NOT EXISTS(SELECT 1 FROM dbo.LeaveRequests WHERE CompanyId=@Company AND MembershipId=@Member AND Fingerprint=@Fingerprint)
   BEGIN
    IF @Year=2025 AND NOT EXISTS(SELECT 1 FROM dbo.LeaveEntitlementPeriods WHERE CompanyId=@Company AND MembershipId=@Member AND LeaveTypeId=N'annual' AND Year=2025)
    INSERT dbo.LeaveEntitlementPeriods(CompanyId,MembershipId,LeaveTypeId,Year,Allocation) VALUES(@Company,@Member,N'annual',2025,@Quota);
    DECLARE @YearQuota decimal(12,4)=@Quota;
    IF @Year=2025 SELECT @YearQuota=Allocation FROM dbo.LeaveEntitlementPeriods WHERE CompanyId=@Company AND MembershipId=@Member AND LeaveTypeId=N'annual' AND Year=2025;
    SELECT @Used=COALESCE(SUM(CASE WHEN Status=N'Used' THEN QuantityDays ELSE 0 END),0),
      @Pending=COALESCE(SUM(CASE WHEN Status=N'Pending' AND (StartDate IS NULL OR StartDate>=@Today) THEN QuantityDays ELSE 0 END),0)
    FROM dbo.Leaves WHERE CompanyId=@Company AND MembershipId=@Member AND LeaveTypeId=N'annual' AND COALESCE(EntitlementYear,2026)=@Year;
    SET @Need=@YearQuota-@Remaining-@Used-CASE WHEN @RequireApproval=1 THEN 0 ELSE @Pending END;
    IF @Need<10 OR @Need>30 OR @Need<>FLOOR(@Need) THROW 51000,'Existing consumption prevents this summer scenario; all changes rolled back.',1;
    DELETE FROM @Candidates;
 DELETE FROM @Selected;
    SET @Summer=DATEADD(day,@Slot*7,DATEFROMPARTS(@Year,7,CASE WHEN @Year=2025 THEN 14 ELSE 13 END));
    INSERT @Candidates SELECT DATEADD(day,v.n,@Summer),0,v.n FROM (VALUES(0),(1),(2),(3),(4),(5),(6),(7),(8),(9),(10),(11),(12),(13)) v(n);
    -- Current-year additions stay after March, so historical carryover allocation is not rewritten.
    INSERT @Candidates SELECT DATEADD(day,v.n,DATEFROMPARTS(@Year,CASE WHEN @Year=2026 AND b.month=2 THEN 4 ELSE b.month END,CASE WHEN @Year=2026 AND b.month=2 THEN 20 ELSE b.day END)),CASE WHEN @Year=2026 AND b.month=2 THEN 4 ELSE b.month END,100+v.n*4+b.ordinal
    FROM (VALUES(0),(1),(2),(3),(4)) v(n) CROSS JOIN (VALUES(2,10,0),(5,12,1),(6,10,2),(10,13,3)) b(month,day,ordinal);
    DELETE c FROM @Candidates c WHERE DATEPART(weekday,c.Date)>5 OR c.Date>=@Today
     OR EXISTS(SELECT 1 FROM dbo.PublicHolidays h WHERE h.CountryCode=N'GR' AND h.Date=c.Date)
     OR EXISTS(SELECT 1 FROM dbo.CompanyHolidays h WHERE h.CompanyId=@Company AND h.DeletedAt IS NULL AND h.Month=MONTH(c.Date) AND h.Day=DAY(c.Date))
     OR EXISTS(SELECT 1 FROM dbo.Leaves l WHERE l.CompanyId=@Company AND l.MembershipId=@Member AND l.Status IN(N'Used',N'Pending') AND c.Date BETWEEN l.StartDate AND l.EndDate);
    INSERT @Selected SELECT TOP(CONVERT(int,@Need)) Date,BreakId FROM @Candidates ORDER BY Priority;
    IF (SELECT COUNT(*) FROM @Selected)<>@Need OR (SELECT COUNT(*) FROM @Selected WHERE BreakId=0)<>10
    THROW 51000,'Stored holidays or leave conflict with the ten-day summer block; review without overwriting existing entries.',1;
    DECLARE breaks CURSOR LOCAL FAST_FORWARD FOR SELECT DISTINCT BreakId FROM @Selected ORDER BY BreakId;
    OPEN breaks;
 FETCH NEXT FROM breaks INTO @Break;
    WHILE @@FETCH_STATUS=0
    BEGIN
     SET @Guid=NEWID();
     INSERT dbo.LeaveRequests(Guid,CompanyId,MembershipId,IdempotencyKey,Fingerprint,LeaveTypeId,CreatedAt,UpdatedAt,DecidedAt,Source)
     VALUES(@Guid,@Company,@Member,@Guid,@Fingerprint,N'annual',@Now,@Now,@Now,N'EmployeeRequest');
     SET @Request=CONVERT(int,SCOPE_IDENTITY());
     INSERT dbo.Leaves(Guid,CompanyId,MembershipId,EntryKind,Status,QuantityDays,StartDate,EndDate,Source,LeaveTypeId,EntitlementYear,RequestId,CreatedAt,UpdatedAt)
     SELECT NEWID(),@Company,@Member,N'RecordedLeave',N'Used',1,Date,Date,N'EmployeeRequest',N'annual',@Year,@Request,@Now,@Now FROM @Selected WHERE BreakId=@Break;
     FETCH NEXT FROM breaks INTO @Break;
    END
    CLOSE breaks;
 DEALLOCATE breaks;
    INSERT @Audit SELECT Username,@Year,CONVERT(int,@Need),10 FROM @Members WHERE Id=@Member;
   END
   ELSE INSERT @Audit SELECT Username,@Year,0,0 FROM @Members WHERE Id=@Member;
   SET @Year=@Year+1;
  END
  FETCH NEXT FROM members INTO @Member,@User,@Remaining,@Slot;
 END
 CLOSE members;
 DEALLOCATE members;
 SELECT N'IsDemo' AS Marker,IsDemo FROM dbo.Organizations WHERE Id=@Company;
 SELECT p.Username,m.HireDate,manager.Username AS Manager,m.PriorServiceYears FROM @Members p JOIN dbo.Memberships m ON m.Id=p.Id LEFT JOIN dbo.Users manager ON manager.Id=m.ManagerUserId ORDER BY p.Username;
 SELECT * FROM @Audit ORDER BY Username,Year;
 SELECT p.Username,COALESCE(e.CustomAllocation,e.PolicyMinimum) AS Allocation,
  SUM(CASE WHEN l.Status=N'Used' THEN l.QuantityDays ELSE 0 END) AS Used,
  SUM(CASE WHEN l.Status=N'Pending' AND (l.StartDate IS NULL OR l.StartDate>=@Today) THEN l.QuantityDays ELSE 0 END) AS Pending
 FROM @Members p JOIN dbo.MembershipEntitlements e ON e.MembershipId=p.Id LEFT JOIN dbo.Leaves l ON l.CompanyId=@Company AND l.MembershipId=p.Id AND l.LeaveTypeId=N'annual' AND COALESCE(l.EntitlementYear,2026)=2026
 GROUP BY p.Username,e.CustomAllocation,e.PolicyMinimum ORDER BY p.Username;
 IF @Apply=1 BEGIN COMMIT TRANSACTION;
 PRINT 'Applied atomically to the marked test tenant.';
 END
 ELSE BEGIN ROLLBACK TRANSACTION;
 PRINT 'PREVIEW ONLY: no data changes committed.';
 END
END TRY
BEGIN CATCH
 IF @@TRANCOUNT>0 ROLLBACK TRANSACTION;
 THROW;
END CATCH;
