using System;
using Newtonsoft.Json;

namespace CRM_Lite.Data.Dtos.PreSale
{
    [JsonObject]
    public class PreSaleGroupDto
    {
        [JsonProperty("id")]
        public Guid? Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("statusId")]
        public Guid? StatusId { get; set; }

        [JsonProperty("status")]
        public string Status { get; set; }

        [JsonProperty("departmentId")]
        public Guid? DepartmentId { get; set; }

        [JsonProperty("department")]
        public string Department { get; set; }
    }
}
