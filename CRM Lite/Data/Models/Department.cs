using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CRM.Data.Models
{
    /// <summary>
    /// Подразделение в Хосте (ДИС, ОВИС и т.д.)
    /// </summary>
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

		//
		public Guid? ManagerFromAD { get; set; }

		//
		public bool CanSell { get; set; }

        public bool CanProduct { get; set; }

        public bool CanExecute { get; set; }

        public IEnumerable<Department> ChildDepartments { get; set; }

        /// <summary>
        /// Сотрудники в данном подразделении
        /// </summary>        
        public IEnumerable<User> Users { get; set; }

        /// <summary>
        /// Организации, курируемые данным подразделением
        /// </summary>
        public IEnumerable<Organization> Organizations { get; set; }

        public bool IsActive { get; set; }

        public virtual IEnumerable<ProductUnitDeal> ProductUnitDeals { get; set; }
        public virtual IEnumerable<IndustrialUnitDeal> IndustrialUnitDeals { get; set; }

        public void UpdateWithNewValues(Department mandatoryDepartment)
        {
            CanExecute = mandatoryDepartment.CanExecute;
            CanProduct = mandatoryDepartment.CanProduct;
            CanSell = mandatoryDepartment.CanSell;
            ChildDepartments = mandatoryDepartment.ChildDepartments;
            ManagerId = mandatoryDepartment.ManagerId;
            ManagerFromAD = mandatoryDepartment.ManagerFromAD;
        }
    }
}