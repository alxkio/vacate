using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Vacate.Application.Identity;
using Vacate.Application.Leave;
using static Vacate.Api.Http.Endpoint;

namespace Vacate.Api.Functions;

public sealed class LeaveFunctions(LeaveService leaves, AuthenticationService authentication)
{
    [Function("PreviewLeaveRequest")]
    public Task<IActionResult> Preview([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/leave/preview")] HttpRequest request, string companyId) =>
        Execute(request, body =>
        {
            Allow(body, "leaveTypeId", "unit", "mode", "startDate", "endDate", "duration");
            return Ok(leaves.Preview(authentication.RequireActor(Token(request)), Id(companyId), Draft(body)));
        });

    [Function("SubmitLeaveRequest")]
    public Task<IActionResult> Submit([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/leave/requests")] HttpRequest request, string companyId) =>
        Execute(request, body =>
        {
            Allow(body, "leaveTypeId", "unit", "mode", "startDate", "endDate", "duration", "idempotencyKey", "previewFingerprint");
            return Ok(leaves.Submit(authentication.RequireActor(Token(request)), Id(companyId), Draft(body),
                Required<Guid>(body, "idempotencyKey"), Field<string?>(body, "previewFingerprint").Or(null)));
        });

    [Function("ListOwnLeaveRequests")]
    public Task<IActionResult> Requests([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/leave/requests")] HttpRequest request, string companyId) =>
        Execute(request, _ => Ok(leaves.Requests(authentication.RequireActor(Token(request)), Id(companyId))));

    [Function("GetOwnLeaveCalendar")]
    public Task<IActionResult> Calendar([HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "organizations/{companyId}/leave/calendar")] HttpRequest request, string companyId) =>
        Execute(request, _ => Ok(leaves.Calendar(authentication.RequireActor(Token(request)), Id(companyId))));

    [Function("CancelOwnLeaveDates")]
    public Task<IActionResult> Cancel([HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = "organizations/{companyId}/leave/requests/{requestId}/cancel")] HttpRequest request, string companyId, string requestId) =>
        Execute(request, body =>
        {
            Allow(body, "dates");
            return Ok(leaves.Cancel(authentication.RequireActor(Token(request)), Id(companyId), Id(requestId), Required<DateOnly[]>(body, "dates")));
        });

    [Function("DeletePersonalLeaveRequest")]
    public Task<IActionResult> Delete([HttpTrigger(AuthorizationLevel.Anonymous, "delete", Route = "organizations/{companyId}/leave/requests/{requestId}")] HttpRequest request, string companyId, string requestId) =>
        Execute(request, _ =>
        {
            leaves.Delete(authentication.RequireActor(Token(request)), Id(companyId), Id(requestId));
            return new NoContentResult();
        });

    private static LeaveDraft Draft(JsonObject body) => new(Required<string>(body, "leaveTypeId"), Required<string>(body, "unit"),
        Required<string>(body, "mode"), Required<DateOnly>(body, "startDate"), Field<DateOnly?>(body, "endDate").Or(null), Field<int?>(body, "duration").Or(null));
}
