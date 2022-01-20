using System;
using Newtonsoft.Json;

namespace CRM_Lite.Data.Dtos.PreSale
{
    [JsonObject]
    public class PreSaleGroupAccessListDto
    {
        [JsonProperty("userId")]
        public Guid UserId { get; set; }

        [JsonProperty("user")]
        public string User { get; set; }

        [JsonProperty("isAbleToEdit")]
        public bool IsAbleToEdit { get; set; }
    }
}
