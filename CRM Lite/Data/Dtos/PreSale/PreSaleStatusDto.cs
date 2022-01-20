using System;
using Newtonsoft.Json;

namespace CRM.Data.Dtos.PreSale
{
    [JsonObject]
    public class PreSaleStatusDto
    {
        [JsonProperty("id")]
        public Guid Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }
    }
}
