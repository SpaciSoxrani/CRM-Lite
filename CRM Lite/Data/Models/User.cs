using System;
using System.ComponentModel.DataAnnotations;

namespace CRM_Lite.Models
{
    public class User
    {
        [Key]
        public Guid Id { get; set; }

        public string FirstName { get; set; }

        public string LastName { get; set; }
        
        public string DisplayName => $"{LastName} {FirstName}";

        public string FullName { get; set; }
    }
}