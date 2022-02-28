using Newtonsoft.Json;

namespace CRM_Lite.Data.Dtos.PreSale
{
    [JsonObject]
    public class PreSaleGroupStatusDto
    {
        [JsonProperty("id")]
        public Guid Id { get; set; }

        [JsonProperty("name")]
        public string Name { get; set; }
    }
}
