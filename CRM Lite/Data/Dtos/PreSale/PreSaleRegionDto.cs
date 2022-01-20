using System;
using AutoMapper.Configuration.Annotations;
using Newtonsoft.Json;

namespace CRM.Data.Dtos.PreSale
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
