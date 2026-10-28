using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Vacate.Application.Common;
using Vacate.Application.Memberships.Commands;
using Vacate.Application.Organizations.Commands;
using Vacate.Application.Users.Commands;
using Vacate.Domain.Common;

namespace Vacate.Api.Http;

public sealed class RequestException(int status, string message) : Exception(message)
{
    public int Status { get; } = status;
}

public static class Endpoint
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web);
    public static readonly string[] ProfileFields = ["firstName", "middleName", "lastName", "gender", "married", "dependentChildren", "soleCare"];

    public static async Task<IActionResult> Execute(HttpRequest request, Func<JsonObject, IActionResult> operation)
    {
        request.HttpContext.Response.Headers.CacheControl = "no-store";
        try
        {
            var body = new JsonObject();
            if (request.Method is "POST" or "PATCH")
            {
                if (request.ContentType?.Split(';')[0] != "application/json")
                {
                    throw new RequestException(415, "Use application/json.");
                }

                using var buffer = new MemoryStream();
                var bytes = new byte[4096];
                int count;
                while ((count = await request.Body.ReadAsync(bytes)) > 0)
                {
                    if (buffer.Length + count > 32768)
                    {
                        throw new RequestException(413, "Request is too large.");
                    }

                    await buffer.WriteAsync(bytes.AsMemory(0, count));
                }
                body = buffer.Length == 0 ? new JsonObject() : JsonNode.Parse(buffer.ToArray()) as JsonObject ?? throw new RequestException(400, "Expected a JSON object.");
            }
            return operation(body);
        }
        catch (RequestException error) { return Error(error.Status, error.Message); }
        catch (ServiceException error)
        {
            return Error(error.Kind switch
            {
                ServiceError.NotFound or ServiceError.Unavailable => 404,
                ServiceError.Forbidden => 403,
                ServiceError.Unauthenticated => 401,
                ServiceError.Conflict => 409,
                _ => 400
            }, error.Message);
        }
        catch (DomainValidationException error) { return Error(400, error.Message); }
        catch (DomainConflictException error) { return Error(409, error.Message); }
        catch (Exception error) when (error is JsonException or InvalidOperationException or FormatException or OverflowException or ArgumentException)
        {
            return Error(400, "Invalid JSON field type or value.");
        }
    }

    private static IActionResult Error(int status, string message) => new ObjectResult(new { error = message }) { StatusCode = status };

    public static IActionResult Ok(object value) => new OkObjectResult(JsonSerializer.SerializeToNode(value, value.GetType(), Json));

    public static IActionResult Created(string path, object value) => new CreatedResult($"/api/{path}", JsonSerializer.SerializeToNode(value, value.GetType(), Json));

    public static string Token(HttpRequest request)
    {
        var value = request.Headers.Authorization.ToString();
        return value.StartsWith("Bearer ", StringComparison.Ordinal) ? value[7..] : "";
    }

    public static Guid Id(string value) => Guid.TryParse(value, out var id) ? id : throw new RequestException(404, "Resource unavailable.");

    public static void Allow(JsonObject body, params string[] fields)
    {
        if (body.Any(x => !fields.Contains(x.Key)))
        {
            throw new RequestException(400, "Unsupported or server-owned field.");
        }
    }

    public static Change<T> Field<T>(JsonObject body, string key) => body.ContainsKey(key) ? new(true, body[key] is null ? default! : body[key]!.Deserialize<T>(Json)!) : default;

    public static T Required<T>(JsonObject body, string key) => Field<T>(body, key) is { IsSpecified: true, Value: { } value } ? value : throw new RequestException(400, $"Enter {key}.");

    public static UpdateUser ReadUserUpdate(Guid guid, JsonObject body)
    {
        Allow(body, ProfileFields);
        return new(guid, Field<string>(body, "firstName"), Field<string?>(body, "middleName"), Field<string>(body, "lastName"),
            Field<string>(body, "gender"), Field<bool?>(body, "married"), Field<int?>(body, "dependentChildren"), Field<bool?>(body, "soleCare"));
    }

    public static MembershipChanges ReadMembershipChanges(JsonObject body)
    {
        Allow(body, "systemRoleId", "jobRoleId", "departmentId", "teamId", "managerUserId", "hireDate", "employmentEndDate", "priorService", "workScheduleId", "holidayCalendarId", "leavePolicyId", "customAllocation");
        return new(Field<Guid>(body, "systemRoleId"), Field<Guid>(body, "jobRoleId"), Field<Guid?>(body, "departmentId"),
            Field<Guid?>(body, "teamId"), Field<Guid?>(body, "managerUserId"), Field<DateOnly?>(body, "hireDate"),
            Field<DateOnly?>(body, "employmentEndDate"), Field<decimal?>(body, "priorService"), Field<Guid?>(body, "workScheduleId"),
            Field<Guid?>(body, "holidayCalendarId"), Field<Guid?>(body, "leavePolicyId"), Field<decimal?>(body, "customAllocation"));
    }
}
