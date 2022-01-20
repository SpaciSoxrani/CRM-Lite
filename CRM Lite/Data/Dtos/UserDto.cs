using System;
using Newtonsoft.Json;

namespace CRM_Lite.Data.Dtos
{
    [JsonObject]
    public class UserDto
    {
        [JsonProperty("id")]
        public Guid Id { get; set; }

        [JsonProperty("displayName")]
        public string DisplayName { get; set; }
    }
}