using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Vacate.Application.Identity;
using Vacate.Application.Leave;
using static Vacate.Api.Http.Endpoint;

namespace Vacate.Api.Functions;

public sealed class AdminLeaveFunctions(AdminLeaveService service, AuthenticationService authentication)
{
    [Function("GetAdminCalendar")]
    public Task<IActionResult> Calendar([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/admin/calendar")] HttpRequest request, string companyId) =>
        Execute(request, _ => Ok(service.Calendar(authentication.RequireActor(Token(request)), Id(companyId))));

    [Function("GetCompanyCalendar")]
    public Task<IActionResult> MemberCalendar([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/leave/company-calendar")] HttpRequest request, string companyId) =>
        Execute(request, _ => Ok(service.MemberCalendar(authentication.RequireActor(Token(request)), Id(companyId))));

    [Function("CreateCompanyHoliday")]
    public Task<IActionResult> Holiday([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/admin/holidays")] HttpRequest request, string companyId) =>
        Execute(request, body =>
        {
            Allow(body, "name", "month", "day");
            return Ok(service.AddHoliday(authentication.RequireActor(Token(request)), Id(companyId), Required<string>(body, "name"), Required<int>(body, "month"), Required<int>(body, "day")));
        });

    [Function("SetCompanyApprover")]
    public Task<IActionResult> Approver([HttpTrigger(AuthorizationLevel.Anonymous, "put", Route = "organizations/{companyId}/admin/approvers")] HttpRequest request, string companyId) =>
        Execute(request, body =>
        {
            Allow(body, "scope", "scopeGuid", "approverGuid");
            return Ok(service.SetApprover(authentication.RequireActor(Token(request)), Id(companyId), Required<string>(body, "scope"), Required<Guid>(body, "scopeGuid"), Field<Guid?>(body, "approverGuid").Or(null)));
        });

    [Function("PreviewCompanyClosure")]
    public Task<IActionResult> PreviewClosure([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/admin/closures/preview")] HttpRequest request, string companyId) =>
        Execute(request, body =>
        {
            Allow(body, "name", "startDate", "endDate", "deductAnnualLeave");
            return Ok(service.PreviewClosure(authentication.RequireActor(Token(request)), Id(companyId), Closure(body)));
        });

    [Function("PublishCompanyClosure")]
    public Task<IActionResult> PublishClosure([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/admin/closures")] HttpRequest request, string companyId) =>
        Execute(request, body =>
        {
            Allow(body, "name", "startDate", "endDate", "deductAnnualLeave", "idempotencyKey");
            return Ok(service.PublishClosure(authentication.RequireActor(Token(request)), Id(companyId), Closure(body), Required<Guid>(body, "idempotencyKey")));
        });

    [Function("ListAssignedApprovals")]
    public Task<IActionResult> Inbox([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/admin/approvals")] HttpRequest request, string companyId) =>
        Execute(request, _ => Ok(service.Inbox(authentication.RequireActor(Token(request)), Id(companyId))));

    [Function("DecideAssignedLeave")]
    public Task<IActionResult> Decide([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/admin/approvals/{requestId}/decision")] HttpRequest request, string companyId, string requestId) =>
        Execute(request, body =>
        {
            Allow(body, "decision");
            return Ok(service.Decide(authentication.RequireActor(Token(request)), Id(companyId), Id(requestId), Required<string>(body, "decision")));
        });

    [Function("GetPersonnelLeave")]
    public Task<IActionResult> Personnel([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/admin/personnel")] HttpRequest request, string companyId) =>
        Execute(request, _ =>
        {
            if (!int.TryParse(request.Query["year"], out var year))
            {
                throw new Vacate.Domain.Common.DomainValidationException("Choose a valid report year.");
            }

            return Ok(service.Personnel(authentication.RequireActor(Token(request)), Id(companyId), year));
        });

    private static ClosureDraft Closure(JsonObject body) => new(Required<string>(body, "name"), Required<DateOnly>(body, "startDate"),
        Required<DateOnly>(body, "endDate"), Required<bool>(body, "deductAnnualLeave"));
}
