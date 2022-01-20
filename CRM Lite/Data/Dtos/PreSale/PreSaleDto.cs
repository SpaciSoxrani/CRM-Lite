using System;
using AutoMapper.Configuration.Annotations;
using Newtonsoft.Json;

namespace CRM.Data.Dtos.PreSale
{
    [JsonObject]
    public class PreSaleDto
    {
        [JsonProperty("id")]
        public Guid? Id { get; set; }

        [JsonProperty("organization")]
        public string Organization { get; set; }

        [JsonProperty("fullName")]
        public string FullName { get; set; }

        [JsonProperty("jobTitle")]
        public string JobTitle { get; set; }

        [JsonProperty("phoneNumber")]
        public string PhoneNumber { get; set; }

        [JsonProperty("email")]
        public string Email { get; set; }

        [JsonProperty("site")]
        public string Site { get; set; }

        [JsonProperty("requestSent")]
        public string RequestSent { get; set; }

        [JsonProperty("incomingNumber")]
        public string IncomingNumber { get; set; }

        [JsonProperty("executorContact")]
        public string ExecutorContact { get; set; }

        [JsonProperty("comments")]
        public string Comments { get; set; }

        [JsonProperty("resultComments")]
        public string ResultComments { get; set; }

        [JsonProperty("regionId")]
        public Guid? RegionId { get; set; }

        [JsonProperty("region")]
        public string Region { get; set; }

        [JsonProperty("timezone")]
        public string Timezone { get; set; }

        [JsonProperty("responsibleUserId")]
        public Guid? ResponsibleUserId { get; set; }

        [JsonProperty("responsibleUser")]
        public string ResponsibleUser { get; set; }

        [JsonProperty("dayAppointment")]
        public DateTime? DayAppointment { get; set; }

        [JsonProperty("statusId")]
        public Guid? StatusId { get; set; }

        [JsonProperty("status")]
        public string Status { get; set; }

        [JsonProperty("resultId")]
        public Guid? ResultId { get; set; }

        [JsonProperty("result")]
        public string Result { get; set; }

        [JsonProperty("groupId")]
        public Guid? GroupId { get; set; }

        [JsonProperty("group")]
        public string Group { get; set; }

        [JsonProperty("changedDate")]
        public DateTime ChangedDate { get; set; }

        [JsonProperty("editFieldName")]
        public string EditFieldName { get; set; }
    }
}
