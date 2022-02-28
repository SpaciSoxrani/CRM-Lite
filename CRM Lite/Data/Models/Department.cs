using System.ComponentModel.DataAnnotations;

namespace CRM_Lite.Data.Models
{
    public class Department
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public string Name { get; set; }

        public Department ParentDepartment { get; set; }
        public Guid? ParentDepartmentId { get; set; }

        public User Manager { get; set; }
        public Guid? ManagerId { get; set; }
        
		public Guid? ManagerFromAD { get; set; }
        
		public bool CanSell { get; set; }

        public bool CanProduct { get; set; }

        public bool CanExecute { get; set; }
        
        public bool IsActive { get; set; }

        public IEnumerable<Department> ChildDepartments { get; set; }
        
        public IEnumerable<User> Users { get; set; }
    }
}