using System;
using Newtonsoft.Json;

namespace CRM_Lite.Data.Dtos.PreSale
{
    [JsonObject]
    public class PreSaleRegionDto
    {
        [JsonProperty("id")]
        public Guid Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }

        [JsonProperty("timezone")]
        public string Timezone { get; set; }
    }
}
